import { CalendarCheck, QrCode, Users } from "lucide-react";
import type { ReactNode } from "react";
import logoTdea from "@mobile/assets/Horizontal-tdea.png";

const PUNTOS = [
  { icono: CalendarCheck, texto: "Descubre las jornadas de tu comunidad e inscríbete en segundos." },
  { icono: QrCode, texto: "Registra tu asistencia escaneando el código QR de la jornada." },
  { icono: Users, texto: "Organiza jornadas, controla cupos y descarga tus planillas." },
];

/** Marco de las pantallas de acceso: panel de marca a la izquierda y formulario a la derecha. */
export function AuthLayout({ titulo, subtitulo, children, pie }: { titulo: string; subtitulo: string; children: ReactNode; pie: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-dark p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/[0.07]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-accent/20" aria-hidden />
        <div className="pointer-events-none absolute bottom-24 right-16 size-40 rounded-full border-[18px] border-white/10" aria-hidden />

        <span className="relative grid h-12 w-28 place-items-center rounded-2xl bg-white px-3 shadow-lg">
          <img src={logoTdea} alt="Institución Universitaria Tecnológico de Antioquia" className="h-6 w-auto" />
        </span>

        <div className="relative max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
            Jornada <span className="text-accent">Viva</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/85">La plataforma de jornadas y bienestar de tu institución, ahora también en la web.</p>
          <ul className="mt-10 space-y-5">
            {PUNTOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icono className="size-5" aria-hidden />
                </span>
                <span className="pt-1.5 text-[15px] leading-snug text-white/90">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">Mismos datos que la app móvil: lo que hagas aquí se ve allá al instante.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[26rem]">
          <span className="mx-auto mb-8 grid h-12 w-28 place-items-center rounded-2xl bg-white px-3 shadow-card lg:hidden">
            <img src={logoTdea} alt="TdeA" className="h-6 w-auto" />
          </span>
          <h2 className="text-3xl font-extrabold text-ink">{titulo}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitulo}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-sm text-muted">{pie}</p>
        </div>
      </main>
    </div>
  );
}
