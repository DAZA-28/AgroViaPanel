# Auditoría de Aprobaciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Historial inmutable (quién/cuándo/por qué) de cada aprobar/rechazar/pedir_revision/suspender/reactivar sobre proveedores y repartidores, visible en una página nueva `/auditoria` del panel de staff.

**Architecture:** Tabla nueva `auditoria_aprobaciones` en Supabase, alimentada por un trigger `AFTER UPDATE` (no por código de React) cada vez que `estado_aprobacion` cambia en `proveedores`/`repartidores`. RLS de solo lectura para staff — nadie tiene permiso de escritura directa. Página nueva en el panel (Next.js) que lee esa tabla con filtros y paginación, siguiendo el mismo patrón de componente cliente + Realtime que ya usan `PedidosTable.tsx`/`AprobacionesTable.tsx`/`MetricasPanel.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (Postgres + RLS + Realtime + `@supabase/ssr`), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-28-auditoria-aprobaciones-design.md`

## Global Constraints

- El historial arranca desde que se aplica la migración — no hay backfill de eventos pasados (no existen, no se pueden reconstruir).
- Nadie (ni admin) puede escribir/editar/borrar filas de `auditoria_aprobaciones` a mano — solo el trigger `SECURITY DEFINER`.
- No se toca `AccionesAprobacion.tsx` ni `AccionSuspender.tsx` — el trigger no depende de código de React.
- Sin dependencias npm nuevas.
- Migraciones de base de datos van con `mcp__supabase__apply_migration` (versionadas), nunca con SQL suelto vía `execute_sql`.
- Cualquier verificación SQL contra datos reales (proveedores/repartidores existentes) va envuelta en `begin; ... rollback;` — no se deja ningún cambio permanente en filas reales solo para probar el trigger.
- Convención de testing de este repo (ya establecida en las 2 tandas anteriores): la lógica pura en `lib/*.ts` lleva tests con TDD; los componentes que solo hacen wiring de Supabase Realtime + JSX (como `PedidosTable.tsx`, `AprobacionesTable.tsx`, `MetricasPanel.tsx`) no llevan test propio — `AuditoriaTable.tsx` sigue el mismo patrón.
- Verificación estándar antes de cada commit de código: `npm test`, `npx tsc --noEmit`, `npm run build` deben quedar limpios.

---

### Task 1: Migración de base de datos — tabla, trigger y RLS

**Files:**
- Ninguno en el repo (esta tarea no toca el working tree — la migración vive en Supabase, aplicada vía MCP; el repo no tiene `supabase/migrations/` local, las migraciones existentes tampoco lo tienen).

**Interfaces:**
- Consumes: nada.
- Produces: tabla `public.auditoria_aprobaciones` (columnas `id, entidad_tipo, entidad_id, entidad_nombre, estado_anterior, estado_nuevo, comentario, staff_id, staff_nombre, creado_en`), función `public.registrar_auditoria_aprobacion()`, triggers `trg_auditoria_proveedores`/`trg_auditoria_repartidores`. Task 4 consume esta tabla vía `supabase.from("auditoria_aprobaciones")`.

- [ ] **Step 1: Aplicar la migración**

Llamar a la tool `mcp__supabase__apply_migration` con:
- `name`: `auditoria_aprobaciones`
- `query`:

```sql
create table public.auditoria_aprobaciones (
  id bigint generated always as identity primary key,
  entidad_tipo text not null check (entidad_tipo in ('proveedor', 'repartidor')),
  entidad_id bigint not null,
  entidad_nombre text not null,
  estado_anterior text,
  estado_nuevo text not null,
  comentario text,
  staff_id uuid,
  staff_nombre text,
  creado_en timestamptz not null default now()
);

alter table public.auditoria_aprobaciones enable row level security;

create policy staff_select_auditoria on public.auditoria_aprobaciones
  for select using (es_staff());

create function public.registrar_auditoria_aprobacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_staff_nombre text;
begin
  if NEW.estado_aprobacion is distinct from OLD.estado_aprobacion then
    select nombre into v_staff_nombre from staff_dashboard where user_id = NEW.revisado_por;
    insert into auditoria_aprobaciones
      (entidad_tipo, entidad_id, entidad_nombre, estado_anterior, estado_nuevo, comentario, staff_id, staff_nombre)
    values
      (TG_ARGV[0], NEW.id, NEW.nombre, OLD.estado_aprobacion, NEW.estado_aprobacion, NEW.comentario_revision, NEW.revisado_por, v_staff_nombre);
  end if;
  return NEW;
end;
$$;

create trigger trg_auditoria_proveedores after update on public.proveedores
  for each row execute function public.registrar_auditoria_aprobacion('proveedor');

create trigger trg_auditoria_repartidores after update on public.repartidores
  for each row execute function public.registrar_auditoria_aprobacion('repartidor');
```

- [ ] **Step 2: Verificar que el trigger dispara, sin dejar cambios reales**

Llamar a `mcp__supabase__execute_sql` con esta query (usa una fila real de `proveedores` pero revierte todo con `rollback`, así no queda ningún cambio permanente):

```sql
begin;
  update proveedores
  set estado_aprobacion = 'rechazado', comentario_revision = 'prueba de trigger (rollback)', revisado_por = null
  where id = (select id from proveedores order by id limit 1);

  select entidad_tipo, entidad_id, entidad_nombre, estado_anterior, estado_nuevo, comentario, staff_nombre
  from auditoria_aprobaciones
  order by id desc
  limit 1;
rollback;
```

Expected: la fila que devuelve el `select` tiene `estado_nuevo = 'rechazado'` y `comentario = 'prueba de trigger (rollback)'`. Como todo corrió dentro de `begin;`/`rollback;`, el proveedor real queda intacto (verificar con `select estado_aprobacion from proveedores where id = <mismo id>;` fuera de la transacción — debe mostrar el valor original, no `'rechazado'`).

- [ ] **Step 3: Verificar que RLS bloquea escritura directa**

Llamar a `mcp__supabase__execute_sql` con:

```sql
begin;
  set local role authenticated;
  insert into auditoria_aprobaciones (entidad_tipo, entidad_id, entidad_nombre, estado_nuevo)
  values ('proveedor', 999999, 'test rls', 'aprobado');
rollback;
```

Expected: error de permiso/RLS (`new row violates row-level security policy` o `permission denied`), no un insert exitoso. Si el insert se ejecuta sin error, la policy está mal — parar y revisar antes de seguir a la Task 2.

---

### Task 2: `lib/auditoria.ts` — helpers puros (TDD)

**Files:**
- Create: `lib/auditoria.ts`
- Test: `lib/auditoria.test.ts`

**Interfaces:**
- Consumes: `etiquetaEstado` de `lib/aprobaciones.ts` (ya existe, firma `etiquetaEstado(estado: string): string`).
- Produces: `export type RangoFecha = "7d" | "30d" | "90d" | "todo"`, `export function fechaDesde(rango: RangoFecha, ahora?: Date): string | null`, `export function etiquetaTransicion(anterior: string | null, nuevo: string): string`. Task 4 los importa de `@/lib/auditoria`.

- [ ] **Step 1: Escribir los tests que deben fallar**

Crear `lib/auditoria.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { etiquetaTransicion, fechaDesde } from "./auditoria";

describe("fechaDesde", () => {
  it("'todo' no aplica corte de fecha", () => {
    expect(fechaDesde("todo")).toBeNull();
  });

  it("'7d' devuelve la fecha 7 dias antes en ISO", () => {
    const ahora = new Date("2026-08-28T12:00:00.000Z");
    expect(fechaDesde("7d", ahora)).toBe("2026-08-21T12:00:00.000Z");
  });

  it("'30d' devuelve la fecha 30 dias antes en ISO", () => {
    const ahora = new Date("2026-08-28T12:00:00.000Z");
    expect(fechaDesde("30d", ahora)).toBe("2026-07-29T12:00:00.000Z");
  });

  it("'90d' devuelve la fecha 90 dias antes en ISO", () => {
    const ahora = new Date("2026-08-28T12:00:00.000Z");
    expect(fechaDesde("90d", ahora)).toBe("2026-05-30T12:00:00.000Z");
  });
});

describe("etiquetaTransicion", () => {
  it("formatea 'anterior -> nuevo' con las etiquetas ya existentes", () => {
    expect(etiquetaTransicion("pendiente", "aprobado")).toBe("Pendiente → Aprobado");
  });

  it("usa un guion cuando no hay estado anterior", () => {
    expect(etiquetaTransicion(null, "aprobado")).toBe("— → Aprobado");
  });
});
```

- [ ] **Step 2: Correr los tests y confirmar que fallan por la razón correcta**

Run: `npx vitest run lib/auditoria.test.ts`
Expected: FAIL — `Cannot find module './auditoria'` (el archivo todavía no existe). Si falla por otra razón (typo, etc.), corregir el test antes de seguir.

- [ ] **Step 3: Implementación mínima**

Crear `lib/auditoria.ts`:

```ts
import { etiquetaEstado } from "./aprobaciones";

export type RangoFecha = "7d" | "30d" | "90d" | "todo";

const DIAS_POR_RANGO: Record<Exclude<RangoFecha, "todo">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function fechaDesde(rango: RangoFecha, ahora: Date = new Date()): string | null {
  if (rango === "todo") return null;
  const dias = DIAS_POR_RANGO[rango];
  return new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export function etiquetaTransicion(anterior: string | null, nuevo: string): string {
  const etiquetaAnterior = anterior ? etiquetaEstado(anterior) : "—";
  return `${etiquetaAnterior} → ${etiquetaEstado(nuevo)}`;
}
```

- [ ] **Step 4: Correr los tests y confirmar que pasan**

Run: `npx vitest run lib/auditoria.test.ts`
Expected: PASS, 6 tests verdes.

- [ ] **Step 5: Commit**

```bash
git add lib/auditoria.ts lib/auditoria.test.ts
git commit -m "Agregar helpers de auditoria (rango de fecha, etiqueta de transicion)"
```

---

### Task 3: Tipo `AuditoriaRow`, ítem de nav e ícono

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/nav-items.ts`
- Modify: `components/Nav.tsx`
- Test: `lib/nav-items.test.ts` (ya existe — revisar que siga pasando, no hace falta un caso nuevo salvo que el archivo ya testee el contenido exacto de `NAV_ITEMS`, en cuyo caso hay que actualizarlo)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `export interface AuditoriaRow` en `lib/types.ts` (campos = columnas de la Task 1); `NAV_ITEMS` incluye `{ href: "/auditoria", label: "Auditoría", enabled: true }`; `Nav.tsx` tiene una entrada `"/auditoria"` en su mapa `ICONS`. Task 4 usa `AuditoriaRow` para tipar las filas.

- [ ] **Step 1: Actualizar `lib/nav-items.test.ts` (fija la lista exacta hoy — 5 ítems, 4 habilitados)**

`lib/nav-items.test.ts` hoy tiene estas dos aserciones que van a romperse al agregar `/auditoria`:

```ts
  it("incluye los 5 módulos del dashboard", () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it("Métricas, Aprobaciones, Pedidos en vivo y Usuarios están habilitados; el resto no", () => {
    const enabled = NAV_ITEMS.filter((i) => i.enabled).map((i) => i.href);
    expect(enabled.sort()).toEqual(["/", "/aprobaciones", "/pedidos", "/usuarios"]);
  });
```

Reemplazar ese archivo completo por:

```ts
import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("incluye los 6 módulos del dashboard", () => {
    expect(NAV_ITEMS).toHaveLength(6);
  });

  it("Métricas, Aprobaciones, Pedidos en vivo, Usuarios y Auditoría están habilitados; el resto no", () => {
    const enabled = NAV_ITEMS.filter((i) => i.enabled).map((i) => i.href);
    expect(enabled.sort()).toEqual(["/", "/aprobaciones", "/auditoria", "/pedidos", "/usuarios"]);
  });
});
```

Correr `npx vitest run lib/nav-items.test.ts` y confirmar que ahora falla (todavía no se agregó el ítem en `nav-items.ts` — `toHaveLength(6)` falla contra los 5 actuales).

- [ ] **Step 2: Agregar el tipo `AuditoriaRow`**

En `lib/types.ts`, agregar al final del archivo:

```ts
export interface AuditoriaRow {
  id: number;
  entidad_tipo: "proveedor" | "repartidor";
  entidad_id: number;
  entidad_nombre: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  staff_id: string | null;
  staff_nombre: string | null;
  creado_en: string;
}
```

- [ ] **Step 3: Agregar el ítem de nav**

En `lib/nav-items.ts`, agregar una entrada al final del array `NAV_ITEMS` (después de `Usuarios`):

```ts
  { href: "/auditoria", label: "Auditoría", enabled: true },
```

- [ ] **Step 4: Agregar el ícono**

En `components/Nav.tsx`, agregar una entrada al objeto `ICONS` (después de la de `"/usuarios"`):

```tsx
  "/auditoria": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
```

- [ ] **Step 5: Correr los tests y confirmar que pasan**

Run: `npx vitest run lib/nav-items.test.ts` (y `npm test` completo)
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts lib/nav-items.ts lib/nav-items.test.ts components/Nav.tsx
git commit -m "Agregar tipo AuditoriaRow, item de nav e icono para /auditoria"
```

---

### Task 4: Página `/auditoria`

**Files:**
- Create: `app/(dashboard)/auditoria/AuditoriaTable.tsx`
- Create: `app/(dashboard)/auditoria/page.tsx`

**Interfaces:**
- Consumes: `fechaDesde`, `etiquetaTransicion`, `RangoFecha` de `@/lib/auditoria` (Task 2); `AuditoriaRow`, `StaffRow` de `@/lib/types` (Task 3 y ya existente); tabla `auditoria_aprobaciones` (Task 1); `createClient` de `@/lib/supabase/client` (ya existe).
- Produces: ruta `/auditoria` navegable desde el sidebar.

- [ ] **Step 1: Crear `AuditoriaTable.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { etiquetaTransicion, fechaDesde, type RangoFecha } from "@/lib/auditoria";
import type { AuditoriaRow, StaffRow } from "@/lib/types";

const PAGINA = 50;

const ETIQUETAS_RANGO: Record<RangoFecha, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  todo: "Todo",
};

export function AuditoriaTable() {
  const [filas, setFilas] = useState<AuditoriaRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [rango, setRango] = useState<RangoFecha>("30d");
  const [tipo, setTipo] = useState<"todos" | "proveedor" | "repartidor">("todos");
  const [staffId, setStaffId] = useState<string>("todos");
  const [hayMas, setHayMas] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);

  const cargarPagina = useCallback(
    async (desde: number) => {
      const supabase = createClient();
      let query = supabase
        .from("auditoria_aprobaciones")
        .select("*")
        .order("creado_en", { ascending: false })
        .range(desde, desde + PAGINA - 1);

      const corte = fechaDesde(rango);
      if (corte) query = query.gte("creado_en", corte);
      if (tipo !== "todos") query = query.eq("entidad_tipo", tipo);
      if (staffId !== "todos") query = query.eq("staff_id", staffId);

      const { data } = await query.returns<AuditoriaRow[]>();
      return data ?? [];
    },
    [rango, tipo, staffId]
  );

  useEffect(() => {
    const supabase = createClient();

    async function cargarInicial() {
      const pagina = await cargarPagina(0);
      setFilas(pagina);
      setHayMas(pagina.length === PAGINA);
    }

    cargarInicial();

    const channel = supabase
      .channel("auditoria-aprobaciones")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "auditoria_aprobaciones" }, cargarInicial)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarPagina]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("staff_dashboard")
      .select("*")
      .returns<StaffRow[]>()
      .then(({ data }) => setStaff(data ?? []));
  }, []);

  async function cargarMas() {
    setCargandoMas(true);
    const pagina = await cargarPagina(filas.length);
    setFilas((actuales) => [...actuales, ...pagina]);
    setHayMas(pagina.length === PAGINA);
    setCargandoMas(false);
  }

  return (
    <div>
      <div className="filter-tabs">
        {(["7d", "30d", "90d", "todo"] as const).map((r) => (
          <button key={r} onClick={() => setRango(r)} className={`filter-tab${rango === r ? " is-active" : ""}`}>
            {ETIQUETAS_RANGO[r]}
          </button>
        ))}
      </div>
      <div className="filter-tabs">
        {(["todos", "proveedor", "repartidor"] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)} className={`filter-tab${tipo === t ? " is-active" : ""}`}>
            {t === "todos" ? "Todos" : t === "proveedor" ? "Proveedores" : "Repartidores"}
          </button>
        ))}
      </div>
      <div className="filter-tabs">
        <button onClick={() => setStaffId("todos")} className={`filter-tab${staffId === "todos" ? " is-active" : ""}`}>
          Todo el staff
        </button>
        {staff.map((s) => (
          <button key={s.user_id} onClick={() => setStaffId(s.user_id)} className={`filter-tab${staffId === s.user_id ? " is-active" : ""}`}>
            {s.nombre}
          </button>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Entidad</th>
            <th>Transición</th>
            <th>Staff</th>
            <th>Comentario</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id}>
              <td className="cell-muted">{new Date(f.creado_en).toLocaleString("es-CR")}</td>
              <td>
                {f.entidad_tipo === "proveedor" ? "Proveedor" : "Repartidor"} · {f.entidad_nombre}
              </td>
              <td>{etiquetaTransicion(f.estado_anterior, f.estado_nuevo)}</td>
              <td className="cell-muted">{f.staff_nombre ?? f.staff_id ?? "—"}</td>
              <td className="cell-muted">{f.comentario ?? "—"}</td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr className="empty-row">
              <td colSpan={5}>No hay eventos para este filtro.</td>
            </tr>
          )}
        </tbody>
      </table>
      {hayMas && (
        <button onClick={cargarMas} disabled={cargandoMas} className="btn btn-secondary" style={{ marginTop: 16 }}>
          {cargandoMas ? "Cargando..." : "Cargar más"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Crear `page.tsx`**

```tsx
import { AuditoriaTable } from "./AuditoriaTable";

export default function AuditoriaPage() {
  return (
    <div className="view-panel">
      <div className="page-header">
        <h1>Auditoría</h1>
        <p>Historial de aprobaciones, rechazos y suspensiones de proveedores y repartidores.</p>
      </div>
      <AuditoriaTable />
    </div>
  );
}
```

- [ ] **Step 3: Verificación completa**

Run, en orden:
1. `npm test` — Expected: todos los test files en verde (incluye los de la Task 2 y los ya existentes, sin regresiones).
2. `npx tsc --noEmit` — Expected: sin errores.
3. `npm run build` — Expected: build exitoso, `/auditoria` aparece en la tabla de rutas generadas (como dinámica `ƒ`, igual que `/aprobaciones`, `/pedidos`, `/usuarios`).

Si cualquiera de los tres falla, arreglar antes de commitear — no commitear con la suite en rojo.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/auditoria/AuditoriaTable.tsx" "app/(dashboard)/auditoria/page.tsx"
git commit -m "Agregar pagina /auditoria: historial de aprobaciones con filtros y paginacion"
```

---

## Después de las 4 tareas

No pushear automáticamente — como en las tandas anteriores, avisar al usuario que el código está listo, que lo pruebe en el browser (filtros, "Cargar más", que aparezcan eventos nuevos en vivo al aprobar/rechazar algo desde otra pestaña) y esperar su confirmación antes de `git push`.
