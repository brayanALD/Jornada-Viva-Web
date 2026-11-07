import { ArrowLeft, CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { estadoVentanaAsistencia, parsearPayloadQrAsistencia } from "@/core";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Misc";
import { LectorQr } from "@/features/asistencia/LectorQr";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { registrarAsistencia } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";
import { useTitulo } from "@/lib/hooks";

interface Resultado {
  ok: boolean;
  titulo: string;
  texto: string;
  /** Si el error no se arregla escaneando de nuevo, no se ofrece reintentar */
  reintentar: boolean;
}

export default function AsistenciaPage() {
  useTitulo("Registrar asistencia");
  const { id: jornadaId = "" } = useParams();
  const navigate = useNavigate();
  const { jornadasPorId, estaInscrito, ahora } = useJornadas();
  const jornada = jornadasPorId.get(jornadaId);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [procesando, setProcesando] = useState(false);
  const ocupado = useRef(false);

  const alLeer = useCallback(
    async (contenido: string) => {
      if (ocupado.current) return;
      ocupado.current = true;
      setProcesando(true);
      try {
        const { valido, datos, error } = parsearPayloadQrAsistencia(contenido) as { valido: boolean; datos?: { jornadaId: string; codigo: string; titulo?: string }; error?: string };
        if (!valido || !datos) {
          setResultado({ ok: false, titulo: "Código QR inválido", texto: error ?? "No se pudo leer el código.", reintentar: true });
          return;
        }
        if (datos.jornadaId !== jornadaId) {
          setResultado({
            ok: false,
            titulo: "Jornada incorrecta",
            texto: `Este código QR corresponde a otra jornada («${datos.titulo || datos.jornadaId}»). Escanea el código de la jornada en la que estás presente.`,
            reintentar: true,
          });
          return;
        }
        // Aviso rápido con el reloj del dispositivo; quien decide es el servidor
        if (jornada?.fecha) {
          const ventana = estadoVentanaAsistencia(jornada.fecha, Date.now(), jornada.duracionMin, jornada.asistenciaTodaJornada === true) as { disponible: boolean; mensaje: string };
          if (!ventana.disponible) {
            setResultado({ ok: false, titulo: "Asistencia no disponible", texto: ventana.mensaje, reintentar: false });
            return;
          }
        }
        if (!estaInscrito(jornadaId)) {
          setResultado({ ok: false, titulo: "No estás inscrito", texto: "Solo puedes registrar asistencia en jornadas en las que estás inscrito.", reintentar: false });
          return;
        }
        const titulo = datos.titulo || jornada?.titulo || "la jornada";
        const r = await registrarAsistencia(datos.jornadaId, datos.codigo);
        setResultado({
          ok: true,
          titulo: r === "ya-registrada" ? "Asistencia ya registrada" : "¡Asistencia registrada!",
          texto: r === "ya-registrada" ? `Tu asistencia a «${titulo}» ya estaba confirmada.` : `Se confirmó tu asistencia a «${titulo}».`,
          reintentar: false,
        });
      } catch (err) {
        setResultado({ ok: false, titulo: "No se pudo registrar", texto: mensajeDeError(err), reintentar: true });
      } finally {
        setProcesando(false);
      }
    },
    [jornadaId, jornada, estaInscrito, ahora]
  );

  const reintentar = () => {
    ocupado.current = false;
    setResultado(null);
  };

  return (
    <div className="mx-auto max-w-lg">
      <Link to={`/jornadas/${jornadaId}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Volver a la jornada
      </Link>
      <PageHeader titulo="Registrar asistencia" descripcion={jornada ? `Apunta la cámara al código QR que muestra el gestor de «${jornada.titulo}».` : "Apunta la cámara al código QR que muestra el gestor de la jornada."} />

      {resultado ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <span className={`grid size-16 place-items-center rounded-full ${resultado.ok ? "bg-success-pale text-success" : "bg-danger-pale text-danger"}`}>
            {resultado.ok ? <CircleCheck className="size-9" aria-hidden /> : <CircleX className="size-9" aria-hidden />}
          </span>
          <h2 className="text-xl font-extrabold">{resultado.titulo}</h2>
          <p className="text-sm leading-relaxed text-muted">{resultado.texto}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {resultado.reintentar && <Button onClick={reintentar}>Intentar de nuevo</Button>}
            <Button variante={resultado.reintentar ? "secondary" : "primary"} onClick={() => navigate(`/jornadas/${jornadaId}`)}>
              Volver a la jornada
            </Button>
          </div>
        </Card>
      ) : (
        <div className="relative">
          <LectorQr alLeer={alLeer} pausado={procesando} />
          {procesando && (
            <div className="absolute inset-0 grid place-items-center rounded-3xl bg-ink/70 text-white" role="status">
              <div className="flex flex-col items-center gap-3 text-sm font-bold">
                <LoaderCircle className="size-8 animate-spin" aria-hidden />
                Confirmando asistencia…
              </div>
            </div>
          )}
          <p className="mt-4 text-center text-xs leading-relaxed text-muted">El código se renueva cada 30 segundos: tiene que estar a la vista en la pantalla del gestor.</p>
        </div>
      )}
    </div>
  );
}
