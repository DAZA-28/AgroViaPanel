import { etiquetaEstado } from "./aprobaciones";

export type RangoFecha = "7d" | "30d" | "90d" | "todo";

const DIAS_POR_RANGO: Record<Exclude<RangoFecha, "todo">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function fechaDesde(rango: RangoFecha, ahora: Date = new Date()): string | null {
  if (rango === "todo") return null;
  const dias = DIAS_POR_RANGO[rango];
  return new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export function etiquetaTransicion(anterior: string | null, nuevo: string): string {
  const etiquetaAnterior = anterior ? etiquetaEstado(anterior) : "—";
  return `${etiquetaAnterior} → ${etiquetaEstado(nuevo)}`;
}
