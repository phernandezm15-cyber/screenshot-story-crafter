import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DollarSign, Package, AlertTriangle, Truck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { useStore, q, fmtFechaHora } from "@/lib/store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FarmaciaDB" },
      { name: "description", content: "Resumen de ventas, inventario y alertas de la farmacia." },
      { property: "og:title", content: "Dashboard — FarmaciaDB" },
      { property: "og:description", content: "Resumen de ventas, inventario y alertas de la farmacia." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { meds, ventas, proveedores } = useStore();
  const today = new Date().toDateString();
  const ventasHoy = ventas.filter((v) => new Date(v.fecha).toDateString() === today).reduce((s, v) => s + v.total, 0);
  const alertas = meds.filter((m) => m.stock < 10).length;

  const chart = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toDateString();
      const total = ventas.filter((v) => new Date(v.fecha).toDateString() === key).reduce((s, v) => s + v.total, 0);
      return { dia: d.toLocaleDateString("es-GT", { weekday: "short", day: "numeric" }), total: Math.round(total * 100) / 100 };
    });
  }, [ventas]);

  const kpis = [
    { label: "Ventas del Día", value: q(ventasHoy), icon: DollarSign, tone: "bg-success/15 text-success" },
    { label: "Productos Totales", value: meds.length, icon: Package, tone: "bg-primary/15 text-primary" },
    { label: "Alertas de Stock", value: alertas, icon: AlertTriangle, tone: "bg-destructive/15 text-destructive", danger: true },
    { label: "Proveedores Activos", value: proveedores.length, icon: Truck, tone: "bg-warning/15 text-warning" },
  ];

  return (
    <div>
      <PageHeader title="Panel de Control" subtitle="Resumen general de la operación" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass lift flex items-center gap-4 rounded-2xl p-5">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${k.tone}`}>
              <k.icon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className={`truncate text-2xl font-extrabold ${k.danger ? "text-destructive" : ""}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-bold">Ventas de los últimos 7 días</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                formatter={(v: number) => q(v)}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
                cursor={{ fill: "var(--accent)" }}
              />
              <Bar dataKey="total" name="Total" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-bold">Últimas 5 ventas realizadas</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.slice(0, 5).map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.id}</TableCell>
                <TableCell>{fmtFechaHora(v.fecha)}</TableCell>
                <TableCell className="max-w-[260px] truncate">{v.items.map((i) => `${i.nombre} x${i.cantidad}`).join(", ")}</TableCell>
                <TableCell className="text-right font-semibold">{q(v.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
