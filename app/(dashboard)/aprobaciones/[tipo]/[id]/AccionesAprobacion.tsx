"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { accionesDisponibles, type Accion } from "@/lib/aprobaciones";

const TABLA: Record<string, string> = { proveedor: "proveedores", repartidor: "repartidores" };

export function AccionesAprobacion({ tipo, id, estado }: { tipo: "proveedor" | "repartidor"; id: number; estado: string }) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [accionActiva, setAccionActiva] = useState<Accion | null>(null);
  const [enviando, setEnviando] = useState(false);

  const acciones = accionesDisponibles(tipo, estado);
  if (acciones.length === 0) return <p className="cell-muted">Esta solicitud ya fue resuelta.</p>;

  async function confirmar(accion: Accion) {
    if ((accion === "rechazar" || accion === "pedir_revision") && !comentario.trim()) {
      setAccionActiva(accion);
      return;
    }
    setEnviando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const nuevoEstado = accion === "aprobar" ? "aprobado" : accion === "rechazar" ? "rechazado" : "en_revision";

    const { data } = await supabase
      .from(TABLA[tipo])
      .update({
        estado_aprobacion: nuevoEstado,
        comentario_revision: accion === "aprobar" ? null : comentario.trim(),
        revisado_por: user?.id ?? null,
        revisado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    setEnviando(false);

    if (!data || data.length === 0) {
      toast.error("No se pudo guardar la decisión. Puede que no tengas permiso o la solicitud ya haya cambiado.");
      return;
    }

    const mensajeExito =
      accion === "aprobar" ? "Solicitud aprobada." : accion === "rechazar" ? "Solicitud rechazada." : "Se pidió revisión al solicitante.";
    toast.success(mensajeExito);

    router.push("/aprobaciones");
    router.refresh();
  }

  return (
    <div style={{ marginTop: 24 }}>
      {(accionActiva === "rechazar" || accionActiva === "pedir_revision") && (
        <textarea
          placeholder="Motivo (obligatorio)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={{ width: "100%", minHeight: 80, marginBottom: 12, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 10 }}
        />
      )}
      <div style={{ display: "flex", gap: 10 }}>
        {acciones.includes("aprobar") && (
          <button disabled={enviando} onClick={() => confirmar("aprobar")} className="btn btn-success">
            Aprobar
          </button>
        )}
        {acciones.includes("pedir_revision") && (
          <button disabled={enviando} onClick={() => confirmar("pedir_revision")} className="btn btn-warning">
            Pedir revisión
          </button>
        )}
        {acciones.includes("rechazar") && (
          <button disabled={enviando} onClick={() => confirmar("rechazar")} className="btn btn-danger">
            Rechazar
          </button>
        )}
      </div>
    </div>
  );
}
