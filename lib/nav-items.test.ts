import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("incluye los 7 módulos del dashboard", () => {
    expect(NAV_ITEMS).toHaveLength(7);
  });

  it("Métricas, Aprobaciones, Pedidos en vivo, Usuarios, Auditoría y Ventas están habilitados; el resto no", () => {
    const enabled = NAV_ITEMS.filter((i) => i.enabled).map((i) => i.href);
    expect(enabled.sort()).toEqual(["/", "/aprobaciones", "/auditoria", "/pedidos", "/usuarios", "/ventas"]);
  });
});
