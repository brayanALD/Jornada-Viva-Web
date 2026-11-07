import { collection, onSnapshot, query, where } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  construirMisJornadas,
  fechaAMillis,
  jornadaDisponible,
  jornadaVencidaActiva,
  normalizarJornada,
  type Inscripcion,
  type Jornada,
} from "@/core";
import { api } from "@/lib/api";
import { db } from "@/lib/firebase";
import { useAhora } from "@/lib/hooks";
import { useAuth } from "../auth/AuthContext";

export interface MiJornada extends Jornada {
  finalizada: boolean;
  enCurso: boolean;
  asistio: boolean;
  noDisponible?: boolean;
}

interface ContextoJornadas {
  /** Todas las jornadas de la plataforma (tiempo real) */
  jornadas: Jornada[];
  jornadasPorId: Map<string, Jornada>;
  /** Activas y que aún no empiezan, la más próxima primero (lo que ve el estudiante en Inicio) */
  jornadasDisponibles: Jornada[];
  /** Historial del usuario: inscripciones + datos de la jornada */
  misJornadas: MiJornada[];
  inscripciones: Inscripcion[];
  estaInscrito: (jornadaId: string) => boolean;
  cargando: boolean;
  error: string | null;
  ahora: number;
}

const Ctx = createContext<ContextoJornadas | null>(null);

// Única fuente de verdad de las jornadas (igual que en la app móvil): todas las pantallas leen de
// aquí, así activar, cancelar o vencer una jornada se refleja en todas a la vez.
export function JornadasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const uid = usuario?.uid;
  const ahora = useAhora(30000);

  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [jornadasListas, setJornadasListas] = useState(false);
  const [inscripcionesListas, setInscripcionesListas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const desactivadas = useRef(new Set<string>());

  useEffect(() => {
    setJornadas([]);
    setInscripciones([]);
    setJornadasListas(false);
    setInscripcionesListas(false);
    setError(null);
    desactivadas.current.clear();
    if (!uid) return;

    const detenerJornadas = onSnapshot(
      collection(db, "jornadas"),
      (snap) => {
        setJornadas(snap.docs.map((d) => normalizarJornada(d.id, d.data()) as Jornada));
        setError(null);
        setJornadasListas(true);
      },
      (e) => {
        console.error("Error escuchando jornadas:", e);
        setError("No se pudieron cargar las jornadas. Verifica tu conexión.");
        setJornadasListas(true);
      }
    );

    const detenerInscripciones = onSnapshot(
      query(collection(db, "inscripciones"), where("userId", "==", uid)),
      (snap) => {
        setInscripciones(
          snap.docs.map((d) => {
            const x = d.data();
            return {
              id: d.id,
              jornadaId: x.jornadaId,
              tituloJornada: x.tituloJornada,
              fechaJornada: fechaAMillis(x.fechaJornada),
              asistio: !!x.asistio,
            };
          })
        );
        setInscripcionesListas(true);
      },
      (e) => {
        console.error("Error escuchando inscripciones:", e);
        setError("No se pudieron cargar tus jornadas. Verifica tu conexión.");
        setInscripcionesListas(true);
      }
    );

    return () => {
      detenerJornadas();
      detenerInscripciones();
    };
  }, [uid]);

  // Una jornada activa que ya terminó se desactiva en el servidor (que además lo hace solo cada pocos minutos)
  useEffect(() => {
    if (!uid || !jornadasListas) return;
    const hayVencidas = jornadas.some((j) => jornadaVencidaActiva(j, ahora) && !desactivadas.current.has(j.id));
    if (!hayVencidas) return;
    jornadas.forEach((j) => jornadaVencidaActiva(j, ahora) && desactivadas.current.add(j.id));
    api.post("/v1/mantenimiento/vencidas").catch((e) => console.warn("No se pudieron desactivar las jornadas vencidas:", e));
  }, [uid, jornadas, jornadasListas, ahora]);

  const jornadasPorId = useMemo(() => new Map(jornadas.map((j) => [j.id, j])), [jornadas]);

  const jornadasDisponibles = useMemo(
    () => jornadas.filter((j) => jornadaDisponible(j, ahora)).sort((a, b) => (a.fecha ?? 0) - (b.fecha ?? 0)),
    [jornadas, ahora]
  );

  const misJornadas = useMemo(
    () =>
      construirMisJornadas(inscripciones, jornadasPorId, ahora, { ocultarEliminadas: jornadasListas }) as MiJornada[],
    [inscripciones, jornadasPorId, ahora, jornadasListas]
  );

  const inscritas = useMemo(() => new Set(inscripciones.map((i) => i.jornadaId)), [inscripciones]);

  const valor = useMemo<ContextoJornadas>(
    () => ({
      jornadas,
      jornadasPorId,
      jornadasDisponibles,
      misJornadas,
      inscripciones,
      estaInscrito: (id) => inscritas.has(id),
      cargando: !!uid && !(jornadasListas && inscripcionesListas),
      error,
      ahora,
    }),
    [jornadas, jornadasPorId, jornadasDisponibles, misJornadas, inscripciones, inscritas, uid, jornadasListas, inscripcionesListas, error, ahora]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useJornadas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useJornadas debe usarse dentro de JornadasProvider");
  return ctx;
}
