# FarmaciaDB — Prototipo SPA de gestión de farmacia

Prototipo frontend completo con datos demostrativos (sin backend), en español, moneda Quetzales (Q).

## Pantallas
- **/login**: fondo con gradiente animado, tarjeta glassmorphism, logo FarmaciaDB, correo + contraseña con ojito, validación, spinner 2 s, Toast "Bienvenido" y redirección al Dashboard. Login simulado (cualquier correo válido).
- **Layout principal**: sidebar retráctil (modo íconos) y drawer en móvil; topbar con "Admin", toggle claro/oscuro y Cerrar Sesión. Footer con el aviso de prototipo textual.
- **/dashboard**: 4 KPIs (Ventas del día, Productos totales, Alertas de stock en rojo, Proveedores activos), gráfico de ventas últimos 7 días, tabla de últimas 5 ventas.
- **/pos**: buscador en tiempo real + botón "+"; ticket con +/−/eliminar, subtotal, descuento, IVA 12%, total; "Completar Venta" descuenta stock, registra venta y lanza Toast. Toast de "Stock insuficiente" cuando aplique.
- **/inventario**: tabla con paginación, búsqueda, filtro por categoría, badges "Stock Crítico" (<10) y "Por vencer" (≤30 días); modal de alta/edición validado y confirmación de borrado.
- **/proveedores**: CRUD de proveedores con la misma experiencia.
- **/compras**: formulario de ingreso de mercadería (proveedor, producto, cantidad, costo) que aumenta stock, más historial de compras.
- **/reportes**: tablas de ventas e inventario con botones Exportar PDF, Excel (.xlsx) y CSV.

## Datos demostrativos
15 medicamentos, 5 proveedores, 10 ventas recientes distribuidas en los últimos 7 días. Se guardan en el navegador para que los cambios persistan al recargar.

## Diseño
Fondo #f8fafc, primario #1e3a8a, éxito #16a34a, peligro #dc2626, tarjetas y modales con efecto cristal, transiciones y hover con elevación, modo oscuro completo, toasts abajo a la derecha.

## Detalles técnicos
- Rutas TanStack: `/` redirige a `/login`; layout pathless `_app` con guardia simple (sesión en localStorage) para las páginas internas.
- Estado global con un store (zustand) persistido en localStorage.
- Librerías: recharts, jspdf + jspdf-autotable, xlsx (SheetJS), zustand, sonner; componentes shadcn (sidebar, dialog, table, badge, select, input).
- Tokens de color en `src/styles.css` (oklch), utilidad `glass`; head() propio por ruta.
