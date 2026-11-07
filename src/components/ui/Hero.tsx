import type { ReactNode } from "react";

function saludoSegunHora() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Cabecera de bienvenida de cada rol (equivale al SaludoHeader de la app móvil). */
export function Hero({ nombre, etiqueta, texto, children }: { nombre: string; etiqueta?: string; texto: string; children?: ReactNode }) {
  const primerNombre = nombre.trim().split(" ")[0] || "Usuario";
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark p-6 text-white shadow-card sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/[0.07]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 right-24 size-56 rounded-full bg-accent/20" aria-hidden />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          {etiqueta && <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">{etiqueta}</span>}
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {saludoSegunHora()}, <span className="text-accent">{primerNombre}</span>
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/85">{texto}</p>
        </div>
        {children && <div className="relative">{children}</div>}
      </div>
    </section>
  );
}
