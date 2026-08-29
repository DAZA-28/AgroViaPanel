import type { SupabaseClient } from "@supabase/supabase-js";

export async function contar(
  supabase: SupabaseClient,
  tabla: string,
  columna: string,
  valores: string[]
): Promise<number> {
  const { count } = await supabase
    .from(tabla)
    .select("*", { count: "exact", head: true })
    .in(columna, valores);
  return count ?? 0;
}

export async function cargarConteos(supabase: SupabaseClient): Promise<ConteosMetricas> {
  const [
    proveedoresPendiente,
    proveedoresAprobado,
    proveedoresRechazado,
    repartidoresPendiente,
    repartidoresAprobado,
    repartidoresRechazado,
    pedidosActivos,
    pedidosEntregados,
    pedidosCancelados,
    { count: tiendasTotal },
  ] = await Promise.all([
    contar(supabase, "proveedores", "estado_aprobacion", ["pendiente"]),
    contar(supabase, "proveedores", "estado_aprobacion", ["aprobado"]),
    contar(supabase, "proveedores", "estado_aprobacion", ["rechazado"]),
    contar(supabase, "repartidores", "estado_aprobacion", ["pendiente", "en_revision"]),
    contar(supabase, "repartidores", "estado_aprobacion", ["aprobado"]),
    contar(supabase, "repartidores", "estado_aprobacion", ["rechazado"]),
    contar(supabase, "pedidos", "estado", ["PEDIDO", "LISTO", "RECOGIDO"]),
    contar(supabase, "pedidos", "estado", ["ENTREGADO"]),
    contar(supabase, "pedidos", "estado", ["CANCELADO"]),
    supabase.from("tiendas").select("*", { count: "exact", head: true }),
  ]);

  return {
    proveedores: { pendiente: proveedoresPendiente, aprobado: proveedoresAprobado, rechazado: proveedoresRechazado },
    repartidores: { pendiente: repartidoresPendiente, aprobado: repartidoresAprobado, rechazado: repartidoresRechazado },
    pedidos: { activos: pedidosActivos, entregados: pedidosEntregados, cancelados: pedidosCancelados },
    tiendasTotal: tiendasTotal ?? 0,
  };
}

export interface ConteosMetricas {
  proveedores: { pendiente: number; aprobado: number; rechazado: number };
  repartidores: { pendiente: number; aprobado: number; rechazado: number };
  pedidos: { activos: number; entregados: number; cancelados: number };
  tiendasTotal: number;
}

export interface StatItem {
  label: string;
  value: number;
  accent?: boolean;
}

export interface StatGroup {
  title: string;
  stats: StatItem[];
}

export function construirGruposMetricas(conteos: ConteosMetricas): StatGroup[] {
  return [
    {
      title: "Proveedores",
      stats: [
        { label: "Pendientes de revisión", value: conteos.proveedores.pendiente, accent: true },
        { label: "Aprobados", value: conteos.proveedores.aprobado },
        { label: "Rechazados", value: conteos.proveedores.rechazado },
      ],
    },
    {
      title: "Repartidores",
      stats: [
        { label: "Pendientes de revisión", value: conteos.repartidores.pendiente, accent: true },
        { label: "Aprobados", value: conteos.repartidores.aprobado },
        { label: "Rechazados", value: conteos.repartidores.rechazado },
      ],
    },
    {
      title: "Pedidos",
      stats: [
        { label: "Activos ahora", value: conteos.pedidos.activos, accent: true },
        { label: "Entregados", value: conteos.pedidos.entregados },
        { label: "Cancelados", value: conteos.pedidos.cancelados },
      ],
    },
    {
      title: "Tiendas",
      stats: [{ label: "Registradas", value: conteos.tiendasTotal }],
    },
  ];
}
