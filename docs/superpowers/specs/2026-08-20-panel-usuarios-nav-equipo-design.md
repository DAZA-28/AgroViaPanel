# Panel de Usuarios + riel de nav expandible + invitar a Equipo

## Contexto

Continúa sobre `AgroViaPanel` (Next.js/React — esta tarea NO es parte de la
migración a HTML/CSS/JS que arrancó por el login; ese trabajo sigue pausado
ahí). Tres pedidos juntos en la misma sesión:

1. Un módulo nuevo donde el staff vea **todos** los repartidores, tiendas
   (proveedores) y clientes — no solo los pendientes de aprobación (eso ya
   lo cubre `/aprobaciones`) — con un modal de detalle por registro.
2. Rediseño visual del nav lateral (`components/Nav.tsx`).
3. Poder agregar staff nuevo desde `/equipo` (hoy es de solo lectura salvo
   cambiar rol/activo; alta de cuentas es 100% manual en Supabase Studio).

Corrección importante surgida en el brainstorming: la idea inicial de
"activar/desactivar" cuentas usando una columna `activo` nueva en
`proveedores`/`usuarios` era incorrecta — `repartidores.activo`/`disponible`
ya existen pero son campos **operacionales** (si el repartidor está
buscando pedidos), no de acceso administrativo, y tocarlos desde el panel
rompería esa funcionalidad real de la app Repartidor. La forma correcta de
suspender/reactivar una cuenta es reusar `estado_aprobacion`
(`aprobado` ⇄ `rechazado`), el mismo campo que ya gobierna el gate de login
de Proveedor/Repartidor.

## Alcance

Dentro:
- Módulo nuevo `/usuarios` con 3 pestañas: Repartidores, Tiendas
  (proveedores), Clientes.
- Modal de detalle reutilizable, con acción Suspender/Reactivar en
  Repartidores y Tiendas (Clientes es solo lectura).
- Policy RLS nueva para que staff pueda leer `usuarios` (hoy no puede).
- Rediseño de `Nav.tsx` a un riel expandible.
- Formulario "Invitar" en `/equipo` (solo admin) + endpoint server-side que
  invita por email y crea la fila en `staff_dashboard`.

Fuera de alcance:
- Borrado real de cuentas de staff (el botón Desactivar que ya existe
  alcanza, confirmado con el usuario).
- Cualquier cambio a `repartidores.activo`/`disponible` — son operacionales,
  no se tocan.
- Suspender/reactivar Clientes — sin campo de estado, sin pedido del
  usuario, la pestaña Clientes es puramente de lectura.
- Migrar más pantallas a HTML/CSS/JS (roadmap aparte, ver bitácora del
  login).
- El rediseño visual React viejo sin commitear ("1b" en la bitácora del
  dashboard) — no se toca ni se asume vigente en esta tarea.

## 1. Panel de Usuarios (`/usuarios`)

### Datos y RLS

- **Repartidores**: `repartidores` completo (ya tiene `staff_select_repartidores`
  vía `es_staff()`, sin cambios de RLS).
- **Tiendas**: `proveedores` con join a `tiendas(nombre, categoria, logo_url)`
  vía `tienda_id` (ya tiene `staff_select_proveedores`, sin cambios de RLS).
- **Clientes**: `usuarios` (id, username, email, direccion, avatar_url,
  creditos, verificado, created_at — la tabla no tiene columna de teléfono,
  confirmado contra el esquema real). **Bloqueo real
  encontrado** (verificado con `pg_policies` contra el proyecto Supabase real,
  no supuesto): no hay ninguna policy que permita a staff leer `usuarios` hoy
  (solo dueño, o repartidor con un pedido asignado de ese cliente). Se agrega
  una migración:
  ```sql
  create policy staff_select_usuarios on public.usuarios
    for select using (es_staff());
  ```
  Mismo patrón exacto que `staff_select_proveedores`/`staff_select_repartidores`
  (helper `es_staff()` ya existe). Solo SELECT — no se agrega UPDATE, la
  pestaña Clientes no muta nada.

### Componentes

- `app/(dashboard)/usuarios/page.tsx` — server component, gate de sesión
  igual que `equipo/page.tsx` (no requiere admin, cualquier staff activo
  puede ver, igual que Aprobaciones).
- `app/(dashboard)/usuarios/UsuariosTabs.tsx` — client component, mismo
  patrón de `filter-tabs` + Realtime que `AprobacionesTable.tsx`, pero 3
  pestañas fijas (no un filtro sobre una lista combinada) y sin el filtro de
  estado pendiente (`.select()` sin `.in("estado_aprobacion", ESTADOS_PENDIENTES)`).
  Cada pestaña es su propia tabla con columnas relevantes al tipo (repartidor:
  nombre/email/vehículo/estado; tienda: nombre tienda/dueño/email/estado;
  cliente: nombre/email/créditos/registrado).
- `app/(dashboard)/usuarios/DetalleModal.tsx` — client component, modal
  genérico parametrizado por `{ tipo: "repartidor" | "tienda" | "cliente",
  data }`, renderiza los campos relevantes por tipo. Para repartidor/tienda
  incluye `<AccionSuspender tipo id estado>` (nuevo, hermano chico de
  `AccionesAprobacion.tsx`: solo dos transiciones, `aprobado → rechazado` con
  motivo obligatorio y `rechazado → aprobado` sin motivo — no reimplementa
  `pedir_revision`, eso sigue siendo exclusivo del flujo de Aprobaciones).
- CSS nuevo en `globals.css`: `.modal-backdrop`/`.modal` (no existe ningún
  estilo de modal en el repo todavía).

### Nav

Se habilita el ítem `{ href: "/usuarios", label: "Usuarios", enabled: true }`
en `lib/nav-items.ts` (ya existe como placeholder deshabilitado con el label
"Usuarios y actividad" — se acorta a "Usuarios", que es lo que realmente
cubre esta tanda; "actividad" queda para otra ronda si se pide).

## 2. Nav lateral — riel expandible verde

Elegido entre 3 opciones mostradas con mockups animados reales (cajón
off-canvas con overlay, riel expandible, overlay a pantalla completa) vía
`superpowers:brainstorming` con su companion visual — el usuario eligió el
riel expandible.

Reemplaza el `<nav className="sidebar">` fijo de `Nav.tsx`:
- Ancho por defecto angosto (solo un punto/ícono por ítem); al `:hover` (y
  `onClick`/`onTouchStart` en pantallas táctiles, para que funcione sin mouse)
  se expande mostrando las etiquetas, con transición de `width` (no de
  posición — no es un overlay, sigue empujando el contenido como hoy).
- El punto/ícono del ítem activo se resalta en verde `#4CAF50` (el `--primary`
  ya establecido en `globals.css`), con un glow sutil (`box-shadow`) — mismo
  tono que ya usa `.badge--success` y los acentos del dashboard, no se
  introduce un verde nuevo.
- Mismo contenido de siempre (logo, ítems de `NAV_ITEMS`, Equipo condicional
  a admin, cerrar sesión) — solo cambia el mecanismo de layout/animación, no
  la lista de secciones ni los permisos de quién ve qué.
- Mobile: dado que hoy no hay tratamiento responsive documentado para el nav,
  se mantiene fuera de alcance un rediseño mobile-first; el riel expandible
  por tap ya es utilizable en pantallas táctiles angostas sin trabajo extra.

## 3. Equipo — invitar por email

- `app/(dashboard)/equipo/InvitarForm.tsx` (nuevo, solo se renderiza si
  `rol === "admin"` en `EquipoPage`): campos **nombre y email únicamente**
  (sin selector de rol — el usuario pidió explícitamente que la invitación
  agregue solo esos dos datos), POST a `/api/equipo/invitar`, refresca la
  tabla al terminar. Toda invitación nueva entra como `"operador"`;
  promoverla a admin se hace después desde el selector de rol que ya existe
  en `EquipoTable.tsx` — no hace falta elegirlo en el alta.
- `app/api/equipo/invitar/route.ts` (Next.js Route Handler nuevo):
  1. Lee la sesión desde las cookies (`lib/supabase/server.ts`, cliente
     normal) y valida `getStaffForUser(...).rol === "admin"` — si no,
     `403`. Esto es necesario porque el cliente admin de abajo se salta RLS
     por completo; sin esta validación cualquiera que le pegue al endpoint
     directo podría crear staff.
  2. Crea un cliente separado con la **service role key**
     (`lib/supabase/admin.ts`, nuevo — `createClient` de
     `@supabase/supabase-js` puro, sin cookies, análogo a `server.ts` pero
     con `SUPABASE_SERVICE_ROLE_KEY`) y llama
     `admin.auth.admin.inviteUserByEmail(email)`.
  3. Inserta en `staff_dashboard` (`user_id` del paso anterior, nombre, email,
     rol, `activo: true`) con ese mismo cliente admin.
  4. Devuelve success/error; si el paso 3 falla después de que el paso 2 ya
     invitó al usuario, se reporta el error igual (no hay rollback de la
     invitación — caso raro, aceptable, el admin puede reintentar o borrar
     el usuario huérfano de Auth a mano si pasa).
- Variable de entorno nueva: `SUPABASE_SERVICE_ROLE_KEY`, documentada en
  `.env.local.example` — el usuario tiene que sacarla de Supabase Dashboard
  → Project Settings → API y agregarla a Vercel (nunca se expone al cliente,
  solo se lee en el Route Handler).

## Testing

- `lib/aprobaciones.ts`/`AccionesAprobacion.tsx` no se tocan — la lógica de
  Suspender/Reactivar vive en un helper nuevo separado
  (`puedeSuspenderReactivar` en un archivo nuevo, p.ej. `lib/usuarios.ts`),
  con sus propios tests unitarios, para no arriesgar el flujo de Aprobaciones
  que ya funciona.
- `lib/usuarios.ts` (nuevo): tests de las transiciones válidas de
  suspender/reactivar (mismo estilo que `lib/aprobaciones.test.ts`).
- `app/api/equipo/invitar/route.ts`: se prueba con `npm run build` +
  `tsc --noEmit` (compila) y verificación manual del usuario en producción
  (no se puede probar el envío de un email real ni la llamada admin de
  Supabase Auth desde este entorno sandbox).
- Verificación automatizada estándar del repo en cada task: `npm test`,
  `tsc --noEmit`, `npm run build`. Sin acceso a Chrome real en este entorno
  — confirmación visual final (nav, modal, colores) queda para que el
  usuario la pruebe, como en las rondas anteriores.
