# FarmaciaDB — Versión de Producción (base de datos real + v4)

Primero se cierran los pendientes de v3 (meta del día, tarjeta de sugerencias, orbes en modo oscuro, toasts ricos, esqueleto en Proveedores, animación del escáner). Luego se migra todo a una base de datos real con Lovable Cloud y se agregan las funciones nuevas.

## 1. Base de datos real (Lovable Cloud)
- Se activa Lovable Cloud. Todo lo que hoy vive en el navegador pasa a la base de datos; el navegador solo guarda la preferencia de tema.
- Tablas: perfiles, roles de usuario (tabla separada: Administrador / Empleado), clientes, medicamentos, proveedores, ventas, detalle de venta, compras.
- Login y registro reales con correo y contraseña (registro pide nombre y rol). Se activa confirmación automática para que el registro entre directo (es un prototipo académico).
- Datos iniciales cargados al crear las tablas: 20 medicamentos, 5 proveedores, 10 clientes, ~60 ventas repartidas en el mes y en distintas horas, compras. Las ventas demo se atribuyen a vendedores ficticios por nombre; las nuevas ventas quedan ligadas al usuario conectado.
- Permisos: cualquier usuario autenticado lee y opera; solo Administrador puede eliminar productos, proveedores y clientes.
- Registrar una venta (descontar stock, guardar detalle y sumar puntos) y recibir una compra (sumar stock) se hacen en una sola operación atómica en la base de datos.

## 2. Voz e IA
- Botón de micrófono brillante en POS e Inventario: animación de ondas; usa el reconocimiento de voz del navegador (español) y, si no está disponible, simula la frase "Buscar Paracetamol". Quita palabras como "buscar" y aplica el texto al buscador.
- Chatbot flotante abajo a la izquierda: responde preguntas sobre los datos reales (qué vence pronto, stock crítico, más vendido, ventas de hoy, buscar un producto, puntos de un cliente) mediante reglas sobre la base de datos. Sugerencias de preguntas como botones.

## 3. Clientes y "Puntos Salud"
- Nueva pantalla Clientes (Nombre, Teléfono, NIT, puntos) con alta, edición y borrado.
- En el POS se elige cliente (o Consumidor Final). Cada Q100 = 5 puntos, guardados en la base de datos; el recibo muestra "Puntos ganados en esta compra: X".

## 4. Gamificación (solo Administrador en Dashboard)
- Tarjeta "Empleado del Mes" con ranking de vendedores del mes.
- Barra de XP del usuario conectado según sus ventas de hoy (1 XP por Q10, niveles cada 500 XP).

## 5. Dashboard predictivo
- Mapa de calor de horas pico (día de la semana × hora) con Recharts.
- Alertas predictivas: rotación de últimos 14 días → "Se agotará en X días" con botón "Generar orden de compra" que crea una compra Pendiente con el proveedor sugerido.

## 6. Modo app
- Píldora "Conectado a DB" (verde) / "Offline" (gris) en la barra superior.
- Botón "Instalar App" en el menú lateral (simulado con modal y progreso; usa la instalación real del navegador si está disponible). Sin funcionamiento offline.

## 7. Microinteracciones
- Resplandor neón al pasar el mouse por botones principales.
- Sonido corto al completar venta, confeti si supera Q500, recibo, toast con acción "Ver recibo".
- Modo Enfoque en POS: oculta menú lateral y barra superior (Esc para salir). Se mantienen Ctrl+K y la calculadora de cambio.

## 8. Reportes (sin cambios de comportamiento)
- Leen de la base de datos en vivo; rango de fechas y los 3 botones PDF / Excel / CSV exportan exactamente lo filtrado.

## Detalles técnicos
- Lectura/escritura con el cliente de Cloud desde el navegador + TanStack Query (claves por tabla, invalidación tras cada mutación). Las páginas protegidas se mueven bajo el layout autenticado que provee la integración (redirige a `/login`).
- Funciones SQL `registrar_venta(items, desc_pct, cliente_id)` y `recibir_compra(id)` con `security definer` y verificación de rol/stock; `has_role` para políticas.
- Trigger que crea perfil + rol al registrarse, leyendo nombre y rol de los metadatos del registro.
- El store zustand queda solo para el tema; se eliminan datos semilla del cliente.
- Web Speech API detrás de detección de soporte; sonido con Web Audio (sin archivos).
- Ruta nueva `/clientes`; enlace en el menú.
