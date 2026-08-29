import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("incluye los 6 módulos del dashboard", () => {
    expect(NAV_ITEMS).toHaveLength(6);
  });

  it("Métricas, Aprobaciones, Pedidos en vivo, Usuarios y Auditoría están habilitados; el resto no", () => {
    const enabled = NAV_ITEMS.filter((i) => i.enabled).map((i) => i.href);
    expect(enabled.sort()).toEqual(["/", "/aprobaciones", "/auditoria", "/pedidos", "/usuarios"]);
  });
});
