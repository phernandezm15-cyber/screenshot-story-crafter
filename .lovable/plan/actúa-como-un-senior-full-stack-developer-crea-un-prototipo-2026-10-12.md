Actúa como un Senior Full-Stack Developer. Crea un prototipo SPA completo para la gestión de farmacia llamado "FarmaciaDB", con datos demostrativos (sin backend real), en español y moneda Quetzales (Q).

**1. Pantallas y Módulos**

- **/login:** Fondo con gradiente animado, tarjeta glassmorphism, logo FarmaciaDB. Correo y contraseña (con botón de ojito), validación estricta, spinner de carga (2s), Toast de "Bienvenido" y redirección al Dashboard. Login simulado con cualquier correo válido.
- **Layout principal:** Sidebar retráctil (modo íconos en PC) y drawer menú hamburguesa en móvil. Topbar con nombre de usuario "Admin", toggle funcional de Modo Claro/Oscuro y botón Cerrar Sesión. Footer con el aviso: "Versión de prototipo. Datos demostrativos."
- **/dashboard:** 4 tarjetas KPIs (Ventas del día, Productos totales, Alertas de stock en rojo, Proveedores activos). Gráfico de ventas de los últimos 7 días. Tabla inferior con las últimas 5 ventas.
- **/pos (Ventas):** Buscador de productos en tiempo real con botón "+". El "Ticket" debe permitir sumar/restar cantidad o eliminar; calcular Subtotal, Descuento, IVA 12% y Total. Botón "Completar Venta" que descuente el stock real, guarde la venta y lance Toast verde. Lanza Toast rojo si hay "Stock insuficiente".
- **/inventario:** Tabla con paginación, búsqueda, filtro por categoría. Insignias (badges) visuales: "Stock Crítico" (<10) en rojo y "Por vencer" (≤30 días) en naranja. Modal de alta/edición validado y confirmación de borrado.
- **/proveedores:** CRUD completo de proveedores con la misma experiencia (tabla, modal, edición, borrado).
- **/compras:** Formulario de ingreso de mercadería (proveedor, producto, cantidad, costo) que sume automáticamente el stock al inventario. Historial de compras.
- **/reportes (REQUISITO CRÍTICO):** Tablas resumen de ventas y estado de inventario. DEBE incluir 3 botones altamente visibles y funcionales para exportar los datos: Exportar a PDF, Exportar a Excel (.xlsx) y Exportar a CSV.

**2. Datos Demostrativos y Persistencia (CRÍTICO)**

- Genera de inicio: 15 medicamentos, 5 proveedores y 10 ventas recientes.
- **Persistencia:** Todos los cambios (ventas, nuevos productos) DEBEN guardarse en el `localStorage` del navegador mediante el store global para que los datos no se borren al recargar la página.

**3. Diseño UI/UX**

- Fondo `#f8fafc`, color primario `#1e3a8a`, éxito `#16a34a`, peligro `#dc2626`.
- Uso de tarjetas y modales con efecto cristal (Glassmorphism). Transiciones y hover con elevación. Modo oscuro completo y Toasts animados abajo a la derecha. 100% Responsivo.

**4. Detalles Técnicos Exigidos**

- **Rutas:** TanStack Router. `/` redirige a `/login`. Layout pathless `_app` con guardia de sesión simple comprobando `localStorage`.
- **Estado:** Store global usando `zustand` persistido.
- **Librerías Obligatorias:** `recharts` para gráficos, `jspdf` + `jspdf-autotable` para exportar PDF, `xlsx` (SheetJS) para exportar Excel, `sonner` para Toasts.
- **Componentes:** Uso intensivo de `shadcn/ui` (sidebar, dialog, table, badge, select, input).