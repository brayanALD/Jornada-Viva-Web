import { ArrowLeft, Ban, CalendarDays, CircleCheck, Info, KeyRound, Save, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ETIQUETA_ROL, ROLES, cuentaActiva, esGestor, estadoJornada, formatearFecha, puedeModificarCuenta, type Rol, type Usuario } from "@/core";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Dialog";
import { Aviso, Cargando, EmptyState, Skeleton, useToast } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Form";
import { Avatar, Card, Chip } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { EstadoChip, JornadaCard } from "@/features/jornadas/componentes";
import { actualizarUsuario } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";
import { useRecursoApi, useTitulo } from "@/lib/hooks";
import { TONO_ROL } from "./UsuariosPage";

type UsuarioConFecha = Usuario & { creadoEn?: number };

export default function UsuarioDetallePage() {
  const { id = "" } = useParams();
  const toast = useToast();
  const confirmar = useConfirm();
  const { usuario: yo } = useAuth();
  const { jornadas, ahora } = useJornadas();
  const { datos, cargando, recargar } = useRecursoApi<UsuarioConFecha[], { usuarios: UsuarioConFecha[] }>("/v1/admin/usuarios", { extraer: (r) => r.usuarios });
  const usuario = datos?.find((u) => u.id === id);
  useTitulo(usuario?.nombre || usuario?.email || "Usuario");

  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>(ROLES.ESTUDIANTE);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setRol(usuario.rol);
    }
  }, [usuario?.id, usuario?.nombre, usuario?.rol]); // eslint-disable-line react-hooks/exhaustive-deps

  const asignadas = useMemo(() => (usuario && esGestor(usuario.rol) ? jornadas.filter((j) => j.creadoPor === usuario.id) : []), [jornadas, usuario]);

  if (cargando && !datos) {
    return (
      <Cargando etiqueta="Cargando usuario">
        <Skeleton className="mb-6 h-5 w-24" />
        <Skeleton className="h-44 rounded-card" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </Cargando>
    );
  }

  if (!usuario) {
    return <EmptyState icono={<UserX className="size-7" />} titulo="El usuario no existe" accion={<Link to="/usuarios" className="text-sm font-bold text-primary hover:underline">Volver a usuarios</Link>} />;
  }

  const esPropia = !puedeModificarCuenta(yo?.uid, usuario);
  const activa = cuentaActiva(usuario);
  const hayCambios = nombre.trim() !== (usuario.nombre || "") || rol !== usuario.rol;

  const aplicar = async (cambios: { nombre?: string; rol?: Rol; activo?: boolean }, exito: string) => {
    setGuardando(true);
    try {
      await actualizarUsuario(usuario.id, cambios);
      await recargar();
      toast.exito(exito);
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      toast.error("Escribe el nombre del usuario.");
      return;
    }
    if (rol !== usuario.rol) {
      const ok = await confirmar({
        titulo: "Cambiar rol",
        mensaje: `${usuario.nombre || usuario.email} pasará de «${ETIQUETA_ROL[usuario.rol]}» a «${ETIQUETA_ROL[rol]}». Los permisos cambian de inmediato.`,
        confirmar: "Sí, cambiar",
      });
      if (!ok) return;
    }
    await aplicar({ nombre: nombre.trim(), rol }, "Los cambios se guardaron.");
  };

  const cambiarEstado = async () => {
    const ok = await confirmar({
      titulo: activa ? "Desactivar cuenta" : "Activar cuenta",
      mensaje: activa
        ? `${usuario.nombre || usuario.email} no podrá usar la plataforma: su sesión se cierra y no podrá realizar acciones. Podrás reactivarla después.`
        : `${usuario.nombre || usuario.email} volverá a poder usar la plataforma.`,
      confirmar: activa ? "Sí, desactivar" : "Sí, activar",
      peligro: activa,
    });
    if (ok) await aplicar({ activo: !activa }, activa ? "Cuenta desactivada." : "Cuenta activada.");
  };

  return (
    <>
      <Link to="/usuarios" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Usuarios
      </Link>

      <Card className="mb-6 flex flex-wrap items-center gap-5 p-5 sm:p-6">
        <Avatar nombre={usuario.nombre || usuario.email} tamano={76} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold">{usuario.nombre || "Sin nombre"}</h1>
          <p className="truncate text-sm text-muted">{usuario.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tono={TONO_ROL[usuario.rol]}>{ETIQUETA_ROL[usuario.rol]}</Chip>
            <Chip tono={activa ? "success" : "danger"}>{activa ? "Cuenta activa" : "Cuenta inactiva"}</Chip>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          {!!usuario.creadoEn && (
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" aria-hidden />
              <dt className="sr-only">Registrado el</dt>
              <dd className="font-semibold">Registrado el {formatearFecha(usuario.creadoEn, "D [de] MMMM [de] YYYY")}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" aria-hidden />
            <dt className="sr-only">ID de la cuenta</dt>
            <dd className="break-all font-mono text-xs text-muted select-all">{usuario.id}</dd>
          </div>
        </dl>
      </Card>

      {esPropia && (
        <Aviso tipo="info" className="mb-6">
          <Info className="mr-1 inline size-4" aria-hidden />
          Es tu propia cuenta: no puedes cambiar tu rol ni desactivarte (solo editar tu nombre).
        </Aviso>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-base font-extrabold">Editar cuenta</h2>
          <div className="space-y-4">
            <Input etiqueta="Nombre" value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} />
            <Select etiqueta="Rol y permisos" value={rol} disabled={esPropia} onChange={(e) => setRol(e.target.value as Rol)} opciones={Object.values(ROLES).map((r) => ({ valor: r as string, etiqueta: ETIQUETA_ROL[r as Rol] }))} />
            <Button icono={<Save className="size-4" />} cargando={guardando} disabled={!hayCambios} onClick={() => void guardar()}>
              Guardar cambios
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-2 text-base font-extrabold">Estado de la cuenta</h2>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            {activa ? "Mientras esté activa, la persona puede usar la plataforma según su rol." : "La cuenta está inactiva: la persona no puede usar la plataforma hasta que se reactive."}
          </p>
          <Button variante={activa ? "danger" : "soft"} icono={activa ? <Ban className="size-4" /> : <CircleCheck className="size-4" />} disabled={esPropia || guardando} onClick={() => void cambiarEstado()}>
            {activa ? "Desactivar cuenta" : "Activar cuenta"}
          </Button>
        </Card>
      </div>

      {esGestor(usuario.rol) && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-extrabold">Jornadas asignadas ({asignadas.length})</h2>
          {asignadas.length === 0 ? (
            <p className="text-sm text-muted">Este gestor no tiene jornadas asignadas.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {asignadas.map((j) => (
                <JornadaCard key={j.id} jornada={j} to={`/jornadas/${j.id}/administrar`} esquina={<EstadoChip estado={estadoJornada(j, ahora)} />} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
