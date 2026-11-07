import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "@/lib/cn";

type Variante = "primary" | "secondary" | "ghost" | "danger" | "soft" | "accent";
type Tamano = "sm" | "md" | "lg";

const VARIANTES: Record<Variante, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20",
  accent: "bg-accent text-ink hover:brightness-95 shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:bg-canvas hover:border-faint",
  soft: "bg-primary-pale text-primary hover:bg-primary/15",
  ghost: "text-muted hover:bg-primary-pale hover:text-primary",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm shadow-danger/20",
};
const TAMANOS: Record<Tamano, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
};

const base =
  "inline-flex items-center justify-center font-semibold transition-all select-none whitespace-nowrap " +
  "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  icono?: ReactNode;
  bloque?: boolean;
}

export function Button({ variante = "primary", tamano = "md", cargando, icono, bloque, className, children, disabled, ...resto }: PropsBoton) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      className={cn(base, VARIANTES[variante], TAMANOS[tamano], bloque && "w-full", className)}
      {...resto}
    >
      {cargando ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icono}
      {children}
    </button>
  );
}

interface PropsEnlace extends LinkProps {
  variante?: Variante;
  tamano?: Tamano;
  icono?: ReactNode;
  bloque?: boolean;
}

export function ButtonLink({ variante = "primary", tamano = "md", icono, bloque, className, children, ...resto }: PropsEnlace) {
  return (
    <Link className={cn(base, VARIANTES[variante], TAMANOS[tamano], bloque && "w-full", className)} {...resto}>
      {icono}
      {children}
    </Link>
  );
}
