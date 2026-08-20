# Rediseño del login de AgroViaPanel en HTML/CSS/JS plano

## Contexto

AgroViaPanel es un panel Next.js/React. El usuario decidió que no quiere seguir
iterando en Next/React como stack ("el stack en sí" es el problema, no solo el
resultado visual) y quiere migrar el panel a HTML/CSS/JS plano, pantalla por
pantalla. Esta es la primera pantalla: el login.

El login además debe recuperar el robot animado completo que ya existía como
demo en `Desktop/InicioDeSecionHtml/public_html/index.html` ("TechZone"), del
cual solo se había portado a React una versión parcial (mouse-tracking,
parpadeo, mensaje de saludo/error) — el usuario pidió explícitamente la
personalidad completa esta vez.

El resto del panel (home/métricas, aprobaciones, equipo, pedidos) sigue en
Next.js/React por ahora y se migrará en rondas futuras, sin alcance en esta
tarea.

## Alcance

Dentro:
- Reescribir `/login` como página estática (`public/login.html` +
  `public/login.css` + `public/login.js` + `public/robot.js`).
- Portar el `RobotController` completo (mood system, sleep/idle a los 30s,
  ~12 estados de ánimo, wave/celebrate/clap/dance/jump, canvas de partículas
  de fondo, reacciones emoji, thought bubbles) conectado a los eventos reales
  del form de login (email + password, focus, typing, submit éxito/error,
  inactividad).
- Mantener el flujo de auth actual: `signInWithPassword` + validación contra
  `staff_dashboard` (activo) + `signOut` si no califica — mismo comportamiento
  que hoy tiene `app/login/LoginForm.tsx`.
- Actualizar `middleware.ts` y cualquier redirect a `/login` para apuntar a
  `/login.html`.
- Borrar el código React reemplazado: `app/login/page.tsx`,
  `app/login/LoginForm.tsx`, `components/Robot.tsx`,
  `components/Robot.module.css`.

Fuera de alcance (queda para rondas futuras, no tocar):
- Home/métricas, aprobaciones, equipo, pedidos — siguen en React.
- Panel de debug del robot original, formularios de registro/recuperar
  contraseña por `localStorage` — son artefactos de la demo, el panel no
  tiene esos flujos.

## Decisión de compatibilidad de sesión

El resto del panel sigue protegido server-side por `middleware.ts` y el
layout del dashboard, ambos vía `@supabase/ssr` (`createServerClient`) leyendo
cookies. Para no tener que tocar ese gate (que funciona) ni crear código
puente temporal, `login.js` importa el **mismo** cliente,
`createBrowserClient` de `@supabase/ssr`, pero vía CDN ESM
(`https://esm.sh/@supabase/ssr@0.12.4`, versión exacta ya instalada en
`package.json`) en lugar de `npm import`. Esto escribe la sesión en cookies
con el formato exacto que el middleware ya espera, sin cambios en
`middleware.ts` más allá del path de redirect.

Riesgo: nunca se probó importar `@supabase/ssr` desde esm.sh en el browser.
Se verifica en `next dev` con un tab de Chrome real (cookies seteadas, sin
errores de consola, redirect a `/` funcional). Plan B si esm.sh no resuelve
bien: apuntar a jsdelivr (`https://cdn.jsdelivr.net/npm/@supabase/ssr@0.12.4/+esm`)
— no cambia el diseño, solo la URL del import.

## Componentes

- **`public/login.html`** — estructura del form (email + password) + markup
  completo del robot (head/body/arms/legs/screen/eyes/mouth/speech/thought
  bubbles + canvas de partículas).
- **`public/login.css`** — estilos del robot y del form, reusando los mismos
  tokens que ya están en `app/globals.css` (`--primary: #4CAF50`, etc. — el
  dashboard ya adoptó esta paleta en el rediseño previo, no hay traducción de
  color que hacer).
- **`public/robot.js`** — `RobotController` portado del original, sin panel
  de debug ni frases de campos inexistentes (`newUser`, `code`, etc.) — solo
  las reacciones de `email`/`password`.
- **`public/login.js`** — cliente Supabase vía CDN, wiring de eventos del
  form a los métodos del robot, lógica de auth (`signInWithPassword` →
  validar `staff_dashboard.activo` → `signOut` si no califica → redirect a
  `/` si ok).

Las claves `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` se
inlinean como constantes literales en `login.js` (son públicas por diseño —
ya viajan hoy en el bundle JS de cada página del panel).

## Testing

Se borran los tests React existentes de `LoginForm`/`Robot` (código
eliminado). No se agregan tests automatizados para `robot.js` — es lógica
puramente visual/de animación sin reglas de negocio. Verificación manual en
browser real (Chrome vía `next dev`): la página carga, el robot anima
correctamente, no hay errores de consola, las cookies de sesión se setean
tras un login válido y el redirect a `/` respeta el gate existente. El login
con credenciales reales lo prueba el usuario.
