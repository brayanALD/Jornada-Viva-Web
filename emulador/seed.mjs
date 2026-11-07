// Datos de prueba SOLO para los emuladores locales (proyecto demo-jornadaviva): nunca toca producción.
// Crea 6 cuentas (clave común más abajo), 8 jornadas en distintos estados, inscripciones y avisos.
// Uso: `npm run emulador:firebase` (otra terminal) y luego `npm run emulador:semilla`.
import { createRequire } from "node:module";
import path from "node:path";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

const movil = path.resolve(process.cwd(), process.env.JV_MOBILE_PATH || "../Jornada-Viva");
const require = createRequire(path.join(movil, "api", "package.json"));
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");

const app = initializeApp({ projectId: "demo-jornadaviva" });
const auth = getAuth(app);
const db = getFirestore(app);

const CLAVE = "prueba123"; // contraseña de TODAS las cuentas de prueba (solo existen en el emulador)
const MIN = 60_000;
const DIA = 86_400_000;
const ahora = Date.now();

const personas = [
  ["estudiante", "Laura Estudiante", "estudiante@prueba.co", "estudiante"],
  ["gestor", "Gabriel Gestor", "gestor@prueba.co", "gestor"],
  ["admin", "Ana Administradora", "admin@prueba.co", "administrador"],
  ["est2", "Camilo Rojas", "camilo@prueba.co", "estudiante"],
  ["est3", "Daniela Pérez", "daniela@prueba.co", "estudiante"],
  ["est4", "Mateo Gómez", "mateo@prueba.co", "estudiante"],
];
const uid = {};
for (const [clave, nombre, email, rol] of personas) {
  const u = await auth.createUser({ email, password: CLAVE, displayName: nombre });
  uid[clave] = u.uid;
  await db.doc(`users/${u.uid}`).set({ uid: u.uid, nombre, email, rol, activo: true, creadoEn: Timestamp.fromMillis(ahora - 20 * DIA) });
}

const base = { entidad: "Institución Universitaria Tecnológico de Antioquia", creadoPor: uid.gestor, activa: true, asistenciaTodaJornada: false };
const jornadas = [
  ["salud", { titulo: "Jornada de salud visual", descripcion: "Valoración visual gratuita con optómetras aliados.\nTrae tu documento de identidad.", responsable: "Gabriel Gestor", lugar: "Auditorio", fecha: ahora + 2 * DIA, duracionMin: 180, cuposTotales: 30, cuposOcupados: 4, categoria: "Salud" }],
  ["taller", { titulo: "Taller de hoja de vida y entrevistas", descripcion: "Aprende a presentar tu perfil profesional.", responsable: "Gabriel Gestor", lugar: "Bloque 3", fecha: ahora + 5 * DIA, duracionMin: 90, cuposTotales: 10, cuposOcupados: 9, categoria: "Talleres" }],
  ["social", { titulo: "Siembra de árboles en el campus", descripcion: "Proyección social con la comunidad.", responsable: "Gabriel Gestor, Ana Administradora", lugar: "Cancha", fecha: ahora + 9 * DIA, duracionMin: 120, cuposTotales: 50, cuposOcupados: 0, categoria: "Proyección social" }],
  ["lleno", { titulo: "Alfabetización digital: Excel básico", descripcion: "Cupos agotados.", responsable: "Gabriel Gestor", lugar: "Bloque 7", fecha: ahora + 12 * DIA, duracionMin: 120, cuposTotales: 20, cuposOcupados: 20, categoria: "Alfabetización digital" }],
  ["curso", { titulo: "Asesoría de proyectos de grado", descripcion: "Jornada en curso ahora mismo.", responsable: "Gabriel Gestor", lugar: "Bloque 2", fecha: ahora - 10 * MIN, duracionMin: 120, cuposTotales: 25, cuposOcupados: 1, categoria: "Asesorías" }],
  ["cancelada", { titulo: "Feria de emprendimiento (cancelada)", descripcion: "Cancelada por el organizador.", responsable: "Gabriel Gestor", lugar: "Coliseo", fecha: ahora + 6 * DIA, duracionMin: 240, cuposTotales: 80, cuposOcupados: 0, categoria: "Proyección social", activa: false }],
  ["pasada", { titulo: "Jornada de vacunación", descripcion: "Ya finalizó.", responsable: "Gabriel Gestor", lugar: "Bloque 1", fecha: ahora - 3 * DIA, duracionMin: 120, cuposTotales: 40, cuposOcupados: 1, categoria: "Salud", activa: false }],
  ["choque", { titulo: "Charla de nutrición", descripcion: "Comparte espacio con la jornada de salud visual (sirve para probar el aviso de espacios ocupados).", responsable: "Gabriel Gestor", lugar: "Auditorio", fecha: ahora + 2 * DIA + 30 * MIN, duracionMin: 60, cuposTotales: 40, cuposOcupados: 0, categoria: "Salud" }],
];
const id = {};
for (const [clave, datos] of jornadas) {
  const ref = await db.collection("jornadas").add({ ...base, ...datos, fecha: Timestamp.fromMillis(datos.fecha), creadaEn: FieldValue.serverTimestamp() });
  id[clave] = ref.id;
}

async function inscribir(persona, jornadaClave, extra = {}) {
  const j = jornadas.find(([k]) => k === jornadaClave)[1];
  const p = personas.find(([k]) => k === persona);
  await db.doc(`inscripciones/${uid[persona]}_${id[jornadaClave]}`).set({
    userId: uid[persona], jornadaId: id[jornadaClave], tituloJornada: j.titulo, fechaJornada: Timestamp.fromMillis(j.fecha),
    nombreUsuario: p[1], emailUsuario: p[2], inscritoEn: Timestamp.fromMillis(ahora - DIA), asistio: false, ...extra,
  });
}
await inscribir("estudiante", "salud");
await inscribir("estudiante", "curso");
await inscribir("estudiante", "pasada", { asistio: true, metodoAsistencia: "qr" });
for (const e of ["est2", "est3", "est4"]) await inscribir(e, "salud");
await inscribir("est2", "curso", { asistio: true, metodoAsistencia: "manual" });

await db.collection("notificaciones").add({ userId: uid.estudiante, jornadaId: id.salud, tipo: "reprogramacion", titulo: "Jornada reprogramada", mensaje: "«Jornada de salud visual» cambió de horario. Revisa los detalles.", leida: false, creadaEn: Timestamp.fromMillis(ahora - 3_600_000) });
await db.collection("notificaciones").add({ userId: uid.estudiante, jornadaId: id.cancelada, tipo: "cancelacion", titulo: "Jornada cancelada", mensaje: "«Feria de emprendimiento» fue cancelada por el organizador.", leida: true, creadaEn: Timestamp.fromMillis(ahora - 2 * DIA) });

console.log("Datos de prueba listos. Cuentas: estudiante@prueba.co, gestor@prueba.co y admin@prueba.co (clave en este archivo).");
