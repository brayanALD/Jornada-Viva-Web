import { CalendarCheck, CalendarPlus, CirclePlay, Library, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { contarPorEstado, contarPrestamos, type Jornada, type Prestamo } from "@/core";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Hero } from "@/components/ui/Hero";
import { SectionTitle, Stat } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { ListaGestionJornadas } from "@/features/jornadas/ListaGestion";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

export default function HomeGestorPage() {
  useTitulo("Inicio");
  const { usuario, nombre } = useAuth();
  const { jornadas, cargando, error, ahora } = useJornadas();
  const mias = useMemo(() => jornadas.filter((j: Jornada) => j.creadoPor === usuario?.uid), [jornadas, usuario?.uid]);
  const conteo = useMemo(() => contarPorEstado(mias, ahora) as Record<string, number>, [mias, ahora]);
  const prestamos = useRecursoApi<Prestamo[], { prestamos: Prestamo[] }>("/v1/prestamos", { extraer: (r) => r.prestamos, refrescoMs: 120000 });
  const prest = useMemo(() => contarPrestamos(prestamos.datos ?? [], ahora) as { activos: number; vencidos: number }, [prestamos.datos, ahora]);

  return (
    <>
      <Hero nombre={nombre} etiqueta="Gestor de jornadas" texto="Administra las jornadas que tienes asignadas: inscritos, asistencia con QR y planillas.">
        <ButtonLink to="/jornadas/nueva" variante="accent" tamano="lg" icono={<CalendarPlus className="size-5" />}>
          Crear jornada
        </ButtonLink>
      </Hero>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icono={<CalendarCheck className="size-5" />} valor={conteo.total} etiqueta="Jornadas asignadas" />
        <Stat icono={<CirclePlay className="size-5" />} valor={(conteo.activa || 0) + (conteo.en_curso || 0)} etiqueta="Activas o en curso" tono="success" />
        <Stat icono={<Library className="size-5" />} valor={prest.activos} etiqueta="Préstamos activos" tono="info" />
        <Stat icono={<TriangleAlert className="size-5" />} valor={prest.vencidos} etiqueta="Préstamos vencidos" tono={prest.vencidos > 0 ? "danger" : "neutral"} />
      </div>

      <SectionTitle>Mis jornadas</SectionTitle>
      <ListaGestionJornadas
        jornadas={mias}
        ahora={ahora}
        cargando={cargando}
        error={error}
        vacio={
          <EmptyState
            icono={<CalendarPlus className="size-7" />}
            titulo="Aún no tienes jornadas asignadas"
            texto="Crea tu primera jornada para que los estudiantes puedan inscribirse."
            accion={<ButtonLink to="/jornadas/nueva">Crear jornada</ButtonLink>}
          />
        }
      />
    </>
  );
}
