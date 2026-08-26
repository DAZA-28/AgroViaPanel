export type EstadoPedido = "PEDIDO" | "LISTO" | "RECOGIDO" | "ENTREGADO" | "CANCELADO";

export const ESTADOS_ACTIVOS: EstadoPedido[] = ["PEDIDO", "LISTO", "RECOGIDO"];

const ETIQUETAS: Record<string, string> = {
  PEDIDO: "Nuevo",
  LISTO: "Listo para recoger",
  RECOGIDO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const VARIANTES_BADGE: Record<string, string> = {
  PEDIDO: "pending",
  LISTO: "warning",
  RECOGIDO: "info",
  ENTREGADO: "success",
  CANCELADO: "error",
};

export function etiquetaEstadoPedido(estado: string): string {
  return ETIQUETAS[estado] ?? estado;
}

export function varianteBadgeEstadoPedido(estado: string): string {
  return VARIANTES_BADGE[estado] ?? "neutral";
}

export function tiempoTranscurrido(fechaIso: string, ahora: Date = new Date()): string {
  const segundos = Math.max(0, Math.floor((ahora.getTime() - new Date(fechaIso).getTime()) / 1000));

  if (segundos < 60) return "hace un momento";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}
