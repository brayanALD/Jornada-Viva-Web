import jsQR from "jsqr";
import { CameraOff, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

function mensajeCamara(error: unknown): string {
  const nombre = (error as { name?: string } | null)?.name;
  if (!window.isSecureContext) return "La cámara solo funciona en una conexión segura (https).";
  if (nombre === "NotAllowedError" || nombre === "SecurityError") return "No diste permiso para usar la cámara. Habilítalo en la barra de direcciones y vuelve a intentarlo.";
  if (nombre === "NotFoundError" || nombre === "OverconstrainedError") return "No encontramos ninguna cámara en este dispositivo.";
  if (nombre === "NotReadableError") return "Otra aplicación está usando la cámara. Ciérrala y vuelve a intentarlo.";
  return "No se pudo iniciar la cámara.";
}

/**
 * Lector de códigos QR con la cámara del navegador (equivale al escáner de expo-camera del móvil).
 * Decodifica con jsQR sobre un lienzo reducido; `pausado` detiene la lectura sin apagar la cámara.
 */
export function LectorQr({ alLeer, pausado }: { alLeer: (contenido: string) => void; pausado: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const pausadoRef = useRef(pausado);
  const alLeerRef = useRef(alLeer);
  pausadoRef.current = pausado;
  alLeerRef.current = alLeer;

  const [estado, setEstado] = useState<"iniciando" | "listo" | "error">("iniciando");
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    let flujo: MediaStream | null = null;
    let cuadro = 0;
    let ultimo = 0;
    setEstado("iniciando");

    const leer = (t: number) => {
      cuadro = requestAnimationFrame(leer);
      const v = video.current;
      const c = lienzo.current;
      if (!v || !c || pausadoRef.current || t - ultimo < 120 || v.readyState < v.HAVE_ENOUGH_DATA) return;
      ultimo = t;
      const escala = Math.min(1, 720 / v.videoWidth);
      c.width = Math.round(v.videoWidth * escala);
      c.height = Math.round(v.videoHeight * escala);
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
      const codigo = jsQR(data, width, height, { inversionAttempts: "dontInvert" });
      if (codigo?.data) alLeerRef.current(codigo.data);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error("sin soporte"), { name: "SecurityError" });
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (!activo || !video.current) {
          flujo.getTracks().forEach((t) => t.stop());
          return;
        }
        video.current.srcObject = flujo;
        await video.current.play();
        setEstado("listo");
        cuadro = requestAnimationFrame(leer);
      } catch (e) {
        if (!activo) return;
        setError(mensajeCamara(e));
        setEstado("error");
      }
    })();

    return () => {
      activo = false;
      cancelAnimationFrame(cuadro);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [intento]);

  if (estado === "error") {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-3xl bg-ink p-8 text-center text-white">
        <CameraOff className="size-12 text-white/70" aria-hidden />
        <p className="text-lg font-extrabold">No se pudo abrir la cámara</p>
        <p className="max-w-xs text-sm leading-relaxed text-white/75">{error}</p>
        <Button variante="accent" onClick={() => setIntento((n) => n + 1)}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-ink">
      <video ref={video} muted playsInline className="size-full object-cover" aria-label="Vista de la cámara" />
      <canvas ref={lienzo} className="hidden" />
      {estado === "iniciando" && (
        <div className="absolute inset-0 grid place-items-center bg-ink text-white" role="status">
          <LoaderCircle className="size-8 animate-spin" aria-label="Iniciando la cámara" />
        </div>
      )}
      {estado === "listo" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
          <div className="relative size-3/5 rounded-3xl shadow-[0_0_0_999px_rgb(0_0_0/0.35)]">
            {["left-0 top-0 border-l-4 border-t-4 rounded-tl-3xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => (
              <span key={c} className={`absolute size-9 border-white ${c}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
