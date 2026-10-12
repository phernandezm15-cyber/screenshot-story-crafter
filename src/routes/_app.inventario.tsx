import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CATEGORIAS, diasParaVencer, fmtFecha, nextId, q, useStore, type Medicamento } from "@/lib/store";

export const Route = createFileRoute("/_app/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario — FarmaciaDB" },
      { name: "description", content: "Gestiona medicamentos, stock y fechas de vencimiento." },
      { property: "og:title", content: "Inventario — FarmaciaDB" },
      { property: "og:description", content: "Gestiona medicamentos, stock y fechas de vencimiento." },
    ],
  }),
  component: Inventario,
});

const PAGE = 8;
const empty = (): Medicamento => ({ id: "", nombre: "", principio: "", categoria: CATEGORIAS[0], caducidad: "", precioCompra: 0, precioVenta: 0, stock: 0 });

function Inventario() {
  const { meds, saveMed, deleteMed } = useStore();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("todas");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Medicamento | null>(null);
  const [toDelete, setToDelete] = useState<Medicamento | null>(null);

  const filtered = meds.filter(
    (m) => m.nombre.toLowerCase().includes(search.toLowerCase()) && (cat === "todas" || m.categoria === cat),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  useEffect(() => setPage(1), [search, cat]);
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle={`${meds.length} medicamentos registrados`}
        actions={<Button onClick={() => setEditing(empty())}><Plus /> Añadir Nuevo</Button>}
      />
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Precio Venta</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const dias = diasParaVencer(m.caducidad);
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.id}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{m.nombre}</div>
                    <div className="text-xs text-muted-foreground">{m.principio}</div>
                  </TableCell>
                  <TableCell>{m.categoria}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      {fmtFecha(m.caducidad)}
                      {dias <= 30 && <Badge variant={dias < 0 ? "danger" : "warning"}>{dias < 0 ? "Vencido" : "Por vencer"}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{q(m.precioVenta)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">{m.stock}</span>
                      {m.stock < 10 && <Badge variant="danger">Stock Crítico</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(m)} aria-label="Editar"><Pencil /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setToDelete(m)} aria-label="Eliminar"><Trash2 /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Sin resultados</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {pages} · {filtered.length} resultados</span>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft /></Button>
            <Button size="icon" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight /></Button>
          </div>
        </div>
      </div>

      {editing && (
        <MedForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(m) => {
            const isNew = !m.id;
            saveMed(isNew ? { ...m, id: nextId("MED", meds.map((x) => x.id)) } : m);
            toast.success(isNew ? "Producto guardado" : "Producto actualizado", { description: m.nombre });
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="¿Eliminar medicamento?"
        description={`Se eliminará "${toDelete?.nombre}" del inventario. Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (toDelete) {
            deleteMed(toDelete.id);
            toast.success("Producto eliminado", { description: toDelete.nombre });
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}

function MedForm({ initial, onClose, onSave }: { initial: Medicamento; onClose: () => void; onSave: (m: Medicamento) => void }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = <K extends keyof Medicamento>(k: K, v: Medicamento[K]) => setF({ ...f, [k]: v });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.nombre.trim()) er.nombre = "Requerido";
    if (!f.principio.trim()) er.principio = "Requerido";
    if (!f.caducidad) er.caducidad = "Requerido";
    if (f.precioCompra <= 0) er.precioCompra = "Debe ser mayor a 0";
    if (f.precioVenta <= 0) er.precioVenta = "Debe ser mayor a 0";
    else if (f.precioVenta < f.precioCompra) er.precioVenta = "Debe ser ≥ precio de compra";
    if (f.stock < 0 || !Number.isInteger(f.stock)) er.stock = "Entero ≥ 0";
    setErr(er);
    if (Object.keys(er).length) return toast.error("Revisa los campos del formulario");
    onSave(f);
  };

  const field = (k: keyof Medicamento, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={f[k] as string | number}
        onChange={(e) => set(k, (type === "number" ? Number(e.target.value) : e.target.value) as never)}
      />
      {err[k] && <p className="text-xs text-destructive">{err[k]}</p>}
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass max-h-[90vh] overflow-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{initial.id ? "Editar medicamento" : "Nuevo medicamento"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {field("nombre", "Nombre comercial")}
          {field("principio", "Principio activo")}
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={f.categoria} onValueChange={(v) => set("categoria", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {field("caducidad", "Fecha de caducidad", "date")}
          {field("precioCompra", "Precio compra (Q)", "number")}
          {field("precioVenta", "Precio venta (Q)", "number")}
          {field("stock", "Stock actual", "number")}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
