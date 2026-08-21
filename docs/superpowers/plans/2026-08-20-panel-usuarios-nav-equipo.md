# Panel de Usuarios + riel de nav expandible + invitar a Equipo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-everything "Usuarios" module (Repartidores/Tiendas/Clientes with a detail modal and suspend/reactivate), redesign the sidebar into a green expanding rail, and let admins invite new staff by email instead of creating accounts by hand in Supabase Studio.

**Architecture:** Three independent slices sharing one repo (`AgroViaPanel`, Next.js 16 App Router + Supabase). Usuarios reuses the exact list/Realtime pattern already proven in `AprobacionesTable.tsx`, and reuses `estado_aprobacion` for suspend/reactivate instead of adding new columns. The nav redesign only touches `Nav.tsx` + CSS — no data changes. Equipo invite adds a new server-only Supabase client (service role key) behind a Next.js Route Handler, because creating an Auth user requires privileges the browser must never hold.

**Tech Stack:** Next.js 16 (App Router, Server + Client Components), React 19, TypeScript, Supabase (`@supabase/ssr` for browser/server clients, `@supabase/supabase-js` for the new admin client), Vitest + jsdom for unit tests, plain CSS (`app/globals.css`, no framework).

**Spec:** `docs/superpowers/specs/2026-08-20-panel-usuarios-nav-equipo-design.md`

## Global Constraints

- Reuse `estado_aprobacion` (`aprobado` ⇄ `rechazado`) for suspend/reactivate — never touch `repartidores.activo`/`disponible` (operational fields owned by the Repartidor app).
- No new database columns. The only schema change is one RLS policy (`staff_select_usuarios`, SELECT-only).
- Do not modify `lib/aprobaciones.ts` or `AccionesAprobacion.tsx` — the new suspend/reactivate logic lives in its own file (`lib/usuarios.ts`) so the existing Aprobaciones flow can't regress.
- Do not revert or "clean up" the currently-uncommitted visual redesign already sitting in the working tree (`Nav.tsx`, `lib/nav-items.ts`, `app/globals.css`, `app/(dashboard)/equipo/page.tsx`, etc.) — build on top of it, per the user's explicit decision.
- `--primary: #4CAF50` (already defined in `app/globals.css` `:root`) is the only green used anywhere in this plan — no new brand colors.
- Every task must leave `npm test`, `npx tsc --noEmit`, and `npm run build` green.

---

### Task 1: RLS policy so staff can read `usuarios`

**Files:**
- None in the repo — applied directly against the live Supabase project via the `mcp__supabase__apply_migration` tool (this repo has no `supabase/migrations/` folder to sync, same precedent as the `staff_select_pedidos` policy added in the previous session).

**Interfaces:**
- Produces: staff (any `staff_dashboard` row, via the existing `es_staff()` helper) can now `SELECT` from `public.usuarios`. Nothing else changes — no INSERT/UPDATE/DELETE policy is added.

- [ ] **Step 1: Apply the migration**

Call `mcp__supabase__apply_migration` with `name: "staff_select_usuarios"` and this SQL:

```sql
create policy staff_select_usuarios on public.usuarios
  for select using (es_staff());
```

- [ ] **Step 2: Verify with a real query**

Call `mcp__supabase__execute_sql` with:

```sql
select policyname, cmd, qual
from pg_policies
where tablename = 'usuarios' and policyname = 'staff_select_usuarios';
```

Expected: one row back, `cmd = 'SELECT'`, `qual = 'es_staff()'`.

- [ ] **Step 3: No commit needed**

This step has no repo files to commit — the DB is the artifact. Note in the task report that the migration was applied directly against the live project (ref `yoalngiolqwyrhmveosn`).

---

### Task 2: `lib/types.ts` additions + `lib/usuarios.ts` (suspend/reactivate logic)

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/usuarios.ts`
- Test: `lib/usuarios.test.ts`

**Interfaces:**
- Consumes: nothing (pure, no dependency on earlier tasks).
- Produces:
  - `UsuarioRow` (type, `lib/types.ts`) — one row from `public.usuarios`.
  - `TiendaResumen` (type, `lib/types.ts`) — `{ nombre: string; categoria: string | null; logo_url: string | null }`.
  - `ProveedorConTienda` (type, `lib/types.ts`) — `ProveedorRow & { tiendas: TiendaResumen | null }`.
  - `AccionCuenta = "suspender" | "reactivar"` (type, `lib/usuarios.ts`).
  - `accionCuentaDisponible(estado: string): AccionCuenta | null` (function, `lib/usuarios.ts`) — later tasks (`AccionSuspender.tsx`) call this to decide which button to show.

- [ ] **Step 1: Write the failing test**

Create `lib/usuarios.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { accionCuentaDisponible } from "./usuarios";

describe("accionCuentaDisponible", () => {
  it("ofrece suspender cuando la cuenta está aprobada", () => {
    expect(accionCuentaDisponible("aprobado")).toBe("suspender");
  });

  it("ofrece reactivar cuando la cuenta está rechazada", () => {
    expect(accionCuentaDisponible("rechazado")).toBe("reactivar");
  });

  it("no ofrece nada mientras la solicitud sigue en revisión", () => {
    expect(accionCuentaDisponible("pendiente")).toBeNull();
    expect(accionCuentaDisponible("en_revision")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/usuarios.test.ts`
Expected: FAIL — `Cannot find module './usuarios'` (file doesn't exist yet).

- [ ] **Step 3: Add the types**

In `lib/types.ts`, after the existing `RepartidorRow` interface, add:

```typescript
export interface UsuarioRow {
  id: number;
  username: string | null;
  email: string;
  direccion: string | null;
  avatar_url: string | null;
  creditos: number;
  verificado: boolean;
  created_at: string;
}

export interface TiendaResumen {
  nombre: string;
  categoria: string | null;
  logo_url: string | null;
}

export interface ProveedorConTienda extends ProveedorRow {
  tiendas: TiendaResumen | null;
}
```

- [ ] **Step 4: Write the implementation**

Create `lib/usuarios.ts`:

```typescript
export type AccionCuenta = "suspender" | "reactivar";

export function accionCuentaDisponible(estado: string): AccionCuenta | null {
  if (estado === "aprobado") return "suspender";
  if (estado === "rechazado") return "reactivar";
  return null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- lib/usuarios.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts lib/usuarios.ts lib/usuarios.test.ts
git commit -m "Add usuarios types and suspend/reactivate account-status helper"
```

---

### Task 3: Nav — green expanding rail

**Files:**
- Modify: `lib/nav-items.ts`
- Modify: `lib/nav-items.test.ts`
- Modify: `components/Nav.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing from Task 1/2.
- Produces: `NAV_ITEMS` now includes an enabled `/usuarios` entry — Task 6 (`usuarios/page.tsx`) relies on this being `enabled: true` to be reachable from the nav; no other task depends on `Nav.tsx`'s internals.

- [ ] **Step 1: Update the failing test first**

In `lib/nav-items.test.ts`, replace the enabled-hrefs assertion:

```typescript
import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("incluye los 5 módulos del dashboard", () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it("Métricas, Aprobaciones, Pedidos en vivo y Usuarios están habilitados; el resto no", () => {
    const enabled = NAV_ITEMS.filter((i) => i.enabled).map((i) => i.href);
    expect(enabled.sort()).toEqual(["/", "/aprobaciones", "/pedidos", "/usuarios"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/nav-items.test.ts`
Expected: FAIL — actual enabled hrefs are still `["/", "/aprobaciones", "/pedidos"]` (`/usuarios` missing).

- [ ] **Step 3: Enable the nav item**

In `lib/nav-items.ts`, change the `/usuarios` entry:

```typescript
  { href: "/usuarios", label: "Usuarios", enabled: true },
```

(label shortened from "Usuarios y actividad" — this task only covers the users list, not an activity feed).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/nav-items.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Rewrite the rail CSS**

In `app/globals.css`, replace the entire `/* ---- Sidebar ---- */` block (from `.sidebar {` through the end of `.sidebar-signout:hover { ... }`) with:

```css
.sidebar {
  width: 64px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  padding: var(--space-4) var(--space-2);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.is-expanded {
  width: 240px;
}

.sidebar-brand {
  color: var(--primary);
  font-weight: 700;
  font-size: 18px;
  margin-bottom: var(--space-4);
  padding: 0 var(--space-2);
  white-space: nowrap;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 14px;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.sidebar-link svg {
  flex-shrink: 0;
  opacity: 0.85;
  transition: filter 0.15s, color 0.15s;
}

.sidebar-link:hover {
  background: var(--bg-card-hover);
  color: var(--text-light);
}

.sidebar-link.is-active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--primary-light);
  font-weight: 600;
}

.sidebar-link.is-active svg {
  color: var(--primary);
  filter: drop-shadow(0 0 6px var(--primary-glow));
}

.sidebar-link.is-disabled {
  color: #555;
  pointer-events: none;
}

.sidebar-link-label {
  overflow: hidden;
}

.sidebar-spacer {
  flex: 1;
}

.sidebar-divider {
  border-top: 1px solid var(--border-color);
  margin: var(--space-3) 0;
}

.sidebar-signout {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  text-align: left;
  padding: 10px var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}

.sidebar-signout:hover {
  background: var(--bg-card-hover);
  color: var(--text-light);
}
```

(`.sidebar-link-label` has no visual styling of its own beyond `overflow: hidden` — its parent `.sidebar-link` already has `white-space: nowrap`, and the rail's `width` transition on `.sidebar` is what reveals/clips it, so no separate opacity/width animation on the span is needed.)

- [ ] **Step 6: Wrap link labels and wire the expand state in `Nav.tsx`**

Replace the full contents of `components/Nav.tsx` with:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { createClient } from "@/lib/supabase/client";

const ICONS: Record<string, React.ReactNode> = {
  "/": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  "/aprobaciones": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  "/pedidos": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
      <circle cx="9" cy="21" r="1.5" />
      <circle cx="18" cy="21" r="1.5" />
    </svg>
  ),
  "/salud": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  "/usuarios": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

const EQUIPO_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const SIGNOUT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export function Nav({ rol }: { rol: "admin" | "operador" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login.html";
    router.refresh();
  }

  return (
    <nav
      className={`sidebar${expanded ? " is-expanded" : ""}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="sidebar-brand">AgroVia Panel</div>
      <div className="sidebar-section">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.enabled ? item.href : "#"}
            className={`sidebar-link${pathname === item.href ? " is-active" : ""}${!item.enabled ? " is-disabled" : ""}`}
          >
            {ICONS[item.href]}
            <span className="sidebar-link-label">
              {item.label}
              {!item.enabled && " (próximamente)"}
            </span>
          </Link>
        ))}
        {rol === "admin" && (
          <Link href="/equipo" className={`sidebar-link${pathname === "/equipo" ? " is-active" : ""}`}>
            {EQUIPO_ICON}
            <span className="sidebar-link-label">Equipo</span>
          </Link>
        )}
      </div>
      <div className="sidebar-spacer" />
      <div className="sidebar-divider" />
      <button onClick={cerrarSesion} className="sidebar-signout">
        {SIGNOUT_ICON}
        <span className="sidebar-link-label">Cerrar sesión</span>
      </button>
    </nav>
  );
}
```

(Wrapping the label text in `<span className="sidebar-link-label">` is the only structural change from the current file — everything else, including the icon set, is unchanged. The `onClick` toggle on `<nav>` is the touch-device fallback for the `:hover`-driven desktop expand; tapping a link still navigates normally, the toggle firing alongside is harmless since the page is about to change.)

- [ ] **Step 7: Verify the build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all three green.

- [ ] **Step 8: Commit**

```bash
git add lib/nav-items.ts lib/nav-items.test.ts components/Nav.tsx app/globals.css
git commit -m "Redesign sidebar as a green expanding rail and enable the Usuarios nav item"
```

---

### Task 4: Modal CSS + `AccionSuspender.tsx`

**Files:**
- Modify: `app/globals.css`
- Create: `app/(dashboard)/usuarios/AccionSuspender.tsx`

**Interfaces:**
- Consumes: `accionCuentaDisponible` from `lib/usuarios.ts` (Task 2).
- Produces: `.modal-backdrop`/`.modal`/`.modal-header`/`.modal-close`/`.modal-row` CSS classes (used by `DetalleModal.tsx` in Task 5). `<AccionSuspender tipo id estado onCambiado>` component (used by `DetalleModal.tsx` in Task 5) — props `{ tipo: "proveedor" | "repartidor"; id: number; estado: string; onCambiado: (nuevoEstado: string) => void }`.

- [ ] **Step 1: Add modal CSS**

Append to `app/globals.css`:

```css
/* ---- Modal ---- */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-4);
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: var(--space-4);
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.modal-header h2 {
  color: var(--primary);
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: var(--space-1);
}

.modal-close:hover {
  color: var(--text-light);
}

.modal-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
}

.modal-row:last-of-type {
  border-bottom: none;
}

.modal-row-label {
  color: var(--text-muted);
}

.modal-row-value {
  color: var(--text-light);
  text-align: right;
}
```

- [ ] **Step 2: Write `AccionSuspender.tsx`**

Create `app/(dashboard)/usuarios/AccionSuspender.tsx` (this mirrors the structure of `AccionesAprobacion.tsx` but with only two possible transitions, and does not touch that file):

```typescript
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { accionCuentaDisponible } from "@/lib/usuarios";

const TABLA: Record<"proveedor" | "repartidor", string> = {
  proveedor: "proveedores",
  repartidor: "repartidores",
};

export function AccionSuspender({
  tipo,
  id,
  estado,
  onCambiado,
}: {
  tipo: "proveedor" | "repartidor";
  id: number;
  estado: string;
  onCambiado: (nuevoEstado: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const accion = accionCuentaDisponible(estado);
  if (!accion) return null;

  async function confirmar() {
    if (accion === "suspender" && !motivo.trim()) {
      setPidiendoMotivo(true);
      return;
    }
    setEnviando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nuevoEstado = accion === "suspender" ? "rechazado" : "aprobado";

    const { data } = await supabase
      .from(TABLA[tipo])
      .update({
        estado_aprobacion: nuevoEstado,
        comentario_revision: accion === "suspender" ? motivo.trim() : null,
        revisado_por: user?.id ?? null,
        revisado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    setEnviando(false);

    if (!data || data.length === 0) {
      alert("No se pudo guardar el cambio. Puede que no tengas permiso o el registro ya no exista.");
      return;
    }

    setPidiendoMotivo(false);
    setMotivo("");
    onCambiado(nuevoEstado);
  }

  return (
    <div style={{ marginTop: 16 }}>
      {pidiendoMotivo && (
        <textarea
          placeholder="Motivo de la suspensión (obligatorio)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          style={{ width: "100%", minHeight: 70, marginBottom: 10, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 10 }}
        />
      )}
      <button
        onClick={confirmar}
        disabled={enviando}
        className={`btn ${accion === "suspender" ? "btn-danger" : "btn-success"}`}
      >
        {enviando ? "Guardando..." : accion === "suspender" ? "Suspender cuenta" : "Reactivar cuenta"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all three green (no new tests in this task — `AccionSuspender.tsx` has no pure logic of its own beyond `accionCuentaDisponible`, which is already covered by `lib/usuarios.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css "app/(dashboard)/usuarios/AccionSuspender.tsx"
git commit -m "Add modal styles and the suspend/reactivate account action"
```

---

### Task 5: `DetalleModal.tsx`

**Files:**
- Create: `app/(dashboard)/usuarios/DetalleModal.tsx`

**Interfaces:**
- Consumes: `RepartidorRow`, `ProveedorConTienda`, `UsuarioRow` (`lib/types.ts`, Task 2), `etiquetaEstado`/`varianteBadgeEstado` (`lib/aprobaciones.ts`, already exists, unmodified), `AccionSuspender` (Task 4).
- Produces: `<DetalleModal seleccion onClose onCambiado />` — `seleccion` is one of the three tagged-union variants below. Task 6 (`UsuariosTabs.tsx`) renders this component and owns the `seleccion` state.

```typescript
type Seleccion =
  | { tipo: "repartidor"; data: RepartidorRow }
  | { tipo: "proveedor"; data: ProveedorConTienda }
  | { tipo: "cliente"; data: UsuarioRow };
```

- [ ] **Step 1: Write `DetalleModal.tsx`**

Create `app/(dashboard)/usuarios/DetalleModal.tsx`:

```typescript
"use client";

import type { ProveedorConTienda, RepartidorRow, UsuarioRow } from "@/lib/types";
import { etiquetaEstado, varianteBadgeEstado } from "@/lib/aprobaciones";
import { AccionSuspender } from "./AccionSuspender";

export type Seleccion =
  | { tipo: "repartidor"; data: RepartidorRow }
  | { tipo: "proveedor"; data: ProveedorConTienda }
  | { tipo: "cliente"; data: UsuarioRow };

function Fila({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="modal-row">
      <span className="modal-row-label">{label}</span>
      <span className="modal-row-value">{value}</span>
    </div>
  );
}

export function DetalleModal({
  seleccion,
  onClose,
  onCambiado,
}: {
  seleccion: Seleccion;
  onClose: () => void;
  onCambiado: (nuevoEstado: string) => void;
}) {
  const titulo =
    seleccion.tipo === "repartidor"
      ? "Repartidor"
      : seleccion.tipo === "proveedor"
        ? "Tienda"
        : "Cliente";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {seleccion.tipo === "repartidor" && (
          <>
            <Fila label="Nombre" value={seleccion.data.nombre} />
            <Fila label="Email" value={seleccion.data.email} />
            <Fila label="Teléfono" value={seleccion.data.telefono ?? "—"} />
            <Fila label="Cédula" value={seleccion.data.cedula} />
            <Fila label="Vehículo" value={seleccion.data.tipo_vehiculo} />
            <Fila label="Placa" value={seleccion.data.placa ?? "—"} />
            <Fila
              label="Estado"
              value={<span className={`badge badge--${varianteBadgeEstado(seleccion.data.estado_aprobacion)}`}>{etiquetaEstado(seleccion.data.estado_aprobacion)}</span>}
            />
            <Fila label="Registrado" value={new Date(seleccion.data.created_at).toLocaleDateString("es-CR")} />
            <AccionSuspender tipo="repartidor" id={seleccion.data.id} estado={seleccion.data.estado_aprobacion} onCambiado={onCambiado} />
          </>
        )}

        {seleccion.tipo === "proveedor" && (
          <>
            <Fila label="Nombre" value={seleccion.data.nombre} />
            <Fila label="Tienda" value={seleccion.data.tiendas?.nombre ?? "—"} />
            <Fila label="Categoría" value={seleccion.data.tiendas?.categoria ?? "—"} />
            <Fila label="Email" value={seleccion.data.email} />
            <Fila label="Teléfono" value={seleccion.data.telefono ?? "—"} />
            <Fila label="Tipo" value={seleccion.data.tipo_proveedor} />
            <Fila
              label="Estado"
              value={<span className={`badge badge--${varianteBadgeEstado(seleccion.data.estado_aprobacion)}`}>{etiquetaEstado(seleccion.data.estado_aprobacion)}</span>}
            />
            <Fila label="Registrado" value={new Date(seleccion.data.created_at).toLocaleDateString("es-CR")} />
            <AccionSuspender tipo="proveedor" id={seleccion.data.id} estado={seleccion.data.estado_aprobacion} onCambiado={onCambiado} />
          </>
        )}

        {seleccion.tipo === "cliente" && (
          <>
            <Fila label="Usuario" value={seleccion.data.username ?? "—"} />
            <Fila label="Email" value={seleccion.data.email} />
            <Fila label="Dirección" value={seleccion.data.direccion ?? "—"} />
            <Fila label="Créditos" value={seleccion.data.creditos} />
            <Fila label="Verificado" value={seleccion.data.verificado ? "Sí" : "No"} />
            <Fila label="Registrado" value={new Date(seleccion.data.created_at).toLocaleDateString("es-CR")} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all three green.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/usuarios/DetalleModal.tsx"
git commit -m "Add the account detail modal for the Usuarios module"
```

---

### Task 6: `UsuariosTabs.tsx` + `usuarios/page.tsx`

**Files:**
- Create: `app/(dashboard)/usuarios/UsuariosTabs.tsx`
- Create: `app/(dashboard)/usuarios/page.tsx`

**Interfaces:**
- Consumes: `RepartidorRow`, `ProveedorConTienda`, `UsuarioRow` (`lib/types.ts`), `etiquetaEstado`/`varianteBadgeEstado` (`lib/aprobaciones.ts`), `DetalleModal`/`Seleccion` (Task 5), `getStaffForUser` (`lib/staff.ts`, existing).
- Produces: the `/usuarios` route, reachable now that `NAV_ITEMS` marks it `enabled: true` (Task 3). Nothing else depends on this task.

- [ ] **Step 1: Write `UsuariosTabs.tsx`**

Create `app/(dashboard)/usuarios/UsuariosTabs.tsx` (same list+Realtime shape as `AprobacionesTable.tsx`, but three independent tabs loading *all* rows instead of one filtered pending list):

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { etiquetaEstado, varianteBadgeEstado } from "@/lib/aprobaciones";
import type { ProveedorConTienda, RepartidorRow, UsuarioRow } from "@/lib/types";
import { DetalleModal, type Seleccion } from "./DetalleModal";

type Pestana = "repartidor" | "proveedor" | "cliente";

const COLUMNAS_REPARTIDOR =
  "id, nombre, email, telefono, activo, foto_url, cedula, tipo_vehiculo, placa, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";
const COLUMNAS_PROVEEDOR =
  "id, nombre, email, tienda_id, telefono, tipo_proveedor, cedula, cedula_juridica, nombre_representante, cedula_representante, verificado_mag, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at, tiendas(nombre, categoria, logo_url)";
const COLUMNAS_CLIENTE = "id, username, email, direccion, avatar_url, creditos, verificado, created_at";

export function UsuariosTabs() {
  const [pestana, setPestana] = useState<Pestana>("repartidor");
  const [repartidores, setRepartidores] = useState<RepartidorRow[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorConTienda[]>([]);
  const [clientes, setClientes] = useState<UsuarioRow[]>([]);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      const [{ data: rep }, { data: prov }, { data: cli }] = await Promise.all([
        supabase.from("repartidores").select(COLUMNAS_REPARTIDOR).order("nombre").returns<RepartidorRow[]>(),
        supabase.from("proveedores").select(COLUMNAS_PROVEEDOR).order("nombre").returns<ProveedorConTienda[]>(),
        supabase.from("usuarios").select(COLUMNAS_CLIENTE).order("created_at", { ascending: false }).returns<UsuarioRow[]>(),
      ]);
      setRepartidores(rep ?? []);
      setProveedores(prov ?? []);
      setClientes(cli ?? []);
    }

    cargar();

    const channel = supabase
      .channel("usuarios-todos")
      .on("postgres_changes", { event: "*", schema: "public", table: "repartidores" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "proveedores" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "usuarios" }, cargar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function onCambiado(nuevoEstado: string) {
    if (seleccion?.tipo === "repartidor") {
      setRepartidores((prev) => prev.map((r) => (r.id === seleccion.data.id ? { ...r, estado_aprobacion: nuevoEstado as RepartidorRow["estado_aprobacion"] } : r)));
      setSeleccion({ tipo: "repartidor", data: { ...seleccion.data, estado_aprobacion: nuevoEstado as RepartidorRow["estado_aprobacion"] } });
    } else if (seleccion?.tipo === "proveedor") {
      setProveedores((prev) => prev.map((p) => (p.id === seleccion.data.id ? { ...p, estado_aprobacion: nuevoEstado as ProveedorConTienda["estado_aprobacion"] } : p)));
      setSeleccion({ tipo: "proveedor", data: { ...seleccion.data, estado_aprobacion: nuevoEstado as ProveedorConTienda["estado_aprobacion"] } });
    }
  }

  return (
    <div>
      <div className="filter-tabs">
        <button onClick={() => setPestana("repartidor")} className={`filter-tab${pestana === "repartidor" ? " is-active" : ""}`}>
          Repartidores
        </button>
        <button onClick={() => setPestana("proveedor")} className={`filter-tab${pestana === "proveedor" ? " is-active" : ""}`}>
          Tiendas
        </button>
        <button onClick={() => setPestana("cliente")} className={`filter-tab${pestana === "cliente" ? " is-active" : ""}`}>
          Clientes
        </button>
      </div>

      {pestana === "repartidor" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Vehículo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {repartidores.map((r) => (
              <tr key={r.id} onClick={() => setSeleccion({ tipo: "repartidor", data: r })} style={{ cursor: "pointer" }}>
                <td>{r.nombre}</td>
                <td className="cell-muted">{r.email}</td>
                <td className="cell-muted">{r.tipo_vehiculo}</td>
                <td>
                  <span className={`badge badge--${varianteBadgeEstado(r.estado_aprobacion)}`}>{etiquetaEstado(r.estado_aprobacion)}</span>
                </td>
              </tr>
            ))}
            {repartidores.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No hay repartidores registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {pestana === "proveedor" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tienda</th>
              <th>Email</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id} onClick={() => setSeleccion({ tipo: "proveedor", data: p })} style={{ cursor: "pointer" }}>
                <td>{p.nombre}</td>
                <td className="cell-muted">{p.tiendas?.nombre ?? "—"}</td>
                <td className="cell-muted">{p.email}</td>
                <td>
                  <span className={`badge badge--${varianteBadgeEstado(p.estado_aprobacion)}`}>{etiquetaEstado(p.estado_aprobacion)}</span>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No hay tiendas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {pestana === "cliente" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Créditos</th>
              <th>Registrado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} onClick={() => setSeleccion({ tipo: "cliente", data: c })} style={{ cursor: "pointer" }}>
                <td>{c.username ?? "—"}</td>
                <td className="cell-muted">{c.email}</td>
                <td className="cell-muted">{c.creditos}</td>
                <td className="cell-muted">{new Date(c.created_at).toLocaleDateString("es-CR")}</td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No hay clientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {seleccion && <DetalleModal seleccion={seleccion} onClose={() => setSeleccion(null)} onCambiado={onCambiado} />}
    </div>
  );
}
```

- [ ] **Step 2: Write `page.tsx`**

Create `app/(dashboard)/usuarios/page.tsx`. `app/(dashboard)/layout.tsx` already gates every dashboard route (redirects if there's no session or the staff row is inactive) before `children` renders, so — same as `aprobaciones/page.tsx` — this page does **not** repeat that check; it only needs one when a page adds an *extra* restriction beyond "any active staff", which Usuarios doesn't (unlike `equipo/page.tsx`, which re-checks because it's admin-only):

```typescript
import { UsuariosTabs } from "./UsuariosTabs";

export default function UsuariosPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Usuarios</h1>
        <p>Repartidores, tiendas y clientes registrados en AgroVia.</p>
      </div>
      <UsuariosTabs />
    </div>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all three green.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/usuarios/UsuariosTabs.tsx" "app/(dashboard)/usuarios/page.tsx"
git commit -m "Add the Usuarios module: Repartidores/Tiendas/Clientes tabs with Realtime"
```

---

### Task 7: Service-role admin client + `/api/equipo/invitar` route

**Files:**
- Create: `lib/supabase/admin.ts`
- Create: `app/api/equipo/invitar/route.ts`
- Modify: `.env.local.example`

**Interfaces:**
- Consumes: `getStaffForUser` (`lib/staff.ts`, existing), `createClient` from `lib/supabase/server.ts` (existing, session-aware).
- Produces: `createAdminClient()` (function, `lib/supabase/admin.ts`) — a `SupabaseClient` built with the service role key, for server-only code. `POST /api/equipo/invitar` accepting `{ nombre: string; email: string }` (no `rol` — every invite is created as `"operador"`; promoting to admin is done afterward from the existing role dropdown in `EquipoTable.tsx`), returning `{ ok: true }` (200) or `{ ok: false; error: string }` (400/403/500) — Task 8 (`InvitarForm.tsx`) calls this endpoint.

- [ ] **Step 1: Add the env var placeholder**

In `.env.local.example`, add a third line:

```
NEXT_PUBLIC_SUPABASE_URL=https://yoalngiolqwyrhmveosn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 2: Write the admin client**

Create `lib/supabase/admin.ts`:

```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- [ ] **Step 3: Write the route handler**

Create `app/api/equipo/invitar/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffForUser } from "@/lib/staff";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 403 });
  }

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || staff.rol !== "admin") {
    return NextResponse.json({ ok: false, error: "Solo un admin puede invitar personas." }, { status: 403 });
  }

  const body = await request.json();
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!nombre || !email) {
    return NextResponse.json({ ok: false, error: "Nombre y email son obligatorios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invitado, error: errorInvitacion } = await admin.auth.admin.inviteUserByEmail(email);

  if (errorInvitacion || !invitado.user) {
    return NextResponse.json({ ok: false, error: errorInvitacion?.message ?? "No se pudo enviar la invitación." }, { status: 500 });
  }

  const { error: errorInsert } = await admin
    .from("staff_dashboard")
    .insert({ user_id: invitado.user.id, nombre, email, rol: "operador", activo: true });

  if (errorInsert) {
    return NextResponse.json({ ok: false, error: `Se envió la invitación pero no se pudo crear el registro de staff: ${errorInsert.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify the build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all three green. (No unit test for the route in this task — it needs a real Supabase project and a real email invite to exercise meaningfully; this repo has no precedent for mocking `@supabase/supabase-js`, and the spec already documents that final verification is manual, done by the user after deploy.)

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/admin.ts "app/api/equipo/invitar/route.ts" .env.local.example
git commit -m "Add server-side staff invite endpoint using the Supabase service role"
```

---

### Task 8: `InvitarForm.tsx` + wire it into `/equipo`

**Files:**
- Create: `app/(dashboard)/equipo/InvitarForm.tsx`
- Modify: `app/(dashboard)/equipo/page.tsx`

**Interfaces:**
- Consumes: `POST /api/equipo/invitar` (Task 7).
- Produces: nothing consumed by later tasks — this is the last task in the plan.

- [ ] **Step 1: Write `InvitarForm.tsx`**

Create `app/(dashboard)/equipo/InvitarForm.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitarForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const res = await fetch("/api/equipo/invitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email }),
    });
    const data = await res.json();

    setEnviando(false);

    if (!data.ok) {
      alert(data.error ?? "No se pudo enviar la invitación.");
      return;
    }

    setNombre("");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="card" style={{ marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div>
        <label className="cell-muted" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
          Nombre
        </label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 8 }} />
      </div>
      <div>
        <label className="cell-muted" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
          Email
        </label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 8 }} />
      </div>
      <button type="submit" disabled={enviando} className="btn btn-primary">
        {enviando ? "Enviando..." : "Invitar"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Wire it into the Equipo page**

In `app/(dashboard)/equipo/page.tsx`, add the import and render it above `<EquipoTable>`:

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffForUser } from "@/lib/staff";
import { EquipoTable } from "./EquipoTable";
import { InvitarForm } from "./InvitarForm";
import type { StaffRow } from "@/lib/types";

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login.html");

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || staff.rol !== "admin") redirect("/");

  const { data: equipo } = await supabase.from("staff_dashboard").select("*").order("nombre");

  return (
    <div>
      <div className="page-header">
        <h1>Equipo</h1>
        <p>Staff con acceso al panel de AgroVia.</p>
      </div>
      <InvitarForm />
      <EquipoTable equipoInicial={(equipo ?? []) as StaffRow[]} miPropioId={staff.id} />
    </div>
  );
}
```

(`EquipoPage` already redirects non-admins before reaching this point, so `InvitarForm` never renders for an operador — no extra role check needed inside the form itself.)

- [ ] **Step 3: Verify the build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all three green.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/equipo/InvitarForm.tsx" "app/(dashboard)/equipo/page.tsx"
git commit -m "Add the admin-only invite form to the Equipo page"
```

---

## After all tasks

Push to `origin/master` only after the user has tried the panel (Usuarios tabs + modal, nav rail, Equipo invite) and confirmed it looks and works right — same rule as every previous round on this repo. Remind the user to add `SUPABASE_SERVICE_ROLE_KEY` to Vercel's environment variables before the invite feature will work in production (it's already required for `next dev` too, via `.env.local`).
