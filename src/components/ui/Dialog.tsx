import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface PropsDialogo {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: string;
  descripcion?: string;
  children: ReactNode;
  ancho?: "sm" | "md" | "lg";
  /** Evita cerrar con Escape o clic fuera (p. ej. mientras se guarda) */
  bloqueado?: boolean;
}

/** Diálogo modal sobre el elemento nativo <dialog>: foco atrapado, Escape y lector de pantalla gratis. */
export function Dialog({ abierto, alCerrar, titulo, descripcion, children, ancho = "md", bloqueado }: PropsDialogo) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!bloqueado) alCerrar();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !bloqueado) alCerrar();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-3xl border-0 bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]",
        "open:animate-pop",
        ancho === "sm" && "max-w-sm",
        ancho === "md" && "max-w-md",
        ancho === "lg" && "max-w-2xl"
      )}
      aria-labelledby={titulo ? "dialogo-titulo" : undefined}
    >
      {abierto && (
        <div className="flex max-h-[85dvh] flex-col">
          {(titulo || descripcion) && (
            <header className="flex items-start gap-3 px-6 pt-6">
              <div className="min-w-0 flex-1">
                {titulo && (
                  <h2 id="dialogo-titulo" className="text-lg font-extrabold">
                    {titulo}
                  </h2>
                )}
                {descripcion && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{descripcion}</p>}
              </div>
              <button
                onClick={alCerrar}
                disabled={bloqueado}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </header>
          )}
          <div className="overflow-y-auto px-6 pb-6 pt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

// ---- Confirmaciones (equivalen a los Alert.alert de dos botones de la app móvil) ----

interface OpcionesConfirmar {
  titulo: string;
  mensaje?: string;
  confirmar?: string;
  cancelar?: string;
  peligro?: boolean;
}

const ConfirmContext = createContext<((o: OpcionesConfirmar) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<(OpcionesConfirmar & { resolver: (v: boolean) => void }) | null>(null);

  const confirmar = useCallback(
    (opciones: OpcionesConfirmar) => new Promise<boolean>((resolver) => setPendiente({ ...opciones, resolver })),
    []
  );

  const responder = (valor: boolean) => {
    pendiente?.resolver(valor);
    setPendiente(null);
  };

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <Dialog abierto={!!pendiente} alCerrar={() => responder(false)} titulo={pendiente?.titulo} descripcion={pendiente?.mensaje} ancho="sm">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variante="secondary" onClick={() => responder(false)}>
            {pendiente?.cancelar ?? "Cancelar"}
          </Button>
          <Button variante={pendiente?.peligro ? "danger" : "primary"} onClick={() => responder(true)} autoFocus>
            {pendiente?.confirmar ?? "Confirmar"}
          </Button>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
  return ctx;
}
