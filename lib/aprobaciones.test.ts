import { describe, expect, it } from "vitest";
import { estaPendienteDeRevision, etiquetaEstado } from "./aprobaciones";

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
