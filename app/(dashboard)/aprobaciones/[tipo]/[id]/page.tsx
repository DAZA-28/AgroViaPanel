import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { etiquetaEstado, varianteBadgeEstado } from "@/lib/aprobaciones";
import { AccionesAprobacion } from "./AccionesAprobacion";
import type { ProveedorRow, RepartidorRow } from "@/lib/types";

const TABLA: Record<string, string> = { proveedor: "proveedores", repartidor: "repartidores" };

const COLUMNAS_PROVEEDOR =
  "id, nombre, email, tienda_id, telefono, tipo_proveedor, cedula, cedula_juridica, nombre_representante, cedula_representante, verificado_mag, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";
const COLUMNAS_REPARTIDOR =
  "id, nombre, email, telefono, activo, foto_url, cedula, tipo_vehiculo, placa, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";

const COLUMNAS: Record<string, string> = { proveedor: COLUMNAS_PROVEEDOR, repartidor: COLUMNAS_REPARTIDOR };

const ETIQUETAS_CAMPO: Record<string, string> = {
  id: "ID",
  nombre: "Nombre",
  email: "Email",
  tienda_id: "ID de tienda",
  telefono: "Teléfono",
  tipo_proveedor: "Tipo de proveedor",
  cedula: "Cédula",
  cedula_juridica: "Cédula jurídica",
  nombre_representante: "Nombre del representante",
  cedula_representante: "Cédula del representante",
  verificado_mag: "Verificado MAG",
  estado_aprobacion: "Estado de aprobación",
  comentario_revision: "Comentario de revisión",
  revisado_por: "Revisado por",
  revisado_en: "Revisado en",
  created_at: "Registrado en",
  activo: "Activo",
  foto_url: "Foto",
  tipo_vehiculo: "Tipo de vehículo",
  placa: "Placa",
};

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}

export default async function DetalleAprobacionPage({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (tipo !== "proveedor" && tipo !== "repartidor") notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.from(TABLA[tipo]).select(COLUMNAS[tipo]).eq("id", Number(id)).single();
  if (error || !data) notFound();

  const fila = data as unknown as ProveedorRow | RepartidorRow;

  return (
    <div>
      <div className="page-header">
        <h1>{fila.nombre}</h1>
        <p>
          {fila.email} · <span className={`badge badge--${varianteBadgeEstado(fila.estado_aprobacion)}`}>{etiquetaEstado(fila.estado_aprobacion)}</span>
        </p>
      </div>
      <div className="card">
        <table className="data-table">
          <tbody>
            {Object.entries(fila).map(([campo, valor]) => (
              <tr key={campo}>
                <td className="cell-muted" style={{ width: 220 }}>{ETIQUETAS_CAMPO[campo] ?? campo}</td>
                <td>{formatearValor(valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AccionesAprobacion tipo={tipo} id={Number(id)} estado={fila.estado_aprobacion} />
    </div>
  );
}
