import { Bell, LogOut, Menu, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import logoTdea from "@mobile/assets/Horizontal-tdea.png";
import { ETIQUETA_ROL } from "@/core";
import { cn } from "@/lib/cn";
import { useEnLinea } from "@/lib/hooks";
import { Avatar } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { useNotificaciones } from "@/features/notificaciones/NotificacionesContext";
import { NAVEGACION, type ItemNav } from "./navegacion";

function Marca({ claro }: { claro?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Jornada Viva, ir al inicio">
      <span className="grid h-10 w-[4.5rem] shrink-0 place-items-center rounded-xl bg-white px-2 shadow-sm">
        <img src={logoTdea} alt="TdeA" className="h-5 w-auto" />
      </span>
      <span className={cn("text-lg font-extrabold tracking-tight", claro ? "text-white" : "text-ink")}>Jornada Viva</span>
    </Link>
  );
}

function Contador({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span className={cn("grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold leading-5 text-white", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

function EnlaceLateral({ item, noLeidas }: { item: ItemNav; noLeidas: number }) {
  const Icono = item.icono;
  return (
    <NavLink
      to={item.ruta}
      end={!item.prefijo}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
          isActive ? "bg-white text-primary shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"
        )
      }
    >
      <Icono className="size-5 shrink-0" aria-hidden />
      <span className="flex-1">{item.etiqueta}</span>
      {item.avisos && <Contador n={noLeidas} />}
    </NavLink>
  );
}

export function AppShell() {
  const { rol, nombre, cerrarSesion } = useAuth();
  const { noLeidas } = useNotificaciones();
  const enLinea = useEnLinea();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const items = NAVEGACION[rol];
  const itemsMovil = items.filter((i) => i.movil).slice(0, 5);

  useEffect(() => {
    setMenuAbierto(false);
    window.scrollTo({ top: 0 });
  }, [ubicacion.pathname]);

  const usuarioTarjeta = (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
      <Avatar nombre={nombre} tamano={38} className="ring-2 ring-white/30" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{nombre}</p>
        <p className="truncate text-xs text-white/70">{ETIQUETA_ROL[rol]}</p>
      </div>
      <button
        onClick={() => void cerrarSesion()}
        className="grid size-9 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="size-[18px]" />
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-72">
      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-gradient-to-b from-primary to-primary-dark p-5 lg:flex">
        <Marca claro />
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Principal">
          {items.map((item) => (
            <EnlaceLateral key={item.ruta} item={item} noLeidas={noLeidas} />
          ))}
        </nav>
        {usuarioTarjeta}
      </aside>

      {/* Cabecera (móvil y tablet) */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-primary px-3 text-white shadow-md lg:hidden">
        <button onClick={() => setMenuAbierto(true)} className="grid size-10 place-items-center rounded-xl hover:bg-white/10" aria-label="Abrir menú">
          <Menu className="size-6" />
        </button>
        <Marca claro />
        <div className="flex-1" />
        {rol === "estudiante" && (
          <Link to="/avisos" className="relative grid size-10 place-items-center rounded-xl hover:bg-white/10" aria-label={`Avisos${noLeidas ? `, ${noLeidas} sin leer` : ""}`}>
            <Bell className="size-5" />
            <Contador n={noLeidas} className="absolute -right-0.5 -top-0.5" />
          </Link>
        )}
      </header>

      {!enLinea && (
        <div role="status" className="flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-[13px] font-semibold text-white">
          <WifiOff className="size-4" aria-hidden />
          Sin conexión: los cambios que hagas no se enviarán hasta que vuelva internet.
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <Outlet />
      </main>

      {/* Barra inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Principal">
        <ul className="mx-auto flex max-w-xl">
          {itemsMovil.map((item) => {
            const Icono = item.icono;
            return (
              <li key={item.ruta} className="flex-1">
                <NavLink
                  to={item.ruta}
                  end={!item.prefijo}
                  className={({ isActive }) =>
                    cn("relative flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-bold transition-colors", isActive ? "text-primary" : "text-faint")
                  }
                >
                  <span className="relative">
                    <Icono className="size-[22px]" aria-hidden />
                    {item.avisos && <Contador n={noLeidas} className="absolute -right-2.5 -top-1.5 min-w-4 px-1 text-[10px] leading-4" />}
                  </span>
                  {item.etiqueta}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Menú completo (móvil) */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 animate-fade bg-ink/50" onClick={() => setMenuAbierto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] animate-slide flex-col bg-gradient-to-b from-primary to-primary-dark p-5">
            <div className="flex items-center justify-between">
              <Marca claro />
              <button onClick={() => setMenuAbierto(false)} className="grid size-9 place-items-center rounded-lg text-white hover:bg-white/10" aria-label="Cerrar menú">
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
              {items.map((item) => (
                <EnlaceLateral key={item.ruta} item={item} noLeidas={noLeidas} />
              ))}
            </nav>
            {usuarioTarjeta}
          </div>
        </div>
      )}
    </div>
  );
}
