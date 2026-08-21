import { describe, expect, it } from "vitest";
import { etiquetaEstadoPedido, varianteBadgeEstadoPedido } from "./pedidos-historial";

describe("etiquetaEstadoPedido", () => {
  it("traduce cada estado a una etiqueta legible", () => {
    expect(etiquetaEstadoPedido("PEDIDO")).toBe("Pedido");
    expect(etiquetaEstadoPedido("LISTO")).toBe("Listo");
    expect(etiquetaEstadoPedido("RECOGIDO")).toBe("Recogido");
    expect(etiquetaEstadoPedido("ENTREGADO")).toBe("Entregado");
    expect(etiquetaEstadoPedido("CANCELADO")).toBe("Cancelado");
  });
  it("devuelve el estado tal cual si no lo reconoce", () => {
    expect(etiquetaEstadoPedido("OTRO")).toBe("OTRO");
  });
});

describe("varianteBadgeEstadoPedido", () => {
  it("mapea cada estado a la variante de color esperada", () => {
    expect(varianteBadgeEstadoPedido("PEDIDO")).toBe("warning");
    expect(varianteBadgeEstadoPedido("LISTO")).toBe("pending");
    expect(varianteBadgeEstadoPedido("RECOGIDO")).toBe("info");
    expect(varianteBadgeEstadoPedido("ENTREGADO")).toBe("success");
    expect(varianteBadgeEstadoPedido("CANCELADO")).toBe("error");
  });
  it("cae a neutral para un estado desconocido", () => {
    expect(varianteBadgeEstadoPedido("OTRO")).toBe("neutral");
  });
});
