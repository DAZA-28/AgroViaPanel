import { describe, expect, it } from "vitest";
import { accionCuentaDisponible } from "./usuarios";

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
