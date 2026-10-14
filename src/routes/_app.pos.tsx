import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Search, Trash2, ShoppingCart, CheckCircle2, ScanBarcode, Printer, Keyboard } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton, useFakeLoading } from "@/components/PageSkeleton";
import { useStore, q, calcTotals, IVA_RATE, fmtFechaHora, useCurrentUser, type Venta, type VentaItem } from "@/lib/store";

export const Route = createFileRoute("/_app/pos")({
  head: () => ({
    meta: [
      { title: "Punto de Venta — FarmaciaDB" },
      { name: "description", content: "Registra ventas con escáner, atajos y cálculo de cambio." },
      { property: "og:title", content: "Punto de Venta — FarmaciaDB" },
      { property: "og:description", content: "Registra ventas con escáner, atajos y cálculo de cambio." },
    ],
  }),
  component: POS,
});

type Recibo = Venta & { efectivo: number; cambio: number };

function POS() {
  const loading = useFakeLoading();
  const meds = useStore((s) => s.meds);
  const registrarVenta = useStore((s) => s.registrarVenta);
  const user = useCurrentUser();
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [cart, setCart] = useState<VentaItem[]>([]);
  const [desc, setDesc] = useState(0);
  const [efectivo, setEfectivo] = useState("");
  const [scanning, setScanning] = useState(false);
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const filtered = meds.filter((m) => `${m.nombre} ${m.principio} ${m.categoria} ${m.codigo}`.toLowerCase().includes(query.toLowerCase()));

  const add = (id: string) => {
    const m = meds.find((x) => x.id === id);
    if (!m) return false;
    const cur = cart.find((c) => c.medId === id)?.cantidad ?? 0;
    if (cur + 1 > m.stock) {
      toast.error("Stock insuficiente", { description: `${m.nombre}: ${m.stock} disponibles` });
      return false;
    }
    setCart((c) =>
      c.some((i) => i.medId === id)
        ? c.map((i) => (i.medId === id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...c, { medId: id, nombre: m.nombre, precio: m.precioVenta, cantidad: 1 }],
    );
    return true;
  };
  const dec = (id: string) => setCart((c) => c.map((i) => (i.medId === id ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.medId !== id));

  const scanCode = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toLowerCase();
    if (!c) return;
    const m = meds.find((x) => x.codigo === c || x.id.toLowerCase() === c);
    if (!m) return void toast.error("Código no encontrado", { description: code });
    if (add(m.id)) toast.success(`${m.nombre} agregado`);
    setCode("");
  };

  const startScan = () => {
    setScanning(true);
    setTimeout(() => {
      const avail = meds.filter((m) => m.stock > (cart.find((c) => c.medId === m.id)?.cantidad ?? 0));
      setScanning(false);
      if (!avail.length) return void toast.error("No hay productos disponibles");
      const m = avail[Math.floor(Math.random() * avail.length)];
      if (add(m.id)) toast.success("Código detectado", { description: `${m.nombre} · ${m.codigo}` });
    }, 2000);
  };

  const t = calcTotals(cart, desc);
  const cash = Number(efectivo) || 0;
  const cambio = cash - t.total;

  const completar = () => {
    if (!cart.length) return toast.error("El ticket está vacío");
    if (efectivo && cash < t.total - 0.001) return toast.error("Efectivo insuficiente", { description: `Faltan ${q(-cambio)}` });
    const bad = cart.find((i) => i.cantidad > (meds.find((m) => m.id === i.medId)?.stock ?? 0));
    if (bad) return toast.error("Stock insuficiente", { description: bad.nombre });
    const v = registrarVenta(cart, desc, user?.nombre ?? "Admin");
    const paid = efectivo ? cash : v.total;
    setRecibo({ ...v, efectivo: paid, cambio: paid - v.total });
    setCart([]);
    setDesc(0);
    setEfectivo("");
    toast.success("Venta exitosa", { description: `${v.id} · ${q(v.total)}` });
    if (v.total > 500) {
      const end = Date.now() + 1500;
      (function frame() {
        confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 } });
        confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
    }
  };

  if (loading) return <PageSkeleton cards={2} />;

  return (
    <div>
      <PageHeader
        title="Punto de Venta"
        subtitle="Busca, escanea y cobra en segundos"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Keyboard className="h-3.5 w-3.5" /> Presiona <kbd className="rounded border bg-muted px-1.5 font-mono">Ctrl</kbd>+<kbd className="rounded border bg-muted px-1.5 font-mono">K</kbd> para buscar
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input ref={searchRef} placeholder="Buscar producto... (Ctrl+K)" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <form onSubmit={scanCode} className="relative">
              <ScanBarcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Escáner de código de barras (simulado)" className="pl-9 font-mono" value={code} onChange={(e) => setCode(e.target.value)} />
            </form>
            <Button variant="hero" onClick={startScan} aria-label="Escanear con cámara">
              <ScanBarcode /> Escanear
            </Button>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Tip: escribe un código (ej. {meds[0]?.codigo}) o ID y presiona Enter.</p>
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
                <Button size="icon" onClick={() => add(m.id)} disabled={m.stock <= 0} aria-label={`Agregar ${m.nombre}`}><Plus /></Button>
              </div>
            ))}
            {!filtered.length && <p className="col-span-full py-10 text-center text-muted-foreground">Sin resultados</p>}
          </div>
        </div>

        <div className="glass flex h-fit flex-col rounded-2xl p-5 lg:sticky lg:top-20">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ShoppingCart className="h-5 w-5 text-primary" /> Ticket</h2>
          <div className="max-h-[35vh] space-y-2 overflow-auto">
            {cart.map((i) => (
              <div key={i.medId} className="flex items-center gap-2 rounded-xl border bg-card/60 p-3 animate-in fade-in slide-in-from-right-2">
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
            {!cart.length && <p className="py-8 text-center text-sm text-muted-foreground">Agrega productos al ticket</p>}
          </div>
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <Row label="Subtotal" value={q(t.subtotal)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Descuento rápido</span>
              <div className="flex gap-1">
                {[0, 5, 10].map((p) => (
                  <Button key={p} size="sm" variant={desc === p ? "default" : "outline"} onClick={() => setDesc(p)}>{p}%</Button>
                ))}
              </div>
            </div>
            <Row label={`Descuento (${desc}%)`} value={`- ${q(t.descuento)}`} />
            <Row label={`IVA (${IVA_RATE * 100}%)`} value={q(t.iva)} />
            <div className="flex justify-between border-t pt-3 text-xl font-extrabold">
              <span>Total</span>
              <span className="text-primary">{q(t.total)}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 rounded-xl border bg-card/50 p-3">
            <label className="text-sm font-semibold" htmlFor="cash">Efectivo Recibido</label>
            <Input id="cash" type="number" min={0} step="0.01" placeholder="Q 0.00" value={efectivo} onChange={(e) => setEfectivo(e.target.value)} />
            <div className="grid grid-cols-4 gap-1.5">
              {[50, 100, 200].map((b) => (
                <Button key={b} size="sm" variant="outline" onClick={() => setEfectivo(String(b))}>Q{b}</Button>
              ))}
              <Button size="sm" variant="secondary" onClick={() => setEfectivo(t.total.toFixed(2))} disabled={!cart.length}>Exacto</Button>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <span>Cambio a devolver</span>
              <span className={efectivo && cambio < 0 ? "text-destructive" : "text-success"}>
                {efectivo ? (cambio < 0 ? `Faltan ${q(-cambio)}` : q(cambio)) : "—"}
              </span>
            </div>
          </div>
          <Button variant="success" className="mt-5 h-14 w-full text-lg font-bold" onClick={completar}>
            <CheckCircle2 className="!size-6" /> Completar Venta
          </Button>
        </div>
      </div>

      <Dialog open={scanning} onOpenChange={() => {}}>
        <DialogContent className="glass sm:max-w-sm [&>button]:hidden">
          <DialogHeader><DialogTitle>Escaneando código...</DialogTitle></DialogHeader>
          <div className="scanner-frame relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl bg-foreground/90">
            <div className="absolute inset-6 rounded-xl border-2 border-dashed border-primary-foreground/40" />
            <ScanBarcode className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-primary-foreground/30" />
            <div className="scanner-laser" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Apunta la cámara al código de barras</p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!recibo} onOpenChange={(o) => !o && setRecibo(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Recibo de venta</DialogTitle></DialogHeader>
          {recibo && (
            <div id="recibo" className="rounded-xl border border-dashed bg-card p-4 font-mono text-xs">
              <div className="mb-3 text-center">
                <p className="text-base font-bold">FarmaciaDB</p>
                <p>NIT 1234567-8 · Ciudad de Guatemala</p>
                <p>{recibo.id} · {fmtFechaHora(recibo.fecha)}</p>
                <p>Atendió: {recibo.vendedor}</p>
              </div>
              <div className="space-y-1 border-y border-dashed py-2">
                {recibo.items.map((i) => (
                  <div key={i.medId} className="flex justify-between gap-2">
                    <span className="truncate">{i.cantidad} x {i.nombre}</span>
                    <span>{q(i.precio * i.cantidad)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 space-y-0.5">
                <Row label="Subtotal" value={q(recibo.subtotal)} />
                <Row label={`Descuento ${recibo.descPct}%`} value={`- ${q(recibo.descuento)}`} />
                <Row label="IVA 12%" value={q(recibo.iva)} />
                <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{q(recibo.total)}</span></div>
                <Row label="Efectivo" value={q(recibo.efectivo)} />
                <Row label="Cambio" value={q(recibo.cambio)} />
              </div>
              <p className="mt-3 text-center">¡Gracias por su compra!</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecibo(null)}>Cerrar</Button>
            <Button onClick={() => { window.print(); toast.success("Enviado a impresión"); }}><Printer /> Imprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
