import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DollarSign, Package, AlertTriangle, Truck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton, useFakeLoading } from "@/components/PageSkeleton";
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

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" };

function Dashboard() {
  const loading = useFakeLoading();
  const { meds, ventas, proveedores } = useStore();
  const today = new Date().toDateString();
  const ventasHoy = ventas.filter((v) => new Date(v.fecha).toDateString() === today).reduce((s, v) => s + v.total, 0);
  const alertas = meds.filter((m) => m.stock < 10).length;

  const chart = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toDateString();
        const total = ventas.filter((v) => new Date(v.fecha).toDateString() === key).reduce((s, v) => s + v.total, 0);
        return { dia: d.toLocaleDateString("es-GT", { weekday: "short", day: "numeric" }), total: Math.round(total * 100) / 100 };
      }),
    [ventas],
  );

  const porCategoria = useMemo(() => {
    const catOf = Object.fromEntries(meds.map((m) => [m.id, m.categoria]));
    const acc: Record<string, number> = {};
    ventas.forEach((v) => v.items.forEach((i) => {
      const c = catOf[i.medId] ?? "Otros";
      acc[c] = (acc[c] ?? 0) + i.precio * i.cantidad;
    }));
    const sorted = Object.entries(acc).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5).map(([name, value]) => ({ name, value: Math.round(value) }));
    const rest = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    return rest ? [...top, { name: "Otros", value: Math.round(rest) }] : top;
  }, [ventas, meds]);

  if (loading) return <PageSkeleton />;

  const kpis = [
    { label: "Ventas del Día", value: q(ventasHoy), icon: DollarSign, tone: "text-success" },
    { label: "Productos Totales", value: meds.length, icon: Package, tone: "text-primary" },
    { label: "Alertas de Stock", value: alertas, icon: AlertTriangle, tone: "text-destructive", danger: true },
    { label: "Proveedores Activos", value: proveedores.length, icon: Truck, tone: "text-warning" },
  ];

  return (
    <div>
      <PageHeader title="Panel de Control" subtitle="Resumen general de la operación" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass lift relative overflow-hidden rounded-2xl p-5">
            <k.icon className={`pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 opacity-10 ${k.tone}`} strokeWidth={1.5} />
            <div className="relative flex items-center gap-3">
              <k.icon className={`h-6 w-6 ${k.tone}`} />
              <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
            </div>
            <p className={`relative mt-3 truncate text-3xl font-extrabold ${k.danger ? "text-destructive" : ""}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-bold">Ventas últimos 7 días</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip formatter={(v: number) => q(v)} contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="total" name="Total" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-bold">Ventas por Categoría</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porCategoria} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3} stroke="none">
                  {porCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => q(v)} contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.slice(0, 5).map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.id}</TableCell>
                <TableCell>{fmtFechaHora(v.fecha)}</TableCell>
                <TableCell className="max-w-[260px] truncate">{v.items.map((i) => `${i.nombre} x${i.cantidad}`).join(", ")}</TableCell>
                <TableCell>{v.vendedor}</TableCell>
                <TableCell className="text-right font-semibold">{q(v.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
