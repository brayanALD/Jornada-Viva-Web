import { CalendarPlus } from "lucide-react";
import type { Usuario } from "@/core";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Misc";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { ListaGestionJornadas } from "@/features/jornadas/ListaGestion";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

export default function JornadasAdminPage() {
  useTitulo("Jornadas");
  const { jornadas, cargando, error, ahora } = useJornadas();
  const usuarios = useRecursoApi<Usuario[], { usuarios: Usuario[] }>("/v1/admin/usuarios", { extraer: (r) => r.usuarios });

  return (
    <>
      <PageHeader
        titulo="Jornadas"
        descripcion="Todas las jornadas de la plataforma: consulta, crea y administra cualquiera de ellas."
        acciones={
          <ButtonLink to="/jornadas/nueva" icono={<CalendarPlus className="size-4" />}>
            Crear jornada
          </ButtonLink>
        }
      />
      <ListaGestionJornadas jornadas={jornadas} ahora={ahora} cargando={cargando} error={error} admin gestores={usuarios.datos ?? []} />
    </>
  );
}
