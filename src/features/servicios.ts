// Operaciones de negocio contra la API compartida con la app móvil. La web nunca escribe en
// Firestore: la API aplica los permisos, valida las reglas (cupos, plazos, ventana de asistencia),
// crea los avisos a los inscritos y audita las acciones del administrador.
import type { Inscrito, Prestamo, RegistroAuditoria, Estadisticas, Usuario, Rol } from "@/core";
import { api, idRuta } from "@/lib/api";
import { descargarArchivo } from "@/lib/hooks";

const rutaJornada = (id: string) => `/v1/jornadas/${idRuta(id)}`;

// ---- Inscripciones ----
export const inscribirse = (jornadaId: string, datos: { nombreUsuario: string; emailUsuario: string; tituloJornada: string }) =>
  api.put<{ resultado: "completada" | "ya-inscrito" }>(`${rutaJornada(jornadaId)}/inscripcion`, datos);

export const cancelarInscripcion = (jornadaId: string) =>
  api.delete<{ resultado: "completada" | "ya-cancelada" }>(`${rutaJornada(jornadaId)}/inscripcion`);

// ---- Gestión de jornadas ----
export type DatosJornada = Record<string, unknown>;

export const crearJornada = (uid: string, datos: DatosJornada, claveIdempotencia: string) =>
  api.post<{ id: string; repetida?: boolean }>("/v1/jornadas", { ...datos, creadoPor: uid, claveIdempotencia });

export const editarJornada = (id: string, datos: DatosJornada, creadoPor?: string) =>
  api.put(rutaJornada(id), { ...datos, ...(creadoPor ? { creadoPor } : {}) });

export const cancelarJornada = (id: string) => api.post(`${rutaJornada(id)}/cancelar`);
export const reactivarJornada = (id: string) => api.post(`${rutaJornada(id)}/reactivar`);
export const eliminarJornada = (id: string) => api.delete(rutaJornada(id));

export const obtenerInscritos = async (id: string) => (await api.get<{ inscritos: Inscrito[] }>(`${rutaJornada(id)}/inscritos`)).inscritos;

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Descarga la planilla de inscritos en Excel (.xlsx). */
export async function descargarPlanilla(id: string, nombreBase: string) {
  const bytes = await api.get<Uint8Array>(`${rutaJornada(id)}/planilla.xlsx`, { binario: true, espera: 40000 });
  descargarArchivo(`planilla-${nombreBase}.xlsx`, bytes as BlobPart, MIME_XLSX);
}

/** Descarga el reporte de jornadas del administrador en Excel (queda en la auditoría). */
export async function descargarReporteJornadas() {
  const bytes = await api.get<Uint8Array>("/v1/admin/reporte-jornadas.xlsx", { binario: true, espera: 40000 });
  descargarArchivo("reporte-jornadas.xlsx", bytes as BlobPart, MIME_XLSX);
}

// ---- Disponibilidad de espacios (FE-01) ----
export interface OcupanteEspacio {
  id: string;
  titulo: string;
  fecha: number;
  lugar: string;
}
export const pedirDisponibilidad = (inicio: number, fin: number, excluirId?: string | null) => {
  const q = new URLSearchParams({ inicio: String(inicio), fin: String(fin) });
  if (excluirId) q.set("excluirId", excluirId);
  return api.get<{ ocupados: Record<string, OcupanteEspacio[]>; libres: string[] }>(`/v1/espacios/disponibilidad?${q}`, { espera: 8000 });
};
export const pedirAlternos = (id: string) =>
  api.get<{ sugerencia: null | { motivo: "cancelada" | "ocupado"; ocupantes: OcupanteEspacio[]; libres: string[] } }>(
    `${rutaJornada(id)}/espacios-alternos`,
    { espera: 8000 }
  );

// ---- Asistencia ----
export const pedirCodigoQr = (id: string) =>
  api.post<{ codigo: string; expiraEn: number; renovarEnMs: number }>(`${rutaJornada(id)}/asistencia/codigo`);

export const registrarAsistencia = async (id: string, codigo: string) =>
  (await api.post<{ resultado: "registrada" | "ya-registrada" }>(`${rutaJornada(id)}/asistencia`, { codigo })).resultado;

export const marcarAsistenciaManual = (jornadaId: string, inscripcionId: string, asistio: boolean) =>
  api.put<{ asistio: boolean }>(`${rutaJornada(jornadaId)}/inscritos/${idRuta(inscripcionId)}/asistencia`, { asistio });

// ---- Préstamos de objetos ----
export interface DatosPrestamo {
  codigo: string;
  nombre: string;
  tipo: string;
  correo: string;
  vence: number;
  nota?: string;
}
export const registrarPrestamo = (datos: DatosPrestamo) => api.post<{ id: string }>("/v1/prestamos", datos);
export const marcarDevuelto = async (id: string) =>
  (await api.post<{ resultado: "devuelto" | "ya-devuelto" }>(`/v1/prestamos/${idRuta(id)}/devolucion`)).resultado;

// ---- Administración ----
export const crearUsuario = (datos: { nombre: string; correo: string; clave: string; rol: Rol }) =>
  api.post<{ id: string }>("/v1/usuarios", datos);
export const actualizarUsuario = (id: string, cambios: { nombre?: string; rol?: Rol; activo?: boolean }) =>
  api.patch<{ cambiado: boolean }>(`/v1/usuarios/${idRuta(id)}`, cambios);

export type { Prestamo, RegistroAuditoria, Estadisticas, Usuario };
