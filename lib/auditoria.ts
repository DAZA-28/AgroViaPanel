import { etiquetaEstado } from "./aprobaciones";

export function etiquetaTransicion(anterior: string | null, nuevo: string): string {
  const etiquetaAnterior = anterior ? etiquetaEstado(anterior) : "—";
  return `${etiquetaAnterior} → ${etiquetaEstado(nuevo)}`;
}
