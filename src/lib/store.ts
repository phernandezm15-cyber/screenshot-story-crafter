import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Rol = "Administrador" | "Empleado";
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: Rol;
}
export interface Medicamento {
  id: string;
  codigo: string;
  nombre: string;
  principio: string;
  categoria: string;
  caducidad: string; // yyyy-mm-dd
  precioCompra: number;
  precioVenta: number;
  stock: number;
}
export interface Proveedor {
  id: string;
  empresa: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
}
export interface VentaItem {
  medId: string;
  nombre: string;
  cantidad: number;
  precio: number;
}
export interface Venta {
  id: string;
  fecha: string;
  items: VentaItem[];
  subtotal: number;
  descuento: number;
  descPct: number;
  iva: number;
  total: number;
  vendedor: string;
}
export type EstadoCompra = "Completado" | "Pendiente";
export interface Compra {
  id: string;
  fecha: string;
  proveedorId: string;
  medId: string;
  cantidad: number;
  costo: number;
  estado: EstadoCompra;
  nota?: string;
}

export const CATEGORIAS = [
  "Analgésicos",
  "Antibióticos",
  "Antiinflamatorios",
  "Antihistamínicos",
  "Gastrointestinal",
  "Cardiovascular",
  "Vitaminas",
  "Respiratorio",
  "Dermatológicos",
  "Diabetes",
];
export const IVA_RATE = 0.12;

const DAY = 86400000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

function seedMeds(): Medicamento[] {
  const raw: [string, string, string, number, number, number, number][] = [
    ["Panadol Extra", "Paracetamol 500mg", "Analgésicos", 400, 8.5, 14, 120],
    ["Advil", "Ibuprofeno 400mg", "Antiinflamatorios", 300, 12, 19.5, 85],
    ["Amoxil", "Amoxicilina 500mg", "Antibióticos", 20, 35, 55, 6],
    ["Clarityne", "Loratadina 10mg", "Antihistamínicos", 250, 22, 34, 48],
    ["Omeprazol MK", "Omeprazol 20mg", "Gastrointestinal", 180, 15, 25, 64],
    ["Losartán Denk", "Losartán 50mg", "Cardiovascular", 365, 28, 42, 8],
    ["Centrum", "Multivitamínico", "Vitaminas", 500, 95, 139, 30],
    ["Ventolin", "Salbutamol 100mcg", "Respiratorio", 25, 48, 72, 22],
    ["Aspirina Bayer", "Ácido acetilsalicílico", "Analgésicos", 600, 6, 10, 150],
    ["Cipro", "Ciprofloxacino 500mg", "Antibióticos", 210, 40, 62, 5],
    ["Voltaren", "Diclofenaco 50mg", "Antiinflamatorios", 15, 18, 29, 40],
    ["Allegra", "Fexofenadina 180mg", "Antihistamínicos", 320, 45, 68, 26],
    ["Gaviscon", "Alginato de sodio", "Gastrointestinal", 140, 38, 58, 18],
    ["Redoxon", "Vitamina C 1g", "Vitaminas", 28, 30, 46, 55],
    ["Atorvastatina MK", "Atorvastatina 20mg", "Cardiovascular", 400, 32, 50, 9],
    ["Bepanthen", "Dexpantenol 5%", "Dermatológicos", 420, 42, 65, 35],
    ["Glucophage", "Metformina 850mg", "Diabetes", 380, 26, 40, 70],
    ["Mucosolvan", "Ambroxol 30mg", "Respiratorio", 12, 33, 49, 14],
    ["Fucidin", "Ácido fusídico 2%", "Dermatológicos", 260, 55, 82, 3],
    ["Januvia", "Sitagliptina 100mg", "Diabetes", 500, 210, 295, 12],
  ];
  return raw.map((r, i) => ({
    id: `MED-${String(i + 1).padStart(3, "0")}`,
    codigo: `750${String(1000000 + i * 7919).slice(-7)}${i % 10}`,
    nombre: r[0],
    principio: r[1],
    categoria: r[2],
    caducidad: iso(r[3]),
    precioCompra: r[4],
    precioVenta: r[5],
    stock: r[6],
  }));
}

function seedProv(): Proveedor[] {
  return [
    { id: "PRV-001", empresa: "Droguería Centroamericana", contacto: "Luis Méndez", telefono: "2245-1100", correo: "ventas@drocen.gt", direccion: "Zona 9, Ciudad de Guatemala" },
    { id: "PRV-002", empresa: "Laboratorios Bonin", contacto: "Ana Castillo", telefono: "2380-4422", correo: "pedidos@bonin.gt", direccion: "Zona 12, Ciudad de Guatemala" },
    { id: "PRV-003", empresa: "Farmasa Distribuciones", contacto: "Carlos Rivera", telefono: "2421-7788", correo: "info@farmasa.com", direccion: "Mixco, Guatemala" },
    { id: "PRV-004", empresa: "MediPharma GT", contacto: "Sofía Herrera", telefono: "2290-3355", correo: "contacto@medipharma.gt", direccion: "Zona 10, Ciudad de Guatemala" },
    { id: "PRV-005", empresa: "Grupo Selecta Salud", contacto: "Jorge Pérez", telefono: "7765-0099", correo: "selecta@salud.gt", direccion: "Quetzaltenango" },
  ];
}

const seedUsers = (): Usuario[] => [
  { id: "USR-001", nombre: "Admin General", correo: "admin@farmacia.gt", password: "admin123", rol: "Administrador" },
  { id: "USR-002", nombre: "María López", correo: "empleado@farmacia.gt", password: "empleado123", rol: "Empleado" },
];

export function calcTotals(items: VentaItem[], descPct: number) {
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const descuento = subtotal * (descPct / 100);
  const base = subtotal - descuento;
  const iva = base * IVA_RATE;
  return { subtotal, descuento, iva, total: base + iva };
}

function seedVentas(meds: Medicamento[]): Venta[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 9).getTime();
  const daysAgo = [0, 0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7, 9, 11, 13, 16, 20, 24];
  return daysAgo.map((d, i) => {
    const a = meds[(i * 3) % meds.length];
    const b = meds[(i * 7 + 2) % meds.length];
    const items = [
      { medId: a.id, nombre: a.nombre, cantidad: (i % 3) + 1, precio: a.precioVenta },
      { medId: b.id, nombre: b.nombre, cantidad: (i % 2) + 1, precio: b.precioVenta },
    ];
    const descPct = i % 5 === 0 ? 5 : 0;
    const t = calcTotals(items, descPct);
    const ts = Math.max(monthStart + i * 3600000, now.getTime() - d * DAY - i * 2400000);
    return { id: `VTA-${String(1100 - i)}`, fecha: new Date(ts).toISOString(), items, descPct, vendedor: i % 2 ? "María López" : "Admin General", ...t };
  });
}

function seedCompras(): Compra[] {
  const f = (d: number) => new Date(Date.now() - d * DAY).toISOString();
  return [
    { id: "CMP-001", fecha: f(1), proveedorId: "PRV-001", medId: "MED-003", cantidad: 50, costo: 35, estado: "Pendiente", nota: "Entrega programada" },
    { id: "CMP-002", fecha: f(3), proveedorId: "PRV-002", medId: "MED-001", cantidad: 100, costo: 8.5, estado: "Completado" },
    { id: "CMP-003", fecha: f(6), proveedorId: "PRV-004", medId: "MED-007", cantidad: 20, costo: 95, estado: "Completado" },
    { id: "CMP-004", fecha: f(8), proveedorId: "PRV-003", medId: "MED-010", cantidad: 40, costo: 40, estado: "Pendiente" },
  ];
}

interface State {
  users: Usuario[];
  meds: Medicamento[];
  proveedores: Proveedor[];
  ventas: Venta[];
  compras: Compra[];
  dark: boolean;
  toggleDark: () => void;
  registrarUsuario: (u: Omit<Usuario, "id">) => boolean;
  saveMed: (m: Medicamento) => void;
  deleteMed: (id: string) => void;
  saveProv: (p: Proveedor) => void;
  deleteProv: (id: string) => void;
  registrarVenta: (items: VentaItem[], descPct: number, vendedor: string) => Venta;
  registrarCompra: (c: Omit<Compra, "id" | "fecha">) => void;
  recibirCompra: (id: string) => void;
}

const fresh = () => {
  const meds = seedMeds();
  return { users: seedUsers(), meds, proveedores: seedProv(), ventas: seedVentas(meds), compras: seedCompras() };
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...fresh(),
      dark: false,
      toggleDark: () => set({ dark: !get().dark }),
      registrarUsuario: (u) => {
        if (get().users.some((x) => x.correo.toLowerCase() === u.correo.toLowerCase())) return false;
        set((s) => ({ users: [...s.users, { ...u, id: nextId("USR", s.users.map((x) => x.id)) }] }));
        return true;
      },
      saveMed: (m) =>
        set((s) => ({
          meds: s.meds.some((x) => x.id === m.id) ? s.meds.map((x) => (x.id === m.id ? m : x)) : [...s.meds, m],
        })),
      deleteMed: (id) => set((s) => ({ meds: s.meds.filter((x) => x.id !== id) })),
      saveProv: (p) =>
        set((s) => ({
          proveedores: s.proveedores.some((x) => x.id === p.id)
            ? s.proveedores.map((x) => (x.id === p.id ? p : x))
            : [...s.proveedores, p],
        })),
      deleteProv: (id) => set((s) => ({ proveedores: s.proveedores.filter((x) => x.id !== id) })),
      registrarVenta: (items, descPct, vendedor) => {
        const t = calcTotals(items, descPct);
        const venta: Venta = { id: `VTA-${Date.now().toString().slice(-6)}`, fecha: new Date().toISOString(), items, descPct, vendedor, ...t };
        set((s) => ({
          ventas: [venta, ...s.ventas],
          meds: s.meds.map((m) => {
            const it = items.find((i) => i.medId === m.id);
            return it ? { ...m, stock: m.stock - it.cantidad } : m;
          }),
        }));
        return venta;
      },
      registrarCompra: (c) =>
        set((s) => ({
          compras: [{ ...c, id: nextId("CMP", s.compras.map((x) => x.id)), fecha: new Date().toISOString() }, ...s.compras],
          meds:
            c.estado === "Completado"
              ? s.meds.map((m) => (m.id === c.medId ? { ...m, stock: m.stock + c.cantidad, precioCompra: c.costo } : m))
              : s.meds,
        })),
      recibirCompra: (id) => {
        const c = get().compras.find((x) => x.id === id);
        if (!c || c.estado === "Completado") return;
        set((s) => ({
          compras: s.compras.map((x) => (x.id === id ? { ...x, estado: "Completado" } : x)),
          meds: s.meds.map((m) => (m.id === c.medId ? { ...m, stock: m.stock + c.cantidad, precioCompra: c.costo } : m)),
        }));
      },
    }),
    {
      name: "farmaciadb-store",
      version: 2,
      migrate: (persisted) => ({ ...fresh(), dark: (persisted as { dark?: boolean })?.dark ?? false }) as unknown as State,
    },
  ),
);

export const nextId = (prefix: string, ids: string[]) => {
  const max = ids.reduce((m, id) => Math.max(m, parseInt(id.split("-")[1] || "0", 10) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
};

export const q = (n: number) => `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtFecha = (s: string) => new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
export const fmtFechaHora = (s: string) =>
  new Date(s).toLocaleString("es-GT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const diasParaVencer = (f: string) => Math.ceil((new Date(f).getTime() - Date.now()) / DAY);

export type EstadoMed = "Óptimo" | "Por Vencer" | "Crítico";
export const estadoMed = (m: Medicamento): EstadoMed =>
  m.stock < 10 || diasParaVencer(m.caducidad) < 0 ? "Crítico" : diasParaVencer(m.caducidad) <= 30 ? "Por Vencer" : "Óptimo";
export const estadoVariant = { "Óptimo": "success", "Por Vencer": "warning", "Crítico": "danger" } as const;

const SESSION = "farmaciadb-session";
export const session = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem(SESSION) : null),
  set: (userId: string) => localStorage.setItem(SESSION, userId),
  clear: () => localStorage.removeItem(SESSION),
};

export const useCurrentUser = () => {
  const users = useStore((s) => s.users);
  const id = session.get();
  return users.find((u) => u.id === id) ?? null;
};
