import { Mail, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { Aviso } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Form";
import { mensajeDeAuth, useAuth } from "@/features/auth/AuthContext";
import { useTitulo } from "@/lib/hooks";
import { AuthLayout } from "./AuthLayout";

export default function LoginPage() {
  useTitulo("Ingresar");
  const { iniciarSesion, cuentaDesactivada, descartarAvisoDesactivada } = useAuth();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<{ email?: string; clave?: string }>({});

  useEffect(() => () => descartarAvisoDesactivada(), [descartarAvisoDesactivada]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const nuevos = {
      email: email.trim() ? undefined : "Escribe tu correo electrónico.",
      clave: clave ? undefined : "Escribe tu contraseña.",
    };
    setErrores(nuevos);
    setError(null);
    if (nuevos.email || nuevos.clave) return;

    setCargando(true);
    try {
      await iniciarSesion(email.trim(), clave);
    } catch (err) {
      setError(mensajeDeAuth(err, "ingresar"));
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthLayout
      titulo="Bienvenido de nuevo"
      subtitulo="Accede para ver y registrarte en las jornadas de tu comunidad."
      pie={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link to="/registro" className="font-bold text-primary hover:underline">
            Regístrate aquí
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
        {cuentaDesactivada && (
          <Aviso tipo="alerta">
            <strong>Cuenta desactivada.</strong> Un administrador desactivó tu cuenta. Comunícate con la institución si crees que es un error.
          </Aviso>
        )}
        {error && <Aviso tipo="error">{error}</Aviso>}
        <Input
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errores.email}
          icono={<Mail className="size-4" />}
          autoFocus
        />
        <Input
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={errores.clave}
          icono={<Lock className="size-4" />}
        />
        <Button type="submit" tamano="lg" cargando={cargando} bloque>
          Ingresar
        </Button>
      </form>
    </AuthLayout>
  );
}
