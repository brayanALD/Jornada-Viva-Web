import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Lock,
  MapPin,
  Pencil,
  QrCode,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  conteoPlural,
  estadoJornada,
  formatearDuracion,
  formatearFecha,
  formatearHora,
  normalizarTexto,
  permisosJornada,
  type Inscrito,
} from "@/core";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Dialog";
import { Aviso, Cargando, EmptyState, ErrorState, Skeleton, useToast } from "@/components/ui/Feedback";
import { SearchInput } from "@/components/ui/Form";
import { Avatar, Card, Chip, ProgressBar, Stat } from "@/components/ui/Misc";
import { ModalQr } from "@/features/asistencia/ModalQr";
import { useAuth } from "@/features/auth/AuthContext";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { EstadoChip, Banner } from "@/features/jornadas/componentes";
import { cancelarJornada, descargarPlanilla, eliminarJornada, marcarAsistenciaManual, reactivarJornada } from "@/features/servicios";
import { idRuta, mensajeDeError } from "@/lib/api";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

function Esqueleto() {
  return (
    <Cargando etiqueta="Cargando jornada">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="mt-6 h-10 w-2/3" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80 rounded-card" />
    </Cargando>
  );
}

export default function JornadaAdministrarPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirmar = useConfirm();
  const { usuario, rol, esAdministrador } = useAuth();
  const { jornadasPorId, cargando, ahora } = useJornadas();
  const [qrAbierto, setQrAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const jornada = jornadasPorId.get(id);
  useTitulo(jornada ? `Administrar · ${jornada.titulo}` : "Administrar jornada");
  const permisos = jornada ? permisosJornada({ rol, uid: usuario?.uid, jornada, ahora }) : null;

  // Inscritos: se piden bajo demanda y se refrescan solos (la asistencia por QR llega en cualquier momento)
  const inscritos = useRecursoApi<Inscrito[], { inscritos: Inscrito[] }>(`/v1/jornadas/${idRuta(id)}/inscritos`, {
    extraer: (r) => r.inscritos,
    refrescoMs: 20000,
    habilitado: !!permisos?.verInscritos,
  });

  const lista = useMemo(() => {
    const q = normalizarTexto(busqueda);
    return (inscritos.datos ?? [])
      .filter((i) => !q || normalizarTexto(i.nombreUsuario).includes(q) || normalizarTexto(i.emailUsuario).includes(q))
      .sort((a, b) => String(a.nombreUsuario || a.emailUsuario).localeCompare(String(b.nombreUsuario || b.emailUsuario), "es"));
  }, [inscritos.datos, busqueda]);
  const asistieron = (inscritos.datos ?? []).filter((i) => i.asistio).length;

  if (cargando && !jornada) return <Esqueleto />;

  if (!jornada || !permisos?.verAdministracion) {
    return (
      <EmptyState
        icono={<Lock className="size-7" />}
        titulo={!jornada ? "La jornada no existe" : "No puedes administrar esta jornada"}
        texto={!jornada ? "Puede que haya sido eliminada." : "Solo puedes administrar las jornadas que tienes asignadas."}
        accion={<ButtonLink to="/" variante="soft">Volver al inicio</ButtonLink>}
      />
    );
  }

  const estado = estadoJornada(jornada, ahora);
  const totalInscritos = jornada.cuposOcupados || 0;
  const ocupacion = jornada.cuposTotales > 0 ? (totalInscritos / jornada.cuposTotales) * 100 : 0;
  const volverA = esAdministrador ? "/jornadas" : "/";

  const ejecutar = async (operacion: () => Promise<unknown>, exito: string, alTerminar?: () => void) => {
    setOcupado(true);
    try {
      await operacion();
      toast.exito(exito);
      alTerminar?.();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setOcupado(false);
    }
  };

  const alCancelar = async () => {
    const ok = await confirmar({
      titulo: "Cancelar jornada",
      mensaje: `La jornada dejará de estar disponible${totalInscritos > 0 ? ` y los ${totalInscritos} estudiantes inscritos recibirán un aviso` : ""}. Podrás reactivarla después.`,
      confirmar: "Sí, cancelar jornada",
      cancelar: "No, mantener",
      peligro: true,
    });
    if (ok) await ejecutar(() => cancelarJornada(jornada.id), "Jornada cancelada.");
  };

  const alReactivar = async () => {
    const ok = await confirmar({
      titulo: "Reactivar jornada",
      mensaje: `La jornada volverá a estar disponible para los estudiantes${totalInscritos > 0 ? ` y los ${totalInscritos} inscritos recibirán un aviso` : ""}.`,
      confirmar: "Sí, reactivar",
    });
    if (ok) await ejecutar(() => reactivarJornada(jornada.id), "Jornada reactivada.");
  };

  const alEliminar = async () => {
    const ok = await confirmar({
      titulo: "Eliminar jornada",
      mensaje: `Se eliminará «${jornada.titulo}» de forma permanente${totalInscritos > 0 ? `. Los ${totalInscritos} estudiantes inscritos la verán como «No disponible»` : ""}. Esta acción no se puede deshacer.`,
      confirmar: "Sí, eliminar",
      peligro: true,
    });
    if (ok) await ejecutar(() => eliminarJornada(jornada.id), "Jornada eliminada.", () => navigate(volverA, { replace: true }));
  };

  const alDescargar = () =>
    ejecutar(
      () => descargarPlanilla(jornada.id, jornada.titulo.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "jornada"),
      "Planilla descargada."
    );

  const alMarcar = async (inscrito: Inscrito) => {
    if (!permisos.marcarAsistencia) {
      toast.info("La asistencia se puede marcar desde la hora de inicio de la jornada.");
      return;
    }
    setMarcando(inscrito.id);
    try {
      await marcarAsistenciaManual(jornada.id, inscrito.id, !inscrito.asistio);
      await inscritos.recargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setMarcando(null);
    }
  };

  return (
    <>
      <Link to={volverA} className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> {esAdministrador ? "Todas las jornadas" : "Mis jornadas"}
      </Link>

      <Card className="mb-6 overflow-hidden">
        <Banner url={jornada.bannerUrl} alto="h-32 sm:h-40" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <EstadoChip estado={estado} />
              <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{jornada.titulo}</h1>
              {jornada.entidad && <p className="mt-1 text-sm font-medium text-muted">{jornada.entidad}</p>}
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] font-semibold text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-primary" aria-hidden />
                  <span className="first-letter:uppercase">{formatearFecha(jornada.fecha, "dddd D [de] MMMM [de] YYYY")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" aria-hidden />
                  {formatearHora(jornada.fecha)} · {formatearDuracion(jornada.duracionMin)}
                </span>
                {jornada.lugar && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-primary" aria-hidden />
                    {jornada.lugar}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {permisos.generarQr && (
                <Button icono={<QrCode className="size-4" />} onClick={() => setQrAbierto(true)}>
                  Mostrar QR
                </Button>
              )}
              {permisos.editar && (
                <ButtonLink to={`/jornadas/${jornada.id}/editar`} variante="secondary" icono={<Pencil className="size-4" />}>
                  Editar
                </ButtonLink>
              )}
              <ButtonLink to={`/jornadas/${jornada.id}`} variante="ghost" icono={<Eye className="size-4" />}>
                Vista del estudiante
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icono={<Users className="size-5" />} valor={`${totalInscritos}/${jornada.cuposTotales}`} etiqueta="Inscritos" detalle={`${Math.round(ocupacion)}% de ocupación`} />
        <Stat icono={<UserCheck className="size-5" />} valor={inscritos.datos ? asistieron : "—"} etiqueta="Asistieron" tono="success" detalle={inscritos.datos && totalInscritos ? `${Math.round((asistieron / Math.max(1, inscritos.datos.length)) * 100)}% de los inscritos` : undefined} />
        <Card className="flex flex-col justify-center gap-2 p-4">
          <div className="flex items-baseline justify-between text-[13px] font-semibold text-muted">
            <span>Ocupación de cupos</span>
            <span className="tabular-nums text-ink">{conteoPlural(Math.max(0, jornada.cuposTotales - totalInscritos), "cupo libre", "cupos libres")}</span>
          </div>
          <ProgressBar valor={ocupacion} etiqueta="Ocupación de cupos" />
        </Card>
      </div>

      {/* Inscritos */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-extrabold">Inscritos</h2>
            <p className="text-xs text-muted">{permisos.marcarAsistencia ? "Marca o corrige la asistencia a mano en cualquier momento." : "La asistencia se podrá marcar desde la hora de inicio."}</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SearchInput valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar inscrito…" className="flex-1 sm:w-64" />
            <Button variante="secondary" icono={<RefreshCw className="size-4" />} onClick={() => void inscritos.recargar()} aria-label="Actualizar lista" />
            <Button variante="soft" icono={<FileSpreadsheet className="size-4" />} onClick={() => void alDescargar()} disabled={ocupado}>
              <span className="hidden sm:inline">Planilla Excel</span>
              <Download className="size-4 sm:hidden" />
            </Button>
          </div>
        </div>

        {inscritos.cargando ? (
          <Cargando etiqueta="Cargando inscritos" className="divide-y divide-line">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </Cargando>
        ) : inscritos.error ? (
          <div className="p-5">
            <ErrorState mensaje={inscritos.error} alReintentar={inscritos.reintentar} />
          </div>
        ) : lista.length === 0 ? (
          <div className="p-5">
            <EmptyState icono={<Users className="size-7" />} titulo={busqueda ? "Sin resultados" : "Aún no hay inscritos"} texto={busqueda ? "Prueba con otro nombre o correo." : "Cuando los estudiantes se inscriban aparecerán aquí."} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {lista.map((i, n) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                <span className="hidden w-6 text-right text-xs font-bold tabular-nums text-faint sm:block">{n + 1}</span>
                <Avatar nombre={i.nombreUsuario || i.emailUsuario} tamano={40} />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-bold">{i.nombreUsuario || "Sin nombre"}</p>
                  <p className="truncate text-xs text-muted">{i.emailUsuario}</p>
                </div>
                <p className="hidden text-xs text-muted lg:block">Inscrito el {formatearFecha(i.inscritoEn, "D MMM, h:mm A")}</p>
                {i.asistio ? (
                  <Chip tono="success" icono={<Check className="size-3.5" />}>
                    Asistió{i.metodoAsistencia ? ` · ${i.metodoAsistencia === "qr" ? "QR" : "manual"}` : ""}
                  </Chip>
                ) : (
                  <Chip tono="neutral">Sin asistencia</Chip>
                )}
                <Button
                  tamano="sm"
                  variante={i.asistio ? "ghost" : "soft"}
                  cargando={marcando === i.id}
                  disabled={!permisos.marcarAsistencia}
                  icono={i.asistio ? <UserMinus className="size-4" /> : <UserCheck className="size-4" />}
                  onClick={() => void alMarcar(i)}
                >
                  {i.asistio ? "Quitar" : "Marcar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Zona de acciones sobre la jornada */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-extrabold">Gestión de la jornada</h2>
        {(permisos.cancelar || permisos.reactivar || permisos.eliminar) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {permisos.cancelar && (
              <Button variante="secondary" icono={<Ban className="size-4" />} onClick={() => void alCancelar()} disabled={ocupado}>
                Cancelar jornada
              </Button>
            )}
            {permisos.reactivar && (
              <Button variante="soft" icono={<RotateCcw className="size-4" />} onClick={() => void alReactivar()} disabled={ocupado}>
                Reactivar jornada
              </Button>
            )}
            {permisos.eliminar && (
              <Button variante="danger" icono={<Trash2 className="size-4" />} onClick={() => void alEliminar()} disabled={ocupado}>
                Eliminar jornada
              </Button>
            )}
          </div>
        )}
        {!permisos.editar && <Aviso tipo="info" className="mt-4">Una vez que la jornada empieza ya no se edita ni se cancela: solo se toma o corrige la asistencia.</Aviso>}
      </Card>

      {permisos.generarQr && <ModalQr abierto={qrAbierto} jornada={jornada} ahora={ahora} alCerrar={() => setQrAbierto(false)} />}
    </>
  );
}
