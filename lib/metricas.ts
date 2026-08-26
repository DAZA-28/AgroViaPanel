export interface ConteosMetricas {
  proveedores: { pendiente: number; aprobado: number; rechazado: number };
  repartidores: { pendiente: number; aprobado: number; rechazado: number };
  pedidos: { activos: number; entregados: number; cancelados: number };
  tiendasTotal: number;
}

export interface StatItem {
  label: string;
  value: number;
  accent?: boolean;
}

export interface StatGroup {
  title: string;
  stats: StatItem[];
}

export function construirGruposMetricas(conteos: ConteosMetricas): StatGroup[] {
  return [
    {
      title: "Proveedores",
      stats: [
        { label: "Pendientes de revisión", value: conteos.proveedores.pendiente, accent: true },
        { label: "Aprobados", value: conteos.proveedores.aprobado },
        { label: "Rechazados", value: conteos.proveedores.rechazado },
      ],
    },
    {
      title: "Repartidores",
      stats: [
        { label: "Pendientes de revisión", value: conteos.repartidores.pendiente, accent: true },
        { label: "Aprobados", value: conteos.repartidores.aprobado },
        { label: "Rechazados", value: conteos.repartidores.rechazado },
      ],
    },
    {
      title: "Pedidos",
      stats: [
        { label: "Activos ahora", value: conteos.pedidos.activos, accent: true },
        { label: "Entregados", value: conteos.pedidos.entregados },
        { label: "Cancelados", value: conteos.pedidos.cancelados },
      ],
    },
    {
      title: "Tiendas",
      stats: [{ label: "Registradas", value: conteos.tiendasTotal }],
    },
  ];
}
