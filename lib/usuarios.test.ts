import { describe, expect, it } from "vitest";
import { accionCuentaDisponible, coincideBusqueda } from "./usuarios";

describe("accionCuentaDisponible", () => {
  it("ofrece suspender cuando la cuenta está aprobada", () => {
    expect(accionCuentaDisponible("aprobado")).toBe("suspender");
  });

  it("ofrece reactivar cuando la cuenta está rechazada", () => {
    expect(accionCuentaDisponible("rechazado")).toBe("reactivar");
  });

  it("no ofrece nada mientras la solicitud sigue en revisión", () => {
    expect(accionCuentaDisponible("pendiente")).toBeNull();
    expect(accionCuentaDisponible("en_revision")).toBeNull();
  });
});

describe("coincideBusqueda", () => {
  it("una búsqueda vacía siempre coincide", () => {
    expect(coincideBusqueda("Ana Pérez", "ana@example.com", "")).toBe(true);
  });

  it("coincide por nombre, sin importar mayúsculas/acentos de más", () => {
    expect(coincideBusqueda("Ana Pérez", "ana@example.com", "ana")).toBe(true);
    expect(coincideBusqueda("Ana Pérez", "ana@example.com", "PÉREZ")).toBe(true);
  });

  it("coincide por email", () => {
    expect(coincideBusqueda("Ana Pérez", "ana.perez@lavaquita.cr", "lavaquita")).toBe(true);
  });

  it("no coincide si no aparece ni en el nombre ni en el email", () => {
    expect(coincideBusqueda("Ana Pérez", "ana@example.com", "carlos")).toBe(false);
  });
});
