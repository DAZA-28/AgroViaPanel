export type EstadoAprobacionProveedor = "pendiente" | "aprobado" | "rechazado";
export type EstadoAprobacionRepartidor = "pendiente" | "en_revision" | "aprobado" | "rechazado";

export interface ProveedorRow {
  id: number;
  nombre: string;
  email: string;
  tienda_id: number | null;
  telefono: string | null;
  tipo_proveedor: "fisica" | "juridica";
  cedula: string | null;
  cedula_juridica: string | null;
  nombre_representante: string | null;
  cedula_representante: string | null;
  verificado_mag: boolean;
  estado_aprobacion: EstadoAprobacionProveedor;
  comentario_revision: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  created_at: string;
}

export interface RepartidorRow {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  foto_url: string | null;
  cedula: string;
  tipo_vehiculo: "moto" | "carro" | "bicicleta";
  placa: string | null;
  estado_aprobacion: EstadoAprobacionRepartidor;
  comentario_revision: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  created_at: string;
}

export interface UsuarioRow {
  id: number;
  username: string | null;
  email: string;
  direccion: string | null;
  avatar_url: string | null;
  creditos: number;
  verificado: boolean;
  created_at: string;
}

export interface TiendaResumen {
  nombre: string;
  categoria: string | null;
  logo_url: string | null;
}

export interface ProveedorConTienda extends ProveedorRow {
  tiendas: TiendaResumen | null;
}

export interface PedidoActivoRow {
  id_pedido: string;
  email_usuario: string;
  total: number;
  estado: string;
  fecha_creacion: string;
  tiendas: { nombre: string } | null;
  repartidores: { nombre: string } | null;
}

export interface StaffRow {
  id: number;
  user_id: string;
  nombre: string;
  email: string;
  rol: "admin" | "operador";
  activo: boolean;
  created_at: string;
}

export interface AuditoriaRow {
  id: number;
  entidad_tipo: "proveedor" | "repartidor";
  entidad_id: number;
  entidad_nombre: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  staff_id: string | null;
  staff_nombre: string | null;
  creado_en: string;
}
