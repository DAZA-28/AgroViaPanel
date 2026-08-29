export interface TransaccionConEstado {
  monto: number;
  metodo: string;
  fecha_transaccion: string;
  estado_pedido: string | null;
}

export interface ResumenVentas {
  gmv: number;
  ticketPromedio: number;
  cantidadPedidos: number;
  porMetodo: Record<string, number>;
}

function excluirCancelados(transacciones: TransaccionConEstado[]): TransaccionConEstado[] {
  return transacciones.filter((t) => t.estado_pedido !== "CANCELADO");
}

export function calcularResumenVentas(transacciones: TransaccionConEstado[]): ResumenVentas {
  const validas = excluirCancelados(transacciones);
  const gmv = validas.reduce((acc, t) => acc + t.monto, 0);
  const cantidadPedidos = validas.length;
  const ticketPromedio = cantidadPedidos > 0 ? gmv / cantidadPedidos : 0;

  const porMetodo: Record<string, number> = {};
  for (const t of validas) {
    porMetodo[t.metodo] = (porMetodo[t.metodo] ?? 0) + t.monto;
  }

  return { gmv, ticketPromedio, cantidadPedidos, porMetodo };
}

export interface PuntoSerie {
  fecha: string;
  monto: number;
  cantidad: number;
}

export function agruparPorDia(transacciones: TransaccionConEstado[]): PuntoSerie[] {
  const validas = excluirCancelados(transacciones);
  const mapa = new Map<string, { monto: number; cantidad: number }>();

  for (const t of validas) {
    const dia = t.fecha_transaccion.slice(0, 10);
    const actual = mapa.get(dia) ?? { monto: 0, cantidad: 0 };
    actual.monto += t.monto;
    actual.cantidad += 1;
    mapa.set(dia, actual);
  }

  return Array.from(mapa.entries())
    .map(([fecha, v]) => ({ fecha, ...v }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function completarSerieDiaria(serie: PuntoSerie[], desde: Date, hasta: Date): PuntoSerie[] {
  const porFecha = new Map(serie.map((p) => [p.fecha, p]));
  const dias: PuntoSerie[] = [];

  const cursor = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), desde.getUTCDate()));
  const fin = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), hasta.getUTCDate()));

  while (cursor.getTime() <= fin.getTime()) {
    const fecha = cursor.toISOString().slice(0, 10);
    dias.push(porFecha.get(fecha) ?? { fecha, monto: 0, cantidad: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dias;
}
