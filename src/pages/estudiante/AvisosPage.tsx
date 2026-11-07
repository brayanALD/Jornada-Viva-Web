import { BellOff, CalendarClock, CircleCheck, CircleX, Info, Trash2, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import type { Notificacion } from "@/core";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Dialog";
import { Cargando, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Card, PageHeader } from "@/components/ui/Misc";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { useNotificaciones } from "@/features/notificaciones/NotificacionesContext";
import { cn } from "@/lib/cn";
import { useTitulo } from "@/lib/hooks";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import "dayjs/locale/es.js";

dayjs.extend(relativeTime);

const TIPOS: Record<string, { icono: LucideIcon; color: string; fondo: string; etiqueta: string }> = {
  cancelacion: { icono: CircleX, color: "text-danger", fondo: "bg-danger-pale", etiqueta: "Cancelada" },
  eliminacion: { icono: Trash2, color: "text-danger", fondo: "bg-danger-pale", etiqueta: "Eliminada" },
  reprogramacion: { icono: CalendarClock, color: "text-[#b97800]", fondo: "bg-accent-pale", etiqueta: "Reprogramada" },
  reactivacion: { icono: CircleCheck, color: "text-success", fondo: "bg-success-pale", etiqueta: "Reactivada" },
  actualizacion: { icono: Info, color: "text-primary", fondo: "bg-primary-pale", etiqueta: "Actualización" },
};

export default function AvisosPage() {
  useTitulo("Avisos");
  const navigate = useNavigate();
  const confirmar = useConfirm();
  const { notificaciones, noLeidas, cargando, marcarLeida, marcarTodasLeidas, eliminar } = useNotificaciones();
  const { jornadasPorId } = useJornadas();

  const abrir = async (n: Notificacion) => {
    if (!n.leida) void marcarLeida(n.id);
    if (n.jornadaId && jornadasPorId.has(n.jornadaId)) navigate(`/jornadas/${n.jornadaId}`);
  };

  const borrar = async (n: Notificacion) => {
    const ok = await confirmar({ titulo: "Eliminar aviso", mensaje: "El aviso se eliminará de tu lista.", confirmar: "Eliminar", peligro: true });
    if (ok) void eliminar(n.id);
  };

  return (
    <>
      <PageHeader
        titulo="Avisos"
        descripcion="Cambios en las jornadas en las que estás inscrito: cancelaciones, reprogramaciones y más."
        acciones={
          noLeidas > 0 && (
            <Button variante="secondary" icono={<CheckCheck className="size-4" />} onClick={() => void marcarTodasLeidas()}>
              Marcar todos como leídos ({noLeidas})
            </Button>
          )
        }
      />
      {cargando ? (
        <Cargando etiqueta="Cargando avisos" className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="flex gap-4 p-4">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </Card>
          ))}
        </Cargando>
      ) : notificaciones.length === 0 ? (
        <EmptyState icono={<BellOff className="size-7" />} titulo="No tienes avisos" texto="Si una jornada en la que estás inscrito cambia, te lo contaremos aquí." />
      ) : (
        <ul className="space-y-3">
          {notificaciones.map((n) => {
            const t = TIPOS[n.tipo ?? "actualizacion"] ?? TIPOS.actualizacion;
            const Icono = t.icono;
            return (
              <li key={n.id}>
                <Card className={cn("flex items-stretch gap-1 overflow-hidden", !n.leida && "border-primary-light/50 bg-primary-pale/40")}>
                  <button onClick={() => void abrir(n)} className="flex min-w-0 flex-1 items-start gap-4 p-4 text-left">
                    <span className={cn("relative grid size-11 shrink-0 place-items-center rounded-xl", t.fondo, t.color)}>
                      <Icono className="size-5" aria-hidden />
                      {!n.leida && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-white bg-danger" aria-label="No leído" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-xs">
                        <span className={cn("font-extrabold uppercase tracking-wide", t.color)}>{t.etiqueta}</span>
                        <span className="text-faint">·</span>
                        <span className="font-medium text-muted">{dayjs(n.creadaEn).locale("es").fromNow()}</span>
                      </span>
                      <span className={cn("mt-0.5 block text-[15px] leading-snug", n.leida ? "font-semibold" : "font-extrabold")}>{n.titulo}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">{n.mensaje}</span>
                    </span>
                  </button>
                  <button onClick={() => void borrar(n)} className="grid w-12 shrink-0 place-items-center text-faint transition-colors hover:bg-danger-pale hover:text-danger" aria-label="Eliminar aviso">
                    <Trash2 className="size-4" />
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
