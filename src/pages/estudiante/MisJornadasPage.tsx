import { CalendarX, ChevronRight, Clock, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { MODOS_HISTORIAL, contarHistorial, distintivoHistorial, filtrarHistorial, formatearFecha, formatearHora } from "@/core";
import { Cargando, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Form";
import { BloqueFecha, Card, Chip, PageHeader } from "@/components/ui/Misc";
import { Skeleton } from "@/components/ui/Feedback";
import { useJornadas, type MiJornada } from "@/features/jornadas/JornadasContext";
import { useTitulo } from "@/lib/hooks";

const TONO: Record<string, "success" | "warning" | "danger" | "neutral" | "primary"> = {
  asistio: "success",
  enCurso: "warning",
  noAsistio: "danger",
  noDisponible: "neutral",
  pendiente: "warning",
  inscrito: "primary",
};

function Fila({ jornada }: { jornada: MiJornada }) {
  const insignia = distintivoHistorial(jornada) as { tipo: string; texto: string };
  const contenido = (
    <Card className="flex items-center gap-4 p-4 transition-all hover:border-primary-light/40 hover:shadow-[0_8px_24px_rgb(16_40_30/0.1)]">
      <BloqueFecha dia={formatearFecha(jornada.fecha, "DD")} mes={formatearFecha(jornada.fecha, "MMM").replace(".", "")} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-extrabold">{jornada.titulo}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 text-primary" aria-hidden />
            {formatearHora(jornada.fecha)}
          </span>
          {jornada.lugar && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-primary" aria-hidden />
              {jornada.lugar}
            </span>
          )}
        </p>
      </div>
      <Chip tono={TONO[insignia.tipo] ?? "primary"}>{insignia.texto}</Chip>
      {!jornada.noDisponible && <ChevronRight className="hidden size-5 text-faint sm:block" aria-hidden />}
    </Card>
  );
  return jornada.noDisponible ? contenido : <Link to={`/jornadas/${jornada.id}`}>{contenido}</Link>;
}

export default function MisJornadasPage() {
  useTitulo("Mis jornadas");
  const { misJornadas, cargando, error } = useJornadas();
  const [modo, setModo] = useState<string>(MODOS_HISTORIAL.INSCRITAS);

  const conteo = useMemo(() => contarHistorial(misJornadas) as { inscritas: number; asistidas: number }, [misJornadas]);
  const lista = useMemo(() => filtrarHistorial(misJornadas, modo) as MiJornada[], [misJornadas, modo]);

  return (
    <>
      <PageHeader titulo="Mis jornadas" descripcion="Tu historial de participación: en las que estás inscrito y en las que ya asististe." />
      <Segmented
        className="mb-6"
        valor={modo}
        onCambiar={setModo}
        opciones={[
          { valor: MODOS_HISTORIAL.INSCRITAS, etiqueta: "Inscritas", conteo: conteo.inscritas },
          { valor: MODOS_HISTORIAL.ASISTIDAS, etiqueta: "Asistidas", conteo: conteo.asistidas },
        ]}
      />
      {cargando ? (
        <Cargando etiqueta="Cargando tus jornadas" className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="size-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </Card>
          ))}
        </Cargando>
      ) : error ? (
        <ErrorState mensaje={error} />
      ) : lista.length === 0 ? (
        <EmptyState
          icono={<CalendarX className="size-7" />}
          titulo={modo === MODOS_HISTORIAL.ASISTIDAS ? "Aún no tienes asistencias" : "Aún no te has inscrito en ninguna jornada"}
          texto={modo === MODOS_HISTORIAL.ASISTIDAS ? "Cuando registres tu asistencia con el código QR, aparecerá aquí." : "Explora las jornadas disponibles en el inicio y reserva tu lugar."}
        />
      ) : (
        <div className="space-y-3">
          {lista.map((j) => (
            <Fila key={j.id} jornada={j} />
          ))}
        </div>
      )}
    </>
  );
}
