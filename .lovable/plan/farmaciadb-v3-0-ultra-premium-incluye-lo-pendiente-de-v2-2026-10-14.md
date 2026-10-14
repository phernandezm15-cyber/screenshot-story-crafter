# FarmaciaDB v3.0 Ultra Premium (incluye lo pendiente de v2)

Ya listo de v2: login/registro con roles, campanita de alertas, animaciones de página, esqueletos de carga, dashboard con donut y KPIs con ícono de fondo, datos demo nuevos. Este plan termina v2 y añade v3 en las mismas pantallas.

## Punto de Venta
- Escáner simulado: botón con ícono de código de barras abre un modal con animación de "cámara buscando" (línea láser) y a los 2 s agrega un producto al azar con stock.
- Campo "Escáner de código de barras (simulado)": escribir código o ID + Enter agrega el producto.
- Ctrl/Cmd + K enfoca el buscador; aviso visible del atajo.
- Descuento rápido 0% / 5% / 10%.
- "Efectivo recibido" con botones Q50, Q100, Q200, Pago Exacto; muestra "Cambio a devolver" (rojo si falta dinero; no permite completar si el efectivo es menor al total).
- Completar Venta: Toast + modal de recibo imprimible (incluye efectivo y cambio). Si total > Q500, confeti a pantalla completa.

## Dashboard
- Barra "Meta del Día: Q2,000" con progreso según ventas de hoy (se actualiza al vender).
- Tarjeta "Sugerencias del Sistema" con borde animado brillante: analiza ventas recientes y stock y genera 3–4 consejos (producto más vendido + proveedor sugerido según historial de compras, stock crítico a reponer, productos por vencer a promocionar).

## Inventario
- Columna con mini código de barras dibujado a partir del código del producto.
- Columna "Estado" con badges Verde Óptimo / Naranja Por Vencer / Rojo Crítico.
- Chips rápidos: Mostrar Todo, Solo Stock Crítico, Próximos a Vencer.
- Botón "Filtros Avanzados" (categoría, rango de precio, rango de stock).
- Esqueleto de 0.5 s en la tabla al buscar o cambiar filtros.

## Compras
- Estados Completado (verde) / Pendiente (amarillo); botón "Marcar recibida" en pendientes (suma stock en ese momento).
- Botón "Ver detalles" con modal completo.
- Al elegir producto: autocompleta proveedor sugerido y costo unitario desde la última compra de ese medicamento (o precio de compra actual).

## Reportes
- Selector "Tipo de Reporte" (Ventas / Inventario).
- Selector de rango con calendario (shadcn Date Range Picker) + botones Hoy, Últimos 7 días, Este Mes.
- Tabla y los 3 botones (Rojo PDF, Verde Excel, Azul CSV) usan solo los datos filtrados; PDF con encabezado, rango, totales y tabla con estilo; Excel con anchos de columna y fila de totales.
- Inventario filtra por fecha de vencimiento dentro del rango.

## Visual
- Modo oscuro con orbes difuminados azul y púrpura en el fondo (estilo Vercel/Stripe).
- Toasts ricos: ícono animado y borde del color de la acción (verde éxito, rojo error, naranja aviso).
- Proveedores también con esqueleto de carga.

## Detalles técnicos
- Instalar `canvas-confetti` (+ tipos).
- Hook `useHotkey` para Ctrl/Cmd+K; `useDebouncedLoading(500)` para tablas.
- Componente `Barcode` en SVG (barras derivadas de los dígitos).
- Date range con `Calendar` (mode="range") dentro de `Popover`.
- Estilos de toast vía `classNames` de sonner + tokens success/warning/destructive; orbes como pseudo-elementos en `.dark .bg-app`.
- Lógica de sugerencias como función pura en `src/lib/insights.ts`.
