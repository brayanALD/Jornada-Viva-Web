import { QRCodeSVG } from "qrcode.react";
import { Expand, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CODIGO_QR_RENOVAR_MS, estadoVentanaAsistencia, formatearFecha, formatearHora, generarPayloadQrAsistencia, type Jornada } from "@/core";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Aviso } from "@/components/ui/Feedback";
import { pedirCodigoQr } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";

/**
 * QR de asistencia de una jornada. El código lo firma el servidor y caduca en un minuto: mientras el
 * diálogo está abierto se pide uno nuevo cada 30 segundos, así hay que estar viendo la pantalla del
 * gestor para escanearlo y una captura deja de servir enseguida.
 */
export function ModalQr({ abierto, jornada, ahora, alCerrar }: { abierto: boolean; jornada: Jornada; ahora: number; alCerrar: () => void }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);
  const zona = useRef<HTMLDivElement>(null);

  const ventana = estadoVentanaAsistencia(jornada.fecha, ahora, jornada.duracionMin, jornada.asistenciaTodaJornada === true) as { disponible: boolean; estado: string; mensaje: string };
  const expirada = ventana.estado === "EXPIRADA";

  useEffect(() => {
    if (!abierto || expirada) {
      setCodigo(null);
      setError(null);
      return;
    }
    let activo = true;
    const pedir = async () => {
      try {
        const nuevo = await pedirCodigoQr(jornada.id);
        if (!activo) return;
        setCodigo(nuevo.codigo);
        setError(null);
      } catch (e) {
        if (!activo) return;
        setError(mensajeDeError(e));
      }
    };
    void pedir();
    const temporizador = setInterval(pedir, CODIGO_QR_RENOVAR_MS);
    return () => {
      activo = false;
      clearInterval(temporizador);
    };
  }, [abierto, jornada.id, expirada, reintento]);

  const payload = codigo ? generarPayloadQrAsistencia(jornada, codigo) : null;

  return (
    <Dialog abierto={abierto} alCerrar={alCerrar} titulo="Asistencia por QR" descripcion={jornada.titulo} ancho="md">
      <div className="flex flex-col items-center gap-4">
        <Aviso tipo={ventana.disponible ? "exito" : expirada ? "error" : "alerta"} className="w-full">
          {ventana.disponible
            ? `Ventana abierta: los estudiantes pueden registrarse hasta las ${formatearHora((jornada.fecha ?? 0) + ventanaMs(jornada))}.`
            : ventana.estado === "ANTES"
              ? `Aún no empieza (${formatearFecha(jornada.fecha, "D MMM")} · ${formatearHora(jornada.fecha)}). Puedes dejarlo listo: el código servirá cuando abra la ventana.`
              : ventana.mensaje}
        </Aviso>

        {expirada ? null : error ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="max-w-xs text-sm font-medium text-danger">{error}</p>
            <Button variante="secondary" icono={<RefreshCw className="size-4" />} onClick={() => setReintento((n) => n + 1)}>
              Reintentar
            </Button>
          </div>
        ) : (
          <div ref={zona} className="grid w-full place-items-center rounded-3xl bg-white p-4 [&:fullscreen]:min-h-dvh [&:fullscreen]:content-center">
            {payload ? (
              <QRCodeSVG value={payload} size={320} level="M" marginSize={1} className="h-auto w-full max-w-80 [:fullscreen_&]:max-w-[min(80vh,80vw)]" role="img" aria-label="Código QR de asistencia" />
            ) : (
              <div className="grid size-64 place-items-center" role="status" aria-label="Generando código">
                <LoaderCircle className="size-9 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}

        {!expirada && !error && (
          <>
            <p className="flex items-center gap-1.5 text-center text-xs leading-relaxed text-muted">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
              El código se renueva solo cada 30 s. Mantén esta pantalla visible para los asistentes.
            </p>
            <Button variante="soft" icono={<Expand className="size-4" />} onClick={() => void zona.current?.requestFullscreen?.()} disabled={!payload}>
              Proyectar en pantalla completa
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}

// Ventana (ms) durante la que el estudiante puede registrarse
function ventanaMs(jornada: Jornada) {
  const duracion = jornada.duracionMin || 60;
  return (jornada.asistenciaTodaJornada === true ? duracion : Math.min(20, duracion)) * 60000;
}
