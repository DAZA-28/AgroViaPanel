import { describe, expect, it } from "vitest";
import { etiquetaTransicion } from "./auditoria";

describe("etiquetaTransicion", () => {
  it("formatea 'anterior -> nuevo' con las etiquetas ya existentes", () => {
    expect(etiquetaTransicion("pendiente", "aprobado")).toBe("Pendiente → Aprobado");
  });

  it("usa un guion cuando no hay estado anterior", () => {
    expect(etiquetaTransicion(null, "aprobado")).toBe("— → Aprobado");
  });
});
