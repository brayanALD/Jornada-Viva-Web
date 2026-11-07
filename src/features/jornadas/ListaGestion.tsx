import { CalendarX, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ESTADOS_JORNADA,
  ETIQUETA_ESTADO_PLURAL,
  contarPorEstado,
  descomponerFecha,
  estadoJornada,
  filtrarJornadas,
  ordenarParaMaestro,
  type Jornada,
  type Usuario,
} from "@/core";
import { Cargando, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { SearchInput, Segmented, Select } from "@/components/ui/Form";
import { EstadoChip, JornadaCard, JornadaCardSkeleton } from "./componentes";

type FiltroEstado = "todos" | "en_curso" | "activa" | "cancelada" | "finalizada";

/**
 * Listado de jornadas para gestor y administrador: filtros por estado y texto (y, para el
 * administrador, por gestor y rango de fechas). Cada tarjeta lleva a la administración de la jornada.
 */
export function ListaGestionJornadas({
  jornadas,
  ahora,
  cargando,
  error,
  admin = false,
  gestores = [],
  vacio,
}: {
  jornadas: Jornada[];
  ahora: number;
  cargando: boolean;
  error?: string | null;
  admin?: boolean;
  gestores?: Usuario[];
  vacio?: React.ReactNode;
}) {
  const [estado, setEstado] = useState<FiltroEstado>("todos");
  const [texto, setTexto] = useState("");
  const [gestor, setGestor] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const conteo = useMemo(() => contarPorEstado(jornadas, ahora) as Record<string, number>, [jornadas, ahora]);
  const nombreGestor = useMemo(() => new Map(gestores.map((g) => [g.id, g.nombre || g.email || g.id])), [gestores]);

  const lista = useMemo(() => {
    const filtradas = filtrarJornadas(jornadas, { texto, estado, gestor, desde: desde || null, hasta: hasta || null }, ahora, (ms: number) => descomponerFecha(ms).dia) as Jornada[];
    return ordenarParaMaestro(filtradas, ahora) as Jornada[];
  }, [jornadas, texto, estado, gestor, desde, hasta, ahora]);

  const hayFiltro = texto.trim() !== "" || estado !== "todos" || gestor !== "todos" || !!desde || !!hasta;

  return (
    <div>
      <div className="mb-5 space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Segmented
            valor={estado}
            onCambiar={setEstado}
            opciones={[
              { valor: "todos", etiqueta: "Todas", conteo: conteo.total },
              ...[ESTADOS_JORNADA.EN_CURSO, ESTADOS_JORNADA.ACTIVA, ESTADOS_JORNADA.CANCELADA, ESTADOS_JORNADA.FINALIZADA].map((e: string) => ({
                valor: e as FiltroEstado,
                etiqueta: (ETIQUETA_ESTADO_PLURAL as Record<string, string>)[e],
                conteo: conteo[e],
              })),
            ]}
          />
        </div>
        <div className={admin ? "grid gap-3 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.8fr_0.8fr]" : "max-w-md"}>
          <SearchInput valor={texto} onCambiar={setTexto} placeholder="Buscar por título o lugar…" />
          {admin && (
            <>
              <Select
                aria-label="Gestor"
                value={gestor}
                onChange={(e) => setGestor(e.target.value)}
                opciones={[
                  { valor: "todos", etiqueta: "Todos los gestores" },
                  { valor: "sin-gestor", etiqueta: "Sin gestor asignado" },
                  ...gestores.filter((g) => g.rol !== "estudiante").map((g) => ({ valor: g.id, etiqueta: g.nombre || g.email || g.id })),
                ]}
              />
              <input type="date" aria-label="Desde" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-11 rounded-xl border border-line bg-surface px-3 text-sm focus:border-primary-light focus:outline-none focus:ring-4 focus:ring-primary-light/15" />
              <input type="date" aria-label="Hasta" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="h-11 rounded-xl border border-line bg-surface px-3 text-sm focus:border-primary-light focus:outline-none focus:ring-4 focus:ring-primary-light/15" />
            </>
          )}
        </div>
      </div>

      {cargando ? (
        <Cargando etiqueta="Cargando jornadas" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <JornadaCardSkeleton key={i} />
          ))}
        </Cargando>
      ) : error ? (
        <ErrorState mensaje={error} />
      ) : lista.length === 0 ? (
        hayFiltro ? (
          <EmptyState icono={<SearchX className="size-7" />} titulo="No hay jornadas con esos criterios" texto="Prueba con otros filtros." />
        ) : (
          (vacio ?? <EmptyState icono={<CalendarX className="size-7" />} titulo="Aún no hay jornadas" />)
        )
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((j) => (
            <JornadaCard
              key={j.id}
              jornada={j}
              to={`/jornadas/${j.id}/administrar`}
              esquina={<EstadoChip estado={estadoJornada(j, ahora)} />}
              extra={`${j.cuposOcupados || 0} de ${j.cuposTotales} inscritos${admin ? ` · ${j.creadoPor ? (nombreGestor.get(j.creadoPor) ?? "Gestor") : "Sin gestor"}` : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
