import { Box, CircleCheck, Cpu, Library, TriangleAlert, Clock, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { ETIQUETA_ESTADO_PRESTAMO, ETIQUETA_TIPO_OBJETO, estadoPrestamo, formatearFecha, type Prestamo } from "@/core";
import { Card } from "@/components/ui/Misc";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/Feedback";

type EstadoPrestamo = "vigente" | "por_vencer" | "vencido" | "devuelto";

const ESTILO: Record<EstadoPrestamo, { texto: string; fondo: string; chip: string }> = {
  vigente: { texto: "text-success", fondo: "bg-success-pale", chip: "bg-success text-white" },
  por_vencer: { texto: "text-[#b97800]", fondo: "bg-accent-pale", chip: "bg-accent text-ink" },
  vencido: { texto: "text-danger", fondo: "bg-danger-pale", chip: "bg-danger text-white" },
  devuelto: { texto: "text-muted", fondo: "bg-line/50", chip: "bg-line text-muted" },
};
const ICONO_TIPO = { libro: Library, equipo: Cpu, material: Box };
const ICONO_ESTADO = { vigente: Clock, por_vencer: TriangleAlert, vencido: TriangleAlert, devuelto: CircleCheck };

/** Tarjeta de un préstamo. `quien` muestra a quién se prestó (gestión); `children` agrega acciones. */
export function PrestamoCard({ prestamo, ahora, quien, children }: { prestamo: Prestamo; ahora: number; quien?: boolean; children?: ReactNode }) {
  const estado = estadoPrestamo(prestamo, ahora) as EstadoPrestamo;
  const e = ESTILO[estado];
  const devuelto = estado === "devuelto";
  const IconoTipo = ICONO_TIPO[prestamo.tipo] ?? Box;
  const IconoEstado = ICONO_ESTADO[estado];
  const fecha =
    devuelto && prestamo.devueltoEn
      ? `Devuelto el ${formatearFecha(prestamo.devueltoEn, "D [de] MMMM [de] YYYY")}`
      : `Devolver antes del ${formatearFecha(prestamo.vence, "D [de] MMMM, h:mm A")}`;

  return (
    <Card className={cn("flex flex-col gap-3.5 p-4", devuelto && "opacity-75")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", e.fondo, e.texto)}>
          <IconoTipo className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug">{prestamo.nombre}</h3>
          <p className="truncate text-xs font-medium text-muted">
            {ETIQUETA_TIPO_OBJETO[prestamo.tipo] ?? "Objeto"} · {prestamo.codigo}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", e.chip)}>{ETIQUETA_ESTADO_PRESTAMO[estado]}</span>
      </div>
      <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold", e.fondo, devuelto ? "text-muted" : "text-ink")}>
        <IconoEstado className={cn("size-4 shrink-0", e.texto)} aria-hidden />
        {fecha}
      </div>
      {quien && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <UserRound className="size-3.5 text-primary" aria-hidden />
          <span className="truncate">Prestado a {prestamo.nombreUsuario || prestamo.emailUsuario || "un estudiante"}</span>
        </p>
      )}
      {prestamo.nota && <p className="line-clamp-3 text-xs italic leading-relaxed text-muted">“{prestamo.nota}”</p>}
      {children}
    </Card>
  );
}

export function PrestamoCardSkeleton() {
  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </Card>
  );
}
