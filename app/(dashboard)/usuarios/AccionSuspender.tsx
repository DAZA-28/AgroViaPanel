"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { accionCuentaDisponible } from "@/lib/usuarios";

const TABLA: Record<"proveedor" | "repartidor", string> = {
  proveedor: "proveedores",
  repartidor: "repartidores",
};

export function AccionSuspender({
  tipo,
  id,
  estado,
  onCambiado,
}: {
  tipo: "proveedor" | "repartidor";
  id: number;
  estado: string;
  onCambiado: (nuevoEstado: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const accion = accionCuentaDisponible(estado);
  if (!accion) return null;

  async function confirmar() {
    if (accion === "suspender" && !motivo.trim()) {
      setPidiendoMotivo(true);
      return;
    }
    setEnviando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nuevoEstado = accion === "suspender" ? "rechazado" : "aprobado";

    const { data } = await supabase
      .from(TABLA[tipo])
      .update({
        estado_aprobacion: nuevoEstado,
        comentario_revision: accion === "suspender" ? motivo.trim() : null,
        revisado_por: user?.id ?? null,
        revisado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    setEnviando(false);

    if (!data || data.length === 0) {
      toast.error("No se pudo guardar el cambio. Puede que no tengas permiso o el registro ya no exista.");
      return;
    }

    toast.success(accion === "suspender" ? "Cuenta suspendida." : "Cuenta reactivada.");
    setPidiendoMotivo(false);
    setMotivo("");
    onCambiado(nuevoEstado);
  }

  return (
    <div style={{ marginTop: 16 }}>
      {pidiendoMotivo && (
        <textarea
          placeholder="Motivo de la suspensión (obligatorio)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          style={{ width: "100%", minHeight: 70, marginBottom: 10, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 10 }}
        />
      )}
      <button
        onClick={confirmar}
        disabled={enviando}
        className={`btn ${accion === "suspender" ? "btn-danger" : "btn-success"}`}
      >
        {enviando ? "Guardando..." : accion === "suspender" ? "Suspender cuenta" : "Reactivar cuenta"}
      </button>
    </div>
  );
}
