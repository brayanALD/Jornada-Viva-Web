import { ChevronRight, UserPlus, UserSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ETIQUETA_ROL, ROLES, cuentaActiva, filtrarUsuarios, type Rol, type Usuario } from "@/core";
import { ButtonLink } from "@/components/ui/Button";
import { Cargando, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { SearchInput, Segmented, Select } from "@/components/ui/Form";
import { Avatar, Card, Chip, PageHeader } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

export const TONO_ROL: Record<Rol, "primary" | "warning" | "neutral"> = { estudiante: "neutral", gestor: "primary", administrador: "warning" };

type FiltroRol = "todos" | Rol;

export default function UsuariosPage() {
  useTitulo("Usuarios");
  const { usuario: yo } = useAuth();
  const [params, setParams] = useSearchParams();
  const rol = (params.get("rol") as FiltroRol) || "todos";
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("todos");

  const { datos, cargando, error, reintentar } = useRecursoApi<Usuario[], { usuarios: Usuario[] }>("/v1/admin/usuarios", { extraer: (r) => r.usuarios, refrescoMs: 30000 });

  const lista = useMemo(() => filtrarUsuarios(datos ?? [], { texto, rol, estado }) as Usuario[], [datos, texto, rol, estado]);
  const conteo = useMemo(() => {
    const c = { todos: datos?.length ?? 0, estudiante: 0, gestor: 0, administrador: 0 };
    (datos ?? []).forEach((u) => (c[u.rol] += 1));
    return c;
  }, [datos]);

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        descripcion="Cuentas de alumnos, gestores de jornadas y administradores."
        acciones={
          <ButtonLink to="/usuarios/nuevo" icono={<UserPlus className="size-4" />}>
            Crear cuenta
          </ButtonLink>
        }
      />

      <div className="mb-5 space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Segmented
            valor={rol}
            onCambiar={(v) => setParams(v === "todos" ? {} : { rol: v })}
            opciones={[
              { valor: "todos", etiqueta: "Todos", conteo: conteo.todos },
              { valor: ROLES.ESTUDIANTE, etiqueta: "Alumnos", conteo: conteo.estudiante },
              { valor: ROLES.GESTOR, etiqueta: "Gestores", conteo: conteo.gestor },
              { valor: ROLES.ADMINISTRADOR, etiqueta: "Administradores", conteo: conteo.administrador },
            ]}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
          <SearchInput valor={texto} onCambiar={setTexto} placeholder="Buscar por nombre o correo…" />
          <Select
            aria-label="Estado de la cuenta"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            opciones={[
              { valor: "todos", etiqueta: "Todas las cuentas" },
              { valor: "activos", etiqueta: "Solo activas" },
              { valor: "inactivos", etiqueta: "Solo inactivas" },
            ]}
          />
        </div>
      </div>

      {cargando ? (
        <Cargando etiqueta="Cargando usuarios">
          <Card className="divide-y divide-line overflow-hidden">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="size-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </Card>
        </Cargando>
      ) : error ? (
        <ErrorState mensaje={error} alReintentar={reintentar} />
      ) : lista.length === 0 ? (
        <EmptyState icono={<UserSearch className="size-7" />} titulo="No hay usuarios con esos criterios" texto="Prueba con otra búsqueda o cambia los filtros." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {lista.map((u) => {
              const activa = cuentaActiva(u);
              return (
                <li key={u.id}>
                  <Link to={`/usuarios/${u.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5">
                    <Avatar nombre={u.nombre || u.email} tamano={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">
                        {u.nombre || "Sin nombre"}
                        {u.id === yo?.uid && <span className="ml-2 text-xs font-semibold text-muted">(tú)</span>}
                      </p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                    {!activa && <Chip tono="danger">Inactiva</Chip>}
                    <Chip tono={TONO_ROL[u.rol]} className="hidden sm:inline-flex">
                      {ETIQUETA_ROL[u.rol]}
                    </Chip>
                    <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
