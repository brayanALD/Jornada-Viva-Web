import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { esAdministrador, esGestor, normalizarRol, ROLES, type Rol } from "@/core";
import { api } from "@/lib/api";
import { auth, db } from "@/lib/firebase";

// Si no se logra leer el perfil se entra como estudiante (igual que la app móvil)
const ESPERA_MAXIMA_PERFIL_MS = 6000;

interface ContextoAuth {
  usuario: User | null;
  /** Sesión y rol todavía sin resolver: no se muestra ninguna pantalla hasta saberlo */
  cargando: boolean;
  rol: Rol;
  esGestor: boolean;
  esAdministrador: boolean;
  nombre: string;
  /** Se cerró la sesión porque un administrador desactivó la cuenta */
  cuentaDesactivada: boolean;
  registrar: (nombre: string, email: string, clave: string) => Promise<void>;
  iniciarSesion: (email: string, clave: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  descartarAvisoDesactivada: () => void;
}

const Ctx = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [rol, setRol] = useState<Rol>(ROLES.ESTUDIANTE);
  // uid cuyo rol ya se conoce: evita mostrar un instante la pantalla equivocada
  const [perfilListoPara, setPerfilListoPara] = useState<string | null>(null);
  const [cuentaDesactivada, setCuentaDesactivada] = useState(false);
  const [version, setVersion] = useState(0);

  const uid = usuario?.uid;

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUsuario(u);
        setCargandoSesion(false);
      }),
    []
  );

  // Rol (users/{uid}.rol): solo decide qué pantallas se muestran; lo que se permite lo decide la API.
  // Se escucha en vivo: un cambio de rol o una desactivación se aplican sin recargar.
  useEffect(() => {
    setRol(ROLES.ESTUDIANTE);
    if (!uid) {
      setPerfilListoPara(null);
      return;
    }
    const temporizador = setTimeout(() => setPerfilListoPara(uid), ESPERA_MAXIMA_PERFIL_MS);
    const detener = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.data()?.activo === false) {
          setCuentaDesactivada(true);
          void signOut(auth);
          return;
        }
        setRol(normalizarRol(snap.data()?.rol));
        setPerfilListoPara(uid);
      },
      (error) => {
        console.warn("No se pudo leer el perfil del usuario:", error);
        setPerfilListoPara(uid);
      }
    );
    return () => {
      clearTimeout(temporizador);
      detener();
    };
  }, [uid]);

  const registrar = useCallback(async (nombre: string, email: string, clave: string) => {
    const credencial = await createUserWithEmailAndPassword(auth, email, clave);
    await updateProfile(credencial.user, { displayName: nombre });
    // La API crea el perfil: siempre como estudiante, sin que la solicitud pueda elegir el rol
    await api.post("/v1/me/perfil", { nombre });
    setVersion((v) => v + 1);
  }, []);

  const iniciarSesion = useCallback(async (email: string, clave: string) => {
    setCuentaDesactivada(false);
    await signInWithEmailAndPassword(auth, email, clave);
  }, []);

  const cerrarSesion = useCallback(() => signOut(auth), []);

  const valor = useMemo<ContextoAuth>(
    () => ({
      usuario,
      cargando: cargandoSesion || (!!uid && perfilListoPara !== uid),
      rol,
      esGestor: esGestor(rol),
      esAdministrador: esAdministrador(rol),
      nombre: (usuario?.displayName || usuario?.email || "Usuario").trim(),
      cuentaDesactivada,
      registrar,
      iniciarSesion,
      cerrarSesion,
      descartarAvisoDesactivada: () => setCuentaDesactivada(false),
    }),
    // `version` fuerza a recalcular el nombre tras updateProfile
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuario, cargandoSesion, uid, perfilListoPara, rol, cuentaDesactivada, registrar, iniciarSesion, cerrarSesion, version]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

/** Mensajes de los errores de Firebase Auth (los mismos de la app móvil). */
export function mensajeDeAuth(error: unknown, accion: "ingresar" | "registrar"): string {
  const codigo = (error as { code?: string } | null)?.code;
  if (accion === "ingresar") {
    if (codigo === "auth/user-not-found" || codigo === "auth/wrong-password" || codigo === "auth/invalid-credential") return "Correo o contraseña incorrectos.";
    if (codigo === "auth/invalid-email") return "El formato del correo no es válido.";
    if (codigo === "auth/too-many-requests") return "Demasiados intentos fallidos. Espera unos minutos.";
    if (codigo === "auth/network-request-failed") return "Sin conexión a internet. Conéctate para iniciar sesión.";
    return "No se pudo iniciar sesión. Intenta de nuevo.";
  }
  if (codigo === "auth/email-already-in-use") return "Este correo ya está registrado. ¿Deseas iniciar sesión?";
  if (codigo === "auth/invalid-email") return "El formato del correo no es válido.";
  if (codigo === "auth/weak-password") return "La contraseña es demasiado débil. Usa al menos 6 caracteres.";
  if (codigo === "auth/network-request-failed") return "Sin conexión a internet. Conéctate para crear tu cuenta.";
  return "No se pudo crear la cuenta. Intenta de nuevo.";
}
