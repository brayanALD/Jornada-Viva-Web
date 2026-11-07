import { ArrowLeft, CalendarClock, ClipboardList, Lock, MapPin, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  CATEGORIAS,
  DURACION_SUGERIDA,
  ENTIDAD_POR_DEFECTO,
  ESPACIOS,
  LIMITES,
  aDayjsNegocio,
  categoriaDeJornada,
  combinarFechaHora,
  descomponerFecha,
  esDuracionValida,
  esUrlDeBanner,
  espaciosOcupados,
  formatearDuracion,
  formatearHora,
  listaCorta,
  nuevaClaveCreacion,
  permisosJornada,
  puedeSerResponsable,
  validarJornada,
  type Jornada,
  type Usuario,
} from "@/core";
import { Button } from "@/components/ui/Button";
import { Aviso, Cargando, EmptyState, Skeleton, useToast } from "@/components/ui/Feedback";
import { Input, Select, Switch, Textarea } from "@/components/ui/Form";
import { Card, PageHeader } from "@/components/ui/Misc";
import { useAuth } from "@/features/auth/AuthContext";
import { useJornadas } from "@/features/jornadas/JornadasContext";
import { JornadaCard } from "@/features/jornadas/componentes";
import { crearJornada, editarJornada } from "@/features/servicios";
import { mensajeDeError } from "@/lib/api";
import { useRecursoApi, useTitulo } from "@/lib/hooks";

const DURACIONES_RAPIDAS = [30, 60, 90, 120, 180];
const OTRA = "__otra__";

interface Formulario {
  titulo: string;
  descripcion: string;
  entidad: string;
  responsable: string;
  lugar: string;
  dia: string;
  hora: string;
  duracionMin: string;
  cuposTotales: string;
  asistenciaTodaJornada: boolean;
  categoria: string;
  bannerUrl: string;
}

const FORMULARIO_VACIO = (responsable: string): Formulario => ({
  titulo: "",
  descripcion: "",
  entidad: ENTIDAD_POR_DEFECTO,
  responsable,
  lugar: "",
  dia: "",
  hora: "",
  duracionMin: DURACION_SUGERIDA,
  cuposTotales: "",
  asistenciaTodaJornada: false,
  categoria: "",
  bannerUrl: "",
});

function Seccion({ icono, titulo, subtitulo, children }: { icono: ReactNode; titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-pale text-primary">{icono}</span>
        <div>
          <h2 className="text-base font-extrabold">{titulo}</h2>
          {subtitulo && <p className="text-xs text-muted">{subtitulo}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export default function JornadaFormPage() {
  const { id: jornadaId } = useParams();
  const esEdicion = !!jornadaId;
  useTitulo(esEdicion ? "Editar jornada" : "Crear jornada");
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario, rol, esAdministrador } = useAuth();
  const { jornadas, jornadasPorId, cargando, ahora } = useJornadas();

  const jornada = jornadaId ? jornadasPorId.get(jornadaId) : undefined;
  const permisos = jornada ? permisosJornada({ rol, uid: usuario?.uid, jornada, ahora }) : null;

  // El administrador elige el gestor responsable (solo él puede listar usuarios)
  const usuarios = useRecursoApi<Usuario[], { usuarios: Usuario[] }>("/v1/admin/usuarios", { extraer: (r) => r.usuarios, habilitado: esAdministrador });
  const responsables = useMemo(() => (usuarios.datos ?? []).filter((u) => puedeSerResponsable(u.rol)), [usuarios.datos]);
  const [gestorId, setGestorId] = useState<string>("");

  const [form, setForm] = useState<Formulario>(() => FORMULARIO_VACIO(usuario?.displayName || ""));
  const [errores, setErrores] = useState<Record<string, string | undefined>>({});
  const [guardando, setGuardando] = useState(false);
  const [duracionOtra, setDuracionOtra] = useState(false);
  const inicializado = useRef(false);
  // Un error de conexión no debe duplicar la jornada al reintentar: la clave se repite si no se cambia nada
  const claveCreacion = useRef<string | null>(null);

  // Al editar, el formulario parte de los datos actuales (una sola vez)
  useEffect(() => {
    if (!esEdicion || !jornada || !permisos?.editar || inicializado.current) return;
    inicializado.current = true;
    const { dia, hora } = descomponerFecha(jornada.fecha);
    setGestorId(jornada.creadoPor || "");
    setForm({
      titulo: jornada.titulo || "",
      descripcion: jornada.descripcion || "",
      entidad: jornada.entidad || ENTIDAD_POR_DEFECTO,
      responsable: jornada.responsable || "",
      lugar: jornada.lugar || "",
      dia,
      hora,
      duracionMin: String(jornada.duracionMin ?? DURACION_SUGERIDA),
      cuposTotales: String(jornada.cuposTotales ?? ""),
      asistenciaTodaJornada: jornada.asistenciaTodaJornada === true,
      categoria: categoriaDeJornada(jornada) || "",
      bannerUrl: jornada.bannerUrl || "",
    });
  }, [esEdicion, jornada, permisos?.editar]);

  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    claveCreacion.current = null;
    setForm((f) => ({ ...f, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const inicioMs = combinarFechaHora(form.dia, form.hora) as number | null;
  const duracion = Number(form.duracionMin);
  const duracionValida = /^\d+$/.test(form.duracionMin) && esDuracionValida(duracion);
  const finMs = inicioMs != null && duracionValida ? inicioMs + duracion * 60000 : null;

  // FE-01: espacios que ya tienen una jornada en esa franja (se calcula con todas las jornadas en vivo)
  const ocupados = useMemo(
    () => espaciosOcupados(jornadas, inicioMs, finMs, { excluirId: jornadaId ?? null, ahora }) as Map<string, Jornada[]>,
    [jornadas, inicioMs, finMs, jornadaId, ahora]
  );
  const ocupadosElegido = form.lugar ? ocupados.get(form.lugar) : undefined;

  const previa = useMemo<Jornada>(
    () => ({
      id: "previa",
      titulo: form.titulo.trim() || "Título de la jornada",
      entidad: form.entidad,
      lugar: form.lugar,
      categoria: form.categoria,
      bannerUrl: form.bannerUrl.trim() && esUrlDeBanner(form.bannerUrl.trim()) ? form.bannerUrl.trim() : undefined,
      fecha: inicioMs,
      duracionMin: duracionValida ? duracion : 60,
      cuposTotales: Number(form.cuposTotales) || 0,
      cuposOcupados: jornada?.cuposOcupados ?? 0,
      activa: true,
    }),
    [form, inicioMs, duracion, duracionValida, jornada?.cuposOcupados]
  );

  if (esEdicion && cargando && !jornada) {
    return (
      <Cargando etiqueta="Cargando jornada">
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="space-y-5">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </Cargando>
    );
  }

  if (esEdicion && (!jornada || !permisos?.editar)) {
    const motivo = !jornada
      ? "La jornada no existe o ya fue eliminada."
      : !permisos?.verAdministracion
        ? "No tienes permiso para editar esta jornada: solo puedes administrar las que tienes asignadas."
        : "Esta jornada ya comenzó y no se puede editar.";
    return <EmptyState icono={<Lock className="size-7" />} titulo="No se puede editar" texto={motivo} accion={<Button variante="soft" onClick={() => navigate(-1)}>Volver</Button>} />;
  }

  const guardar = async () => {
    const { errores: nuevos, datos } = validarJornada(form, {
      ahora: Date.now(),
      cuposOcupados: jornada?.cuposOcupados ?? 0,
      // una jornada cancelada puede conservar una fecha pasada; las activas, no
      exigirFutura: !esEdicion || jornada?.activa !== false,
    }) as { errores: Record<string, string>; datos: Record<string, unknown> | null };
    setErrores(nuevos);
    if (!datos) {
      toast.error("Revisa los campos marcados en rojo.");
      return;
    }
    setGuardando(true);
    try {
      // Un gestor siempre actúa a su nombre; el administrador, para el gestor elegido
      const responsable = esAdministrador ? gestorId || usuario!.uid : usuario!.uid;
      let idFinal = jornadaId;
      if (esEdicion) {
        await editarJornada(jornadaId!, datos, esAdministrador ? responsable : undefined);
      } else {
        claveCreacion.current = claveCreacion.current || nuevaClaveCreacion();
        idFinal = (await crearJornada(responsable, datos, claveCreacion.current)).id;
      }
      toast.exito(esEdicion ? "Jornada actualizada. Los estudiantes inscritos recibirán el aviso." : "Jornada creada: ya está disponible para los estudiantes.");
      navigate(`/jornadas/${idFinal}/administrar`, { replace: true });
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const duracionPersonalizada = duracionOtra || (form.duracionMin !== "" && !DURACIONES_RAPIDAS.map(String).includes(form.duracionMin));

  return (
    <>
      <Link to={esEdicion ? `/jornadas/${jornadaId}/administrar` : "/"} className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> {esEdicion ? "Volver a la jornada" : "Volver"}
      </Link>
      <PageHeader
        titulo={esEdicion ? "Editar jornada" : "Crear jornada"}
        descripcion={esEdicion ? "Los cambios se avisan automáticamente a los estudiantes inscritos." : "Completa los datos: en cuanto la guardes estará disponible para que los estudiantes se inscriban."}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <form
          className="space-y-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <Seccion icono={<ClipboardList className="size-5" />} titulo="Información general" subtitulo="Lo primero que verán los estudiantes">
            <Input className="sm:col-span-2" etiqueta="Título" obligatorio value={form.titulo} onChange={(e) => cambiar("titulo", e.target.value)} error={errores.titulo} contador={`${form.titulo.length}/${LIMITES.titulo}`} placeholder="Ej. Jornada de salud visual" />
            <Select etiqueta="Categoría" obligatorio value={form.categoria} onChange={(e) => cambiar("categoria", e.target.value)} error={errores.categoria} placeholder="Elige una categoría" opciones={CATEGORIAS.map((c: string) => ({ valor: c, etiqueta: c }))} />
            <Input etiqueta="Entidad organizadora" obligatorio value={form.entidad} onChange={(e) => cambiar("entidad", e.target.value)} error={errores.entidad} />
            <Textarea className="sm:col-span-2" etiqueta="Descripción" obligatorio value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} error={errores.descripcion} contador={`${form.descripcion.length}/${LIMITES.descripcion}`} placeholder="¿De qué trata la jornada? ¿Qué deben llevar los asistentes?" />
            <Input className="sm:col-span-2" etiqueta="Responsable(s)" obligatorio value={form.responsable} onChange={(e) => cambiar("responsable", e.target.value)} error={errores.responsable} ayuda="Puedes indicar varios separados por comas." />
            <Input className="sm:col-span-2" etiqueta="Imagen de portada (opcional)" type="url" value={form.bannerUrl} onChange={(e) => cambiar("bannerUrl", e.target.value)} error={errores.bannerUrl} placeholder="https://…/imagen.jpg" ayuda="Enlace https a una imagen. Si lo dejas vacío se usa la portada institucional." />
            {esAdministrador && (
              <Select
                className="sm:col-span-2"
                etiqueta="Gestor a cargo"
                value={gestorId}
                onChange={(e) => setGestorId(e.target.value)}
                ayuda="Quién administra la jornada: inscritos, asistencia y planilla."
                placeholder="Yo (administrador)"
                opciones={responsables.map((u) => ({ valor: u.id, etiqueta: u.nombre || u.email || u.id }))}
              />
            )}
          </Seccion>

          <Seccion icono={<CalendarClock className="size-5" />} titulo="Fecha y duración" subtitulo="Hora de Colombia (UTC-5)">
            <Input etiqueta="Fecha" obligatorio type="date" value={form.dia} onChange={(e) => cambiar("dia", e.target.value)} error={errores.dia} />
            <Input etiqueta="Hora de inicio" obligatorio type="time" value={form.hora} onChange={(e) => cambiar("hora", e.target.value)} error={errores.hora} />
            <Select
              etiqueta="Duración"
              obligatorio
              value={duracionPersonalizada ? OTRA : form.duracionMin}
              onChange={(e) => {
                if (e.target.value === OTRA) {
                  setDuracionOtra(true);
                } else {
                  setDuracionOtra(false);
                  cambiar("duracionMin", e.target.value);
                }
              }}
              opciones={[...DURACIONES_RAPIDAS.map((m) => ({ valor: String(m), etiqueta: formatearDuracion(m) })), { valor: OTRA, etiqueta: "Otra duración…" }]}
              error={duracionPersonalizada ? undefined : errores.duracionMin}
            />
            {duracionPersonalizada && <Input etiqueta="Minutos" inputMode="numeric" value={form.duracionMin} onChange={(e) => cambiar("duracionMin", e.target.value.replace(/\D/g, ""))} error={errores.duracionMin} ayuda="Entre 10 y 1440 minutos." />}
            <p className="text-xs leading-relaxed text-muted sm:col-span-2">
              {finMs
                ? `Termina a las ${formatearHora(finMs)}${(aDayjsNegocio(finMs) as { format: (f: string) => string }).format("YYYY-MM-DD") !== form.dia ? " del día siguiente" : ""}.`
                : "La jornada aparece «En curso» hasta que termina su duración."}
            </p>
          </Seccion>

          <Seccion icono={<MapPin className="size-5" />} titulo="Lugar" subtitulo="Espacios de la institución">
            <Select
              className="sm:col-span-2"
              etiqueta="Espacio"
              obligatorio
              value={form.lugar}
              onChange={(e) => cambiar("lugar", e.target.value)}
              error={errores.lugar}
              placeholder="Elige el espacio"
              opciones={ESPACIOS.map((e: string) => ({ valor: e, etiqueta: ocupados.has(e) ? `${e} — ocupado a esa hora` : e }))}
            />
            {ocupadosElegido && (
              <Aviso tipo="alerta" className="sm:col-span-2">
                <strong>{form.lugar}</strong> ya tiene {listaCorta(ocupadosElegido.map((j) => `«${j.titulo}»`), 3)} en esa franja. Puedes continuar, pero conviene elegir un espacio libre
                {ESPACIOS.some((e: string) => !ocupados.has(e)) && <>: {listaCorta(ESPACIOS.filter((e: string) => !ocupados.has(e)), 6)}</>}.
              </Aviso>
            )}
          </Seccion>

          <Seccion icono={<Users className="size-5" />} titulo="Cupos y asistencia">
            <Input etiqueta="Cupos totales" obligatorio inputMode="numeric" value={form.cuposTotales} onChange={(e) => cambiar("cuposTotales", e.target.value.replace(/\D/g, ""))} error={errores.cuposTotales} ayuda={`Máximo ${LIMITES.cuposMaximos}.${jornada?.cuposOcupados ? ` Ya hay ${jornada.cuposOcupados} inscritos.` : ""}`} />
            <div className="sm:col-span-2">
              <Switch
                marcado={form.asistenciaTodaJornada}
                onCambiar={(v) => cambiar("asistenciaTodaJornada", v)}
                etiqueta="Asistencia durante toda la jornada"
                descripcion="Apagado: los estudiantes pueden registrar su asistencia con el QR solo en los primeros 20 minutos."
              />
            </div>
          </Seccion>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variante="secondary" tamano="lg" onClick={() => navigate(-1)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" tamano="lg" cargando={guardando}>
              {esEdicion ? "Guardar cambios" : "Crear jornada"}
            </Button>
          </div>
        </form>

        <aside className="hidden space-y-3 xl:sticky xl:top-8 xl:block" aria-label="Vista previa">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Así la verán los estudiantes</p>
          <div className="pointer-events-none">
            <JornadaCard jornada={previa} to="#" />
          </div>
        </aside>
      </div>
    </>
  );
}
