import { ErrorApi, ErrorNegocio, ErrorRed, crearClienteApi, mensajeDeRed } from "@/core";
import { auth } from "./firebase";

// Único punto de salida hacia la API de negocio (la misma que usa la app móvil). Reutiliza su
// cliente HTTP, que ya traduce los errores del servidor (cupos agotados, plazo vencido, validación…).
// Sin VITE_API_URL se llama al mismo origen: en desarrollo lo reenvía Vite y en producción un rewrite.
const base = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, "");

interface Opciones {
  cuerpo?: unknown;
  texto?: boolean;
  binario?: boolean;
  espera?: number;
}

// El cliente del móvil es JavaScript: se le da tipo aquí
const cliente = crearClienteApi({
  url: base,
  obtenerToken: () => {
    if (!auth.currentUser) throw Object.assign(new Error("Sin sesión"), { code: "auth/no-user" });
    return auth.currentUser.getIdToken();
  },
}) as unknown as { llamar: (metodo: string, ruta: string, opciones?: Opciones) => Promise<unknown> };

export const api = {
  get: <T = unknown>(ruta: string, op?: Opciones) => cliente.llamar("GET", ruta, op) as Promise<T>,
  post: <T = unknown>(ruta: string, cuerpo?: unknown, op?: Opciones) =>
    cliente.llamar("POST", ruta, { ...op, cuerpo }) as Promise<T>,
  put: <T = unknown>(ruta: string, cuerpo?: unknown, op?: Opciones) =>
    cliente.llamar("PUT", ruta, { ...op, cuerpo }) as Promise<T>,
  patch: <T = unknown>(ruta: string, cuerpo?: unknown, op?: Opciones) =>
    cliente.llamar("PATCH", ruta, { ...op, cuerpo }) as Promise<T>,
  delete: <T = unknown>(ruta: string, cuerpo?: unknown) =>
    cliente.llamar("DELETE", ruta, { cuerpo }) as Promise<T>,
};

export const idRuta = (id: string) => encodeURIComponent(id);

/** Mensaje legible para el usuario según el error que lance la API o Firebase. */
export function mensajeDeError(error: unknown, porDefecto = "No se pudo completar la operación. Intenta de nuevo."): string {
  const e = error as { name?: string; code?: string; message?: string; campos?: Record<string, string> } | null;
  if (!e) return porDefecto;
  if (error instanceof ErrorRed || e.name === "ErrorRed") return mensajeDeRed(error);
  if (error instanceof ErrorNegocio || e.name === "ErrorNegocio") return e.message || porDefecto;
  if (error instanceof ErrorApi || e.name === "ErrorApi") {
    if (e.campos) return Object.values(e.campos)[0] || porDefecto;
    if (e.code === "permission-denied") return "No tienes permiso para realizar esta acción.";
    return e.message || porDefecto;
  }
  return porDefecto;
}

export const esErrorDeRed = (error: unknown) => (error as { name?: string } | null)?.name === "ErrorRed";
