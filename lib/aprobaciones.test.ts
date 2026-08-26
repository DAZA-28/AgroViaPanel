import { describe, expect, it } from "vitest";
import { accionesDisponibles, estaPendienteDeRevision, etiquetaEstado, filtraPorEstado, varianteBadgeEstado } from "./aprobaciones";

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

describe("filtraPorEstado", () => {
  it("el filtro 'pendientes' incluye pendiente y en_revision", () => {
    expect(filtraPorEstado("pendiente", "pendientes")).toBe(true);
    expect(filtraPorEstado("en_revision", "pendientes")).toBe(true);
  });
  it("el filtro 'pendientes' excluye aprobado y rechazado", () => {
    expect(filtraPorEstado("aprobado", "pendientes")).toBe(false);
    expect(filtraPorEstado("rechazado", "pendientes")).toBe(false);
  });
  it("el filtro 'aprobado' solo incluye aprobado", () => {
    expect(filtraPorEstado("aprobado", "aprobado")).toBe(true);
    expect(filtraPorEstado("rechazado", "aprobado")).toBe(false);
    expect(filtraPorEstado("pendiente", "aprobado")).toBe(false);
  });
  it("el filtro 'rechazado' solo incluye rechazado", () => {
    expect(filtraPorEstado("rechazado", "rechazado")).toBe(true);
    expect(filtraPorEstado("aprobado", "rechazado")).toBe(false);
  });
  it("el filtro 'todos' incluye cualquier estado", () => {
    expect(filtraPorEstado("pendiente", "todos")).toBe(true);
    expect(filtraPorEstado("en_revision", "todos")).toBe(true);
    expect(filtraPorEstado("aprobado", "todos")).toBe(true);
    expect(filtraPorEstado("rechazado", "todos")).toBe(true);
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
