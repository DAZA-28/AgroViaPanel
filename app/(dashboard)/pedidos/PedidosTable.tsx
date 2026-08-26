"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ESTADOS_ACTIVOS, etiquetaEstadoPedido, tiempoTranscurrido, varianteBadgeEstadoPedido, type EstadoPedido } from "@/lib/pedidos";
import type { PedidoActivoRow } from "@/lib/types";

const COLUMNAS = "id_pedido, email_usuario, total, estado, fecha_creacion, tiendas(nombre), repartidores(nombre)";

export function PedidosTable() {
  const [pedidos, setPedidos] = useState<PedidoActivoRow[]>([]);
  const [filtro, setFiltro] = useState<"todos" | EstadoPedido>("todos");
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      const { data } = await supabase
        .from("pedidos")
        .select(COLUMNAS)
        .in("estado", ESTADOS_ACTIVOS)
        .order("fecha_creacion", { ascending: false })
        .returns<PedidoActivoRow[]>();
      setPedidos(data ?? []);
    }

    cargar();

    const channel = supabase
      .channel("pedidos-activos")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, cargar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const visibles = pedidos.filter((p) => filtro === "todos" || p.estado === filtro);

  return (
    <div>
      <div className="filter-tabs">
        {(["todos", ...ESTADOS_ACTIVOS] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`filter-tab${filtro === f ? " is-active" : ""}`}
          >
            {f === "todos" ? "Todos" : etiquetaEstadoPedido(f)}
          </button>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Tienda</th>
            <th>Repartidor</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((p) => (
            <tr key={p.id_pedido}>
              <td>
                <span className={`badge badge--${varianteBadgeEstadoPedido(p.estado)}`}>{etiquetaEstadoPedido(p.estado)}</span>
              </td>
              <td>{p.tiendas?.nombre ?? "—"}</td>
              <td className="cell-muted">{p.repartidores?.nombre ?? "Sin asignar"}</td>
              <td className="cell-muted">{p.email_usuario}</td>
              <td>₡{p.total.toLocaleString("es-CR")}</td>
              <td className="cell-muted">{tiempoTranscurrido(p.fecha_creacion, ahora)}</td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr className="empty-row"><td colSpan={6}>No hay pedidos activos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
