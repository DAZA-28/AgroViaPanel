import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { etiquetaEstado } from "@/lib/aprobaciones";
import { AccionesAprobacion } from "./AccionesAprobacion";
import type { ProveedorRow, RepartidorRow } from "@/lib/types";

const TABLA: Record<string, string> = { proveedor: "proveedores", repartidor: "repartidores" };

export default async function DetalleAprobacionPage({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (tipo !== "proveedor" && tipo !== "repartidor") notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.from(TABLA[tipo]).select("*").eq("id", Number(id)).single();
  if (error || !data) notFound();

  const fila = data as ProveedorRow | RepartidorRow;

  return (
    <div>
      <h1 style={{ color: "var(--primary)" }}>{fila.nombre}</h1>
      <p style={{ color: "var(--text-muted)" }}>{fila.email} · {etiquetaEstado(fila.estado_aprobacion)}</p>
      <div style={{ marginTop: 20, background: "var(--bg-card)", padding: 20, borderRadius: 12 }}>
        <pre style={{ whiteSpace: "pre-wrap", color: "var(--text-light)", fontSize: 13 }}>
          {JSON.stringify(fila, null, 2)}
        </pre>
      </div>
      <AccionesAprobacion tipo={tipo} id={Number(id)} estado={fila.estado_aprobacion} />
    </div>
  );
}
