import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { fmtFechaHora, q, useStore } from "@/lib/store";

export const Route = createFileRoute("/_app/compras")({
  head: () => ({
    meta: [
      { title: "Compras — FarmaciaDB" },
      { name: "description", content: "Registra el ingreso de mercadería y aumenta el stock." },
      { property: "og:title", content: "Compras — FarmaciaDB" },
      { property: "og:description", content: "Registra el ingreso de mercadería y aumenta el stock." },
    ],
  }),
  component: Compras,
});

function Compras() {
  const { meds, proveedores, compras, registrarCompra } = useStore();
  const [prov, setProv] = useState("");
  const [med, setMed] = useState("");
  const [cant, setCant] = useState("");
  const [costo, setCosto] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = Number(cant);
    const k = Number(costo);
    if (!prov || !med) return toast.error("Selecciona proveedor y producto");
    if (!Number.isInteger(c) || c <= 0) return toast.error("Cantidad inválida");
    if (!(k > 0)) return toast.error("Costo unitario inválido");
    registrarCompra({ proveedorId: prov, medId: med, cantidad: c, costo: k });
    const m = meds.find((x) => x.id === med)!;
    toast.success("Compra registrada", { description: `${m.nombre}: +${c} unidades (stock ${m.stock + c})` });
    setCant("");
    setCosto("");
  };

  const name = (id: string, list: { id: string }[], key: string) =>
    (list.find((x) => x.id === id) as Record<string, string> | undefined)?.[key] ?? "—";

  return (
    <div>
      <PageHeader title="Compras" subtitle="Ingreso de mercadería al inventario" />
      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <form onSubmit={submit} className="glass h-fit space-y-4 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><PackagePlus className="h-5 w-5 text-primary" /> Registrar ingreso</h2>
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <Select value={prov} onValueChange={setProv}>
              <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
              <SelectContent>{proveedores.map((p) => <SelectItem key={p.id} value={p.id}>{p.empresa}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Producto</Label>
            <Select value={med} onValueChange={(v) => { setMed(v); setCosto(String(meds.find((m) => m.id === v)?.precioCompra ?? "")); }}>
              <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
              <SelectContent>{meds.map((m) => <SelectItem key={m.id} value={m.id}>{m.nombre} (stock {m.stock})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Cantidad</Label><Input type="number" min={1} value={cant} onChange={(e) => setCant(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Costo unit. (Q)</Label><Input type="number" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} /></div>
          </div>
          {Number(cant) > 0 && Number(costo) > 0 && (
            <p className="text-sm text-muted-foreground">Total compra: <span className="font-bold text-foreground">{q(Number(cant) * Number(costo))}</span></p>
          )}
          <Button type="submit" variant="success" className="w-full">Registrar compra</Button>
        </form>

        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-lg font-bold">Historial de compras</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.id}</TableCell>
                  <TableCell>{fmtFechaHora(c.fecha)}</TableCell>
                  <TableCell>{name(c.proveedorId, proveedores, "empresa")}</TableCell>
                  <TableCell>{name(c.medId, meds, "nombre")}</TableCell>
                  <TableCell className="text-right">+{c.cantidad}</TableCell>
                  <TableCell className="text-right font-semibold">{q(c.cantidad * c.costo)}</TableCell>
                </TableRow>
              ))}
              {!compras.length && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Aún no hay compras registradas</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
