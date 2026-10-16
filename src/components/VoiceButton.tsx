import { useRef, useState } from "react";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type SR = { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; stop: () => void; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };

const clean = (t: string) => t.toLowerCase().replace(/^(buscar|busca|buscame|búscame|encuentra|agregar|agrega)\s+/i, "").replace(/[.,!?¿¡]/g, "").trim();

export function VoiceButton({ onText, fallback = "Buscar Paracetamol" }: { onText: (t: string) => void; fallback?: string }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);

  const finish = (raw: string) => {
    setListening(false);
    const t = clean(raw);
    if (t) {
      onText(t);
      toast.success("Comando de voz", { description: `“${raw}”` });
    }
  };

  const start = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    setListening(true);
    if (!Ctor) {
      setTimeout(() => finish(fallback), 1800);
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = "es-GT";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let got = false;
      rec.onresult = (e) => { got = true; finish(e.results[0][0].transcript); };
      rec.onerror = () => { if (!got) finish(fallback); };
      rec.onend = () => { if (!got) setListening(false); };
      recRef.current = rec;
      rec.start();
    } catch {
      setTimeout(() => finish(fallback), 1500);
    }
  };

  return (
    <div className="relative">
      <Button type="button" variant="hero" size="icon" onClick={start} aria-label="Buscar por voz" className={`glow ${listening ? "ring-2 ring-destructive" : ""}`}>
        <Mic />
      </Button>
      {listening && (
        <div className="glass absolute right-0 top-11 z-30 flex items-center gap-1 rounded-full px-3 py-2 animate-in fade-in zoom-in-95">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="voice-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
          <span className="ml-2 whitespace-nowrap text-xs font-medium">Escuchando...</span>
        </div>
      )}
    </div>
  );
}
