import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...resto }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-card border border-line bg-surface shadow-card", className)} {...resto}>
      {children}
    </div>
  );
}

type TonoChip = "primary" | "success" | "danger" | "warning" | "neutral" | "info";
const TONOS: Record<TonoChip, string> = {
  primary: "bg-primary-pale text-primary",
  success: "bg-success-pale text-success",
  danger: "bg-danger-pale text-danger",
  warning: "bg-accent-pale text-[#8a5a00]",
  neutral: "bg-line/70 text-muted",
  info: "bg-ink text-white",
};

export function Chip({ tono = "primary", icono, children, className }: { tono?: TonoChip; icono?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", TONOS[tono], className)}>
      {icono}
      {children}
    </span>
  );
}

export function ProgressBar({ valor, color, className, etiqueta }: { valor: number; color?: string; className?: string; etiqueta?: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(valor)));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
    >
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color ?? "var(--color-primary-light)" }} />
    </div>
  );
}

/** Avatar determinista: un degradado verde y la inicial (sin imágenes ni red). */
export function Avatar({ nombre, semilla, tamano = 40, className }: { nombre?: string; semilla?: string; tamano?: number; className?: string }) {
  const clave = semilla || nombre || "u";
  let h = 0;
  for (let i = 0; i < clave.length; i++) h = (h * 31 + clave.charCodeAt(i)) >>> 0;
  const tono = 140 + (h % 40); // verdes institucionales
  const giro = h % 360;
  return (
    <div
      className={cn("grid shrink-0 select-none place-items-center rounded-full font-extrabold text-white", className)}
      style={{
        width: tamano,
        height: tamano,
        fontSize: tamano * 0.4,
        background: `linear-gradient(${giro}deg, hsl(${tono} 60% 28%), hsl(${tono + 12} 55% 42%))`,
      }}
      aria-hidden
    >
      {(nombre || "?").trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

/** Bloque de fecha del móvil (día grande + mes) adaptado a la web. */
export function BloqueFecha({ dia, mes, className }: { dia: string; mes: string; className?: string }) {
  return (
    <div className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-pale text-primary", className)}>
      <span className="text-xl font-extrabold leading-none tabular-nums">{dia}</span>
      <span className="mt-0.5 text-[11px] font-extrabold uppercase tracking-wider text-primary-light">{mes}</span>
    </div>
  );
}

export function PageHeader({ titulo, descripcion, acciones, volver }: { titulo: string; descripcion?: string; acciones?: ReactNode; volver?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {volver}
        <h1 className="text-2xl font-extrabold text-ink sm:text-[1.75rem]">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

export function Stat({ icono, valor, etiqueta, tono = "primary", detalle }: { icono: ReactNode; valor: ReactNode; etiqueta: string; tono?: TonoChip; detalle?: string }) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", TONOS[tono])}>{icono}</div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none tabular-nums text-ink">{valor}</p>
        <p className="mt-1 text-[13px] font-semibold text-muted">{etiqueta}</p>
        {detalle && <p className="text-xs text-faint">{detalle}</p>}
      </div>
    </Card>
  );
}

export function SectionTitle({ children, derecha }: { children: ReactNode; derecha?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted">{children}</h2>
      {derecha}
    </div>
  );
}
