// Lógica de negocio COMPARTIDA con la app móvil. No se copia: se importa de ../Jornada-Viva (alias
// "@mobile"), así las reglas (estados de jornada, permisos, validaciones, plazos, ventana de
// asistencia…) son exactamente las mismas en las dos plataformas y en la API. Solo se comparten
// módulos sin dependencias de React Native.
//
// Todo lo que use la web de esa lógica se importa desde "@/core": este archivo es el único punto de
// contacto con el proyecto móvil.

import * as rolesMovil from "@mobile/src/utils/roles.js";

export type Rol = "estudiante" | "gestor" | "administrador";

// Los módulos del móvil son JavaScript: aquí se les da tipo sin tocarlos
export const ROLES = rolesMovil.ROLES as { ESTUDIANTE: "estudiante"; GESTOR: "gestor"; ADMINISTRADOR: "administrador" };
export const ETIQUETA_ROL = rolesMovil.ETIQUETA_ROL as Record<Rol, string>;
export const normalizarRol = rolesMovil.normalizarRol as (valor: unknown) => Rol;
export const esGestor = rolesMovil.esGestor as (rol: unknown) => boolean;
export const esAdministrador = rolesMovil.esAdministrador as (rol: unknown) => boolean;
export const puedeAdministrarJornada = rolesMovil.puedeAdministrarJornada as (rol: unknown, uid: string | undefined, jornada: unknown) => boolean;
export const puedeSerResponsable = rolesMovil.puedeSerResponsable as (rol: unknown) => boolean;

import * as estadoMovil from "@mobile/src/utils/estadoJornada.js";

export const estadoJornada = estadoMovil.estadoJornada as (jornada: unknown, ahora?: number) => EstadoJornada;

export {
  ESTADOS_JORNADA,
  ETIQUETA_ESTADO,
  ETIQUETA_ESTADO_PLURAL,
  permisosJornada,
  ordenarParaMaestro,
  contarPorEstado,
} from "@mobile/src/utils/estadoJornada.js";

export {
  normalizarJornada,
  fechaAMillis,
  formatearFecha,
  formatearHora,
  formatearDiasFaltan,
  jornadaYaPaso,
  puedeCancelarInscripcion,
  coincideFiltroFecha,
  aDayjsNegocio,
  DIAS_LIMITE_CANCELACION,
} from "@mobile/src/utils/jornadaFecha.js";

export {
  jornadaDisponible,
  jornadaVencidaActiva,
  construirMisJornadas,
  distintivoHistorial,
  filtrarHistorial,
  contarHistorial,
  MODOS_HISTORIAL,
} from "@mobile/src/utils/jornadaEstado.js";

export { formatearDuracion, jornadaTerminada, esDuracionValida, finJornadaMs } from "@mobile/src/utils/duracion.js";
export { CATEGORIAS, categoriaDeJornada } from "@mobile/src/utils/categorias.js";
export { ESPACIOS } from "@mobile/src/utils/espacios.js";
import * as espaciosMovil from "@mobile/src/utils/espaciosLibres.js";

export const espaciosOcupados = espaciosMovil.espaciosOcupados as (
  jornadas: unknown[],
  inicio: number | null,
  fin: number | null,
  opciones?: { excluirId?: string | null; ahora?: number }
) => Map<string, Jornada[]>;
export const { listaCorta, sugerirEspaciosAlternos } = espaciosMovil;
export { combinarFechaHora, descomponerFecha } from "@mobile/src/utils/zonaNegocio.js";
export { normalizarTexto, opcionesUnicas } from "@mobile/src/utils/textoFiltro.js";
export { conteoPlural, palabraPlural } from "@mobile/src/utils/plural.js";
export { formatearTiempoRestante } from "@mobile/src/utils/tiempoRestante.js";

import * as asistenciaMovil from "@mobile/src/utils/asistencia.js";

export const estadoVentanaAsistencia = asistenciaMovil.estadoVentanaAsistencia as (
  fechaJornadaMs: number | null,
  ahoraMs?: number,
  duracionMin?: number,
  todaLaJornada?: boolean
) => { disponible: boolean; estado: "ANTES" | "EN_CURSO" | "EXPIRADA"; minutosRestantes: number; segundosRestantes: number; mensaje: string };
export const { textoVentanaAsistencia, generarPayloadQrAsistencia, parsearPayloadQrAsistencia, CODIGO_QR_RENOVAR_MS } = asistenciaMovil;

export {
  validarJornada,
  nuevaClaveCreacion,
  DURACION_SUGERIDA,
  ENTIDAD_POR_DEFECTO,
  LIMITES,
} from "@mobile/src/utils/jornadaForm.js";

export {
  filtrarUsuarios,
  validarUsuario,
  filtrarJornadas,
  calcularEstadisticas,
  cuentaActiva,
  puedeModificarCuenta,
} from "@mobile/src/utils/usuariosAdmin.js";

export {
  TIPOS_OBJETO,
  ETIQUETA_TIPO_OBJETO,
  ETIQUETA_ESTADO_PRESTAMO,
  LIMITES_PRESTAMO,
  estadoPrestamo,
  contarPrestamos,
  ordenarPrestamos,
  validarPrestamo,
} from "@mobile/src/utils/prestamos.js";

export { esUrlDeBanner, MENSAJE_BANNER } from "@mobile/src/utils/bannerJornada.js";
export { ErrorNegocio, ErrorRed, mensajeDeRed } from "@mobile/src/utils/sincronizacion.js";
export { crearClienteApi, ErrorApi } from "@mobile/src/services/apiClientCore.js";

// ---- Tipos de los datos (los mismos documentos que lee y escribe la app móvil) ----

export type EstadoJornada = "activa" | "en_curso" | "cancelada" | "finalizada";

export interface Jornada {
  id: string;
  titulo: string;
  descripcion?: string;
  entidad?: string;
  responsable?: string;
  lugar?: string;
  categoria?: string;
  bannerUrl?: string;
  /** Inicio, en milisegundos epoch (null si falta) */
  fecha: number | null;
  duracionMin: number;
  cuposTotales: number;
  cuposOcupados: number;
  activa: boolean;
  asistenciaTodaJornada?: boolean;
  creadoPor?: string;
}

export interface Inscripcion {
  id: string;
  jornadaId: string;
  tituloJornada?: string;
  fechaJornada: number | null;
  asistio: boolean;
}

export interface Inscrito {
  id: string;
  userId: string;
  nombreUsuario: string;
  emailUsuario: string;
  inscritoEn: number | null;
  asistio: boolean;
  metodoAsistencia: "qr" | "manual" | null;
}

export interface Usuario {
  id: string;
  nombre?: string;
  email?: string;
  rol: Rol;
  activo?: boolean;
}

export interface Notificacion {
  id: string;
  userId: string;
  jornadaId?: string;
  tipo?: "cancelacion" | "eliminacion" | "reprogramacion" | "reactivacion" | "actualizacion";
  titulo: string;
  mensaje: string;
  leida?: boolean;
  creadaEn: number;
}

export interface Prestamo {
  id: string;
  codigo: string;
  nombre: string;
  tipo: "libro" | "equipo" | "material";
  vence: number;
  devueltoEn?: number | null;
  activo?: boolean;
  nota?: string;
  nombreUsuario?: string;
  emailUsuario?: string;
}

export interface RegistroAuditoria {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle: string;
  actorId: string;
  actorNombre: string;
  creadaEn: number | null;
}

export interface Estadisticas {
  totalUsuarios: number;
  estudiantes: number;
  gestores: number;
  administradores: number;
  cuentasInactivas: number;
  totalJornadas: number;
  porEstado: Record<EstadoJornada, number>;
  porEspacio: Record<string, number>;
  porGestor: Record<string, number>;
  porGestorNombre?: { id: string; nombre: string; jornadas: number }[];
  /** Jornadas por mes ("YYYY-MM"); una API desactualizada puede no enviarlo */
  porMes?: Record<string, number>;
  cuposTotales: number;
  cuposOcupados: number;
  ocupacion: number;
}
