"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cargarConteos, construirGruposMetricas, type ConteosMetricas } from "@/lib/metricas";
import { StatCard } from "./StatCard";

const CONTEOS_VACIOS: ConteosMetricas = {
  proveedores: { pendiente: 0, aprobado: 0, rechazado: 0 },
  repartidores: { pendiente: 0, aprobado: 0, rechazado: 0 },
  pedidos: { activos: 0, entregados: 0, cancelados: 0 },
  tiendasTotal: 0,
};

export function MetricasPanel() {
  const [conteos, setConteos] = useState<ConteosMetricas>(CONTEOS_VACIOS);

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      setConteos(await cargarConteos(supabase));
    }

    cargar();

    const channel = supabase
      .channel("metricas-home")
      .on("postgres_changes", { event: "*", schema: "public", table: "proveedores" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "repartidores" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "tiendas" }, cargar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const grupos = construirGruposMetricas(conteos);

  return (
    <>
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
    </>
  );
}
