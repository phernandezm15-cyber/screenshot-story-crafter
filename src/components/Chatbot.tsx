import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/lib/db";
import { diasParaVencer, q } from "@/lib/store";

interface Msg { from: "bot" | "user"; text: string }
const SUGGESTIONS = ["¿Qué medicamentos vencen pronto?", "¿Qué tiene stock crítico?", "¿Cuánto vendimos hoy?", "¿Cuál es el más vendido?"];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "¡Hola! Soy el asistente de FarmaciaDB. Pregúntame sobre inventario, ventas o clientes." }]);
  const { meds, ventas, clientes } = useData();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, typing]);

  const answer = (raw: string): string => {
    const t = norm(raw);
    if (/venc|caduc|expir/.test(t)) {
      const l = meds.map((m) => ({ m, d: diasParaVencer(m.caducidad) })).filter((x) => x.d <= 60).sort((a, b) => a.d - b.d);
      return l.length ? `Estos productos vencen en los próximos 60 días:\n${l.map((x) => `• ${x.m.nombre} — ${x.d < 0 ? "vencido" : `${x.d} días`} (stock ${x.m.stock})`).join("\n")}` : "Ningún producto vence en los próximos 60 días. ✅";
    }
    if (/critic|agot|bajo|poco stock|reponer/.test(t)) {
      const l = meds.filter((m) => m.stock < 10).sort((a, b) => a.stock - b.stock);
      return l.length ? `Stock crítico (< 10 uds.):\n${l.map((m) => `• ${m.nombre}: ${m.stock}`).join("\n")}` : "No hay productos en stock crítico.";
    }
    if (/hoy|dia|vendimos|ventas/.test(t) && !/mas vendido|top/.test(t)) {
      const today = new Date().toDateString();
      const v = ventas.filter((x) => new Date(x.fecha).toDateString() === today);
      return `Hoy se registraron ${v.length} ventas por un total de ${q(v.reduce((s, x) => s + x.total, 0))}.`;
    }
    if (/mas vendido|top|popular|rotacion/.test(t)) {
      const acc: Record<string, number> = {};
      ventas.forEach((v) => v.items.forEach((i) => (acc[i.nombre] = (acc[i.nombre] ?? 0) + i.cantidad)));
      const top = Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return top.length ? `Top productos más vendidos:\n${top.map(([n, c], i) => `${i + 1}. ${n} — ${c} uds.`).join("\n")}` : "Aún no hay ventas.";
    }
    if (/punto|cliente/.test(t)) {
      const c = clientes.find((x) => t.includes(norm(x.nombre.split(" ")[0])));
      if (c) return `${c.nombre} tiene ${c.puntos} Puntos Salud (NIT ${c.nit}).`;
      const top = [...clientes].sort((a, b) => b.puntos - a.puntos).slice(0, 3);
      return `Clientes con más Puntos Salud:\n${top.map((x) => `• ${x.nombre}: ${x.puntos} pts`).join("\n")}`;
    }
    const m = meds.find((x) => t.includes(norm(x.nombre.split(" ")[0])) || t.includes(norm(x.principio.split(" ")[0])));
    if (m) return `${m.nombre} (${m.principio}): ${m.stock} uds. en stock, precio ${q(m.precioVenta)}, vence el ${m.caducidad}.`;
    return "No entendí del todo 🤔. Prueba con: vencimientos, stock crítico, ventas de hoy, más vendido, puntos de un cliente o el nombre de un producto.";
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "bot", text: answer(text) }]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Asistente"
        className="glow fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-xl hover:scale-105"
      >
        {open ? <X /> : <Bot className="h-6 w-6" />}
      </button>
      {open && (
        <div className="glass fixed bottom-24 left-5 z-40 flex h-[480px] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-bold">Asistente FarmaciaDB</p>
              <p className="text-[11px] text-muted-foreground">Consulta datos en vivo</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.text}
              </div>
            ))}
            {typing && <div className="w-16 rounded-2xl bg-muted px-3 py-2 text-sm"><span className="animate-pulse">•••</span></div>}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-1 px-3 pb-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border bg-card/60 px-2 py-1 text-[11px] hover:bg-accent">{s}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta..." />
            <Button type="submit" size="icon" aria-label="Enviar"><Send /></Button>
          </form>
        </div>
      )}
    </>
  );
}
