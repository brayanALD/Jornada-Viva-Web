import { ArrowLeft, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ETIQUETA_ROL, ROLES, validarUsuario, type Rol } from "@/core";
import { Button } from "@/components/ui/Button";
import { Aviso, useToast } from "@/components/ui/Feedback";
import { Input, Select } from "@/components/ui/Form";
import { Card, PageHeader } from "@/components/ui/Misc";
import { crearUsuario } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";
import { useTitulo } from "@/lib/hooks";

export default function UsuarioFormPage() {
  useTitulo("Crear cuenta");
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ nombre: "", correo: "", clave: "", rol: ROLES.ESTUDIANTE as Rol });
  const [errores, setErrores] = useState<Record<string, string | undefined>>({});
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: keyof typeof form, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const { errores: nuevos, datos } = validarUsuario(form) as { errores: Record<string, string>; datos: { nombre: string; correo: string; clave: string; rol: Rol } | null };
    setErrores(nuevos);
    if (!datos) return;
    setGuardando(true);
    try {
      const { id } = await crearUsuario(datos);
      toast.exito(`${datos.correo} ya puede iniciar sesión como ${ETIQUETA_ROL[datos.rol]}.`);
      navigate(`/usuarios/${id}`, { replace: true });
    } catch (err) {
      const e2 = err as { code?: string; codigoApi?: string };
      toast.error(e2.codigoApi === "EMAIL_EN_USO" || e2.code === "email-already-in-use" ? "Ya existe una cuenta con ese correo." : mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/usuarios" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Usuarios
      </Link>
      <PageHeader titulo="Crear cuenta" descripcion="Crea una cuenta de acceso con el rol indicado. La persona podrá iniciar sesión de inmediato." />
      <Card className="p-5 sm:p-6">
        <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Input className="sm:col-span-2" etiqueta="Nombre completo" obligatorio icono={<UserRound className="size-4" />} value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} error={errores.nombre} autoFocus />
          <Input className="sm:col-span-2" etiqueta="Correo electrónico" obligatorio type="email" icono={<Mail className="size-4" />} value={form.correo} onChange={(e) => cambiar("correo", e.target.value)} error={errores.correo} />
          <Input etiqueta="Contraseña inicial" obligatorio type="password" autoComplete="new-password" icono={<Lock className="size-4" />} value={form.clave} onChange={(e) => cambiar("clave", e.target.value)} error={errores.clave} ayuda="Mínimo 6 caracteres." />
          <Select etiqueta="Rol y permisos" obligatorio value={form.rol} onChange={(e) => cambiar("rol", e.target.value)} error={errores.rol} opciones={Object.values(ROLES).map((r) => ({ valor: r as string, etiqueta: ETIQUETA_ROL[r as Rol] }))} />
          {form.rol !== ROLES.ESTUDIANTE && (
            <Aviso tipo="alerta" className="sm:col-span-2">
              <ShieldCheck className="mr-1 inline size-4" aria-hidden />
              Este rol tiene permisos ampliados: {form.rol === ROLES.GESTOR ? "administrará jornadas, inscritos y préstamos." : "podrá administrar cuentas, jornadas, reportes y auditoría."}
            </Aviso>
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button variante="secondary" onClick={() => navigate(-1)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" cargando={guardando}>
              Crear cuenta
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
