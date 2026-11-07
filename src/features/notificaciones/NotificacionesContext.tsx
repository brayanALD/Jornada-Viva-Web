import { collection, onSnapshot, query, where } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Notificacion } from "@/core";
import { api, idRuta, mensajeDeError } from "@/lib/api";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/Feedback";
import { useAuth } from "../auth/AuthContext";

interface ContextoNotificaciones {
  notificaciones: Notificacion[];
  noLeidas: number;
  cargando: boolean;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminar: (id: string) => Promise<void>;
}

const Ctx = createContext<ContextoNotificaciones | null>(null);

// Los avisos los crea el servidor al cambiar una jornada (cancelación, reprogramación…); aquí solo
// se leen en tiempo real y se marcan como leídos por la API.
export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const uid = usuario?.uid;
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const vistas = useRef<Set<string> | null>(null);

  useEffect(() => {
    setNotificaciones([]);
    vistas.current = null;
    if (!uid) {
      setCargando(false);
      return;
    }
    setCargando(true);
    return onSnapshot(
      query(collection(db, "notificaciones"), where("userId", "==", uid)),
      (snap) => {
        const lista = snap.docs
          .map((d) => {
            const x = d.data();
            return {
              id: d.id,
              ...x,
              creadaEn: typeof x.creadaEn?.toMillis === "function" ? x.creadaEn.toMillis() : x.creadaEn || Date.now(),
            } as Notificacion;
          })
          .sort((a, b) => b.creadaEn - a.creadaEn);

        // Aviso en pantalla de lo que llega con la sesión abierta (no de lo que ya había)
        if (vistas.current) {
          for (const n of lista) {
            if (!vistas.current.has(n.id) && !n.leida) {
              toast.info(`${n.titulo}: ${n.mensaje}`);
              mostrarNotificacionDelNavegador(n);
            }
          }
        }
        vistas.current = new Set(lista.map((n) => n.id));
        setNotificaciones(lista);
        setCargando(false);
      },
      (e) => {
        console.error("Error escuchando notificaciones:", e);
        setCargando(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const valor = useMemo<ContextoNotificaciones>(
    () => ({
      notificaciones,
      noLeidas: notificaciones.filter((n) => !n.leida).length,
      cargando,
      marcarLeida: async (id) => {
        try {
          await api.patch(`/v1/me/notificaciones/${idRuta(id)}`, { leida: true });
        } catch (e) {
          toast.error(mensajeDeError(e));
        }
      },
      marcarTodasLeidas: async () => {
        try {
          await api.post("/v1/me/notificaciones/leer-todas", {});
        } catch (e) {
          toast.error(mensajeDeError(e));
        }
      },
      eliminar: async (id) => {
        try {
          await api.delete(`/v1/me/notificaciones/${idRuta(id)}`);
        } catch (e) {
          toast.error(mensajeDeError(e));
        }
      },
    }),
    [notificaciones, cargando, toast]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

// Notificación del sistema si el usuario ya dio permiso (no se pide permiso sin que lo solicite en Perfil)
function mostrarNotificacionDelNavegador(n: Notificacion) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted" || document.visibilityState === "visible") return;
  try {
    new Notification(n.titulo, { body: n.mensaje });
  } catch {
    /* algunos navegadores solo la permiten desde un service worker */
  }
}

export function useNotificaciones() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  return ctx;
}
