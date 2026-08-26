import { createClient } from "@/lib/supabase/server";
import { construirGruposMetricas, type ConteosMetricas } from "@/lib/metricas";
import { StatCard } from "./StatCard";

async function contar(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

async function cargarConteos(): Promise<ConteosMetricas> {
  const supabase = await createClient();

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

export default async function HomePage() {
  const conteos = await cargarConteos();
  const grupos = construirGruposMetricas(conteos);

  return (
    <div className="view-panel" style={{ position: "relative" }}>
      <div className="ambient-glow" aria-hidden="true"></div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Métricas</h1>
          <p>Estado general del ecosistema AgroVia en este momento.</p>
        </div>
        <div className="live-badge"><span className="live-dot"></span>En vivo</div>
      </div>
      {grupos.map((grupo) => (
        <div className="stat-group" key={grupo.title}>
          <div className="stat-group-title">{grupo.title}</div>
          <div className="stat-grid">
            {grupo.stats.map((stat) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} accent={stat.accent} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
