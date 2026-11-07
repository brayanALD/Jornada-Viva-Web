import {
  Bell,
  CalendarDays,
  ChartColumn,
  House,
  Library,
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLES, type Rol } from "@/core";

export interface ItemNav {
  ruta: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Aparece en la barra inferior del móvil (máximo 5 por rol) */
  movil?: boolean;
  /** Coincide también con sus rutas hijas */
  prefijo?: boolean;
  /** Muestra el contador de avisos sin leer */
  avisos?: boolean;
}

// Mismas secciones que la app móvil para cada rol, reorganizadas para la web
export const NAVEGACION: Record<Rol, ItemNav[]> = {
  [ROLES.ESTUDIANTE]: [
    { ruta: "/", etiqueta: "Inicio", icono: House, movil: true },
    { ruta: "/mis-jornadas", etiqueta: "Mis jornadas", icono: CalendarDays, movil: true },
    { ruta: "/prestamos", etiqueta: "Préstamos", icono: Library, movil: true, prefijo: true },
    { ruta: "/avisos", etiqueta: "Avisos", icono: Bell, movil: true, avisos: true },
    { ruta: "/perfil", etiqueta: "Mi perfil", icono: UserRound, movil: true },
  ],
  [ROLES.GESTOR]: [
    { ruta: "/", etiqueta: "Inicio", icono: House, movil: true },
    { ruta: "/jornadas/nueva", etiqueta: "Crear jornada", icono: PlusCircle, movil: true },
    { ruta: "/prestamos", etiqueta: "Préstamos", icono: Library, movil: true, prefijo: true },
    { ruta: "/perfil", etiqueta: "Mi perfil", icono: UserRound, movil: true },
  ],
  [ROLES.ADMINISTRADOR]: [
    { ruta: "/", etiqueta: "Panel", icono: LayoutDashboard, movil: true },
    { ruta: "/jornadas", etiqueta: "Jornadas", icono: CalendarDays, movil: true, prefijo: true },
    { ruta: "/usuarios", etiqueta: "Usuarios", icono: Users, movil: true, prefijo: true },
    { ruta: "/prestamos", etiqueta: "Préstamos", icono: Library, prefijo: true },
    { ruta: "/reportes", etiqueta: "Reportes", icono: ChartColumn, movil: true },
    { ruta: "/auditoria", etiqueta: "Auditoría", icono: ShieldCheck },
    { ruta: "/perfil", etiqueta: "Mi perfil", icono: UserRound, movil: true },
  ],
};
