const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export function estaPendienteDeRevision(estado: string): boolean {
  return estado === "pendiente" || estado === "en_revision";
}

export function etiquetaEstado(estado: string): string {
  return ETIQUETAS[estado] ?? estado;
}

export type FiltroEstado = "pendientes" | "aprobado" | "rechazado" | "todos";

export function filtraPorEstado(estado: string, filtro: FiltroEstado): boolean {
  if (filtro === "todos") return true;
  if (filtro === "pendientes") return estaPendienteDeRevision(estado);
  return estado === filtro;
}

const VARIANTES_BADGE: Record<string, string> = {
  pendiente: "warning",
  en_revision: "pending",
  aprobado: "success",
  rechazado: "error",
};

export function varianteBadgeEstado(estado: string): string {
  return VARIANTES_BADGE[estado] ?? "neutral";
}

export type Accion = "aprobar" | "rechazar" | "pedir_revision";

export function accionesDisponibles(tipo: "proveedor" | "repartidor", estado: string): Accion[] {
  if (!estaPendienteDeRevision(estado)) return [];
  const acciones: Accion[] = ["aprobar", "rechazar"];
  if (tipo === "repartidor" && estado === "pendiente") {
    acciones.push("pedir_revision");
  }
  return acciones;
}
