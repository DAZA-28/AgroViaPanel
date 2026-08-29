import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { etiquetaEstado, nombreRevisor, varianteBadgeEstado } from "@/lib/aprobaciones";
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

function formatearValor(campo: string, valor: unknown, staffPorId: Record<string, string>): string {
  if (campo === "revisado_por") return nombreRevisor(valor as string | null, staffPorId);
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}

export default async function DetalleAprobacionPage({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (tipo !== "proveedor" && tipo !== "repartidor") notFound();

  const supabase = await createClient();
  const [{ data, error }, { data: staff }] = await Promise.all([
    supabase.from(TABLA[tipo]).select(COLUMNAS[tipo]).eq("id", Number(id)).single(),
    supabase.from("staff_dashboard").select("user_id, nombre"),
  ]);
  if (error || !data) notFound();

  const fila = data as unknown as ProveedorRow | RepartidorRow;
  const staffPorId = Object.fromEntries((staff ?? []).map((s) => [s.user_id, s.nombre]));

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
                <td>{formatearValor(campo, valor, staffPorId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AccionesAprobacion tipo={tipo} id={Number(id)} estado={fila.estado_aprobacion} />
    </div>
  );
}
