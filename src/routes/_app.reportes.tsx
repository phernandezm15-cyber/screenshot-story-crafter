import { createFileRoute } from "@tanstack/react-router";
import { FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { fmtFecha, fmtFechaHora, q, useStore } from "@/lib/store";
import { exportCSV, exportPDF, exportXLSX, type Sheet } from "@/lib/export";

export const Route = createFileRoute("/_app/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes — FarmaciaDB" },
      { name: "description", content: "Reportes de ventas e inventario exportables a PDF, Excel y CSV." },
      { property: "og:title", content: "Reportes — FarmaciaDB" },
      { property: "og:description", content: "Reportes de ventas e inventario exportables a PDF, Excel y CSV." },
    ],
  }),
  component: Reportes,
});

function Reportes() {
  const { ventas, meds } = useStore();
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
  const valorInv = meds.reduce((s, m) => s + m.stock * m.precioCompra, 0);

  const sheets = (): Sheet[] => [
    {
      name: "Ventas",
      headers: ["ID", "Fecha", "Productos", "Subtotal (Q)", "Descuento (Q)", "IVA (Q)", "Total (Q)"],
      rows: ventas.map((v) => [
        v.id,
        fmtFechaHora(v.fecha),
        v.items.map((i) => `${i.nombre} x${i.cantidad}`).join("; "),
        +v.subtotal.toFixed(2),
        +v.descuento.toFixed(2),
        +v.iva.toFixed(2),
        +v.total.toFixed(2),
      ]),
    },
    {
      name: "Inventario",
      headers: ["ID", "Nombre", "Principio activo", "Categoría", "Vencimiento", "Precio compra (Q)", "Precio venta (Q)", "Stock"],
      rows: meds.map((m) => [m.id, m.nombre, m.principio, m.categoria, m.caducidad, m.precioCompra, m.precioVenta, m.stock]),
    },
  ];
  const file = `FarmaciaDB_reporte_${new Date().toISOString().slice(0, 10)}`;
  const run = (fn: () => void, label: string) => {
    try {
      fn();
      toast.success(`Reporte exportado a ${label}`);
    } catch {
      toast.error(`No se pudo exportar a ${label}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle={`${ventas.length} ventas · Total ${q(totalVentas)} · Valor inventario ${q(valorInv)}`}
        actions={
          <>
            <Button variant="destructive" size="lg" onClick={() => run(() => exportPDF("Reporte FarmaciaDB", sheets(), file), "PDF")}>
              <FileText /> Exportar a PDF
            </Button>
            <Button variant="success" size="lg" onClick={() => run(() => exportXLSX(sheets(), file), "Excel")}>
              <FileSpreadsheet /> Exportar a Excel
            </Button>
            <Button size="lg" onClick={() => run(() => exportCSV(sheets(), file), "CSV")}>
              <FileDown /> Exportar a CSV
            </Button>
          </>
        }
      />
      <div className="glass rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-bold">Resumen de ventas</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">IVA</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.id}</TableCell>
                <TableCell>{fmtFechaHora(v.fecha)}</TableCell>
                <TableCell className="max-w-[320px] truncate">{v.items.map((i) => `${i.nombre} x${i.cantidad}`).join(", ")}</TableCell>
                <TableCell className="text-right">{q(v.subtotal)}</TableCell>
                <TableCell className="text-right">{q(v.iva)}</TableCell>
                <TableCell className="text-right font-semibold">{q(v.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="glass mt-6 rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-bold">Inventario actual</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Precio venta</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meds.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.id}</TableCell>
                <TableCell>{m.nombre}</TableCell>
                <TableCell>{m.categoria}</TableCell>
                <TableCell>{fmtFecha(m.caducidad)}</TableCell>
                <TableCell className="text-right">{q(m.precioVenta)}</TableCell>
                <TableCell className={`text-right font-semibold ${m.stock < 10 ? "text-destructive" : ""}`}>{m.stock}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
