"use client";

import { useCountUp } from "@/lib/useCountUp";

export function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  const animado = useCountUp(value);

  return (
    <div className={`stat-card${accent ? " stat-card--accent" : ""}`}>
      <div className="stat-card-value">{animado}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
