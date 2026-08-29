"use client";

import { useState } from "react";
import type { PuntoSerie } from "@/lib/ventas";

const ANCHO = 640;
const ALTO = 200;
const PAD_IZQ = 56;
const PAD_DER = 16;
const PAD_ARRIBA = 16;
const PAD_ABAJO = 28;
const VERDE = "#4CAF50";

function formatearMonto(monto: number): string {
  return `₡${Math.round(monto).toLocaleString("es-CR")}`;
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia)).toLocaleDateString("es-CR", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function TendenciaChart({ serie }: { serie: PuntoSerie[] }) {
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);

  if (serie.length === 0) {
    return <p className="cell-muted">No hay datos suficientes para mostrar una tendencia.</p>;
  }

  const anchoPlot = ANCHO - PAD_IZQ - PAD_DER;
  const altoPlot = ALTO - PAD_ARRIBA - PAD_ABAJO;
  const montoMax = Math.max(...serie.map((p) => p.monto), 1);

  const escalaX = (i: number) => (serie.length === 1 ? PAD_IZQ + anchoPlot / 2 : PAD_IZQ + (i / (serie.length - 1)) * anchoPlot);
  const escalaY = (monto: number) => PAD_ARRIBA + (1 - monto / montoMax) * altoPlot;
  const baseY = PAD_ARRIBA + altoPlot;

  const puntos = serie.map((p, i) => ({ x: escalaX(i), y: escalaY(p.monto), dato: p }));
  const lineaD = puntos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const areaD = `${lineaD} L ${puntos[puntos.length - 1].x},${baseY} L ${puntos[0].x},${baseY} Z`;

  const ticksY = [0, montoMax / 2, montoMax];
  const mostrarLabelX = (i: number) => i === 0 || i === serie.length - 1 || i === Math.floor((serie.length - 1) / 2);

  function posicionDesdePuntero(clientX: number, svg: SVGSVGElement) {
    const rect = svg.getBoundingClientRect();
    const xSvg = ((clientX - rect.left) / rect.width) * ANCHO;
    let masCercano = 0;
    let distanciaMin = Infinity;
    puntos.forEach((p, i) => {
      const d = Math.abs(p.x - xSvg);
      if (d < distanciaMin) {
        distanciaMin = d;
        masCercano = i;
      }
    });
    setIndiceActivo(masCercano);
  }

  const activo = indiceActivo !== null ? puntos[indiceActivo] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        width="100%"
        height={ALTO}
        role="img"
        aria-label="Tendencia de GMV por día"
        onPointerMove={(e) => posicionDesdePuntero(e.clientX, e.currentTarget)}
        onPointerLeave={() => setIndiceActivo(null)}
      >
        {ticksY.map((valor, i) => (
          <g key={i}>
            <line
              x1={PAD_IZQ}
              x2={ANCHO - PAD_DER}
              y1={escalaY(valor)}
              y2={escalaY(valor)}
              stroke="var(--border-color)"
              strokeWidth={1}
            />
            <text x={PAD_IZQ - 8} y={escalaY(valor)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-muted)">
              {formatearMonto(valor)}
            </text>
          </g>
        ))}

        {serie.map((p, i) =>
          mostrarLabelX(i) ? (
            <text key={p.fecha} x={escalaX(i)} y={ALTO - 8} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
              {formatearFecha(p.fecha)}
            </text>
          ) : null
        )}

        <path d={areaD} fill={VERDE} opacity={0.1} stroke="none" />
        <path d={lineaD} fill="none" stroke={VERDE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {activo && (
          <line x1={activo.x} x2={activo.x} y1={PAD_ARRIBA} y2={baseY} stroke="var(--border-color)" strokeWidth={1} />
        )}
        {puntos.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === indiceActivo ? 5 : 3}
            fill={VERDE}
            stroke="var(--bg-card)"
            strokeWidth={2}
          />
        ))}
      </svg>

      {activo && (
        <div
          style={{
            position: "absolute",
            left: `${(activo.x / ANCHO) * 100}%`,
            top: 0,
            transform: activo.x > ANCHO / 2 ? "translateX(-100%)" : "translateX(0)",
            background: "var(--bg-card-hover)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: 12,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ color: "var(--text-light)", fontWeight: 600 }}>{formatearMonto(activo.dato.monto)}</div>
          <div className="cell-muted">
            {formatearFecha(activo.dato.fecha)} · {activo.dato.cantidad} pedido{activo.dato.cantidad === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
