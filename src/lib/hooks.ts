import { useCallback, useEffect, useRef, useState } from "react";
import { api, mensajeDeError } from "./api";

/** Reloj para reevaluar estados (una jornada pasa a «En curso» o «Finalizada» sin recargar). */
export function useAhora(intervaloMs = 30000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return ahora;
}

/** Estado de conexión del navegador. */
export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine);
  useEffect(() => {
    const alCambiar = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", alCambiar);
    window.addEventListener("offline", alCambiar);
    return () => {
      window.removeEventListener("online", alCambiar);
      window.removeEventListener("offline", alCambiar);
    };
  }, []);
  return enLinea;
}

interface OpcionesRecurso<T, R> {
  /** Convierte la respuesta de la API en lo que usa la pantalla */
  extraer: (respuesta: R) => T;
  /** Vuelve a pedirlo cada tanto mientras la pantalla está a la vista (0 = no) */
  refrescoMs?: number;
  habilitado?: boolean;
}

/**
 * Lectura de un recurso de la API. Se pide al abrir la pantalla, al volver a la pestaña y,
 * opcionalmente, cada cierto tiempo. `recargar()` lo vuelve a pedir sin mostrar el esqueleto.
 */
export function useRecursoApi<T, R = T>(ruta: string | null, { extraer, refrescoMs = 0, habilitado = true }: OpcionesRecurso<T, R>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(!!ruta && habilitado);
  const [error, setError] = useState<string | null>(null);
  const extraerRef = useRef(extraer);
  extraerRef.current = extraer;
  const peticion = useRef(0);

  const cargar = useCallback(
    async (silencioso: boolean) => {
      if (!ruta || !habilitado) return;
      const id = ++peticion.current;
      if (!silencioso) setCargando(true);
      try {
        const respuesta = await api.get<R>(ruta);
        if (id !== peticion.current) return;
        setDatos(extraerRef.current(respuesta));
        setError(null);
      } catch (e) {
        if (id !== peticion.current) return;
        console.warn(`No se pudo leer ${ruta}:`, e);
        setError(mensajeDeError(e, "No se pudo cargar la información. Intenta de nuevo."));
      } finally {
        if (id === peticion.current) setCargando(false);
      }
    },
    [ruta, habilitado]
  );

  useEffect(() => {
    if (!ruta || !habilitado) {
      setCargando(false);
      return;
    }
    void cargar(false);
    const intervalo = refrescoMs > 0 ? setInterval(() => void cargar(true), refrescoMs) : undefined;
    const alVolver = () => {
      if (document.visibilityState === "visible") void cargar(true);
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      if (intervalo) clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      peticion.current++;
    };
  }, [ruta, habilitado, refrescoMs, cargar]);

  return { datos, cargando, error, recargar: () => cargar(true), reintentar: () => cargar(false) };
}

/** Título de la pestaña del navegador. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Jornada Viva` : "Jornada Viva";
  }, [titulo]);
}

/** Descarga un archivo generado en memoria (planillas y reportes). */
export function descargarArchivo(nombre: string, contenido: BlobPart, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
