import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { session } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — FarmaciaDB" },
      { name: "description", content: "Accede al panel de gestión de FarmaciaDB." },
      { property: "og:title", content: "Iniciar sesión — FarmaciaDB" },
      { property: "og:description", content: "Accede al panel de gestión de FarmaciaDB." },
    ],
  }),
  component: Login,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; pass?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (!email.trim()) er.email = "El correo es obligatorio";
    else if (!EMAIL_RE.test(email)) er.email = "Correo electrónico inválido";
    if (!pass) er.pass = "La contraseña es obligatoria";
    setErrors(er);
    if (Object.keys(er).length) {
      toast.error("Revisa los campos del formulario");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      session.set(email);
      toast.success("Bienvenido a FarmaciaDB", { description: "Sesión iniciada como Admin" });
      navigate({ to: "/dashboard" });
    }, 2000);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-auth px-4 py-10">
      <div className="glass w-full max-w-md rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-sm text-muted-foreground">Ingresa para administrar tu farmacia</p>
          </div>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@farmacia.gt"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pass">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pass"
                type={show ? "text" : "password"}
                placeholder="••••••••"
                className="px-9"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <button
                type="button"
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.pass && <p className="text-xs text-destructive">{errors.pass}</p>}
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Versión de prototipo. Usa cualquier correo válido y contraseña.
        </p>
      </div>
    </div>
  );
}
