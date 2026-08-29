# Auditoría de aprobaciones

## Contexto

Segunda tanda de una auditoría más amplia del Dashboard (`AgroViaPanel`)
pedida por el usuario para dejarlo "lo más profesional" posible, tanto en
UI/UX como en necesidades reales de la empresa. La primera tanda (bugs +
accesibilidad — métricas realmente en vivo, `revisado_por` legible, toasts
en vez de `alert()`, `aria-current`) ya está commiteada y pusheada
(`f5eac9d`).

Esta tanda cubre accountability: con `Equipo` ya permitiendo invitar a
varios operadores, hoy no hay forma de saber quién aprobó/rechazó/suspendió
qué y cuándo, más allá del **último** movimiento (`revisado_por`/
`revisado_en`/`comentario_revision` en `proveedores`/`repartidores` son
campos mutables que se sobreescriben en cada acción — verificado contra la
base real vía MCP de Supabase, no hay ninguna tabla de historial hoy).

Decisión tomada con el usuario: en vez de una vista que solo muestre el
último estado (rápida pero pierde el pasado), se construye un historial de
verdad — tabla nueva append-only, alimentada por trigger de Postgres en vez
de código de la app, para que no se pueda romper ni olvidar el día que se
agregue una tercera forma de cambiar `estado_aprobacion`.

## Alcance

Dentro:
- Tabla nueva `auditoria_aprobaciones` (migración vía `apply_migration`).
- Trigger `AFTER UPDATE` en `proveedores` y `repartidores` que graba cada
  transición de `estado_aprobacion` automáticamente.
- RLS: staff puede `SELECT`; nadie tiene permiso de escritura directa (solo
  el trigger, `SECURITY DEFINER`).
- Página nueva `/auditoria`: tabla con filtro de rango de fechas, tipo de
  entidad y staff, con paginación ("Cargar más") y actualización en vivo
  (Realtime `INSERT`) de eventos nuevos.
- Ítem de nav "Auditoría", visible para todo el staff (es de solo lectura,
  no requiere admin).

Fuera de alcance:
- **Historial retroactivo.** El trigger graba desde que se aplica la
  migración en adelante. Lo que pasó antes (ej. el único registro de
  `proveedores` que ya existe) no se puede reconstruir porque el dato viejo
  nunca se guardó — el usuario lo sabe.
- Tocar `AccionesAprobacion.tsx`/`AccionSuspender.tsx` — no hace falta,
  el trigger no depende de código de React.
- Auditoría de `pedidos`/`transacciones` (dinero) — es la tanda 3
  (métricas de negocio), no esta.
- Exportar CSV del historial — no lo pidió el usuario, se puede agregar
  después si hace falta.

## 1. Modelo de datos

Verificado contra el schema real (`proveedores`/`repartidores` tienen
`nombre`, `estado_aprobacion`, `comentario_revision`, `revisado_por`
(`uuid`, FK a `auth.users`), `revisado_en`; `staff_dashboard` tiene
`user_id`, `nombre`; helper `es_staff()` ya existe y es el mismo que usan
`staff_select_proveedores`/`staff_select_repartidores`).

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
```

`entidad_nombre` y `staff_nombre` se guardan como **snapshot** en el momento
del evento (no join en vivo) — si se borra una tienda o alguien sale del
equipo, el historial no se rompe ni cambia lo que ya mostró. Sin FK a
`proveedores`/`repartidores` porque `entidad_id` es polimórfico (mismo
rango de ids en las dos tablas según `entidad_tipo`).

No se agrega ninguna policy de `insert`/`update`/`delete` para roles
normales — la única forma de escribir es el trigger de abajo, que corre con
privilegios de su dueño (`security definer`), no con los del usuario
autenticado. Así ni un admin puede editar o borrar una fila a mano desde el
panel ni desde el SQL editor con su propio usuario.

## 2. Trigger

```sql
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

Solo dispara cuando `estado_aprobacion` realmente cambia (no en cada
`update` — evita ruido de otros campos que se editen a futuro). Cubre las 5
transiciones que ya existen hoy sin distinguir código React: aprobar,
rechazar, pedir revisión, suspender, reactivar — todas pasan por el mismo
`update` de `estado_aprobacion`.

**Verificación antes de dar por cerrada la migración:** una escritura de
prueba (`update proveedores set estado_aprobacion = estado_aprobacion ...`
no dispara nada por el `is distinct from`; se prueba con un cambio real de
estado en un registro de prueba) confirmando que aparece la fila esperada
en `auditoria_aprobaciones` y que un `insert`/`update`/`delete` directo
contra la tabla desde `authenticated` es rechazado por RLS.

## 3. UI — página `/auditoria`

- `lib/auditoria.ts` (nuevo, con tests): helpers puros —
  `fechaDesde(rango: "7d" | "30d" | "90d" | "todo"): string | null` (calcula
  el corte ISO) y `etiquetaTransicion(anterior: string | null, nuevo: string): string`
  (reusa `etiquetaEstado` de `lib/aprobaciones.ts` para no duplicar el
  diccionario de estados).
- `app/(dashboard)/auditoria/page.tsx` — server component, mismo gate de
  sesión que el resto (cualquier staff activo, no solo admin).
- `app/(dashboard)/auditoria/AuditoriaTable.tsx` — client component, mismo
  patrón de `PedidosTable.tsx`/`MetricasPanel.tsx`: fetch inicial +
  suscripción Realtime, pero solo a eventos `INSERT` (la tabla es
  append-only, no hace falta escuchar `UPDATE`/`DELETE`) que antepone la
  fila nueva a la lista sin recargar todo.
  - Filtros: rango de fecha (7/30/90 días/Todo, arrancando en 30 días para
    no traer de más), tipo de entidad (Todos/Proveedores/Repartidores),
    staff (select poblado con una consulta aparte a `staff_dashboard`
    completo — tabla chica, 3 filas hoy — no con los nombres que aparecen
    en la página cargada, para no perder staff que solo tiene eventos en
    páginas siguientes).
  - Paginación: `order by creado_en desc limit 50`, botón "Cargar más" que
    pide la siguiente página con `range()`. Primera vista paginada del
    panel — el resto siempre cargó todo de una porque las listas son
    chicas (pendientes de aprobación, pedidos activos); esta crece para
    siempre.
  - Columnas: Fecha, Entidad (tipo + `entidad_nombre`), Transición (badge
    estado anterior → badge estado nuevo), Staff (`staff_nombre`, con
    fallback al UUID si es null — cuenta borrada de `staff_dashboard`),
    Comentario.
- `lib/nav-items.ts`: agregar
  `{ href: "/auditoria", label: "Auditoría", enabled: true }`.
- `components/Nav.tsx`: ícono nuevo en `ICONS` (reloj/historial) para
  `/auditoria`.

## Testing

- `lib/auditoria.ts`: TDD real (test primero, ver fallar, implementar) —
  mismo patrón que `nombreRevisor` de la tanda 1.
- `AuditoriaTable.tsx`/`page.tsx`: sin test propio, seguiendo la misma
  convención ya establecida en el repo para componentes que solo hacen
  wiring de Supabase Realtime + JSX (`PedidosTable.tsx`,
  `AprobacionesTable.tsx`, `MetricasPanel.tsx` tampoco lo tienen).
- Migración: se aplica con `apply_migration` (versionada, no SQL suelto) y
  se verifica con la escritura de prueba descrita arriba antes de tocar el
  código de la UI.
- Verificación estándar del repo: `npm test`, `tsc --noEmit`, `npm run
  build`. Confirmación visual final (colores, filtros, paginación) queda
  para que el usuario la pruebe en el browser, como en la tanda anterior.
