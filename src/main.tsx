import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import iconoApp from "@mobile/assets/icon.png";
import "./index.css";
import { App } from "./App";

// Icono de la pestaña: el mismo de la app móvil (se importa de allá, no se copia)
const enlace = document.querySelector<HTMLLinkElement>("link[rel='icon']") ?? document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }));
enlace.href = iconoApp;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
