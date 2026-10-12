import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Search, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { useStore, q, calcTotals, IVA_RATE, type VentaItem } from "@/lib/store";

export const Route = createFileRoute("/_app/pos")({
  head: () => ({
    meta: [
      { title: "Punto de Venta — FarmaciaDB" },
      { name: "description", content: "Registra ventas rápidamente con búsqueda en tiempo real." },
      { property: "og:title", content: "Punto de Venta — FarmaciaDB" },
      { property: "og:description", content: "Registra ventas rápidamente con búsqueda en tiempo real." },
    ],
  }),
  component: POS,
});

function POS() {
  const meds = useStore((s) => s.meds);
  const registrarVenta = useStore((s) => s.registrarVenta);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<VentaItem[]>([]);
  const [desc, setDesc] = useState(0);

  const filtered = meds.filter((m) =>
    `${m.nombre} ${m.principio} ${m.categoria}`.toLowerCase().includes(query.toLowerCase()),
  );
  const stockOf = (id: string) => meds.find((m) => m.id === id)?.stock ?? 0;

  const add = (id: string) => {
    const m = meds.find((x) => x.id === id)!;
    const cur = cart.find((c) => c.medId === id)?.cantidad ?? 0;
    if (cur + 1 > m.stock) return toast.error("Stock insuficiente", { description: `${m.nombre}: ${m.stock} disponibles` });
    setCart((c) =>
      c.some((i) => i.medId === id)
        ? c.map((i) => (i.medId === id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...c, { medId: id, nombre: m.nombre, precio: m.precioVenta, cantidad: 1 }],
    );
  };
  const dec = (id: string) =>
    setCart((c) => c.map((i) => (i.medId === id ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.medId !== id));

  const t = calcTotals(cart, desc);

  const completar = () => {
    if (!cart.length) return toast.error("El ticket está vacío");
    const bad = cart.find((i) => i.cantidad > stockOf(i.medId));
    if (bad) return toast.error("Stock insuficiente", { description: bad.nombre });
    const v = registrarVenta(cart, desc);
    setCart([]);
    setDesc(0);
    toast.success("Venta exitosa", { description: `${v.id} · ${q(v.total)}` });
  };

  return (
    <div>
      <PageHeader title="Punto de Venta" subtitle="Busca productos y arma el ticket" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="glass rounded-2xl p-5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, principio activo o categoría..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((m) => (
              <div key={m.id} className="lift flex items-center justify-between gap-3 rounded-xl border bg-card/60 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{m.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.principio}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="font-bold text-primary">{q(m.precioVenta)}</span>
                    <Badge variant={m.stock < 10 ? "danger" : "success"}>Stock: {m.stock}</Badge>
                  </div>
                </div>
                <Button size="icon" onClick={() => add(m.id)} disabled={m.stock <= 0} aria-label={`Agregar ${m.nombre}`}>
                  <Plus />
                </Button>
              </div>
            ))}
            {!filtered.length && <p className="col-span-full py-10 text-center text-muted-foreground">Sin resultados</p>}
          </div>
        </div>

        <div className="glass flex h-fit flex-col rounded-2xl p-5 lg:sticky lg:top-20">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <ShoppingCart className="h-5 w-5 text-primary" /> Ticket
          </h2>
          <div className="max-h-[45vh] space-y-2 overflow-auto">
            {cart.map((i) => (
              <div key={i.medId} className="flex items-center gap-2 rounded-xl border bg-card/60 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{i.nombre}</p>
                  <p className="text-xs text-muted-foreground">{q(i.precio)} c/u · {q(i.precio * i.cantidad)}</p>
                </div>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => dec(i.medId)}><Minus /></Button>
                <span className="w-6 text-center text-sm font-bold">{i.cantidad}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => add(i.medId)}><Plus /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i.medId)}><Trash2 /></Button>
              </div>
            ))}
            {!cart.length && <p className="py-10 text-center text-sm text-muted-foreground">Agrega productos al ticket</p>}
          </div>
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <Row label="Subtotal" value={q(t.subtotal)} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Descuento (%)</span>
              <Input type="number" min={0} max={100} value={desc} onChange={(e) => setDesc(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className="h-8 w-20 text-right" />
            </div>
            <Row label="Monto descuento" value={`- ${q(t.descuento)}`} />
            <Row label={`IVA (${IVA_RATE * 100}%)`} value={q(t.iva)} />
            <div className="flex justify-between border-t pt-3 text-xl font-extrabold">
              <span>Total</span>
              <span className="text-primary">{q(t.total)}</span>
            </div>
          </div>
          <Button variant="success" className="mt-5 h-14 w-full text-lg font-bold" onClick={completar}>
            <CheckCircle2 className="!size-6" /> Completar Venta
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
