import { describe, expect, it } from "vitest";
import { accionesDisponibles, estaPendienteDeRevision, etiquetaEstado, varianteBadgeEstado } from "./aprobaciones";

describe("estaPendienteDeRevision", () => {
  it("es true para pendiente y en_revision", () => {
    expect(estaPendienteDeRevision("pendiente")).toBe(true);
    expect(estaPendienteDeRevision("en_revision")).toBe(true);
  });
  it("es false para aprobado y rechazado", () => {
    expect(estaPendienteDeRevision("aprobado")).toBe(false);
    expect(estaPendienteDeRevision("rechazado")).toBe(false);
  });
});

describe("etiquetaEstado", () => {
  it("traduce cada estado a una etiqueta legible", () => {
    expect(etiquetaEstado("pendiente")).toBe("Pendiente");
    expect(etiquetaEstado("en_revision")).toBe("En revisión");
    expect(etiquetaEstado("aprobado")).toBe("Aprobado");
    expect(etiquetaEstado("rechazado")).toBe("Rechazado");
  });
});

describe("varianteBadgeEstado", () => {
  it("mapea cada estado a la variante de color esperada", () => {
    expect(varianteBadgeEstado("pendiente")).toBe("warning");
    expect(varianteBadgeEstado("en_revision")).toBe("pending");
    expect(varianteBadgeEstado("aprobado")).toBe("success");
    expect(varianteBadgeEstado("rechazado")).toBe("error");
  });
  it("cae a neutral para un estado desconocido", () => {
    expect(varianteBadgeEstado("otro")).toBe("neutral");
  });
});

describe("accionesDisponibles", () => {
  it("proveedor pendiente: aprobar o rechazar, sin pedir revision", () => {
    expect(accionesDisponibles("proveedor", "pendiente")).toEqual(["aprobar", "rechazar"]);
  });
  it("repartidor pendiente: aprobar, rechazar o pedir revision", () => {
    expect(accionesDisponibles("repartidor", "pendiente")).toEqual(["aprobar", "rechazar", "pedir_revision"]);
  });
  it("repartidor en_revision: solo aprobar o rechazar (ya se pidio revision)", () => {
    expect(accionesDisponibles("repartidor", "en_revision")).toEqual(["aprobar", "rechazar"]);
  });
  it("estado ya resuelto: sin acciones", () => {
    expect(accionesDisponibles("proveedor", "aprobado")).toEqual([]);
    expect(accionesDisponibles("repartidor", "rechazado")).toEqual([]);
  });
});
