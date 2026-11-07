import { Lock, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { Aviso } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Form";
import { mensajeDeAuth, useAuth } from "@/features/auth/AuthContext";
import { useTitulo } from "@/lib/hooks";
import { AuthLayout } from "./AuthLayout";

export default function RegisterPage() {
  useTitulo("Crear cuenta");
  const { registrar } = useAuth();
  const [form, setForm] = useState({ nombre: "", email: "", clave: "", confirmar: "" });
  const [errores, setErrores] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cambiar = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const nuevos: typeof errores = {};
    if (!form.nombre.trim()) nuevos.nombre = "Escribe tu nombre.";
    if (!form.email.trim()) nuevos.email = "Escribe tu correo electrónico.";
    if (!form.clave) nuevos.clave = "Escribe una contraseña.";
    else if (form.clave.length < 6) nuevos.clave = "La contraseña debe tener mínimo 6 caracteres.";
    if (!form.confirmar) nuevos.confirmar = "Confirma tu contraseña.";
    else if (form.confirmar !== form.clave) nuevos.confirmar = "Las contraseñas no coinciden.";
    setErrores(nuevos);
    setError(null);
    if (Object.keys(nuevos).length) return;

    setCargando(true);
    try {
      await registrar(form.nombre.trim(), form.email.trim(), form.clave);
    } catch (err) {
      setError(mensajeDeAuth(err, "registrar"));
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthLayout
      titulo="Crea tu cuenta"
      subtitulo="Regístrate para inscribirte en las jornadas y registrar tu asistencia."
      pie={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/ingresar" className="font-bold text-primary hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <Input etiqueta="Nombre completo" autoComplete="name" placeholder="Tu nombre" value={form.nombre} onChange={cambiar("nombre")} error={errores.nombre} icono={<UserRound className="size-4" />} autoFocus />
        <Input etiqueta="Correo electrónico" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={form.email} onChange={cambiar("email")} error={errores.email} icono={<Mail className="size-4" />} />
        <Input etiqueta="Contraseña" type="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={form.clave} onChange={cambiar("clave")} error={errores.clave} icono={<Lock className="size-4" />} />
        <Input etiqueta="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="Repite tu contraseña" value={form.confirmar} onChange={cambiar("confirmar")} error={errores.confirmar} icono={<Lock className="size-4" />} />
        <Button type="submit" tamano="lg" cargando={cargando} bloque className="mt-1">
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  );
}
