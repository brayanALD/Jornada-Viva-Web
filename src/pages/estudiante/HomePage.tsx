import { CalendarCheck, SearchX, Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { conteoPlural, formatearDiasFaltan, formatearFecha, formatearHora } from "@/core";
import { Cargando, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { Hero } from "@/components/ui/Hero";
import { useAuth } from "@/features/auth/AuthContext";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { FILTROS_INICIALES, FiltrosJornadas, JornadaCard, JornadaCardSkeleton, aplicarFiltros, hayFiltros, type Filtros } from "@/features/jornadas/componentes";
import { useTitulo } from "@/lib/hooks";
import { Chip } from "@/components/ui/Misc";
import { Check } from "lucide-react";

export default function HomeEstudiantePage() {
  useTitulo("Inicio");
  const { nombre } = useAuth();
  const { jornadasDisponibles, misJornadas, estaInscrito, cargando, error } = useJornadas();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);

  const filtradas = useMemo(() => aplicarFiltros(jornadasDisponibles, filtros), [jornadasDisponibles, filtros]);
  const proxima = misJornadas.find((j) => !j.finalizada);

  return (
    <>
      <Hero nombre={nombre} texto="Descubre las jornadas de tu comunidad e inscríbete en segundos.">
        {proxima && (
          <Link
            to={`/jornadas/${proxima.id}`}
            className="group flex items-center gap-4 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur transition-colors hover:bg-white/20"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-white text-primary">
              <CalendarCheck className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/70">Tu próxima jornada · {formatearDiasFaltan(proxima.fecha)}</span>
              <span className="block max-w-64 truncate text-sm font-bold">{proxima.titulo}</span>
              <span className="block text-xs text-white/75">
                {formatearFecha(proxima.fecha, "ddd D MMM")} · {formatearHora(proxima.fecha)}
              </span>
            </span>
          </Link>
        )}
      </Hero>

      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-extrabold">Jornadas disponibles</h2>
        {!cargando && !error && <span className="text-sm font-semibold text-muted">{conteoPlural(filtradas.length, "jornada", "jornadas")}</span>}
      </div>

      <FiltrosJornadas filtros={filtros} onCambiar={setFiltros} jornadas={jornadasDisponibles} />

      {cargando ? (
        <Cargando etiqueta="Cargando jornadas" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <JornadaCardSkeleton key={i} />
          ))}
        </Cargando>
      ) : error ? (
        <ErrorState mensaje={error} />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icono={hayFiltros(filtros) ? <SearchX className="size-7" /> : <Inbox className="size-7" />}
          titulo={hayFiltros(filtros) ? "No encontramos jornadas con esos criterios" : "No hay jornadas disponibles en este momento"}
          texto={hayFiltros(filtros) ? "Prueba con otra búsqueda o limpia los filtros." : "Vuelve a revisar pronto: aquí aparecerán las próximas jornadas."}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((j) => (
            <JornadaCard
              key={j.id}
              jornada={j}
              to={`/jornadas/${j.id}`}
              insignia={
                estaInscrito(j.id) ? (
                  <Chip tono="success" icono={<Check className="size-3.5" />}>
                    Inscrito
                  </Chip>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
