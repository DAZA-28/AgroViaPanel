"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fechaDesde, type RangoFecha } from "@/lib/fechas";
import { agruparPorDia, calcularResumenVentas, completarSerieDiaria, type TransaccionConEstado } from "@/lib/ventas";
import { StatCard } from "../StatCard";
import { TendenciaChart } from "./TendenciaChart";

const ETIQUETAS_RANGO: Record<RangoFecha, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  todo: "Todo",
};

const ETIQUETAS_METODO: Record<string, string> = {
  TARJETA_STRIPE: "Tarjeta",
  EFECTIVO: "Efectivo",
};

function formatearColones(valor: number): string {
  return `₡${Math.round(valor).toLocaleString("es-CR")}`;
}

type FilaTransaccion = { monto: number; metodo: string; fecha_transaccion: string; pedidos: { estado: string } | null };

export function VentasPanel() {
  const [transacciones, setTransacciones] = useState<TransaccionConEstado[]>([]);
  const [rango, setRango] = useState<RangoFecha>("30d");

  const cargarDatos = useCallback(async (): Promise<TransaccionConEstado[]> => {
    const supabase = createClient();
    const ahora = new Date();
    let query = supabase.from("transacciones").select("monto, metodo, fecha_transaccion, pedidos(estado)");

    const corte = fechaDesde(rango, ahora);
    if (corte) query = query.gte("fecha_transaccion", corte);

    const { data } = await query.returns<FilaTransaccion[]>();
    return (data ?? []).map((f) => ({
      monto: f.monto,
      metodo: f.metodo,
      fecha_transaccion: f.fecha_transaccion,
      estado_pedido: f.pedidos?.estado ?? null,
    }));
  }, [rango]);

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      setTransacciones(await cargarDatos());
    }

    cargar();

    const channel = supabase
      .channel("ventas")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transacciones" }, cargar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarDatos]);

  const resumen = calcularResumenVentas(transacciones);
  const serieDiaria = agruparPorDia(transacciones);
  const ahora = new Date();
  const corte = fechaDesde(rango, ahora);
  const serie = corte ? completarSerieDiaria(serieDiaria, new Date(corte), ahora) : serieDiaria;

  return (
    <div>
      <div className="filter-tabs">
        {(["7d", "30d", "90d", "todo"] as const).map((r) => (
          <button key={r} onClick={() => setRango(r)} className={`filter-tab${rango === r ? " is-active" : ""}`}>
            {ETIQUETAS_RANGO[r]}
          </button>
        ))}
      </div>

      <div className="stat-grid" style={{ marginBottom: "var(--space-5)" }}>
        <StatCard value={resumen.gmv} label="GMV del período" accent formatear={formatearColones} />
        <StatCard value={resumen.ticketPromedio} label="Ticket promedio" formatear={formatearColones} />
        <StatCard value={resumen.cantidadPedidos} label="Pedidos pagados" />
      </div>

      <div className="stat-group-title">Por método de pago</div>
      <div className="stat-grid" style={{ marginBottom: "var(--space-5)" }}>
        {Object.entries(ETIQUETAS_METODO).map(([metodo, etiqueta]) => (
          <StatCard key={metodo} value={resumen.porMetodo[metodo] ?? 0} label={etiqueta} formatear={formatearColones} />
        ))}
      </div>

      <div className="stat-group-title">Tendencia</div>
      <div className="card">
        <TendenciaChart serie={serie} />
      </div>
    </div>
  );
}
