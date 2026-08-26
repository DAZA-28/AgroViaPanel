import { describe, expect, it } from "vitest";
import { construirGruposMetricas, type ConteosMetricas } from "./metricas";

const CONTEOS: ConteosMetricas = {
  proveedores: { pendiente: 2, aprobado: 5, rechazado: 1 },
  repartidores: { pendiente: 3, aprobado: 8, rechazado: 0 },
  pedidos: { activos: 4, entregados: 20, cancelados: 2 },
  tiendasTotal: 6,
};

describe("construirGruposMetricas", () => {
  it("arma un grupo por entidad con sus estados como stats", () => {
    const grupos = construirGruposMetricas(CONTEOS);
    expect(grupos.map((g) => g.title)).toEqual(["Proveedores", "Repartidores", "Pedidos", "Tiendas"]);
  });

  it("cada stat conserva el valor exacto del conteo", () => {
    const grupos = construirGruposMetricas(CONTEOS);
    const proveedores = grupos[0].stats;
    expect(proveedores.find((s) => s.label === "Pendientes de revisión")?.value).toBe(2);
    expect(proveedores.find((s) => s.label === "Aprobados")?.value).toBe(5);
    expect(proveedores.find((s) => s.label === "Rechazados")?.value).toBe(1);
  });

  it("Tiendas es un grupo de un solo stat con el total", () => {
    const grupos = construirGruposMetricas(CONTEOS);
    expect(grupos[3].stats).toEqual([{ label: "Registradas", value: 6 }]);
  });

  it("el primer stat de cada grupo de entidades va acentuado", () => {
    const grupos = construirGruposMetricas(CONTEOS);
    expect(grupos[0].stats[0].accent).toBe(true);
    expect(grupos[1].stats[0].accent).toBe(true);
    expect(grupos[2].stats[0].accent).toBe(true);
  });
});
