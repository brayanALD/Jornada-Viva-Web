import { CalendarCheck, ChartColumn, CirclePlay, CircleX, Flag, Library, ShieldCheck, UserMinus, Users } from "lucide-react";
import { Link } from "react-router";
import type { Estadisticas } from "@/core";
import { Cargando, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Hero } from "@/components/ui/Hero";
import { Card, ProgressBar, SectionTitle, Stat } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { BarraSegmentada } from "@/features/admin/graficas";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

const ACCESOS = [
  { ruta: "/usuarios", titulo: "Usuarios", detalle: "Alumnos, gestores y administradores", icono: Users },
  { ruta: "/jornadas", titulo: "Jornadas", detalle: "Consulta, crea y administra jornadas", icono: CalendarCheck },
  { ruta: "/prestamos", titulo: "Préstamos de objetos", detalle: "Libros, equipos y materiales", icono: Library },
  { ruta: "/reportes", titulo: "Estadísticas y reportes", detalle: "Ocupación y descarga en Excel", icono: ChartColumn },
  { ruta: "/auditoria", titulo: "Auditoría", detalle: "Últimas acciones administrativas", icono: ShieldCheck },
];

export default function PanelAdminPage() {
  useTitulo("Panel de control");
  const { nombre } = useAuth();
  const { datos, cargando, error, reintentar } = useRecursoApi<Estadisticas>("/v1/admin/estadisticas", { extraer: (r) => r, refrescoMs: 60000 });

  return (
    <>
      <Hero nombre={nombre} etiqueta="Administrador" texto="Así va la plataforma: usuarios, jornadas y ocupación en un vistazo." />

      {cargando ? (
        <Cargando etiqueta="Cargando indicadores">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-card" />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-56 rounded-card" />
            <Skeleton className="h-56 rounded-card" />
          </div>
        </Cargando>
      ) : error || !datos ? (
        <ErrorState mensaje={error ?? "No se pudieron cargar los indicadores."} alReintentar={reintentar} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icono={<CheckIcono />} valor={datos.porEstado.activa} etiqueta="Jornadas activas" tono="success" />
            <Stat icono={<CirclePlay className="size-5" />} valor={datos.porEstado.en_curso} etiqueta="En curso" tono="warning" />
            <Stat icono={<CircleX className="size-5" />} valor={datos.porEstado.cancelada} etiqueta="Canceladas" tono="danger" />
            <Stat icono={<Flag className="size-5" />} valor={datos.porEstado.finalizada} etiqueta="Finalizadas" tono="neutral" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-base font-extrabold">Usuarios</h2>
                <Link to="/usuarios" className="text-[13px] font-bold text-primary hover:underline">
                  Ver todos
                </Link>
              </div>
              <p className="mb-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums">{datos.totalUsuarios}</span>
                <span className="text-sm font-semibold text-muted">usuarios registrados</span>
              </p>
              <BarraSegmentada
                segmentos={[
                  { etiqueta: "Alumnos", valor: datos.estudiantes, color: "var(--color-primary)" },
                  { etiqueta: "Gestores", valor: datos.gestores, color: "var(--color-accent)" },
                  { etiqueta: "Admins", valor: datos.administradores, color: "var(--color-muted)" },
                ]}
              />
              {datos.cuentasInactivas > 0 && (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-danger">
                  <UserMinus className="size-4" aria-hidden />
                  {datos.cuentasInactivas} {datos.cuentasInactivas === 1 ? "cuenta inactiva" : "cuentas inactivas"}
                </p>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-base font-extrabold">Jornadas</h2>
                <Link to="/reportes" className="text-[13px] font-bold text-primary hover:underline">
                  Ver reportes
                </Link>
              </div>
              <p className="mb-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums">{datos.totalJornadas}</span>
                <span className="text-sm font-semibold text-muted">jornadas en total</span>
              </p>
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="font-semibold text-muted">Ocupación de cupos</span>
                <span className="font-extrabold tabular-nums text-primary">{Math.min(100, Math.max(0, datos.ocupacion))}%</span>
              </div>
              <ProgressBar valor={datos.ocupacion} className="h-3" etiqueta="Ocupación de cupos" />
              <p className="mt-2 text-xs text-muted">
                {datos.cuposOcupados} de {datos.cuposTotales} cupos ocupados
              </p>
            </Card>
          </div>
        </>
      )}

      <div className="mt-8">
        <SectionTitle>Accesos rápidos</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ACCESOS.map(({ ruta, titulo, detalle, icono: Icono }) => (
            <Link key={ruta} to={ruta} className="group flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-light/40">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-pale text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Icono className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-extrabold">{titulo}</span>
                <span className="block text-xs text-muted">{detalle}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function CheckIcono() {
  return <CalendarCheck className="size-5" />;
}
