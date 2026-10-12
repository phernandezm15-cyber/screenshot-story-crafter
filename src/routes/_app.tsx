import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, Package, Truck, PackagePlus, FileBarChart, Moon, Sun, LogOut, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { session, useStore } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => {
    if (!session.get()) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Punto de Venta", url: "/pos", icon: ShoppingCart },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Proveedores", url: "/proveedores", icon: Truck },
  { title: "Compras", url: "/compras", icon: PackagePlus },
  { title: "Reportes", url: "/reportes", icon: FileBarChart },
] as const;

function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon" className="backdrop-blur-xl">
      <SidebarHeader className="p-3">
        <Logo compact={collapsed} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={path === it.url} tooltip={it.title}>
                    <Link to={it.url} onClick={() => setOpenMobile(false)}>
                      <it.icon />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const dark = useStore((s) => s.dark);
  const toggleDark = useStore((s) => s.toggleDark);
  const logout = () => {
    session.clear();
    toast.success("Sesión cerrada");
    navigate({ to: "/login", replace: true });
  };
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-app">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-20 flex h-14 items-center gap-2 rounded-none border-x-0 border-t-0 px-3 sm:px-5">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="hidden items-center gap-2 text-sm font-semibold sm:flex">
              <UserCircle2 className="h-5 w-5 text-primary" /> Admin
            </div>
            <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Cambiar tema">
              {dark ? <Sun /> : <Moon />}
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut /> <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </header>
          <main className="mx-auto w-full max-w-[1800px] flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
          <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
            Versión de prototipo. Los datos presentados son demostrativos. Las funciones de backend y seguridad requieren
            configuración adicional.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
