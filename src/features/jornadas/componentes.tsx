import { CalendarDays, Clock, ImageOff, MapPin, SlidersHorizontal, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  CATEGORIAS,
  ESTADOS_JORNADA,
  ETIQUETA_ESTADO,
  categoriaDeJornada,
  coincideFiltroFecha,
  conteoPlural,
  formatearDuracion,
  formatearFecha,
  formatearHora,
  normalizarTexto,
  opcionesUnicas,
  type EstadoJornada,
  type Jornada,
} from "@/core";
import { cn } from "@/lib/cn";
import { Chip, ProgressBar, BloqueFecha } from "@/components/ui/Misc";
import { Select, SearchInput } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/Feedback";

// ---- Banner de la jornada (enlace https opcional a una imagen) ----

export function Banner({ url, className, alto = "h-32" }: { url?: string; className?: string; alto?: string }) {
  const [fallo, setFallo] = useState(false);
  if (url && !fallo) {
    return <img src={url} alt="" loading="lazy" onError={() => setFallo(true)} className={cn("w-full object-cover", alto, className)} />;
  }
  return (
    <div className={cn("relative w-full overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary", alto, className)} aria-hidden>
      <div className="absolute -right-6 -top-8 size-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-10 left-8 size-28 rounded-full bg-accent/25" />
      <CalendarDays className="absolute bottom-3 right-4 size-10 text-white/30" />
    </div>
  );
}

// ---- Estado de una jornada ----

const TONO_ESTADO: Record<EstadoJornada, "success" | "warning" | "danger" | "neutral"> = {
  activa: "success",
  en_curso: "warning",
  cancelada: "danger",
  finalizada: "neutral",
};

export function EstadoChip({ estado, className }: { estado: EstadoJornada; className?: string }) {
  return (
    <Chip tono={TONO_ESTADO[estado]} className={className}>
      {estado === ESTADOS_JORNADA.EN_CURSO && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {ETIQUETA_ESTADO[estado]}
    </Chip>
  );
}

// ---- Tarjeta ----

interface PropsTarjeta {
  jornada: Jornada;
  to: string;
  /** Sustituye el indicador de cupos (p. ej. «Inscrito») */
  insignia?: ReactNode;
  /** Línea adicional (p. ej. inscritos para gestor y administrador) */
  extra?: string;
  /** Etiqueta flotante sobre el banner (p. ej. el estado para gestor y administrador) */
  esquina?: ReactNode;
}

export function JornadaCard({ jornada, to, insignia, extra, esquina }: PropsTarjeta) {
  const total = Number(jornada.cuposTotales) || 0;
  const ocupados = Number(jornada.cuposOcupados) || 0;
  const restantes = total - ocupados;
  const sinCupos = !insignia && restantes <= 0;
  const pocos = restantes > 0 && restantes <= 10;
  const ocupacion = total > 0 ? (ocupados / total) * 100 : 0;
  const colorCupos = sinCupos ? "var(--color-faint)" : pocos ? "var(--color-accent)" : "var(--color-success)";
  const categoria = categoriaDeJornada(jornada);

  return (
    <Link
      to={to}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all",
        "hover:-translate-y-0.5 hover:border-primary-light/40 hover:shadow-[0_10px_30px_rgb(16_40_30/0.12)]",
        sinCupos && "opacity-70"
      )}
    >
      <div className="relative overflow-hidden">
        <Banner url={jornada.bannerUrl} alto="h-28" className="transition-transform duration-500 group-hover:scale-[1.03]" />
        {esquina && <div className="absolute left-3 top-3 drop-shadow">{esquina}</div>}
      </div>
      <div className="flex flex-1 gap-3.5 p-4">
        <BloqueFecha dia={formatearFecha(jornada.fecha, "DD")} mes={formatearFecha(jornada.fecha, "MMM").replace(".", "")} />
        <div className="min-w-0 flex-1 space-y-1.5">
          {categoria && <Chip>{categoria}</Chip>}
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-ink group-hover:text-primary">{jornada.titulo}</h3>
          {jornada.entidad && <p className="truncate text-xs font-medium text-muted">{jornada.entidad}</p>}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5 text-primary" aria-hidden />
              {formatearHora(jornada.fecha)}
            </span>
            {jornada.lugar && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{jornada.lugar}</span>
              </span>
            )}
          </p>
          {extra && (
            <p className="flex items-center gap-1 text-xs font-semibold text-muted">
              <Users className="size-3.5 text-primary" aria-hidden />
              {extra}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-line/70 bg-canvas/50 px-4 py-3">
        {insignia ?? (
          <>
            <ProgressBar valor={ocupacion} color={colorCupos} className="flex-1" etiqueta="Ocupación de cupos" />
            <span className="text-xs font-bold tabular-nums" style={{ color: sinCupos ? "var(--color-muted)" : colorCupos }}>
              {sinCupos ? "Sin cupos" : conteoPlural(restantes, "cupo", "cupos")}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}

export function JornadaCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <Skeleton className="h-28 rounded-none" />
      <div className="flex gap-3.5 p-4">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </div>
      <div className="border-t border-line/70 px-4 py-3.5">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

// ---- Filtros del listado ----

export interface Filtros {
  busqueda: string;
  categoria: string;
  lugar: string;
  fecha: "todas" | "hoy" | "semana" | "mes" | "rango";
  desde: string;
  hasta: string;
}

export const FILTROS_INICIALES: Filtros = { busqueda: "", categoria: "", lugar: "", fecha: "todas", desde: "", hasta: "" };

export const hayFiltros = (f: Filtros) => f.busqueda.trim() !== "" || !!f.categoria || !!f.lugar || f.fecha !== "todas";

export function aplicarFiltros(jornadas: Jornada[], f: Filtros) {
  const texto = normalizarTexto(f.busqueda);
  return jornadas.filter((j) => {
    if (texto && !normalizarTexto(j.titulo).includes(texto) && !normalizarTexto(j.entidad).includes(texto)) return false;
    if (f.categoria && normalizarTexto(j.categoria) !== f.categoria) return false;
    if (f.lugar && normalizarTexto(j.lugar) !== f.lugar) return false;
    return coincideFiltroFecha(j.fecha, f.fecha, f.desde, f.hasta);
  });
}

const OPCIONES_FECHA = [
  { valor: "todas", etiqueta: "Cualquier fecha" },
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "semana", etiqueta: "Próximos 7 días" },
  { valor: "mes", etiqueta: "Este mes" },
  { valor: "rango", etiqueta: "Rango de fechas…" },
];

export function FiltrosJornadas({ filtros, onCambiar, jornadas }: { filtros: Filtros; onCambiar: (f: Filtros) => void; jornadas: Jornada[] }) {
  const categorias = useMemo(() => opcionesUnicas(jornadas, "categoria") as { valor: string; etiqueta: string }[], [jornadas]);
  const lugares = useMemo(() => opcionesUnicas(jornadas, "lugar") as { valor: string; etiqueta: string }[], [jornadas]);
  const set = (parcial: Partial<Filtros>) => onCambiar({ ...filtros, ...parcial });

  return (
    <div className="mb-6 rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <SearchInput valor={filtros.busqueda} onCambiar={(busqueda) => set({ busqueda })} placeholder="Buscar jornada por nombre o entidad…" />
        <Select aria-label="Categoría" value={filtros.categoria} onChange={(e) => set({ categoria: e.target.value })} placeholder="Todas las categorías" opciones={categorias} />
        <Select aria-label="Lugar" value={filtros.lugar} onChange={(e) => set({ lugar: e.target.value })} placeholder="Todos los lugares" opciones={lugares} />
        <Select aria-label="Fecha" value={filtros.fecha} onChange={(e) => set({ fecha: e.target.value as Filtros["fecha"] })} opciones={OPCIONES_FECHA} />
      </div>
      {filtros.fecha === "rango" && (
        <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-muted">
            Desde
            <input type="date" value={filtros.desde} onChange={(e) => set({ desde: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm text-ink focus:border-primary-light focus:outline-none focus:ring-4 focus:ring-primary-light/15" />
          </label>
          <label className="text-xs font-semibold text-muted">
            Hasta
            <input type="date" value={filtros.hasta} min={filtros.desde} onChange={(e) => set({ hasta: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-sm text-ink focus:border-primary-light focus:outline-none focus:ring-4 focus:ring-primary-light/15" />
          </label>
        </div>
      )}
      {hayFiltros(filtros) && (
        <button onClick={() => onCambiar(FILTROS_INICIALES)} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline">
          <SlidersHorizontal className="size-3.5" aria-hidden /> Limpiar filtros
        </button>
      )}
    </div>
  );
}

export const OPCIONES_CATEGORIA = CATEGORIAS.map((c: string) => ({ valor: c, etiqueta: c }));

/** Fecha y hora largas para el detalle: «martes 12 de noviembre de 2026». */
export const fechaLarga = (ms: number | null) => formatearFecha(ms, "dddd D [de] MMMM [de] YYYY");

export const textoDuracion = (min: number) => formatearDuracion(min);
