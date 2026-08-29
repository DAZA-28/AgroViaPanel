import { describe, expect, it } from "vitest";
import { fechaDesde } from "./fechas";

describe("fechaDesde", () => {
  it("'todo' no aplica corte de fecha", () => {
    expect(fechaDesde("todo")).toBeNull();
  });

  it("'7d' devuelve la fecha 7 dias antes en ISO", () => {
    const ahora = new Date("2026-08-28T12:00:00.000Z");
    expect(fechaDesde("7d", ahora)).toBe("2026-08-21T12:00:00.000Z");
  });

  it("'30d' devuelve la fecha 30 dias antes en ISO", () => {
    const ahora = new Date("2026-08-28T12:00:00.000Z");
    expect(fechaDesde("30d", ahora)).toBe("2026-07-29T12:00:00.000Z");
  });

  it("'90d' devuelve la fecha 90 dias antes en ISO", () => {
    const ahora = new Date("2026-08-28T12:00:00.000Z");
    expect(fechaDesde("90d", ahora)).toBe("2026-05-30T12:00:00.000Z");
  });
});
