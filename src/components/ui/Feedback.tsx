import { CircleCheck, CircleX, Info, TriangleAlert, WifiOff, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

/** Bloque gris animado. Cada pantalla arma su skeleton con la forma exacta de lo que va a mostrar. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-skeleton rounded-lg bg-line/80", className)} aria-hidden />;
}

/** Envuelve un skeleton para que los lectores de pantalla anuncien un solo «cargando». */
export function Cargando({ etiqueta = "Cargando", children, className }: { etiqueta?: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={etiqueta} className={className}>
      {children}
    </div>
  );
}

export function EmptyState({ icono, titulo, texto, accion }: { icono: ReactNode; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary-pale text-primary">{icono}</div>
      <h3 className="text-base font-bold text-ink">{titulo}</h3>
      {texto && <p className="max-w-sm text-sm leading-relaxed text-muted">{texto}</p>}
      {accion && <div className="mt-1">{accion}</div>}
    </div>
  );
}

export function ErrorState({ mensaje, alReintentar }: { mensaje: string; alReintentar?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card border border-danger/25 bg-danger-pale px-6 py-12 text-center">
      <TriangleAlert className="size-9 text-danger" aria-hidden />
      <p className="max-w-md text-sm font-medium text-danger">{mensaje}</p>
      {alReintentar && (
        <Button variante="secondary" tamano="sm" onClick={alReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Aviso({ tipo = "info", children, className }: { tipo?: "info" | "error" | "exito" | "alerta" | "sinRed"; children: ReactNode; className?: string }) {
  const estilos = {
    info: "border-primary-light/25 bg-primary-pale text-primary-dark",
    error: "border-danger/25 bg-danger-pale text-danger",
    exito: "border-success/25 bg-success-pale text-success",
    alerta: "border-accent/40 bg-accent-pale text-[#8a5a00]",
    sinRed: "border-line bg-canvas text-muted",
  }[tipo];
  const Icono = { info: Info, error: CircleX, exito: CircleCheck, alerta: TriangleAlert, sinRed: WifiOff }[tipo];
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium", estilos, className)}>
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

// ---- Avisos emergentes (toasts) ----

type TipoToast = "exito" | "error" | "info";
interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}
interface ContextoToast {
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
}

const ToastContext = createContext<ContextoToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const contador = useRef(0);

  const quitar = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const mostrar = useCallback(
    (tipo: TipoToast, mensaje: string) => {
      const id = ++contador.current;
      setToasts((t) => [...t.slice(-3), { id, tipo, mensaje }]);
      setTimeout(() => quitar(id), tipo === "error" ? 7000 : 4200);
    },
    [quitar]
  );

  const valor = useMemo<ContextoToast>(
    () => ({
      exito: (m) => mostrar("exito", m),
      error: (m) => mostrar("error", m),
      info: (m) => mostrar("info", m),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {toasts.map((t) => {
          const Icono = t.tipo === "exito" ? CircleCheck : t.tipo === "error" ? CircleX : Info;
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-md animate-pop items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-pop",
                t.tipo === "exito" && "bg-primary",
                t.tipo === "error" && "bg-danger",
                t.tipo === "info" && "bg-ink"
              )}
              role={t.tipo === "error" ? "alert" : "status"}
            >
              <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="flex-1 leading-relaxed">{t.mensaje}</span>
              <button onClick={() => quitar(t.id)} className="grid size-5 place-items-center rounded opacity-80 hover:opacity-100" aria-label="Cerrar aviso">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
