import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("incluye los 5 módulos del dashboard", () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it("Métricas y Aprobaciones están habilitados; el resto no", () => {
    const enabled = NAV_ITEMS.filter((i) => i.enabled).map((i) => i.href);
    expect(enabled.sort()).toEqual(["/", "/aprobaciones"]);
  });
});
