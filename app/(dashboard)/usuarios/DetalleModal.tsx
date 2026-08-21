"use client";

import type { ProveedorConTienda, RepartidorRow, UsuarioRow } from "@/lib/types";
import { etiquetaEstado, varianteBadgeEstado } from "@/lib/aprobaciones";
import { AccionSuspender } from "./AccionSuspender";
import { HistorialPedidos } from "./HistorialPedidos";

export type Seleccion =
  | { tipo: "repartidor"; data: RepartidorRow }
  | { tipo: "proveedor"; data: ProveedorConTienda }
  | { tipo: "cliente"; data: UsuarioRow };

function Fila({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="modal-row">
      <span className="modal-row-label">{label}</span>
      <span className="modal-row-value">{value}</span>
    </div>
  );
}

export function DetalleModal({
  seleccion,
  onClose,
  onCambiado,
}: {
  seleccion: Seleccion;
  onClose: () => void;
  onCambiado: (nuevoEstado: string) => void;
}) {
  const titulo =
    seleccion.tipo === "repartidor"
      ? "Repartidor"
      : seleccion.tipo === "proveedor"
        ? "Tienda"
        : "Cliente";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {seleccion.tipo === "repartidor" && (
          <>
            <Fila label="Nombre" value={seleccion.data.nombre} />
            <Fila label="Email" value={seleccion.data.email} />
            <Fila label="Teléfono" value={seleccion.data.telefono ?? "—"} />
            <Fila label="Cédula" value={seleccion.data.cedula} />
            <Fila label="Vehículo" value={seleccion.data.tipo_vehiculo} />
            <Fila label="Placa" value={seleccion.data.placa ?? "—"} />
            <Fila label="Buscando pedidos" value={seleccion.data.activo ? "Sí" : "No"} />
            <Fila
              label="Estado"
              value={<span className={`badge badge--${varianteBadgeEstado(seleccion.data.estado_aprobacion)}`}>{etiquetaEstado(seleccion.data.estado_aprobacion)}</span>}
            />
            {seleccion.data.comentario_revision && (
              <Fila label="Comentario de revisión" value={seleccion.data.comentario_revision} />
            )}
            <Fila label="Registrado" value={new Date(seleccion.data.created_at).toLocaleDateString("es-CR")} />
            <AccionSuspender tipo="repartidor" id={seleccion.data.id} estado={seleccion.data.estado_aprobacion} onCambiado={onCambiado} />
            <HistorialPedidos tipo="repartidor" repartidorId={seleccion.data.id} />
          </>
        )}

        {seleccion.tipo === "proveedor" && (
          <>
            <Fila label="Nombre" value={seleccion.data.nombre} />
            <Fila label="Tienda" value={seleccion.data.tiendas?.nombre ?? "—"} />
            <Fila label="Categoría" value={seleccion.data.tiendas?.categoria ?? "—"} />
            <Fila label="Email" value={seleccion.data.email} />
            <Fila label="Teléfono" value={seleccion.data.telefono ?? "—"} />
            <Fila label="Tipo" value={seleccion.data.tipo_proveedor === "juridica" ? "Jurídica" : "Física"} />
            <Fila
              label="Cédula"
              value={(seleccion.data.tipo_proveedor === "juridica" ? seleccion.data.cedula_juridica : seleccion.data.cedula) ?? "—"}
            />
            {seleccion.data.tipo_proveedor === "juridica" && (
              <>
                <Fila label="Representante" value={seleccion.data.nombre_representante ?? "—"} />
                <Fila label="Cédula del representante" value={seleccion.data.cedula_representante ?? "—"} />
              </>
            )}
            <Fila label="Verificado MAG" value={seleccion.data.verificado_mag ? "Sí" : "No"} />
            <Fila
              label="Estado"
              value={<span className={`badge badge--${varianteBadgeEstado(seleccion.data.estado_aprobacion)}`}>{etiquetaEstado(seleccion.data.estado_aprobacion)}</span>}
            />
            {seleccion.data.comentario_revision && (
              <Fila label="Comentario de revisión" value={seleccion.data.comentario_revision} />
            )}
            <Fila label="Registrado" value={new Date(seleccion.data.created_at).toLocaleDateString("es-CR")} />
            <AccionSuspender tipo="proveedor" id={seleccion.data.id} estado={seleccion.data.estado_aprobacion} onCambiado={onCambiado} />
            <HistorialPedidos tipo="proveedor" tiendaId={seleccion.data.tienda_id} />
          </>
        )}

        {seleccion.tipo === "cliente" && (
          <>
            <Fila label="Usuario" value={seleccion.data.username ?? "—"} />
            <Fila label="Email" value={seleccion.data.email} />
            <Fila label="Dirección" value={seleccion.data.direccion ?? "—"} />
            <Fila label="Créditos" value={seleccion.data.creditos} />
            <Fila label="Verificado" value={seleccion.data.verificado ? "Sí" : "No"} />
            <Fila label="Registrado" value={new Date(seleccion.data.created_at).toLocaleDateString("es-CR")} />
            <HistorialPedidos tipo="cliente" clienteEmail={seleccion.data.email} />
          </>
        )}
      </div>
    </div>
  );
}
