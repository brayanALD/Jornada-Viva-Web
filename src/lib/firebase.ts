import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Mismo proyecto de Firebase que la app móvil (la configuración web es pública).
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps()[0] ?? initializeApp(config);

// La sesión se conserva sola en el navegador (IndexedDB)
export const auth = getAuth(app);
// Solo lectura en tiempo real: todas las escrituras pasan por la API
export const db = getFirestore(app);

// `npm run dev:emulador`: trabaja contra los emuladores locales de Firebase (nunca toca producción)
if (import.meta.env.VITE_USE_EMULATORS === "true") {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {
    /* ya conectados (recarga en caliente) */
  }
}
