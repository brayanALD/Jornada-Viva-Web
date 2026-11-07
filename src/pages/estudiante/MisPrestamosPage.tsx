import { Library } from "lucide-react";
import { useMemo } from "react";
import { contarPrestamos, ordenarPrestamos, type Prestamo } from "@/core";
import { Cargando, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { PageHeader, Stat } from "@/components/ui/Misc";
import { PrestamoCard, PrestamoCardSkeleton } from "@/features/prestamos/componentes";
import { useAhora, useRecursoApi, useTitulo } from "@/lib/hooks";
import { Clock, TriangleAlert } from "lucide-react";

export default function MisPrestamosPage() {
  useTitulo("Mis préstamos");
  const ahora = useAhora(60000);
  const { datos, cargando, error, reintentar } = useRecursoApi<Prestamo[], { prestamos: Prestamo[] }>("/v1/me/prestamos", {
    extraer: (r) => r.prestamos,
    refrescoMs: 60000,
  });

  const lista = useMemo(() => ordenarPrestamos(datos ?? [], ahora) as Prestamo[], [datos, ahora]);
  const conteo = useMemo(() => contarPrestamos(datos ?? [], ahora) as { activos: number; vencidos: number; porVencer: number }, [datos, ahora]);

  return (
    <>
      <PageHeader titulo="Mis préstamos" descripcion="Libros, equipos y materiales que tienes prestados y cuándo debes devolverlos." />
      {!cargando && !error && datos && datos.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat icono={<Library className="size-5" />} valor={conteo.activos} etiqueta="Préstamos activos" />
          <Stat icono={<Clock className="size-5" />} valor={conteo.porVencer} etiqueta="Por vencer" tono="warning" />
          <Stat icono={<TriangleAlert className="size-5" />} valor={conteo.vencidos} etiqueta="Vencidos" tono="danger" />
        </div>
      )}
      {cargando ? (
        <Cargando etiqueta="Cargando préstamos" className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <PrestamoCardSkeleton key={i} />
          ))}
        </Cargando>
      ) : error ? (
        <ErrorState mensaje={error} alReintentar={reintentar} />
      ) : lista.length === 0 ? (
        <EmptyState icono={<Library className="size-7" />} titulo="No tienes préstamos" texto="Cuando un gestor te preste un libro, equipo o material, aparecerá aquí con su fecha de devolución." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lista.map((p) => (
            <PrestamoCard key={p.id} prestamo={p} ahora={ahora} />
          ))}
        </div>
      )}
    </>
  );
}
