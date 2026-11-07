import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// La web NO copia la lógica de negocio de la app móvil: la importa de ../Jornada-Viva con el alias
// "@mobile". Solo se comparte código sin dependencias de React Native (utilidades de dominio y el
// cliente HTTP). La interfaz de la web es propia (src/).
export default defineConfig(({ mode }) => {
  const raiz = process.cwd();
  const env = loadEnv(mode, raiz, "");
  // Proyecto móvil: JV_MOBILE_PATH si se define; si no, el submódulo `mobile/` (así compila igual en
  // Vercel y en cualquier equipo); y como último recurso la carpeta hermana ../Jornada-Viva.
  const tieneCodigo = (ruta: string) => existsSync(path.join(ruta, "src", "utils"));
  const candidatos = [env.JV_MOBILE_PATH, "mobile", "../Jornada-Viva"].filter(Boolean).map((r) => path.resolve(raiz, r as string));
  const movil = candidatos.find(tieneCodigo);

  if (!movil) {
    throw new Error(
      `No se encontró el proyecto móvil (buscado en: ${candidatos.join(", ")}). Ejecuta "git submodule update --init" o define JV_MOBILE_PATH en .env.`
    );
  }

  const apiDestino = (env.JV_API_TARGET || "https://jornada-viva.onrender.com").replace(/\/+$/, "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^@mobile\//, replacement: `${movil.replace(/\\/g, "/")}/` },
        { find: /^@\//, replacement: `${path.resolve(raiz, "src").replace(/\\/g, "/")}/` },
      ],
      // El código del móvil importa "dayjs": que use la copia de esta carpeta (una sola instancia)
      dedupe: ["dayjs"],
    },
    server: {
      port: 5173,
      fs: { allow: [raiz, movil] },
      // La API compartida solo habilita CORS para los orígenes de CORS_ORIGINS: en desarrollo la
      // web llama a su propio servidor y este reenvía /v1 a la API real.
      proxy: { "/v1": { target: apiDestino, changeOrigin: true } },
    },
  };
});
