"use client";

import { useCountUp } from "@/lib/useCountUp";

export function StatCard({
  value,
  label,
  accent,
  formatear,
}: {
  value: number;
  label: string;
  accent?: boolean;
  formatear?: (valor: number) => string;
}) {
  const animado = useCountUp(value);

  return (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
      <div className="stat-card-value">{formatear ? formatear(animado) : animado}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
