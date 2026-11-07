import { CircleCheck, Library, Plus, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { TIPOS_OBJETO, ETIQUETA_TIPO_OBJETO, LIMITES_PRESTAMO, contarPrestamos, estadoPrestamo, normalizarTexto, ordenarPrestamos, validarPrestamo, type Prestamo } from "@/core";
import { Button } from "@/components/ui/Button";
import { Dialog, useConfirm } from "@/components/ui/Dialog";
import { Cargando, EmptyState, ErrorState, useToast } from "@/components/ui/Feedback";
import { Input, Segmented, SearchInput, Select, Textarea } from "@/components/ui/Form";
import { PageHeader } from "@/components/ui/Misc";
import { PrestamoCard, PrestamoCardSkeleton } from "@/features/prestamos/componentes";
import { marcarDevuelto, registrarPrestamo } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";
import { useAhora, useRecursoApi, useTitulo } from "@/lib/hooks";

type Filtro = "activos" | "vencidos" | "devueltos" | "todos";
const DIA_MS = 86_400_000;

function FormularioPrestamo({ abierto, alCerrar, alRegistrar }: { abierto: boolean; alCerrar: () => void; alRegistrar: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ codigo: "", nombre: "", tipo: "", correo: "", dias: "7", nota: "" });
  const [errores, setErrores] = useState<Record<string, string | undefined>>({});
  const [guardando, setGuardando] = useState(false);
  const cambiar = (campo: keyof typeof form, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined, vence: campo === "dias" ? undefined : e.vence }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const dias = Number(form.dias);
    const { errores: nuevos, datos } = validarPrestamo({ ...form, vence: Number.isFinite(dias) && dias > 0 ? Date.now() + dias * DIA_MS : NaN }) as { errores: Record<string, string>; datos: Parameters<typeof registrarPrestamo>[0] | null };
    if (nuevos.vence) nuevos.dias = nuevos.vence.replace("La fecha de devolución", "Los días de préstamo").replace("Elige hasta cuándo se presta.", "Escribe cuántos días se presta.");
    setErrores(nuevos);
    if (!datos) return;
    setGuardando(true);
    try {
      await registrarPrestamo(datos);
      toast.exito(`«${datos.nombre}» quedó prestado por ${dias} ${dias === 1 ? "día" : "días"}.`);
      setForm({ codigo: "", nombre: "", tipo: "", correo: "", dias: "7", nota: "" });
      alRegistrar();
      alCerrar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog abierto={abierto} alCerrar={alCerrar} titulo="Registrar préstamo" descripcion="Presta un libro, equipo o material a un estudiante." ancho="md" bloqueado={guardando}>
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input className="sm:col-span-2" etiqueta="Nombre del objeto" obligatorio value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} error={errores.nombre} placeholder="Ej. Calculadora científica" />
        <Select etiqueta="Tipo" obligatorio value={form.tipo} onChange={(e) => cambiar("tipo", e.target.value)} error={errores.tipo} placeholder="Elige el tipo" opciones={TIPOS_OBJETO.map((t: string) => ({ valor: t, etiqueta: (ETIQUETA_TIPO_OBJETO as Record<string, string>)[t] }))} />
        <Input etiqueta="Código de inventario" obligatorio value={form.codigo} onChange={(e) => cambiar("codigo", e.target.value)} error={errores.codigo} placeholder="LIB-001" />
        <Input className="sm:col-span-2" etiqueta="Correo del estudiante" obligatorio type="email" value={form.correo} onChange={(e) => cambiar("correo", e.target.value)} error={errores.correo} placeholder="estudiante@correo.com" />
        <Input etiqueta="Días de préstamo" obligatorio inputMode="numeric" value={form.dias} onChange={(e) => cambiar("dias", e.target.value.replace(/\D/g, ""))} error={errores.dias} ayuda={`Máximo ${LIMITES_PRESTAMO.diasMaximos} días.`} />
        <Textarea className="sm:col-span-2" etiqueta="Nota (opcional)" value={form.nota} onChange={(e) => cambiar("nota", e.target.value)} error={errores.nota} contador={`${form.nota.length}/${LIMITES_PRESTAMO.nota}`} placeholder="Estado del objeto, observaciones…" />
        <div className="mt-1 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button variante="secondary" onClick={alCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" cargando={guardando}>
            Registrar préstamo
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function PrestamosGestionPage() {
  useTitulo("Préstamos de objetos");
  const toast = useToast();
  const confirmar = useConfirm();
  const ahora = useAhora(60000);
  const { datos, cargando, error, recargar, reintentar } = useRecursoApi<Prestamo[], { prestamos: Prestamo[] }>("/v1/prestamos", { extraer: (r) => r.prestamos, refrescoMs: 60000 });
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [texto, setTexto] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [devolviendo, setDevolviendo] = useState<string | null>(null);

  const conteo = useMemo(() => contarPrestamos(datos ?? [], ahora) as { activos: number; vencidos: number; porVencer: number }, [datos, ahora]);
  const devueltos = useMemo(() => (datos ?? []).filter((p) => estadoPrestamo(p, ahora) === "devuelto").length, [datos, ahora]);

  const lista = useMemo(() => {
    const q = normalizarTexto(texto);
    const filtrados = (datos ?? []).filter((p) => {
      const estado = estadoPrestamo(p, ahora);
      if (filtro === "activos" && estado === "devuelto") return false;
      if (filtro === "vencidos" && estado !== "vencido") return false;
      if (filtro === "devueltos" && estado !== "devuelto") return false;
      return !q || [p.nombre, p.codigo, p.nombreUsuario, p.emailUsuario].some((c) => normalizarTexto(c).includes(q));
    });
    return ordenarPrestamos(filtrados, ahora) as Prestamo[];
  }, [datos, filtro, texto, ahora]);

  const devolver = async (p: Prestamo) => {
    const ok = await confirmar({ titulo: "Marcar devolución", mensaje: `¿Recibiste «${p.nombre}» (${p.codigo})?`, confirmar: "Sí, fue devuelto" });
    if (!ok) return;
    setDevolviendo(p.id);
    try {
      await marcarDevuelto(p.id);
      toast.exito("Devolución registrada.");
      await recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setDevolviendo(null);
    }
  };

  return (
    <>
      <PageHeader
        titulo="Préstamos de objetos"
        descripcion="Libros, equipos y materiales prestados a estudiantes, con alertas de vencimiento."
        acciones={
          <Button icono={<Plus className="size-4" />} onClick={() => setFormAbierto(true)}>
            Registrar préstamo
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Segmented
            valor={filtro}
            onCambiar={setFiltro}
            opciones={[
              { valor: "activos", etiqueta: "Activos", conteo: conteo.activos },
              { valor: "vencidos", etiqueta: "Vencidos", conteo: conteo.vencidos },
              { valor: "devueltos", etiqueta: "Devueltos", conteo: devueltos },
              { valor: "todos", etiqueta: "Todos", conteo: datos?.length ?? 0 },
            ]}
          />
        </div>
        <SearchInput valor={texto} onCambiar={setTexto} placeholder="Buscar objeto, código o estudiante…" className="w-full sm:w-80" />
      </div>

      {cargando ? (
        <Cargando etiqueta="Cargando préstamos" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PrestamoCardSkeleton key={i} />
          ))}
        </Cargando>
      ) : error ? (
        <ErrorState mensaje={error} alReintentar={reintentar} />
      ) : lista.length === 0 ? (
        texto || filtro !== "activos" ? (
          <EmptyState icono={<SearchX className="size-7" />} titulo="No hay préstamos con esos criterios" />
        ) : (
          <EmptyState icono={<Library className="size-7" />} titulo="No hay préstamos activos" texto="Registra un préstamo para llevar el control de lo que sale de la biblioteca o el laboratorio." accion={<Button onClick={() => setFormAbierto(true)}>Registrar préstamo</Button>} />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => (
            <PrestamoCard key={p.id} prestamo={p} ahora={ahora} quien>
              {estadoPrestamo(p, ahora) !== "devuelto" && (
                <Button variante="soft" tamano="sm" cargando={devolviendo === p.id} icono={<CircleCheck className="size-4" />} onClick={() => void devolver(p)}>
                  Marcar devuelto
                </Button>
              )}
            </PrestamoCard>
          ))}
        </div>
      )}

      <FormularioPrestamo abierto={formAbierto} alCerrar={() => setFormAbierto(false)} alRegistrar={() => void recargar()} />
    </>
  );
}
