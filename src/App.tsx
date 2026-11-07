import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmProvider } from "@/components/ui/Dialog";
import { ToastProvider } from "@/components/ui/Feedback";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { JornadasProvider } from "@/features/jornadas/JornadasContext";
import { NotificacionesProvider } from "@/features/notificaciones/NotificacionesContext";
import type { Rol } from "@/core";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

// Cada pantalla se descarga solo cuando se visita
const HomeEstudiantePage = lazy(() => import("@/pages/estudiante/HomePage"));
const MisJornadasPage = lazy(() => import("@/pages/estudiante/MisJornadasPage"));
const MisPrestamosPage = lazy(() => import("@/pages/estudiante/MisPrestamosPage"));
const AvisosPage = lazy(() => import("@/pages/estudiante/AvisosPage"));
const AsistenciaPage = lazy(() => import("@/pages/estudiante/AsistenciaPage"));
const HomeGestorPage = lazy(() => import("@/pages/gestor/HomePage"));
const JornadaFormPage = lazy(() => import("@/pages/gestor/JornadaFormPage"));
const JornadaAdministrarPage = lazy(() => import("@/pages/gestor/JornadaAdministrarPage"));
const PrestamosGestionPage = lazy(() => import("@/pages/gestor/PrestamosGestionPage"));
const PanelAdminPage = lazy(() => import("@/pages/admin/PanelPage"));
const JornadasAdminPage = lazy(() => import("@/pages/admin/JornadasAdminPage"));
const UsuariosPage = lazy(() => import("@/pages/admin/UsuariosPage"));
const UsuarioFormPage = lazy(() => import("@/pages/admin/UsuarioFormPage"));
const UsuarioDetallePage = lazy(() => import("@/pages/admin/UsuarioDetallePage"));
const ReportesPage = lazy(() => import("@/pages/admin/ReportesPage"));
const AuditoriaPage = lazy(() => import("@/pages/admin/AuditoriaPage"));
const JornadaDetallePage = lazy(() => import("@/pages/JornadaDetallePage"));
const PerfilPage = lazy(() => import("@/pages/PerfilPage"));

function Arranque() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas" role="status" aria-label="Cargando Jornada Viva">
      <div className="size-10 animate-spin rounded-full border-4 border-primary-pale border-t-primary" />
    </div>
  );
}

function CargandoPagina() {
  return (
    <div className="grid h-64 place-items-center" role="status" aria-label="Cargando">
      <div className="size-8 animate-spin rounded-full border-4 border-primary-pale border-t-primary" />
    </div>
  );
}

/** Solo con sesión iniciada; sin sesión lleva a «Ingresar». */
function Privado() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Arranque />;
  if (!usuario) return <Navigate to="/ingresar" replace />;
  return (
    <JornadasProvider>
      <NotificacionesProvider>
        <AppShell />
      </NotificacionesProvider>
    </JornadasProvider>
  );
}

/** Solo sin sesión; con sesión lleva al inicio. */
function Publico() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Arranque />;
  if (usuario) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Restringe un grupo de rutas a ciertos roles (la API igualmente valida cada operación). */
function SoloRoles({ roles }: { roles: Rol[] }) {
  const { rol } = useAuth();
  return roles.includes(rol) ? <Outlet /> : <Navigate to="/" replace />;
}

/** El inicio depende del rol, como en la app móvil. */
function Inicio() {
  const { esAdministrador, esGestor } = useAuth();
  return esAdministrador ? <PanelAdminPage /> : esGestor ? <HomeGestorPage /> : <HomeEstudiantePage />;
}

function Prestamos() {
  const { esAdministrador, esGestor } = useAuth();
  return esAdministrador || esGestor ? <PrestamosGestionPage /> : <MisPrestamosPage />;
}

/** `/jornadas`: el administrador ve todas; para el gestor, su inicio ya las lista. */
function ListaJornadas() {
  const { esAdministrador } = useAuth();
  return esAdministrador ? <JornadasAdminPage /> : <Navigate to="/" replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Suspense fallback={<CargandoPagina />}>
              <Routes>
                <Route element={<Publico />}>
                  <Route path="/ingresar" element={<LoginPage />} />
                  <Route path="/registro" element={<RegisterPage />} />
                </Route>

                <Route element={<Privado />}>
                  <Route index element={<Inicio />} />
                  <Route path="jornadas" element={<ListaJornadas />} />
                  <Route path="prestamos" element={<Prestamos />} />
                  <Route path="perfil" element={<PerfilPage />} />

                  <Route element={<SoloRoles roles={["gestor", "administrador"]} />}>
                    <Route path="jornadas/nueva" element={<JornadaFormPage />} />
                    <Route path="jornadas/:id/editar" element={<JornadaFormPage />} />
                    <Route path="jornadas/:id/administrar" element={<JornadaAdministrarPage />} />
                  </Route>
                  <Route path="jornadas/:id" element={<JornadaDetallePage />} />

                  <Route element={<SoloRoles roles={["estudiante"]} />}>
                    <Route path="mis-jornadas" element={<MisJornadasPage />} />
                    <Route path="avisos" element={<AvisosPage />} />
                    <Route path="jornadas/:id/asistencia" element={<AsistenciaPage />} />
                  </Route>

                  <Route element={<SoloRoles roles={["administrador"]} />}>
                    <Route path="usuarios" element={<UsuariosPage />} />
                    <Route path="usuarios/nuevo" element={<UsuarioFormPage />} />
                    <Route path="usuarios/:id" element={<UsuarioDetallePage />} />
                    <Route path="reportes" element={<ReportesPage />} />
                    <Route path="auditoria" element={<AuditoriaPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
