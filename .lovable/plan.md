# FarmaciaDB v2 — Mejoras de funcionalidad y diseño

Se mantiene todo lo actual (datos en el navegador, español, Quetzales).

## 1. Login y Registro
- Tarjeta de cristal mejorada con pestañas "Iniciar Sesión" / "Registrarse".
- Registro: Nombre, Correo, Contraseña, Rol (Administrador / Empleado). Valida correo único, guarda el usuario, Toast de éxito y cambia a la pestaña de inicio.
- Login valida contra los usuarios guardados (error claro si no coincide). Spinner de 2 s se mantiene.
- Usuarios demo: admin@farmacia.gt / admin123 (Administrador) y empleado@farmacia.gt / empleado123 (Empleado), mostrados como pista en la tarjeta.
- La barra superior muestra el nombre y rol del usuario conectado.

## 2. Layout y experiencia
- Campanita de notificaciones con contador rojo de productos en stock crítico (y por vencer); al hacer clic despliega la lista con enlace al inventario.
- Animaciones fade-in / slide-up al cambiar de página y al abrir modales.
- Esqueletos de carga de 1 s al entrar a cada pantalla.

## 3. Módulos
- **Dashboard**: tarjetas KPI con ícono grande translúcido de fondo; gráfico de barras (7 días) + gráfico de anillo "Ventas por Categoría".
- **POS**: campo "Escáner de código de barras (simulado)" — al presionar Enter con un código o ID agrega el producto directo. Cada medicamento recibe un código de barras. Botones de descuento rápido 0% / 5% / 10%. Al completar venta: Toast + modal de recibo imprimible (botón Imprimir).
- **Inventario**: botón "Filtros Avanzados" (panel con rango de precio, rango de stock, estado, vencimiento). Nueva columna "Estado" con badge Verde Óptimo / Naranja Por Vencer / Rojo Crítico.
- **Compras**: cada compra con estado "Completado" (verde) o "Pendiente" (amarillo), opción al registrar; las pendientes no suman stock hasta marcarlas como recibidas. Botón "Ver detalles" abre modal con la información completa. Compras demo iniciales.
- **Reportes**: selector "Tipo de Reporte" (Ventas / Inventario) y rango "Desde – Hasta". La tabla muestra solo lo filtrado y los 3 botones (Rojo PDF, Verde Excel, Azul CSV) exportan exactamente esos datos. Para Inventario el rango filtra por fecha de vencimiento.

## 4. Datos demo
2 usuarios, 20 medicamentos con categorías variadas, 5 proveedores, 15+ ventas repartidas en el mes actual, algunas compras. Se incrementa la versión del almacenamiento para que los navegadores con datos viejos carguen el nuevo set.

## Detalles técnicos
- Store zustand: añadir `users`, `currentUser`, `compras.estado`, `codigo` en medicamentos; `version` + `migrate` para resembrar.
- Sesión pasa a guardar el id del usuario; guardia de `_app` sin cambios en concepto.
- Componentes shadcn: tabs, dropdown-menu/popover (campanita), skeleton, dialog. Recharts PieChart para el donut.
- Hook `useFakeLoading(1000)` por página para los esqueletos; clase de animación en el contenedor de `<Outlet />` con key por ruta.
