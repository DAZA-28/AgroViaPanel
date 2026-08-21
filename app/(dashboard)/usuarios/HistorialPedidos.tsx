"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { etiquetaEstadoPedido, varianteBadgeEstadoPedido } from "@/lib/pedidos-historial";

type PedidoHistorial = {
  id_pedido: string;
  estado: string;
  total: number;
  fecha_creacion: string;
  contraparte: string;
};

function formatearColones(total: number): string {
  return `₡${total.toLocaleString("es-CR")}`;
}

export function HistorialPedidos({
  tipo,
  clienteEmail,
  tiendaId,
  repartidorId,
}: {
  tipo: "cliente" | "proveedor" | "repartidor";
} & (
  | { tipo: "cliente"; clienteEmail: string; tiendaId?: never; repartidorId?: never }
  | { tipo: "proveedor"; tiendaId: number | null; clienteEmail?: never; repartidorId?: never }
  | { tipo: "repartidor"; repartidorId: number; clienteEmail?: never; tiendaId?: never }
)) {
  const [pedidos, setPedidos] = useState<PedidoHistorial[] | null>(null);

  useEffect(() => {
    if (tipo === "proveedor" && !tiendaId) {
      setPedidos([]);
      return;
    }

    let activo = true;
    async function cargar() {
      const supabase = createClient();

      if (tipo === "cliente") {
        const { data } = await supabase
          .from("pedidos")
          .select("id_pedido, estado, total, fecha_creacion, tiendas(nombre)")
          .eq("email_usuario", clienteEmail)
          .order("fecha_creacion", { ascending: false });
        if (activo) {
          setPedidos(
            (data ?? []).map((p) => ({
              id_pedido: p.id_pedido,
              estado: p.estado,
              total: p.total,
              fecha_creacion: p.fecha_creacion,
              contraparte: (p.tiendas as unknown as { nombre: string } | null)?.nombre ?? "—",
            }))
          );
        }
      } else if (tipo === "proveedor") {
        const { data } = await supabase
          .from("pedidos")
          .select("id_pedido, estado, total, fecha_creacion, email_usuario")
          .eq("tienda_id", tiendaId)
          .order("fecha_creacion", { ascending: false });
        if (activo) {
          setPedidos(
            (data ?? []).map((p) => ({
              id_pedido: p.id_pedido,
              estado: p.estado,
              total: p.total,
              fecha_creacion: p.fecha_creacion,
              contraparte: p.email_usuario,
            }))
          );
        }
      } else {
        const { data } = await supabase
          .from("pedidos")
          .select("id_pedido, estado, total, fecha_creacion, tiendas(nombre)")
          .eq("repartidor_id", repartidorId)
          .order("fecha_creacion", { ascending: false });
        if (activo) {
          setPedidos(
            (data ?? []).map((p) => ({
              id_pedido: p.id_pedido,
              estado: p.estado,
              total: p.total,
              fecha_creacion: p.fecha_creacion,
              contraparte: (p.tiendas as unknown as { nombre: string } | null)?.nombre ?? "—",
            }))
          );
        }
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, [tipo, clienteEmail, tiendaId, repartidorId]);

  return (
    <>
      <div className="historial-title">Historial de pedidos</div>
      <div className="historial-list">
        {pedidos === null ? (
          <div className="historial-empty">Cargando...</div>
        ) : pedidos.length === 0 ? (
          <div className="historial-empty">Sin pedidos registrados.</div>
        ) : (
          pedidos.map((p) => (
            <div key={p.id_pedido} className="historial-item">
              <div className="historial-item-main">
                <span className={`badge badge--${varianteBadgeEstadoPedido(p.estado)}`}>{etiquetaEstadoPedido(p.estado)}</span>
                <span className="historial-item-sub">
                  {new Date(p.fecha_creacion).toLocaleDateString("es-CR")} · {p.contraparte}
                </span>
              </div>
              <span className="historial-item-total">{formatearColones(p.total)}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
