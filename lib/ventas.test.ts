import { describe, expect, it } from "vitest";
import { agruparPorDia, calcularResumenVentas, completarSerieDiaria, type TransaccionConEstado } from "./ventas";

const TX: TransaccionConEstado[] = [
  { monto: 5000, metodo: "TARJETA_STRIPE", fecha_transaccion: "2026-08-20T10:00:00.000Z", estado_pedido: "ENTREGADO" },
  { monto: 3000, metodo: "EFECTIVO", fecha_transaccion: "2026-08-20T15:00:00.000Z", estado_pedido: "ENTREGADO" },
  { monto: 8000, metodo: "TARJETA_STRIPE", fecha_transaccion: "2026-08-21T09:00:00.000Z", estado_pedido: "ENTREGADO" },
  { monto: 2000, metodo: "EFECTIVO", fecha_transaccion: "2026-08-21T09:30:00.000Z", estado_pedido: "CANCELADO" },
];

describe("calcularResumenVentas", () => {
  it("suma el GMV excluyendo pedidos cancelados", () => {
    expect(calcularResumenVentas(TX).gmv).toBe(16000);
  });

  it("cuenta solo los pedidos no cancelados", () => {
    expect(calcularResumenVentas(TX).cantidadPedidos).toBe(3);
  });

  it("calcula el ticket promedio sobre pedidos no cancelados", () => {
    expect(calcularResumenVentas(TX).ticketPromedio).toBeCloseTo(16000 / 3);
  });

  it("devuelve 0 de ticket promedio cuando no hay pedidos", () => {
    expect(calcularResumenVentas([]).ticketPromedio).toBe(0);
  });

  it("desglosa el monto por metodo de pago, excluyendo cancelados", () => {
    expect(calcularResumenVentas(TX).porMetodo).toEqual({
      TARJETA_STRIPE: 13000,
      EFECTIVO: 3000,
    });
  });
});

describe("agruparPorDia", () => {
  it("agrupa monto y cantidad por dia, excluyendo cancelados", () => {
    expect(agruparPorDia(TX)).toEqual([
      { fecha: "2026-08-20", monto: 8000, cantidad: 2 },
      { fecha: "2026-08-21", monto: 8000, cantidad: 1 },
    ]);
  });

  it("devuelve la serie ordenada de mas viejo a mas nuevo", () => {
    const desordenadas: TransaccionConEstado[] = [
      { monto: 100, metodo: "EFECTIVO", fecha_transaccion: "2026-08-22T10:00:00.000Z", estado_pedido: "ENTREGADO" },
      { monto: 100, metodo: "EFECTIVO", fecha_transaccion: "2026-08-19T10:00:00.000Z", estado_pedido: "ENTREGADO" },
    ];
    expect(agruparPorDia(desordenadas).map((p) => p.fecha)).toEqual(["2026-08-19", "2026-08-22"]);
  });
});

describe("completarSerieDiaria", () => {
  it("rellena con cero los dias sin datos entre desde y hasta", () => {
    const serie = [{ fecha: "2026-08-20", monto: 5000, cantidad: 1 }];
    const desde = new Date("2026-08-19T00:00:00.000Z");
    const hasta = new Date("2026-08-21T00:00:00.000Z");
    expect(completarSerieDiaria(serie, desde, hasta)).toEqual([
      { fecha: "2026-08-19", monto: 0, cantidad: 0 },
      { fecha: "2026-08-20", monto: 5000, cantidad: 1 },
      { fecha: "2026-08-21", monto: 0, cantidad: 0 },
    ]);
  });

  it("devuelve solo el dia cuando desde y hasta son el mismo dia", () => {
    const desde = new Date("2026-08-20T00:00:00.000Z");
    const hasta = new Date("2026-08-20T23:00:00.000Z");
    expect(completarSerieDiaria([], desde, hasta)).toEqual([{ fecha: "2026-08-20", monto: 0, cantidad: 0 }]);
  });
});
