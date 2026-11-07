// Arranca la API REAL del proyecto móvil (../Jornada-Viva/api) contra los emuladores de Firebase,
// en el puerto 8787 (el que usa `npm run dev:emulador`). No toca datos reales.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const movil = path.resolve(process.cwd(), process.env.JV_MOBILE_PATH || "../Jornada-Viva");
const carpetaApi = path.join(movil, "api");
if (!existsSync(path.join(carpetaApi, "src", "server.js"))) throw new Error(`No se encontró la API en ${carpetaApi}`);

const hijo = spawn(process.execPath, ["src/server.js"], {
  cwd: carpetaApi,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: "8787",
    FIREBASE_PROJECT_ID: "demo-jornadaviva",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    ASISTENCIA_SECRETO: "secreto-local-de-prueba",
    MANTENIMIENTO_MINUTOS: "0",
  },
});
hijo.on("exit", (codigo) => process.exit(codigo ?? 0));
process.on("SIGINT", () => hijo.kill("SIGINT"));
