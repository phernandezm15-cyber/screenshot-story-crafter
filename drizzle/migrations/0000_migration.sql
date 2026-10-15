
CREATE TYPE public.app_role AS ENUM ('admin', 'empleado');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text;
BEGIN
  INSERT INTO public.profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'nombre', ''), split_part(NEW.email, '@', 1)));
  r := COALESCE(NEW.raw_user_meta_data->>'rol', 'empleado');
  IF r NOT IN ('admin', 'empleado') THEN r := 'empleado'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r::public.app_role);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE SEQUENCE public.med_seq START 1;
CREATE TABLE public.medicamentos (
  id text PRIMARY KEY DEFAULT ('MED-' || lpad(nextval('public.med_seq')::text, 3, '0')),
  codigo text NOT NULL DEFAULT ('750' || lpad((floor(random()*1e8))::bigint::text, 8, '0')),
  nombre text NOT NULL,
  principio text NOT NULL DEFAULT '',
  categoria text NOT NULL,
  caducidad date NOT NULL,
  precio_compra numeric(10,2) NOT NULL DEFAULT 0,
  precio_venta numeric(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT USAGE ON SEQUENCE public.med_seq TO authenticated;

CREATE SEQUENCE public.prov_seq START 1;
CREATE TABLE public.proveedores (
  id text PRIMARY KEY DEFAULT ('PRV-' || lpad(nextval('public.prov_seq')::text, 3, '0')),
  empresa text NOT NULL,
  contacto text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  correo text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT USAGE ON SEQUENCE public.prov_seq TO authenticated;

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text NOT NULL DEFAULT '',
  nit text NOT NULL DEFAULT 'CF',
  puntos integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE public.venta_seq START 1001;
CREATE TABLE public.ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL DEFAULT ('VTA-' || nextval('public.venta_seq')::text),
  fecha timestamptz NOT NULL DEFAULT now(),
  vendedor_id uuid,
  vendedor_nombre text NOT NULL DEFAULT '',
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  descuento numeric(10,2) NOT NULL DEFAULT 0,
  desc_pct numeric(5,2) NOT NULL DEFAULT 0,
  iva numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  puntos integer NOT NULL DEFAULT 0
);
CREATE INDEX ventas_fecha_idx ON public.ventas (fecha DESC);

CREATE TABLE public.venta_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  med_id text REFERENCES public.medicamentos(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  cantidad integer NOT NULL,
  precio numeric(10,2) NOT NULL
);
CREATE INDEX venta_detalle_venta_idx ON public.venta_detalle (venta_id);

CREATE SEQUENCE public.compra_seq START 1;
CREATE TABLE public.compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL DEFAULT ('CMP-' || lpad(nextval('public.compra_seq')::text, 3, '0')),
  fecha timestamptz NOT NULL DEFAULT now(),
  proveedor_id text REFERENCES public.proveedores(id) ON DELETE SET NULL,
  med_id text REFERENCES public.medicamentos(id) ON DELETE SET NULL,
  cantidad integer NOT NULL,
  costo numeric(10,2) NOT NULL,
  estado text NOT NULL DEFAULT 'Completado',
  nota text
);
GRANT USAGE ON SEQUENCE public.compra_seq TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicamentos, public.proveedores, public.clientes TO authenticated;
GRANT SELECT ON public.ventas, public.venta_detalle TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.compras TO authenticated;
GRANT ALL ON public.medicamentos, public.proveedores, public.clientes, public.ventas, public.venta_detalle, public.compras TO service_role;

ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meds read" ON public.medicamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "meds insert" ON public.medicamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "meds update" ON public.medicamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "meds delete admin" ON public.medicamentos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "prov read" ON public.proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "prov insert" ON public.proveedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "prov update" ON public.proveedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "prov delete admin" ON public.proveedores FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cli read" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cli insert" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cli update" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "cli delete admin" ON public.clientes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ventas read" ON public.ventas FOR SELECT TO authenticated USING (true);
CREATE POLICY "detalle read" ON public.venta_detalle FOR SELECT TO authenticated USING (true);

CREATE POLICY "compras read" ON public.compras FOR SELECT TO authenticated USING (true);
CREATE POLICY "compras insert" ON public.compras FOR INSERT TO authenticated WITH CHECK (estado IN ('Completado','Pendiente'));
CREATE POLICY "compras update" ON public.compras FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.registrar_venta(_items jsonb, _desc_pct numeric, _cliente_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  it jsonb; m record; v_sub numeric := 0; v_desc numeric; v_iva numeric; v_total numeric; v_pts int; v_nombre text; v_row public.ventas;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Ticket vacío'; END IF;
  IF _desc_pct < 0 OR _desc_pct > 100 THEN RAISE EXCEPTION 'Descuento inválido'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO m FROM public.medicamentos WHERE id = it->>'med_id' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto no existe'; END IF;
    IF (it->>'cantidad')::int <= 0 OR m.stock < (it->>'cantidad')::int THEN RAISE EXCEPTION 'Stock insuficiente: %', m.nombre; END IF;
    v_sub := v_sub + m.precio_venta * (it->>'cantidad')::int;
  END LOOP;
  v_desc := round(v_sub * _desc_pct / 100, 2);
  v_iva := round((v_sub - v_desc) * 0.12, 2);
  v_total := v_sub - v_desc + v_iva;
  v_pts := CASE WHEN _cliente_id IS NULL THEN 0 ELSE floor(v_total / 100)::int * 5 END;
  SELECT p.nombre INTO v_nombre FROM public.profiles p WHERE p.id = auth.uid();
  INSERT INTO public.ventas (vendedor_id, vendedor_nombre, cliente_id, subtotal, descuento, desc_pct, iva, total, puntos)
  VALUES (auth.uid(), COALESCE(v_nombre, 'Usuario'), _cliente_id, v_sub, v_desc, _desc_pct, v_iva, v_total, v_pts)
  RETURNING * INTO v_row;
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO m FROM public.medicamentos WHERE id = it->>'med_id';
    INSERT INTO public.venta_detalle (venta_id, med_id, nombre, cantidad, precio) VALUES (v_row.id, m.id, m.nombre, (it->>'cantidad')::int, m.precio_venta);
    UPDATE public.medicamentos SET stock = stock - (it->>'cantidad')::int WHERE id = m.id;
  END LOOP;
  IF _cliente_id IS NOT NULL THEN UPDATE public.clientes SET puntos = puntos + v_pts WHERE id = _cliente_id; END IF;
  RETURN to_jsonb(v_row);
END $$;
REVOKE ALL ON FUNCTION public.registrar_venta(jsonb, numeric, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.registrar_venta(jsonb, numeric, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.recibir_compra(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO c FROM public.compras WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR c.estado = 'Completado' THEN RETURN; END IF;
  UPDATE public.compras SET estado = 'Completado' WHERE id = _id;
  UPDATE public.medicamentos SET stock = stock + c.cantidad, precio_compra = c.costo WHERE id = c.med_id;
END $$;
REVOKE ALL ON FUNCTION public.recibir_compra(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.recibir_compra(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.compra_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.estado = 'Completado' THEN
    UPDATE public.medicamentos SET stock = stock + NEW.cantidad, precio_compra = NEW.costo WHERE id = NEW.med_id;
  END IF;
  RETURN NEW;
END $$;

INSERT INTO public.medicamentos (nombre, principio, categoria, caducidad, precio_compra, precio_venta, stock, codigo) VALUES
('Panadol Extra','Paracetamol 500mg','Analgésicos', current_date + 400, 8.5, 14, 120, '75010000010'),
('Advil','Ibuprofeno 400mg','Antiinflamatorios', current_date + 300, 12, 19.5, 85, '75010079191'),
('Amoxil','Amoxicilina 500mg','Antibióticos', current_date + 20, 35, 55, 6, '75010158382'),
('Clarityne','Loratadina 10mg','Antihistamínicos', current_date + 250, 22, 34, 48, '75010237573'),
('Omeprazol MK','Omeprazol 20mg','Gastrointestinal', current_date + 180, 15, 25, 64, '75010316764'),
('Losartán Denk','Losartán 50mg','Cardiovascular', current_date + 365, 28, 42, 8, '75010395955'),
('Centrum','Multivitamínico','Vitaminas', current_date + 500, 95, 139, 30, '75010475146'),
('Ventolin','Salbutamol 100mcg','Respiratorio', current_date + 25, 48, 72, 22, '75010554337'),
('Aspirina Bayer','Ácido acetilsalicílico','Analgésicos', current_date + 600, 6, 10, 150, '75010633528'),
('Cipro','Ciprofloxacino 500mg','Antibióticos', current_date + 210, 40, 62, 5, '75010712719'),
('Voltaren','Diclofenaco 50mg','Antiinflamatorios', current_date + 15, 18, 29, 40, '75010791900'),
('Allegra','Fexofenadina 180mg','Antihistamínicos', current_date + 320, 45, 68, 26, '75010871091'),
('Gaviscon','Alginato de sodio','Gastrointestinal', current_date + 140, 38, 58, 18, '75010950282'),
('Redoxon','Vitamina C 1g','Vitaminas', current_date + 28, 30, 46, 55, '75011029473'),
('Atorvastatina MK','Atorvastatina 20mg','Cardiovascular', current_date + 400, 32, 50, 9, '75011108664'),
('Bepanthen','Dexpantenol 5%','Dermatológicos', current_date + 420, 42, 65, 35, '75011187855'),
('Glucophage','Metformina 850mg','Diabetes', current_date + 380, 26, 40, 70, '75011267046'),
('Mucosolvan','Ambroxol 30mg','Respiratorio', current_date + 12, 33, 49, 14, '75011346237'),
('Fucidin','Ácido fusídico 2%','Dermatológicos', current_date + 260, 55, 82, 3, '75011425428'),
('Januvia','Sitagliptina 100mg','Diabetes', current_date + 500, 210, 295, 12, '75011504619');

INSERT INTO public.proveedores (empresa, contacto, telefono, correo, direccion) VALUES
('Droguería Centroamericana','Luis Méndez','2245-1100','ventas@drocen.gt','Zona 9, Ciudad de Guatemala'),
('Laboratorios Bonin','Ana Castillo','2380-4422','pedidos@bonin.gt','Zona 12, Ciudad de Guatemala'),
('Farmasa Distribuciones','Carlos Rivera','2421-7788','info@farmasa.com','Mixco, Guatemala'),
('MediPharma GT','Sofía Herrera','2290-3355','contacto@medipharma.gt','Zona 10, Ciudad de Guatemala'),
('Grupo Selecta Salud','Jorge Pérez','7765-0099','selecta@salud.gt','Quetzaltenango');

INSERT INTO public.clientes (nombre, telefono, nit, puntos) VALUES
('Ana Morales','5512-3344','4589632-1',45),('Carlos Juárez','5523-8899','CF',10),('Lucía Barrios','4456-7788','7845123-6',120),
('Pedro Gómez','5590-1122','1234567-8',0),('María Fernanda Ruiz','3345-6677','9988776-5',75),('José Ramírez','5567-0011','CF',20),
('Elena Castillo','4478-2233','5566778-9',200),('Diego Hernández','5501-9988','3322114-0',35),('Sofía Pérez','3390-4455','CF',5),('Ricardo López','5544-6677','6677889-1',60);

INSERT INTO public.compras (fecha, proveedor_id, med_id, cantidad, costo, estado, nota) VALUES
(now() - interval '1 day','PRV-001','MED-003',50,35,'Pendiente','Entrega programada'),
(now() - interval '3 day','PRV-002','MED-001',100,8.5,'Completado',NULL),
(now() - interval '6 day','PRV-004','MED-007',20,95,'Completado',NULL),
(now() - interval '8 day','PRV-003','MED-010',40,40,'Pendiente',NULL),
(now() - interval '12 day','PRV-001','MED-009',80,6,'Completado',NULL),
(now() - interval '15 day','PRV-005','MED-017',60,26,'Completado',NULL);

CREATE TRIGGER compras_after_insert AFTER INSERT ON public.compras FOR EACH ROW EXECUTE FUNCTION public.compra_after_insert();

DO $$
DECLARE
  i int; j int; n int; v_id uuid; mid text; qty int; pr numeric; s_sub numeric; s_dsc numeric; s_pct numeric; s_iva numeric; s_tot numeric;
  vendedores text[] := ARRAY['Admin General','María López','Carlos Méndez','Andrea Solís'];
  hrs int[] := ARRAY[8,9,10,10,11,11,12,12,13,15,16,17,17,18,18,19,20];
  cli uuid; ts timestamptz;
BEGIN
  FOR i IN 0..64 LOOP
    ts := date_trunc('day', now()) - ((i * 7) % 29) * interval '1 day'
          + hrs[1 + (i * 5) % array_length(hrs,1)] * interval '1 hour' + ((i * 13) % 60) * interval '1 minute';
    IF ts > now() THEN ts := now() - ((i % 5) + 1) * interval '1 hour'; END IF;
    s_pct := CASE WHEN i % 6 = 0 THEN 5 WHEN i % 11 = 0 THEN 10 ELSE 0 END;
    cli := CASE WHEN i % 3 = 0 THEN (SELECT c.id FROM public.clientes c ORDER BY c.nombre OFFSET (i % 10) LIMIT 1) ELSE NULL END;
    INSERT INTO public.ventas (fecha, vendedor_nombre, cliente_id, desc_pct) VALUES (ts, vendedores[1 + i % 4], cli, s_pct) RETURNING id INTO v_id;
    s_sub := 0; n := 1 + i % 3;
    FOR j IN 1..n LOOP
      mid := 'MED-' || lpad((1 + ((i * 3 + j * 7) % 20))::text, 3, '0');
      qty := 1 + ((i + j) % 3);
      SELECT m.precio_venta INTO pr FROM public.medicamentos m WHERE m.id = mid;
      INSERT INTO public.venta_detalle (venta_id, med_id, nombre, cantidad, precio) SELECT v_id, m.id, m.nombre, qty, m.precio_venta FROM public.medicamentos m WHERE m.id = mid;
      s_sub := s_sub + pr * qty;
    END LOOP;
    s_dsc := round(s_sub * s_pct / 100, 2); s_iva := round((s_sub - s_dsc) * 0.12, 2); s_tot := s_sub - s_dsc + s_iva;
    UPDATE public.ventas SET subtotal = s_sub, descuento = s_dsc, iva = s_iva, total = s_tot,
      puntos = CASE WHEN cli IS NULL THEN 0 ELSE floor(s_tot/100)::int * 5 END WHERE id = v_id;
  END LOOP;
END $$;
