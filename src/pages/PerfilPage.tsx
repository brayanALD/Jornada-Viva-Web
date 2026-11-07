import { BellRing, BriefcaseBusiness, CalendarDays, ChartColumn, CircleCheck, Download, GraduationCap, KeyRound, Library, LogOut, Mail, Pencil, QrCode, ShieldCheck, Users, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ETIQUETA_ROL, ROLES, contarHistorial, contarPorEstado, contarPrestamos, type Estadisticas, type Prestamo, type Rol } from "@/core";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Dialog";
import { Aviso, Skeleton } from "@/components/ui/Feedback";
import { Avatar, Card, Chip, SectionTitle } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

const PERMISOS: Record<Rol, [LucideIcon, string][]> = {
  [ROLES.ESTUDIANTE]: [
    [CalendarDays, "Ver las jornadas disponibles e inscribirte"],
    [XCircle, "Cancelar tu inscripción dentro del plazo permitido"],
    [QrCode, "Registrar tu asistencia escaneando el código QR"],
    [Library, "Consultar tus préstamos de objetos y tus avisos"],
  ],
  [ROLES.GESTOR]: [
    [Pencil, "Crear y administrar las jornadas que tienes asignadas"],
    [QrCode, "Generar el código QR de asistencia y corregirla"],
    [Download, "Descargar la planilla de inscritos en Excel"],
    [Library, "Registrar y recibir los préstamos de objetos"],
  ],
  [ROLES.ADMINISTRADOR]: [
    [Users, "Administrar cuentas, roles y estados"],
    [CalendarDays, "Gestionar cualquier jornada y reasignar gestores"],
    [ChartColumn, "Consultar estadísticas y descargar reportes"],
    [ShieldCheck, "Revisar la auditoría de las acciones administrativas"],
  ],
};

const ICONO_ROL: Record<Rol, LucideIcon> = { estudiante: GraduationCap, gestor: BriefcaseBusiness, administrador: ShieldCheck };

function Cifra({ valor, etiqueta, tono = "text-primary" }: { valor: React.ReactNode; etiqueta: string; tono?: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-4 text-center">
      <p className={`text-3xl font-extrabold tabular-nums ${tono}`}>{valor}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{etiqueta}</p>
    </div>
  );
}

function ResumenEstudiante() {
  const { misJornadas, cargando } = useJornadas();
  const prestamos = useRecursoApi<Prestamo[], { prestamos: Prestamo[] }>("/v1/me/prestamos", { extraer: (r) => r.prestamos });
  const h = useMemo(() => contarHistorial(misJornadas) as { inscritas: number; asistidas: number }, [misJornadas]);
  const p = useMemo(() => contarPrestamos(prestamos.datos ?? [], Date.now()) as { activos: number; vencidos: number }, [prestamos.datos]);
  if (cargando) return <Skeleton className="h-24 rounded-2xl" />;
  return (
    <div className="grid grid-cols-3 gap-3">
      <Cifra valor={h.inscritas} etiqueta="Jornadas inscritas" />
      <Cifra valor={h.asistidas} etiqueta="Asistencias" tono="text-success" />
      <Cifra valor={p.activos} etiqueta="Préstamos activos" tono={p.vencidos > 0 ? "text-danger" : "text-primary-light"} />
    </div>
  );
}

function ResumenGestor() {
  const { usuario } = useAuth();
  const { jornadas, cargando, ahora } = useJornadas();
  const prestamos = useRecursoApi<Prestamo[], { prestamos: Prestamo[] }>("/v1/prestamos", { extraer: (r) => r.prestamos });
  const c = useMemo(() => contarPorEstado(jornadas.filter((j) => j.creadoPor === usuario?.uid), ahora) as Record<string, number>, [jornadas, usuario?.uid, ahora]);
  const p = useMemo(() => contarPrestamos(prestamos.datos ?? [], Date.now()) as { activos: number; vencidos: number }, [prestamos.datos]);
  if (cargando) return <Skeleton className="h-24 rounded-2xl" />;
  return (
    <div className="grid grid-cols-3 gap-3">
      <Cifra valor={c.total} etiqueta="Jornadas asignadas" />
      <Cifra valor={(c.activa || 0) + (c.en_curso || 0)} etiqueta="Activas o en curso" tono="text-success" />
      <Cifra valor={p.activos} etiqueta="Préstamos activos" tono={p.vencidos > 0 ? "text-danger" : "text-primary-light"} />
    </div>
  );
}

function ResumenAdmin() {
  const { datos, cargando } = useRecursoApi<Estadisticas>("/v1/admin/estadisticas", { extraer: (r) => r });
  if (cargando) return <Skeleton className="h-24 rounded-2xl" />;
  if (!datos) return <p className="text-sm text-muted">No se pudo cargar el resumen de la plataforma.</p>;
  return (
    <div className="grid grid-cols-3 gap-3">
      <Cifra valor={datos.totalUsuarios} etiqueta="Usuarios" />
      <Cifra valor={datos.totalJornadas} etiqueta="Jornadas" tono="text-primary-light" />
      <Cifra valor={`${datos.ocupacion}%`} etiqueta="Ocupación de cupos" tono="text-success" />
    </div>
  );
}

function PermisoNotificaciones() {
  const soportado = typeof Notification !== "undefined";
  const [permiso, setPermiso] = useState<NotificationPermission>(soportado ? Notification.permission : "denied");
  useEffect(() => {
    if (soportado) setPermiso(Notification.permission);
  }, [soportado]);
  if (!soportado) return null;
  return (
    <Card className="flex flex-wrap items-center gap-4 p-5">
      <span className="grid size-11 place-items-center rounded-xl bg-primary-pale text-primary">
        <BellRing className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-extrabold">Avisos del navegador</h3>
        <p className="text-xs leading-relaxed text-muted">
          {permiso === "granted" ? "Te avisaremos aunque tengas esta pestaña en segundo plano." : permiso === "denied" ? "Están bloqueados: habilítalos desde la configuración del sitio en tu navegador." : "Recibe una notificación cuando una de tus jornadas cambie."}
        </p>
      </div>
      {permiso === "granted" ? (
        <Chip tono="success" icono={<CircleCheck className="size-3.5" />}>
          Activados
        </Chip>
      ) : (
        permiso === "default" && (
          <Button variante="soft" onClick={() => void Notification.requestPermission().then(setPermiso)}>
            Activar
          </Button>
        )
      )}
    </Card>
  );
}

export default function PerfilPage() {
  useTitulo("Mi perfil");
  const { usuario, nombre, rol, esAdministrador, cerrarSesion } = useAuth();
  const confirmar = useConfirm();
  const IconoRol = ICONO_ROL[rol];

  const salir = async () => {
    const ok = await confirmar({ titulo: "Cerrar sesión", mensaje: "¿Seguro que quieres salir de Jornada Viva?", confirmar: "Cerrar sesión", peligro: true });
    if (ok) void cerrarSesion();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="flex flex-col items-center gap-3 overflow-hidden p-0 text-center">
        <div className="h-24 w-full bg-gradient-to-r from-primary to-primary-light" aria-hidden />
        <div className="-mt-14 flex flex-col items-center gap-3 px-6 pb-6">
          <Avatar nombre={nombre} semilla={usuario?.uid} tamano={96} className="ring-4 ring-surface" />
          <h1 className="text-2xl font-extrabold">{nombre}</h1>
          <Chip tono="primary" icono={<IconoRol className="size-3.5" />}>
            {ETIQUETA_ROL[rol]}
          </Chip>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Mail className="size-4" aria-hidden />
            {usuario?.email}
          </p>
          {esAdministrador && (
            <p className="flex items-center gap-2 text-xs text-faint">
              <KeyRound className="size-3.5" aria-hidden />
              <span className="select-all font-mono">{usuario?.uid}</span>
            </p>
          )}
        </div>
      </Card>

      <section>
        <SectionTitle>Tu actividad</SectionTitle>
        <Card className="p-4">{rol === ROLES.ESTUDIANTE ? <ResumenEstudiante /> : rol === ROLES.GESTOR ? <ResumenGestor /> : <ResumenAdmin />}</Card>
      </section>

      <section>
        <SectionTitle>Qué puedes hacer</SectionTitle>
        <Card className="divide-y divide-line">
          {PERMISOS[rol].map(([Icono, texto]) => (
            <div key={texto} className="flex items-center gap-4 px-5 py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-pale text-primary">
                <Icono className="size-[18px]" aria-hidden />
              </span>
              <p className="text-sm font-semibold">{texto}</p>
            </div>
          ))}
        </Card>
      </section>

      {esAdministrador && <Aviso tipo="info">Tu rol y el estado de tu cuenta solo pueden cambiarlos otro administrador: nadie puede modificar los suyos.</Aviso>}

      {rol === ROLES.ESTUDIANTE && <PermisoNotificaciones />}

      <Button variante="secondary" tamano="lg" bloque icono={<LogOut className="size-5" />} onClick={() => void salir()} className="text-danger">
        Cerrar sesión
      </Button>
    </div>
  );
}
