import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock,
  Hourglass,
  Lightbulb,
  MapPin,
  QrCode,
  Settings2,
  Timer,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  DIAS_LIMITE_CANCELACION,
  ErrorNegocio,
  categoriaDeJornada,
  estadoJornada,
  estadoVentanaAsistencia,
  formatearDuracion,
  formatearFecha,
  formatearHora,
  jornadaDisponible,
  jornadaTerminada,
  jornadaYaPaso,
  listaCorta,
  palabraPlural,
  permisosJornada,
  puedeCancelarInscripcion,
  sugerirEspaciosAlternos,
  textoVentanaAsistencia,
} from "@/core";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Dialog";
import { Aviso, Cargando, EmptyState, Skeleton, useToast } from "@/components/ui/Feedback";
import { Card, Chip, ProgressBar } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { Banner, EstadoChip, fechaLarga } from "@/features/jornadas/componentes";
import { cancelarInscripcion, inscribirse } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useTitulo } from "@/lib/hooks";

const TITULO_ERROR: Record<string, string> = {
  SIN_CUPOS: "Sin cupos",
  JORNADA_NO_DISPONIBLE: "Jornada no disponible",
  PLAZO_VENCIDO: "Plazo vencido",
  ACCION_DEMASIADO_ANTIGUA: "Cancelación demasiado antigua",
};

function Dato({ icono, etiqueta, children }: { icono: ReactNode; etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-pale text-primary">{icono}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">{etiqueta}</p>
        <p className="text-[15px] font-bold leading-snug text-ink first-letter:uppercase">{children}</p>
      </div>
    </div>
  );
}

function EsqueletoDetalle() {
  return (
    <Cargando etiqueta="Cargando jornada">
      <Skeleton className="mb-6 h-5 w-24" />
      <Skeleton className="h-52 w-full rounded-3xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-6 h-40 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    </Cargando>
  );
}

export default function JornadaDetallePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirmar = useConfirm();
  const { usuario, rol } = useAuth();
  const { jornadas, jornadasPorId, inscripciones, estaInscrito, cargando, ahora } = useJornadas();
  const [procesando, setProcesando] = useState<"inscribir" | "cancelar" | null>(null);

  const jornada = jornadasPorId.get(id);
  useTitulo(jornada?.titulo ?? "Jornada");

  const sugerencia = useMemo(() => (jornada ? sugerirEspaciosAlternos(jornada, jornadas, ahora) : null), [jornada, jornadas, ahora]);

  if (cargando && !jornada) return <EsqueletoDetalle />;

  if (!jornada) {
    return (
      <EmptyState
        icono={<CircleAlert className="size-7" />}
        titulo="La jornada no existe"
        texto="Puede que haya sido eliminada por su organizador."
        accion={<ButtonLink to="/" variante="soft">Volver al inicio</ButtonLink>}
      />
    );
  }

  const esEstudiante = rol === "estudiante";
  const permisos = permisosJornada({ rol, uid: usuario?.uid, jornada, ahora });
  const estado = estadoJornada(jornada, ahora);
  const disponible = jornadaDisponible(jornada, ahora);
  const vencida = jornadaYaPaso(jornada.fecha, ahora);
  const inscrito = estaInscrito(jornada.id);
  const inscripcion = inscripciones.find((i) => i.jornadaId === jornada.id);
  const yaAsistio = !!inscripcion?.asistio;
  const restantes = jornada.cuposTotales - jornada.cuposOcupados;
  const sinCupos = restantes <= 0;
  const ocupacion = jornada.cuposTotales > 0 ? (jornada.cuposOcupados / jornada.cuposTotales) * 100 : 0;
  const ventana = estadoVentanaAsistencia(jornada.fecha, ahora, jornada.duracionMin, jornada.asistenciaTodaJornada === true);
  const categoria = categoriaDeJornada(jornada);

  const mostrarError = (err: unknown) => {
    if (err instanceof ErrorNegocio) toast.error(`${TITULO_ERROR[err.codigo] ?? "No se pudo completar"}: ${err.message}`);
    else toast.error(mensajeDeError(err));
  };

  const alInscribirse = async () => {
    if (!usuario) return;
    const ok = await confirmar({
      titulo: "Confirmar inscripción",
      mensaje: `¿Deseas inscribirte en «${jornada.titulo}»?\n\nFecha: ${formatearFecha(jornada.fecha, "DD [de] MMMM [de] YYYY")}\nHora: ${formatearHora(jornada.fecha)}\nLugar: ${jornada.lugar}`,
      confirmar: "Sí, inscribirme",
    });
    if (!ok) return;
    setProcesando("inscribir");
    try {
      await inscribirse(jornada.id, {
        nombreUsuario: usuario.displayName || usuario.email || "",
        emailUsuario: usuario.email || "",
        tituloJornada: jornada.titulo,
      });
      toast.exito(`¡Inscripción exitosa! Preséntate el ${formatearFecha(jornada.fecha, "DD [de] MMMM")} a las ${formatearHora(jornada.fecha)} en ${jornada.lugar}.`);
    } catch (err) {
      mostrarError(err);
    } finally {
      setProcesando(null);
    }
  };

  const alCancelar = async () => {
    if (!puedeCancelarInscripcion(jornada.fecha)) {
      toast.error(`Plazo vencido: solo puedes cancelar hasta ${DIAS_LIMITE_CANCELACION} días antes de la jornada.`);
      return;
    }
    const ok = await confirmar({
      titulo: "Cancelar inscripción",
      mensaje: `¿Seguro que deseas cancelar tu inscripción en «${jornada.titulo}»?\n\nTu cupo quedará disponible para otras personas.`,
      confirmar: "Sí, cancelar",
      cancelar: "Mantener inscripción",
      peligro: true,
    });
    if (!ok) return;
    setProcesando("cancelar");
    try {
      await cancelarInscripcion(jornada.id);
      toast.exito(`Cancelaste tu inscripción en «${jornada.titulo}».`);
    } catch (err) {
      mostrarError(err);
    } finally {
      setProcesando(null);
    }
  };

  return (
    <article>
      <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Volver
      </button>

      <Banner url={jornada.bannerUrl} alto="h-44 sm:h-60" className="rounded-3xl" />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <EstadoChip estado={estado} />
              {categoria && <Chip tono="primary">{categoria}</Chip>}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{jornada.titulo}</h1>
            {jornada.entidad && <p className="mt-2 text-[15px] font-medium text-muted">{jornada.entidad}</p>}
          </header>

          {esEstudiante && !disponible && !inscrito && (
            <Aviso tipo="error">
              {vencida
                ? jornadaTerminada(jornada, ahora)
                  ? "Esta jornada ya finalizó."
                  : "Esta jornada ya comenzó y no admite nuevas inscripciones."
                : "Esta jornada fue desactivada y no está disponible por el momento."}
            </Aviso>
          )}

          <Card className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <Dato icono={<CalendarDays className="size-5" />} etiqueta="Fecha">{fechaLarga(jornada.fecha)}</Dato>
            <Dato icono={<Clock className="size-5" />} etiqueta="Hora de inicio">{formatearHora(jornada.fecha)}</Dato>
            <Dato icono={<Timer className="size-5" />} etiqueta="Duración">{formatearDuracion(jornada.duracionMin)}</Dato>
            <Dato icono={<MapPin className="size-5" />} etiqueta="Lugar">{jornada.lugar || "Por confirmar"}</Dato>
            {jornada.responsable && <Dato icono={<UserRound className="size-5" />} etiqueta="Responsable">{jornada.responsable}</Dato>}
            {jornada.entidad && <Dato icono={<Building2 className="size-5" />} etiqueta="Entidad organizadora">{jornada.entidad}</Dato>}
          </Card>

          {jornada.descripcion && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-2 text-lg font-extrabold">Acerca de esta jornada</h2>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted">{jornada.descripcion}</p>
            </Card>
          )}

          {sugerencia && (
            <Card className="border-accent/40 bg-accent-pale/50 p-5">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#b97800]" aria-hidden />
                <div className="min-w-0 text-sm leading-relaxed text-[#6b4700]">
                  <p className="font-extrabold">{sugerencia.motivo === "cancelada" ? "Esta jornada fue cancelada" : "Su espacio también lo usa otra jornada a la misma hora"}</p>
                  {sugerencia.motivo === "ocupado" && sugerencia.ocupantes.length > 0 && (
                    <p className="mt-1">
                      Coincide con: {listaCorta(sugerencia.ocupantes.map((o: { titulo: string }) => o.titulo), 3)}.
                    </p>
                  )}
                  {sugerencia.libres.length > 0 && (
                    <p className="mt-1">
                      Espacios libres a esa hora: <strong>{listaCorta(sugerencia.libres, 6)}</strong>.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Columna de acciones */}
        <aside className="space-y-4 lg:sticky lg:top-8">
          <Card className="p-5">
            <div className="flex items-end gap-2">
              <span className={cn("text-5xl font-extrabold leading-none tabular-nums", sinCupos ? "text-faint" : "text-primary")}>{sinCupos ? 0 : restantes}</span>
              <span className="pb-1 text-sm font-bold text-muted">{sinCupos ? "Sin cupos" : palabraPlural(restantes, "cupo disponible", "cupos disponibles")}</span>
            </div>
            <ProgressBar valor={ocupacion} color={sinCupos ? "var(--color-faint)" : restantes <= 10 ? "var(--color-accent)" : "var(--color-success)"} className="mt-4" etiqueta="Ocupación de cupos" />
            <p className="mt-2 text-xs font-medium text-muted">
              {jornada.cuposOcupados} de {jornada.cuposTotales} {palabraPlural(jornada.cuposTotales, "lugar ocupado", "lugares ocupados")}
            </p>

            {esEstudiante && (
              <div className="mt-5 space-y-3">
                {inscrito ? (
                  <>
                    <div className="flex items-center gap-2 rounded-xl bg-success-pale px-3.5 py-3 text-sm font-bold text-success">
                      <CircleCheck className="size-5" aria-hidden /> Ya estás inscrito
                    </div>
                    {yaAsistio ? (
                      <div className="flex items-center gap-2 rounded-xl bg-primary-pale px-3.5 py-3 text-sm font-bold text-primary">
                        <CircleCheck className="size-5" aria-hidden /> Asistencia registrada
                      </div>
                    ) : estado === "en_curso" || estado === "activa" || estado === "finalizada" ? (
                      ventana.disponible && (
                        <ButtonLink to={`/jornadas/${jornada.id}/asistencia`} tamano="lg" bloque icono={<QrCode className="size-5" />}>
                          Registrar mi asistencia
                        </ButtonLink>
                      )
                    ) : null}
                    {!yaAsistio && !vencida && (
                      <Button variante="secondary" bloque cargando={procesando === "cancelar"} onClick={alCancelar}>
                        Cancelar inscripción
                      </Button>
                    )}
                    {!yaAsistio && (
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                        <Hourglass className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        {textoVentanaAsistencia(jornada.duracionMin, jornada.asistenciaTodaJornada === true)}
                      </p>
                    )}
                  </>
                ) : !disponible ? (
                  <Button variante="secondary" bloque disabled>
                    Jornada no disponible
                  </Button>
                ) : sinCupos ? (
                  <Button variante="secondary" bloque disabled>
                    Sin cupos disponibles
                  </Button>
                ) : (
                  <Button tamano="lg" bloque cargando={procesando === "inscribir"} onClick={alInscribirse}>
                    Inscribirme a esta jornada
                  </Button>
                )}
              </div>
            )}

            {!esEstudiante && (
              <p className="mt-5 text-xs leading-relaxed text-muted">Esta es la vista que ven los estudiantes de la jornada.</p>
            )}
          </Card>

          {permisos.verAdministracion && (
            <Card className="p-5">
              <h2 className="text-sm font-extrabold">Administración</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">Inscritos, asistencia con QR, planilla en Excel y edición.</p>
              <Link
                to={`/jornadas/${jornada.id}/administrar`}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-pale text-sm font-bold text-primary transition-colors hover:bg-primary/15"
              >
                <Settings2 className="size-4" aria-hidden /> Administrar jornada
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </article>
  );
}
