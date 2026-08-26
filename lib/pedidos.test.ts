import { describe, expect, it } from "vitest";
import { ESTADOS_ACTIVOS, etiquetaEstadoPedido, tiempoTranscurrido, varianteBadgeEstadoPedido } from "./pedidos";

describe("ESTADOS_ACTIVOS", () => {
  it("incluye los 3 estados no terminales", () => {
    expect(ESTADOS_ACTIVOS).toEqual(["PEDIDO", "LISTO", "RECOGIDO"]);
  });
});

describe("etiquetaEstadoPedido", () => {
  it("traduce cada estado a una etiqueta legible", () => {
    expect(etiquetaEstadoPedido("PEDIDO")).toBe("Nuevo");
    expect(etiquetaEstadoPedido("LISTO")).toBe("Listo para recoger");
    expect(etiquetaEstadoPedido("RECOGIDO")).toBe("En camino");
    expect(etiquetaEstadoPedido("ENTREGADO")).toBe("Entregado");
    expect(etiquetaEstadoPedido("CANCELADO")).toBe("Cancelado");
  });

  it("cae al estado crudo si no lo reconoce", () => {
    expect(etiquetaEstadoPedido("OTRO")).toBe("OTRO");
  });
});

describe("varianteBadgeEstadoPedido", () => {
  it("mapea cada estado a la variante de color esperada", () => {
    expect(varianteBadgeEstadoPedido("PEDIDO")).toBe("pending");
    expect(varianteBadgeEstadoPedido("LISTO")).toBe("warning");
    expect(varianteBadgeEstadoPedido("RECOGIDO")).toBe("info");
    expect(varianteBadgeEstadoPedido("ENTREGADO")).toBe("success");
    expect(varianteBadgeEstadoPedido("CANCELADO")).toBe("error");
  });

  it("cae a neutral para un estado desconocido", () => {
    expect(varianteBadgeEstadoPedido("OTRO")).toBe("neutral");
  });
});

describe("tiempoTranscurrido", () => {
  const ahora = new Date("2026-08-20T12:00:00Z");

  it("menos de un minuto: 'hace un momento'", () => {
    expect(tiempoTranscurrido("2026-08-20T11:59:40Z", ahora)).toBe("hace un momento");
  });

  it("minutos", () => {
    expect(tiempoTranscurrido("2026-08-20T11:45:00Z", ahora)).toBe("hace 15 min");
  });

  it("horas", () => {
    expect(tiempoTranscurrido("2026-08-20T09:00:00Z", ahora)).toBe("hace 3 h");
  });

  it("días", () => {
    expect(tiempoTranscurrido("2026-08-18T12:00:00Z", ahora)).toBe("hace 2 d");
  });
});
