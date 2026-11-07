import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { ETIQUETA_ESTADO, ESTADOS_JORNADA, descomponerFecha, type Estadisticas } from "@/core";
import { Button } from "@/components/ui/Button";
import { Cargando, ErrorState, Skeleton, useToast } from "@/components/ui/Feedback";
import { Segmented } from "@/components/ui/Form";
import { Card, PageHeader, Stat } from "@/components/ui/Misc";
import { Anillo, BarraSegmentada, BarrasRanking, ColumnasMes, TarjetaGrafica } from "@/features/admin/graficas";
import { descargarReporteJornadas } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";
import { useRecursoApi, useTitulo } from "@/lib/hooks";
import { CalendarCheck, Percent, Ticket } from "lucide-react";

const COLOR_ESTADO: Record<string, string> = {
  [ESTADOS_JORNADA.ACTIVA]: "var(--color-success)",
  [ESTADOS_JORNADA.EN_CURSO]: "var(--color-accent)",
  [ESTADOS_JORNADA.CANCELADA]: "var(--color-danger)",
  [ESTADOS_JORNADA.FINALIZADA]: "var(--color-muted)",
};

function Tabla({ titulo, filas }: { titulo: string; filas: [string, number][] }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="mb-3 text-base font-extrabold">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-sm text-muted">Sin datos.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            {filas.map(([nombre, valor]) => (
              <tr key={nombre}>
                <td className="py-2.5 pr-4 font-medium text-muted">{nombre}</td>
                <td className="py-2.5 text-right font-extrabold tabular-nums">{valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export default function ReportesPage() {
  useTitulo("Estadísticas y reportes");
  const toast = useToast();
  const { datos, cargando, error, reintentar } = useRecursoApi<Estadisticas>("/v1/admin/estadisticas", { extraer: (r) => r, refrescoMs: 60000 });
  const [vista, setVista] = useState<"graficas" | "tablas">("graficas");
  const [exportando, setExportando] = useState(false);

  const exportar = async () => {
    setExportando(true);
    try {
      await descargarReporteJornadas();
      toast.exito("Reporte descargado.");
    } catch (e) {
      toast.error(mensajeDeError(e, "No se pudo generar el reporte. Intenta de nuevo."));
    } finally {
      setExportando(false);
    }
  };

  const ordenar = (obj: Record<string, number>) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const porGestor = (datos?.porGestorNombre ?? []).map((g) => [g.nombre, g.jornadas] as [string, number]).sort((a, b) => b[1] - a[1]);
  const filasEstado = datos ? (Object.entries(datos.porEstado) as [string, number][]) : [];
  const filasRol: [string, number][] = datos ? [["Alumnos", datos.estudiantes], ["Gestores", datos.gestores], ["Administradores", datos.administradores]] : [];

  return (
    <>
      <PageHeader
        titulo="Estadísticas y reportes"
        descripcion="Ocupación, jornadas por estado, espacio y gestor. Descarga el reporte completo en Excel."
        acciones={
          <Button icono={<FileSpreadsheet className="size-4" />} cargando={exportando} disabled={!datos || datos.totalJornadas === 0} onClick={() => void exportar()}>
            Descargar reporte (Excel)
          </Button>
        }
      />

      {cargando ? (
        <Cargando etiqueta="Cargando estadísticas" className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-card" />
          ))}
        </Cargando>
      ) : error || !datos ? (
        <ErrorState mensaje={error ?? "No se pudieron cargar las estadísticas."} alReintentar={reintentar} />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              valor={vista}
              onCambiar={setVista}
              opciones={[
                { valor: "graficas", etiqueta: "Gráficas" },
                { valor: "tablas", etiqueta: "Tablas" },
              ]}
            />
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat icono={<CalendarCheck className="size-5" />} valor={datos.totalJornadas} etiqueta="Jornadas" />
            <Stat icono={<Percent className="size-5" />} valor={`${datos.ocupacion}%`} etiqueta="Ocupación de cupos" tono="success" />
            <Stat icono={<Ticket className="size-5" />} valor={datos.cuposOcupados} etiqueta="Inscripciones" tono="info" />
          </div>

          {vista === "graficas" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <TarjetaGrafica titulo="Ocupación de cupos" subtitulo="Cupos usados frente al total ofrecido">
                <Anillo valor={datos.cuposOcupados} total={datos.cuposTotales} etiqueta="cupos" />
              </TarjetaGrafica>
              {datos.porMes && (
                <TarjetaGrafica titulo="Jornadas por mes" subtitulo="Evolución de las jornadas programadas">
                  <ColumnasMes porMes={datos.porMes} mesActual={(descomponerFecha(Date.now()) as { dia: string }).dia.slice(0, 7)} />
                </TarjetaGrafica>
              )}
              <TarjetaGrafica titulo="Jornadas por estado" subtitulo="Cómo se reparte el total" className="lg:col-span-2">
                <BarraSegmentada segmentos={filasEstado.map(([e, n]) => ({ etiqueta: (ETIQUETA_ESTADO as Record<string, string>)[e], valor: n, color: COLOR_ESTADO[e] }))} />
              </TarjetaGrafica>
              <TarjetaGrafica titulo="Jornadas por espacio" subtitulo="Espacios con más jornadas">
                <BarrasRanking filas={ordenar(datos.porEspacio)} tope={8} />
              </TarjetaGrafica>
              <TarjetaGrafica titulo="Jornadas por gestor" subtitulo="Quién organiza más jornadas">
                <BarrasRanking filas={porGestor} tope={6} color="var(--color-primary-light)" />
              </TarjetaGrafica>
              <TarjetaGrafica titulo="Usuarios por rol" subtitulo={`${datos.totalUsuarios} usuarios registrados`}>
                <BarrasRanking filas={filasRol} tope={6} unidad="usuarios" />
                {datos.cuentasInactivas > 0 && <p className="mt-4 text-sm font-semibold text-danger">{datos.cuentasInactivas} {datos.cuentasInactivas === 1 ? "cuenta inactiva" : "cuentas inactivas"}</p>}
              </TarjetaGrafica>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Tabla titulo="Jornadas por estado" filas={filasEstado.map(([e, n]) => [(ETIQUETA_ESTADO as Record<string, string>)[e], n])} />
              <Tabla titulo="Jornadas por espacio" filas={ordenar(datos.porEspacio)} />
              <Tabla titulo="Jornadas por gestor" filas={porGestor} />
              <Tabla titulo="Usuarios por rol" filas={[...filasRol, ["Cuentas inactivas", datos.cuentasInactivas]]} />
            </div>
          )}
        </>
      )}
    </>
  );
}
