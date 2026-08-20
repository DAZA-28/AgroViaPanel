# Login HTML/CSS/JS Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AgroViaPanel's React login page with a fully static `public/login.html` (+ CSS + JS), including the complete animated-robot personality from the original TechZone demo, while keeping session cookies compatible with the still-React dashboard.

**Architecture:** A static page served straight out of Next.js's `public/` folder (no React, no build step for this screen) uses the browser Supabase client (`@supabase/ssr`'s `createBrowserClient`, imported from a CDN) so it writes the exact cookie format `middleware.ts` and the dashboard layout already read. The robot is a vanilla-JS port of `Desktop/InicioDeSecionHtml/public_html/index.html`'s `RobotController`, trimmed of demo-only features (debug panel, register/forgot-password forms) that don't exist in this panel.

**Tech Stack:** Plain HTML/CSS/JS (ES modules), `@supabase/ssr@0.12.4` via `https://esm.sh/@supabase/ssr@0.12.4`, existing Next.js 16 app for everything not in scope.

**Spec:** `docs/superpowers/specs/2026-08-20-login-html-rewrite-design.md`

## Global Constraints

- No build step for the login screen — files under `public/` are served as-is by Next.js.
- Pin the CDN import to `@supabase/ssr@0.12.4` (the exact version in `package.json`/`node_modules` today). If `esm.sh` fails to resolve it cleanly during verification, switch to `https://cdn.jsdelivr.net/npm/@supabase/ssr@0.12.4/+esm` instead — same API, no other design change.
- Reuse the color tokens already in `app/globals.css` (`--primary: #4CAF50`, `--bg-card: #141414`, etc.) — the dashboard already uses this palette, so the login page must match it exactly, not the demo's original `:root` values (which happen to be very close but are not byte-identical).
- Drop everything in the ported robot code that references fields/forms the panel doesn't have: `newUser`, `newEmail`, `newPass`, `newPhoto`, `code`, `newPassword`, `username`, the debug panel, EmailJS. Keep the `email` and `password` reactions.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be inlined as literal strings in `login.js`, copied verbatim from `.env.local` (they are already public — every page's JS bundle ships them today).

---

## Task 1: Port the robot controller to vanilla JS

**Files:**
- Create: `public/robot.js`

**Interfaces:**
- Produces: `window.RobotController` with methods `init()`, `speak(message, duration, type)`, `think(message, duration)`, `setState(state, duration)`, `registerActivity()`, `onTyping()`, `onInputFocus(inputType)`, `onPasswordTyping(length)`, `fullCelebration(message)`, `showError(message)`, `showThinking()`, `showSurprised(message)`, `showLove(message)`, `showAmazed(message)`, `showAngry(message)`, `showConfused(message)`, `showSilly()`, `showDizzy()`, `showAlert(message)`.
- Produces: `window.initParticles()` — starts the ambient canvas particle background. Expects a `<canvas id="particles-canvas">` to exist in the DOM when called.
- Consumes (DOM elements `RobotController.init()` expects to already exist, created in Task 3): `#robot`, `#leftPupil`, `#rightPupil`, `#leftEye`, `#rightEye`, `#robotMouth`, `#robotSpeech`, `#robotThought`, `#robotCore`, `#robotContainer`, `#idleIndicator`.

- [ ] **Step 1: Write `public/robot.js`**

Port `RobotController` from `Desktop/InicioDeSecionHtml/public_html/index.html` (the `<script>` block starting at the line containing `const RobotController = {` through its closing `};`, followed immediately by the `initParticles` function) with these exact changes:

1. Drop the `emailjs.init(...)` line entirely (no EmailJS in the panel).
2. In `onInputFocus`'s `reactions` object, keep only the `email` and `password` entries:
   ```js
   const reactions = {
       'password': { msg: 'Tu secreto está seguro 🔒', state: 'neutral', action: () => this.point() },
       'email': { msg: 'Necesito tu correo 📧', state: 'neutral' }
   };
   ```
3. Delete `onUserRecognized` and `onUserNotFound` (no username concept in this panel; nothing will call them).
4. Keep everything else byte-for-byte: eye tracking, blinking, idle detection (sleep after 30s idle, snore after 60s), mood system, every `setState` case (happy, very-happy, sad, surprised, thinking, love, amazed, angry, worried, confused, silly, dizzy, sleeping, alert, success), `speak`/`think`, `wave`/`celebrate`/`clap`/`dance`/`jump`/`walk`/`point`, `sleep`/`wakeUp`/`snore`, `emitEmoji`, `createParticles`, `fullCelebration`, `showError`, `showThinking`, `showSurprised`, `showLove`, `showAmazed`, `showAngry`, `showConfused`, `showSilly`, `showDizzy`, `showAlert`, `onTyping`, `onPasswordTyping`, and the full `initParticles` function (the `Particle` class, `drawConnections`, `animate` loop, resize handling).

At the very end of the file, after the `RobotController` object literal and the `initParticles` function declaration, add:

```js
window.RobotController = RobotController;
window.initParticles = initParticles;
```

Do not call `RobotController.init()` or `initParticles()` from this file — `login.js` (Task 4) controls when that happens.

- [ ] **Step 2: Syntax-check the file**

Run: `node --check public/robot.js`
Expected: no output, exit code 0. (This only validates JS syntax — `document`/`window` aren't defined in Node, so this can't execute the file, just parse it.)

- [ ] **Step 3: Commit**

```bash
git add public/robot.js
git commit -m "Add vanilla-JS robot controller for the plain login page"
```

---

## Task 2: Login stylesheet

**Files:**
- Create: `public/login.css`

**Interfaces:**
- Consumes: nothing (self-contained).
- Produces: every class name Task 1's `RobotController`/`initParticles` and Task 3's markup rely on — see the class list below. Task 3 must use these exact names.

- [ ] **Step 1: Write `public/login.css`**

Port the `<style>` block from `Desktop/InicioDeSecionHtml/public_html/index.html` (from `:root {` through the closing `}` of the `@media (max-width: 480px)` rule) with these exact changes:

1. Replace the `:root` block with AgroViaPanel's actual tokens (copied from `app/globals.css`), so the login page matches the dashboard exactly:
   ```css
   :root {
       --primary: #4CAF50;
       --primary-dark: #388E3C;
       --primary-light: #81C784;
       --primary-glow: rgba(76, 175, 80, 0.4);
       --bg-dark: #0a0a0a;
       --bg-card: #141414;
       --bg-card-hover: #1a1a1a;
       --text-light: #ffffff;
       --text-muted: #888888;
       --success: #4CAF50;
       --warning: #ff9800;
       --error: #f44336;
       --info: #2196f3;
   }
   ```
2. Delete the `.debug-panel`, `.debug-panel.active`, `#debugToggle`, and `@keyframes slide-in` rules (no debug panel in this build).
3. Delete the `input[type="file"]` and `input[type="file"]::file-selector-button` rules (no file inputs on this form).
4. Delete `.container img` and `.container img:hover` (Task 3's markup has no `<img>` — the robot's speech bubble is the only "avatar", there's no separate profile photo).
5. Delete `.alert-message`, `.alert-message.error`, `.alert-message.success`, and `@keyframes alert-appear` (Task 3's markup has no alert box — errors surface only through the robot's speech bubble, via `RobotController.showError`, so a second error-display element would be dead code).
6. Delete `.toggle` and `.toggle a` (no register/forgot-password links on this form).
7. Keep every other rule as-is: `.bg-grid`, `#particles-canvas`, `.main-wrapper`, `.robot-container`, `.robot` and all its state/animation classes (`.robot.excited`, `.robot.dancing`, `.robot.sleeping`, `.robot.confused`, `.robot.love`, `.robot.amazed`, `.robot.dizzy`, `.robot.angry`, `.robot.worried`, `.robot.happy`, `.robot.thinking`, `.robot.silly`, `.robot.alert`, `.robot.success`, `.robot.wave`, `.robot.celebrate`, `.robot.clapping`, `.robot.pointing`, `.robot.walking`, `.robot.jumping`), `.robot-head`, `.robot-antenna`, `.robot-ear`, `.robot-screen`, `.robot-zzz`, `.robot-eyes`, `.robot-eye`, `.robot-pupil`, `.robot-eyebrow`, `.robot-mouth` (and its `.smile`/`.big-smile`/`.sad`/`.surprised`/`.talking`/`.angry` variants), `.robot-tongue`, `.robot-body`, `.robot-core`, `.robot-buttons`, `.robot-button`, `.robot-arm`, `.robot-legs`, `.robot-leg`, `.robot-speech` (and `.show`/`.error`/`.warning`), `.robot-thought`, `.emoji-reaction`, `.container`, `h2`, the `input[type="text"|"password"|"email"]` rules, `input[type="submit"], button`, `.particle`, `.idle-indicator`, and both `@media` responsive blocks.

- [ ] **Step 2: Commit**

```bash
git add public/login.css
git commit -m "Add stylesheet for the plain HTML login page"
```

---

## Task 3: Login page markup

**Files:**
- Create: `public/login.html`

**Interfaces:**
- Consumes: `public/login.css` (Task 2), `public/robot.js` (Task 1), `public/login.js` (Task 4 — not yet created; the `<script type="module" src="/login.js">` tag will 404 until Task 4 lands, which is fine, this task's own verification only checks robot rendering/animation).
- Produces: DOM element IDs `loginForm`, `email`, `password`, `submitButton` that Task 4's `login.js` binds to.

- [ ] **Step 1: Write `public/login.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Iniciar sesión - AgroViaPanel</title>
<link rel="stylesheet" href="/login.css">
</head>
<body>

<div class="bg-grid"></div>
<canvas id="particles-canvas"></canvas>

<div class="idle-indicator" id="idleIndicator">💤 Robot descansando...</div>

<div class="main-wrapper">

    <div class="container">
        <h2>AgroViaPanel</h2>

        <form id="loginForm">
            <input type="email" id="email" placeholder="📧 Correo" required autocomplete="email">
            <input type="password" id="password" placeholder="🔒 Contraseña" required autocomplete="current-password">
            <button type="submit" id="submitButton">Entrar</button>
        </form>
    </div>

    <div class="robot-container" id="robotContainer">
        <div class="robot" id="robot">
            <div class="robot-speech" id="robotSpeech"></div>
            <div class="robot-thought" id="robotThought"></div>
            <div class="robot-zzz">💤</div>

            <div class="robot-head">
                <div class="robot-antenna"></div>
                <div class="robot-ear left"></div>
                <div class="robot-ear right"></div>
                <div class="robot-screen">
                    <div class="robot-eyebrow left"></div>
                    <div class="robot-eyebrow right"></div>
                    <div class="robot-eyes">
                        <div class="robot-eye" id="leftEye">
                            <div class="robot-pupil" id="leftPupil"></div>
                        </div>
                        <div class="robot-eye" id="rightEye">
                            <div class="robot-pupil" id="rightPupil"></div>
                        </div>
                    </div>
                </div>
                <div class="robot-mouth" id="robotMouth">
                    <div class="robot-tongue"></div>
                </div>
            </div>

            <div class="robot-body">
                <div class="robot-core" id="robotCore">💚</div>
                <div class="robot-buttons">
                    <div class="robot-button"></div>
                    <div class="robot-button"></div>
                    <div class="robot-button"></div>
                </div>
            </div>

            <div class="robot-arm left"></div>
            <div class="robot-arm right"></div>

            <div class="robot-legs">
                <div class="robot-leg"></div>
                <div class="robot-leg"></div>
            </div>
        </div>
    </div>

</div>

<script src="/robot.js"></script>
<script type="module" src="/login.js"></script>
</body>
</html>
```

- [ ] **Step 2: Manual verification (robot + layout only, auth not wired yet)**

Run `npm run dev` in `AgroViaPanel/`, then open `http://localhost:3000/login.html` in a real Chrome tab.

Check:
- The card and robot render side by side (stacked on narrow widths), matching the dashboard's dark/green theme.
- The robot's pupils track the mouse, it blinks every few seconds, and it does an initial wave/jump (this comes from `RobotController.init()` — but nothing calls `init()` yet, so **at this point the robot will be static** and particles won't move; that's expected until Task 4 wires up the bootstrap. Confirm instead: no console errors, and the markup/CSS render correctly with the robot in its neutral pose).
- Browser console has no errors besides the expected 404 for `/login.js` (not created yet).

- [ ] **Step 3: Commit**

```bash
git add public/login.html
git commit -m "Add markup for the plain HTML login page"
```

---

## Task 4: Auth logic and robot wiring

**Files:**
- Create: `public/login.js`

**Interfaces:**
- Consumes: `window.RobotController` and `window.initParticles` (Task 1), DOM IDs `loginForm`/`email`/`password`/`submitButton` (Task 3), `staff_dashboard` table (columns `user_id`, `activo`, same as `lib/staff.ts`'s `getStaffForUser`).
- Produces: none consumed by other tasks — this is the last piece of the static page.

- [ ] **Step 1: Read the Supabase credentials**

Run: `cat .env.local` (from `AgroViaPanel/`) and note the exact values of `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These get inlined literally in Step 2 — they are already public (shipped in every page's JS bundle today via `lib/supabase/client.ts`).

- [ ] **Step 2: Write `public/login.js`**

```js
import { createBrowserClient } from "https://esm.sh/@supabase/ssr@0.12.4";

const SUPABASE_URL = "REPLACE_WITH_VALUE_FROM_ENV_LOCAL";
const SUPABASE_ANON_KEY = "REPLACE_WITH_VALUE_FROM_ENV_LOCAL";

const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submitButton");

emailInput.addEventListener("focus", () => window.RobotController.onInputFocus("email"));
passwordInput.addEventListener("focus", () => window.RobotController.onInputFocus("password"));
emailInput.addEventListener("input", () => window.RobotController.onTyping());
passwordInput.addEventListener("input", () => {
  window.RobotController.onPasswordTyping(passwordInput.value.length);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  submitButton.textContent = "Entrando...";

  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value,
  });

  if (authError || !data.user) {
    window.RobotController.showError("Correo o contraseña incorrectos.");
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
    return;
  }

  const { data: staff, error: staffError } = await supabase
    .from("staff_dashboard")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (staffError || !staff || !staff.activo) {
    await supabase.auth.signOut();
    window.RobotController.showError("Tu cuenta no tiene acceso al panel.");
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
    return;
  }

  window.RobotController.fullCelebration("¡Bienvenido!");
  setTimeout(() => {
    window.location.href = "/";
  }, 1200);
});

document.addEventListener("DOMContentLoaded", () => {
  window.RobotController.init();
  window.initParticles();
});
```

Replace both `REPLACE_WITH_VALUE_FROM_ENV_LOCAL` placeholders with the literal values read in Step 1 before saving the file.

- [ ] **Step 3: Manual verification — page loads and robot is alive**

With `npm run dev` still running, reload `http://localhost:3000/login.html`.

Check in the browser:
- No console errors on load (this is the main check for whether the `esm.sh` import of `@supabase/ssr@0.12.4` resolved correctly — if it throws an import error, switch the import URL to `https://cdn.jsdelivr.net/npm/@supabase/ssr@0.12.4/+esm` per the Global Constraints and reload).
- The robot waves and speaks a greeting shortly after load, and its eyes track the mouse.
- Typing in the password field visibly changes the robot's mood/state as length increases (worried → thinking → happy → very-happy, per the ported `onPasswordTyping` thresholds).

- [ ] **Step 4: Manual verification — auth flow**

In the same tab, submit the form with an intentionally wrong email/password.

Check:
- The robot goes sad and shows a speech bubble with "Correo o contraseña incorrectos." (or the inactive-account message, if you use real-but-inactive test credentials).
- The submit button re-enables and its label goes back to "Entrar".
- No unhandled promise rejections in the console.

If you have real staff credentials, submit those too and confirm: the robot celebrates, and the page redirects to `/` after ~1.2s. Open DevTools → Application → Cookies and confirm a `sb-...-auth-token` cookie (or chunked `sb-...-auth-token.0`, `.1`, …) now exists for `localhost`.

- [ ] **Step 5: Commit**

```bash
git add public/login.js
git commit -m "Wire Supabase auth and robot reactions into the plain login page"
```

---

## Task 5: Point every redirect at the new page

**Files:**
- Modify: `middleware.ts:28`, `middleware.ts:30`
- Modify: `app/(dashboard)/layout.tsx:9`, `app/(dashboard)/layout.tsx:12`
- Modify: `app/(dashboard)/equipo/page.tsx:10`
- Modify: `components/Nav.tsx:67`

**Interfaces:**
- Consumes: `public/login.html` existing at `/login.html` (Tasks 1-4).

- [ ] **Step 1: Update `middleware.ts`**

Change:
```ts
  const isLoginPage = request.nextUrl.pathname === "/login";
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
```
to:
```ts
  const isLoginPage = request.nextUrl.pathname === "/login.html";
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login.html", request.url));
  }
```

- [ ] **Step 2: Update `app/(dashboard)/layout.tsx`**

Change both occurrences of `redirect("/login")` to `redirect("/login.html")`.

- [ ] **Step 3: Update `app/(dashboard)/equipo/page.tsx`**

Change `redirect("/login")` (line 10) to `redirect("/login.html")`.

- [ ] **Step 4: Update `components/Nav.tsx`**

Change `router.push("/login")` (line 67) to `window.location.href = "/login.html"` (a plain navigation, since `/login.html` is a static file outside the Next.js router — `router.push` from `next/navigation` only handles Next.js routes).

- [ ] **Step 5: Verify the build still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification — gate behavior**

With `npm run dev` running, open a private/incognito Chrome window and visit `http://localhost:3000/`. Confirm it redirects to `/login.html`. Visit `http://localhost:3000/equipo` directly — confirm it also redirects to `/login.html`.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts "app/(dashboard)/layout.tsx" "app/(dashboard)/equipo/page.tsx" components/Nav.tsx
git commit -m "Point session-gate redirects at the new static /login.html"
```

---

## Task 6: Remove the replaced React code

**Files:**
- Delete: `app/login/page.tsx`
- Delete: `app/login/LoginForm.tsx`
- Delete: `components/Robot.tsx`
- Delete: `components/Robot.module.css`

**Interfaces:**
- Consumes: nothing — this only removes files nothing else in the codebase imports after Task 5.

- [ ] **Step 1: Confirm nothing still imports the files being deleted**

Run: `grep -rn "components/Robot\|app/login/LoginForm\|from \"@/components/Robot\"" --include="*.tsx" --include="*.ts" .`
Expected: no matches outside `app/login/page.tsx` itself (which is also being deleted).

- [ ] **Step 2: Delete the files**

```bash
git rm "app/login/page.tsx" "app/login/LoginForm.tsx" "components/Robot.tsx" "components/Robot.module.css"
```

If `app/login/` is now empty, remove the empty directory too (git already stops tracking it once both files are removed; no separate action needed).

- [ ] **Step 3: Verify the full build and test suite**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm test`
Expected: all existing tests pass (none of them cover the deleted files).

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove the React login page and Robot component, replaced by public/login.html"
```

---

## Task 7: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Full flow in a real browser**

With `npm run dev` running, open a fresh incognito Chrome window:
1. Visit `http://localhost:3000/` → redirected to `/login.html`.
2. Confirm the robot's idle behavior: leave the tab alone (don't move the mouse) for 30+ seconds and confirm it falls asleep (`💤` ZZZ appears, the "Robot descansando..." indicator shows in the bottom-left) — moving the mouse again should wake it up with a surprised reaction.
3. Log in with real staff credentials. Confirm: success celebration animation, redirect to `/`, and the dashboard loads normally (same as it did before this change).
4. Use the Nav's "cerrar sesión" (or equivalent logout action) and confirm it lands back on `/login.html`.

- [ ] **Step 2: Confirm no dead references remain**

Run: `grep -rn '"/login"' --include="*.ts" --include="*.tsx" .`
Expected: no matches (everything now points at `/login.html`, or the string doesn't appear at all).

- [ ] **Step 3: Final commit if anything was fixed during verification**

If Steps 1-2 required any fixes, commit them with a message describing what verification caught.
