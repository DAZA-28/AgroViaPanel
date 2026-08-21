const ETIQUETAS: Record<string, string> = {
  PEDIDO: "Pedido",
  LISTO: "Listo",
  RECOGIDO: "Recogido",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export function etiquetaEstadoPedido(estado: string): string {
  return ETIQUETAS[estado] ?? estado;
}

const VARIANTES_BADGE: Record<string, string> = {
  PEDIDO: "warning",
  LISTO: "pending",
  RECOGIDO: "info",
  ENTREGADO: "success",
  CANCELADO: "error",
};

export function varianteBadgeEstadoPedido(estado: string): string {
  return VARIANTES_BADGE[estado] ?? "neutral";
}
