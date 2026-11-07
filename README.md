# Jornada Viva — versión web

Versión web de la app móvil **Jornada Viva** (`../Jornada-Viva`). Tiene su **propia interfaz**, pensada
para el navegador (barra lateral, rejillas, tablas, diálogos, vista previa en vivo), construida sobre la
misma identidad visual de la app (verde institucional TdeA, acento ámbar, tarjetas redondeadas, bloque de
fecha, chips), y **comparte con la app el backend y la lógica de negocio**:

| Se comparte (no se copia) | Cómo |
|---|---|
| **Backend**: API `/v1` (Express + Firebase Admin) | Mismas rutas y mismos errores |
| **Datos**: Firebase Auth + Firestore | Mismo proyecto: lo que se hace aquí se ve en el móvil al instante |
| **Reglas de negocio**: estados de jornada, permisos por rol, validaciones, plazo de cancelación, ventana de asistencia, espacios ocupados, préstamos, estadísticas | Se importan de `../Jornada-Viva/src/utils` y `apiClientCore` (alias `@mobile`, ver `src/core/index.ts`) |
| **Recursos**: logo institucional e icono | Se importan de `../Jornada-Viva/assets` |

La web nunca escribe en Firestore: solo lee en tiempo real; toda escritura pasa por la API, que aplica
permisos, valida, avisa a los inscritos y audita (igual que el móvil).

## Stack

Vite 8 · React 19 · TypeScript · React Router · Tailwind CSS 4 · Firebase Web SDK · `qrcode.react` (QR del
gestor) · `jsqr` (lector de QR con la cámara del navegador) · Lucide (iconos).

## Ejecutar

El código del móvil viene como submódulo de git en `mobile/` (rama `IA_Agents` de
`68GHz/Jornada-Viva`); si ya tienes el móvil clonado en `../Jornada-Viva` también sirve, o define
`JV_MOBILE_PATH` en `.env`. Para actualizar la lógica compartida: `git submodule update --remote mobile`.

```bash
git clone --recurse-submodules https://github.com/brayanALD/Jornada-Viva-Web.git
cd Jornada-Viva-Web
npm install
cp .env.example .env   # una sola vez (trae la configuración pública del proyecto)
npm run dev            # http://localhost:5173
```

`npm run build` genera `dist/` (revisa tipos y compila).

## Pantallas por rol

- **Estudiante**: inicio con filtros y «tu próxima jornada», detalle con inscripción/cancelación, mis
  jornadas (inscritas/asistidas), registro de asistencia escaneando el QR con la cámara, préstamos,
  avisos y perfil.
- **Gestor**: inicio con indicadores y sus jornadas, crear/editar jornada (con vista previa y aviso de
  espacios ocupados), administración (inscritos, asistencia manual, **QR de asistencia** proyectable,
  planilla Excel, cancelar/reactivar/eliminar) y préstamos de objetos.
- **Administrador**: panel, todas las jornadas con filtros, usuarios (crear, rol, activar/desactivar),
  estadísticas con gráficas y reporte Excel, auditoría.

## API en desarrollo y producción

El navegador exige CORS y la API compartida solo lo habilita para los orígenes de `CORS_ORIGINS`. Por eso
la web llama a su **mismo origen** (`/v1/...`):

- **Desarrollo**: Vite reenvía `/v1` a la API real (`vite.config.ts`, variable `JV_API_TARGET`).
- **Producción**: `vercel.json` ya trae el *rewrite* `/v1/*` → API. Si prefieres otro hosting, haz lo mismo
  o define `VITE_API_URL` y agrega el origen de la web a `CORS_ORIGINS` en el servidor de la API.
- En Firebase Console → Authentication → Settings → *Authorized domains* autoriza el dominio de la web.

## Probar sin tocar producción (emuladores locales)

Levanta Firebase (Auth + Firestore), la API del móvil y la web contra datos de prueba. En tres terminales:

```bash
npm run emulador:firebase   # emuladores (necesita Java; la primera vez descarga firebase-tools)
npm run emulador:semilla    # una vez: crea cuentas, jornadas, inscripciones y avisos de prueba
npm run emulador:api        # API real del móvil en el puerto 8787
npm run dev:emulador        # la web apuntando a todo lo anterior
```

Las cuentas de prueba (estudiante, gestor y administrador) y su clave están en `emulador/seed.mjs`; solo
existen en el emulador. Las reglas de Firestore son las reales (`../Jornada-Viva/firestore.api.rules`).

## Diferencias con la app móvil

- **Sin modo sin conexión**: la web necesita internet para inscribirse, marcar asistencia, etc. (la cola
  de acciones pendientes es de la app móvil). Si se cae la conexión se avisa y se pide reintentar.
- **Sin notificaciones push** (tampoco las hay hoy en el móvil): los avisos llegan en tiempo real mientras
  la web está abierta y, si lo permites en *Mi perfil*, como notificación del navegador.
- **La cámara** para escanear el QR solo funciona en `https://` o `localhost`.
- **«Compartir» = descargar**: planillas y reportes se descargan como `.xlsx`.
