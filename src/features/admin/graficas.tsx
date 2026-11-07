import type { ReactNode } from "react";
import { Card } from "@/components/ui/Misc";

/** Tarjeta que enmarca una gráfica con título y subtítulo. */
export function TarjetaGrafica({ titulo, subtitulo, children, className }: { titulo: string; subtitulo?: string; children: ReactNode; className?: string }) {
  return (
    <Card className={`p-5 sm:p-6 ${className ?? ""}`}>
      <h3 className="text-base font-extrabold">{titulo}</h3>
      {subtitulo && <p className="mb-5 mt-0.5 text-xs text-muted">{subtitulo}</p>}
      {children}
    </Card>
  );
}

/** Anillo de avance (p. ej. cupos usados frente al total). */
export function Anillo({ valor, total, etiqueta }: { valor: number; total: number; etiqueta: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  const radio = 52;
  const largo = 2 * Math.PI * radio;
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" role="img" aria-label={`${pct}% de ${etiqueta} usados`}>
          <circle cx="64" cy="64" r={radio} fill="none" stroke="var(--color-line)" strokeWidth="14" />
          <circle
            cx="64"
            cy="64"
            r={radio}
            fill="none"
            stroke="var(--color-primary-light)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={largo}
            strokeDashoffset={largo * (1 - pct / 100)}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-extrabold tabular-nums">{pct}%</p>
            <p className="text-[11px] font-semibold text-muted">ocupación</p>
          </div>
        </div>
      </div>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold text-muted">Usados</dt>
          <dd className="text-xl font-extrabold tabular-nums text-primary">{valor}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Ofrecidos</dt>
          <dd className="text-xl font-extrabold tabular-nums">{total}</dd>
        </div>
      </dl>
    </div>
  );
}

export interface Segmento {
  etiqueta: string;
  valor: number;
  color: string;
}

/** Barra horizontal dividida en segmentos con su leyenda. */
export function BarraSegmentada({ segmentos }: { segmentos: Segmento[] }) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-line" role="img" aria-label={segmentos.map((s) => `${s.etiqueta}: ${s.valor}`).join(", ")}>
        {total > 0 &&
          segmentos.map((s) => s.valor > 0 && <div key={s.etiqueta} style={{ flex: s.valor, background: s.color }} className="transition-all duration-500" />)}
      </div>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-x-4 gap-y-2.5">
        {segmentos.map((s) => (
          <li key={s.etiqueta} className="flex items-center gap-2 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="truncate font-medium text-muted">{s.etiqueta}</span>
            <span className="ml-auto font-extrabold tabular-nums">{s.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranking de barras horizontales (espacios con más jornadas, gestores, etc.). */
export function BarrasRanking({ filas, tope = 8, color = "var(--color-primary)", unidad = "" }: { filas: [string, number][]; tope?: number; color?: string; unidad?: string }) {
  const visibles = filas.slice(0, tope);
  const maximo = Math.max(1, ...visibles.map(([, n]) => n));
  if (visibles.length === 0) return <p className="text-sm text-muted">Sin datos.</p>;
  return (
    <ul className="space-y-3">
      {visibles.map(([nombre, n]) => (
        <li key={nombre}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold">{nombre}</span>
            <span className="shrink-0 font-extrabold tabular-nums">
              {n}
              {unidad && <span className="ml-1 text-xs font-medium text-muted">{unidad}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(n / maximo) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
      {filas.length > tope && <li className="text-xs text-muted">y {filas.length - tope} más</li>}
    </ul>
  );
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Columnas de jornadas por mes ("YYYY-MM"), resaltando el mes actual. */
export function ColumnasMes({ porMes, mesActual }: { porMes: Record<string, number>; mesActual: string }) {
  const meses = Object.entries(porMes).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const maximo = Math.max(1, ...meses.map(([, n]) => n));
  if (meses.length === 0) return <p className="text-sm text-muted">Sin datos.</p>;
  return (
    <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label={meses.map(([m, n]) => `${m}: ${n}`).join(", ")}>
      {meses.map(([mes, n]) => {
        const [anio, numero] = mes.split("-");
        const actual = mes === mesActual;
        return (
          <div key={mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs font-extrabold tabular-nums">{n}</span>
            <div className="w-full max-w-10 rounded-t-lg transition-all duration-500" style={{ height: `${Math.max(6, (n / maximo) * 100)}%`, background: actual ? "var(--color-accent)" : "var(--color-primary-light)" }} />
            <span className="text-[11px] font-semibold text-muted">
              {MESES[Number(numero) - 1]}
              <span className="hidden text-faint sm:inline"> {anio.slice(2)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
