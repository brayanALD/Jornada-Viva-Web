import { CircleAlert, Eye, EyeOff, Search, X } from "lucide-react";
import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const campoBase =
  "w-full rounded-xl border bg-surface px-3.5 text-sm text-ink placeholder:text-faint transition-colors " +
  "focus:border-primary-light focus:outline-none focus:ring-4 focus:ring-primary-light/15 disabled:bg-canvas disabled:text-muted";

interface PropsCampo {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
  contador?: string;
  obligatorio?: boolean;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

/** Etiqueta + control + mensaje de error accesible. */
export function Field({ etiqueta, error, ayuda, contador, obligatorio, className, children }: PropsCampo) {
  const id = useId();
  const idMensaje = `${id}-msg`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(etiqueta || contador) && (
        <div className="flex items-baseline justify-between gap-2">
          {etiqueta && (
            <label htmlFor={id} className="text-[13px] font-semibold text-ink">
              {etiqueta}
              {obligatorio && <span className="text-danger"> *</span>}
            </label>
          )}
          {contador && <span className="text-xs text-faint tabular-nums">{contador}</span>}
        </div>
      )}
      {children({ id, "aria-invalid": !!error, "aria-describedby": error || ayuda ? idMensaje : undefined })}
      {error ? (
        <p id={idMensaje} role="alert" className="flex items-center gap-1 text-xs font-medium text-danger">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden /> {error}
        </p>
      ) : (
        ayuda && (
          <p id={idMensaje} className="text-xs text-muted">
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}

interface PropsInput extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
  contador?: string;
  obligatorio?: boolean;
  icono?: ReactNode;
}

export function Input({ etiqueta, error, ayuda, contador, obligatorio, icono, className, type, ...resto }: PropsInput) {
  const [visible, setVisible] = useState(false);
  const esClave = type === "password";
  return (
    <Field etiqueta={etiqueta} error={error} ayuda={ayuda} contador={contador} obligatorio={obligatorio} className={className}>
      {(a11y) => (
        <div className="relative">
          {icono && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">{icono}</span>}
          <input
            {...a11y}
            type={esClave && visible ? "text" : type}
            className={cn(campoBase, "h-11", error ? "border-danger" : "border-line", icono && "pl-10", esClave && "pr-11")}
            {...resto}
          />
          {esClave && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-canvas"
              aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>
      )}
    </Field>
  );
}

interface PropsTextarea extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
  contador?: string;
  obligatorio?: boolean;
}

export function Textarea({ etiqueta, error, ayuda, contador, obligatorio, className, ...resto }: PropsTextarea) {
  return (
    <Field etiqueta={etiqueta} error={error} ayuda={ayuda} contador={contador} obligatorio={obligatorio} className={className}>
      {(a11y) => (
        <textarea {...a11y} className={cn(campoBase, "min-h-28 resize-y py-3", error ? "border-danger" : "border-line")} {...resto} />
      )}
    </Field>
  );
}

interface PropsSelect extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
  obligatorio?: boolean;
  opciones: { valor: string; etiqueta: string }[];
  placeholder?: string;
}

export function Select({ etiqueta, error, ayuda, obligatorio, opciones, placeholder, className, ...resto }: PropsSelect) {
  return (
    <Field etiqueta={etiqueta} error={error} ayuda={ayuda} obligatorio={obligatorio} className={className}>
      {(a11y) => (
        <select
          {...a11y}
          className={cn(campoBase, "h-11 appearance-none bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10", error ? "border-danger" : "border-line")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a7070' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
          {...resto}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function SearchInput({ valor, onCambiar, placeholder = "Buscar…", className }: { valor: string; onCambiar: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(campoBase, "h-11 border-line pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden")}
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambiar("")}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-canvas"
          aria-label="Limpiar búsqueda"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function Switch({ marcado, onCambiar, etiqueta, descripcion }: { marcado: boolean; onCambiar: (v: boolean) => void; etiqueta: string; descripcion?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={marcado}
      onClick={() => onCambiar(!marcado)}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-faint"
    >
      <span className={cn("mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors", marcado ? "bg-primary" : "bg-line")}>
        <span className={cn("size-5 rounded-full bg-white shadow transition-transform", marcado && "translate-x-5")} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{etiqueta}</span>
        {descripcion && <span className="mt-0.5 block text-xs text-muted">{descripcion}</span>}
      </span>
    </button>
  );
}

/** Selector segmentado (pestañas compactas), p. ej. «Inscritas / Asistidas». */
export function Segmented<T extends string>({ valor, onCambiar, opciones, className }: { valor: T; onCambiar: (v: T) => void; opciones: { valor: T; etiqueta: string; conteo?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex rounded-xl bg-line/60 p-1", className)}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          role="tab"
          aria-selected={valor === o.valor}
          onClick={() => onCambiar(o.valor)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all",
            valor === o.valor ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
          )}
        >
          {o.etiqueta}
          {o.conteo !== undefined && (
            <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", valor === o.valor ? "bg-primary-pale text-primary" : "bg-line text-muted")}>{o.conteo}</span>
          )}
        </button>
      ))}
    </div>
  );
}
