"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { accionesDisponibles, type Accion } from "@/lib/aprobaciones";

const TABLA: Record<string, string> = { proveedor: "proveedores", repartidor: "repartidores" };

export function AccionesAprobacion({ tipo, id, estado }: { tipo: "proveedor" | "repartidor"; id: number; estado: string }) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [accionActiva, setAccionActiva] = useState<Accion | null>(null);
  const [enviando, setEnviando] = useState(false);

  const acciones = accionesDisponibles(tipo, estado);
  if (acciones.length === 0) return <p style={{ color: "var(--text-muted)" }}>Esta solicitud ya fue resuelta.</p>;

  async function confirmar(accion: Accion) {
    if ((accion === "rechazar" || accion === "pedir_revision") && !comentario.trim()) {
      setAccionActiva(accion);
      return;
    }
    setEnviando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const nuevoEstado = accion === "aprobar" ? "aprobado" : accion === "rechazar" ? "rechazado" : "en_revision";

    await supabase
      .from(TABLA[tipo])
      .update({
        estado_aprobacion: nuevoEstado,
        comentario_revision: accion === "aprobar" ? null : comentario.trim(),
        revisado_por: user?.id ?? null,
        revisado_en: new Date().toISOString(),
      })
      .eq("id", id);

    setEnviando(false);
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
          <button disabled={enviando} onClick={() => confirmar("aprobar")} style={{ padding: "10px 16px", background: "var(--success)", border: "none", borderRadius: 8, color: "#fff" }}>
            Aprobar
          </button>
        )}
        {acciones.includes("pedir_revision") && (
          <button disabled={enviando} onClick={() => confirmar("pedir_revision")} style={{ padding: "10px 16px", background: "var(--warning)", border: "none", borderRadius: 8, color: "#fff" }}>
            Pedir revisión
          </button>
        )}
        {acciones.includes("rechazar") && (
          <button disabled={enviando} onClick={() => confirmar("rechazar")} style={{ padding: "10px 16px", background: "var(--error)", border: "none", borderRadius: 8, color: "#fff" }}>
            Rechazar
          </button>
        )}
      </div>
    </div>
  );
}
