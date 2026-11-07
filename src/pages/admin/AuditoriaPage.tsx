import { ShieldCheck, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { formatearFecha, normalizarTexto, type RegistroAuditoria } from "@/core";
import { Cargando, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { SearchInput, Select } from "@/components/ui/Form";
import { Card, Chip, PageHeader } from "@/components/ui/Misc";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

const ACCIONES: Record<string, { texto: string; tono: "primary" | "success" | "danger" | "warning" | "neutral" }> = {
  "jornada.crear": { texto: "Jornada creada", tono: "success" },
  "jornada.editar": { texto: "Jornada editada", tono: "primary" },
  "jornada.reasignar": { texto: "Jornada reasignada", tono: "warning" },
  "jornada.cancelar": { texto: "Jornada cancelada", tono: "danger" },
  "jornada.reactivar": { texto: "Jornada reactivada", tono: "success" },
  "jornada.eliminar": { texto: "Jornada eliminada", tono: "danger" },
  "usuario.crear": { texto: "Cuenta creada", tono: "success" },
  "usuario.editar": { texto: "Cuenta editada", tono: "primary" },
  "usuario.rol": { texto: "Rol cambiado", tono: "warning" },
  "usuario.estado": { texto: "Estado de cuenta", tono: "warning" },
  "reporte.exportar": { texto: "Reporte exportado", tono: "neutral" },
  "asistencia.marcar": { texto: "Asistencia marcada", tono: "success" },
  "asistencia.desmarcar": { texto: "Asistencia quitada", tono: "danger" },
  "prestamo.crear": { texto: "Préstamo registrado", tono: "primary" },
  "prestamo.devolver": { texto: "Préstamo devuelto", tono: "success" },
};

const ENTIDADES = [
  { valor: "", etiqueta: "Todas las entidades" },
  { valor: "jornada", etiqueta: "Jornadas" },
  { valor: "usuario", etiqueta: "Cuentas" },
  { valor: "asistencia", etiqueta: "Asistencia" },
  { valor: "prestamo", etiqueta: "Préstamos" },
  { valor: "reporte", etiqueta: "Reportes" },
];

export default function AuditoriaPage() {
  useTitulo("Auditoría");
  const { datos, cargando, error, reintentar } = useRecursoApi<RegistroAuditoria[], { registros: RegistroAuditoria[] }>("/v1/admin/auditoria?limite=200", { extraer: (r) => r.registros, refrescoMs: 30000 });
  const [texto, setTexto] = useState("");
  const [entidad, setEntidad] = useState("");

  const lista = useMemo(() => {
    const q = normalizarTexto(texto);
    return (datos ?? []).filter(
      (r) =>
        (!entidad || r.entidad === entidad || r.accion.startsWith(`${entidad}.`)) &&
        (!q || [r.actorNombre, r.detalle, ACCIONES[r.accion]?.texto ?? r.accion].some((c) => normalizarTexto(c).includes(q)))
    );
  }, [datos, texto, entidad]);

  return (
    <>
      <PageHeader titulo="Auditoría" descripcion="Registro inmutable de las acciones administrativas: quién hizo qué y cuándo (últimos 200 movimientos)." />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <SearchInput valor={texto} onCambiar={setTexto} placeholder="Buscar por persona, acción o detalle…" />
        <Select aria-label="Entidad" value={entidad} onChange={(e) => setEntidad(e.target.value)} opciones={ENTIDADES} />
      </div>

      {cargando ? (
        <Cargando etiqueta="Cargando auditoría">
          <Card className="divide-y divide-line overflow-hidden">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-6 w-32 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </Card>
        </Cargando>
      ) : error ? (
        <ErrorState mensaje={error} alReintentar={reintentar} />
      ) : lista.length === 0 ? (
        <EmptyState icono={texto || entidad ? <SearchX className="size-7" /> : <ShieldCheck className="size-7" />} titulo={texto || entidad ? "No hay registros con esos criterios" : "Aún no hay movimientos"} />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {lista.map((r) => {
              const a = ACCIONES[r.accion] ?? { texto: r.accion, tono: "neutral" as const };
              return (
                <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-4 py-3.5 sm:px-5">
                  <Chip tono={a.tono} className="shrink-0">
                    {a.texto}
                  </Chip>
                  <div className="min-w-0 flex-1 basis-60">
                    <p className="text-sm font-semibold leading-snug">{r.detalle || r.entidadId}</p>
                    <p className="text-xs text-muted">Por {r.actorNombre || "—"}</p>
                  </div>
                  <time className="shrink-0 text-xs font-medium tabular-nums text-muted" dateTime={r.creadaEn ? new Date(r.creadaEn).toISOString() : undefined}>
                    {formatearFecha(r.creadaEn, "D MMM YYYY, h:mm A")}
                  </time>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
