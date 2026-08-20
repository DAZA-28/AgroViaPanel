"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StaffRow } from "@/lib/types";

export function EquipoTable({ equipoInicial, miPropioId }: { equipoInicial: StaffRow[]; miPropioId: number }) {
  const [equipo, setEquipo] = useState(equipoInicial);

  async function cambiarRol(id: number, rol: "admin" | "operador") {
    const supabase = createClient();
    const { data } = await supabase.from("staff_dashboard").update({ rol }).eq("id", id).select();
    if (!data || data.length === 0) {
      alert("No se pudo actualizar el rol. Puede que no tengas permiso o el registro ya no exista.");
      return;
    }
    setEquipo((prev) => prev.map((s) => (s.id === id ? { ...s, rol } : s)));
  }

  async function alternarActivo(id: number, activo: boolean) {
    const supabase = createClient();
    const { data } = await supabase.from("staff_dashboard").update({ activo: !activo }).eq("id", id).select();
    if (!data || data.length === 0) {
      alert("No se pudo actualizar el estado. Puede que no tengas permiso o el registro ya no exista.");
      return;
    }
    setEquipo((prev) => prev.map((s) => (s.id === id ? { ...s, activo: !activo } : s)));
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
      <thead>
        <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
          <th style={{ padding: 8 }}>Nombre</th>
          <th style={{ padding: 8 }}>Email</th>
          <th style={{ padding: 8 }}>Rol</th>
          <th style={{ padding: 8 }}>Activo</th>
          <th style={{ padding: 8 }}></th>
        </tr>
      </thead>
      <tbody>
        {equipo.map((s) => {
          const esUnoMismo = s.id === miPropioId;
          return (
            <tr key={s.id} style={{ borderTop: "1px solid var(--border-color)" }}>
              <td style={{ padding: 8 }}>{s.nombre}{esUnoMismo && <span style={{ color: "var(--text-muted)" }}> (vos)</span>}</td>
              <td style={{ padding: 8 }}>{s.email}</td>
              <td style={{ padding: 8 }}>
                <select
                  value={s.rol}
                  disabled={esUnoMismo}
                  onChange={(e) => cambiarRol(s.id, e.target.value as "admin" | "operador")}
                >
                  <option value="admin">Admin</option>
                  <option value="operador">Operador</option>
                </select>
              </td>
              <td style={{ padding: 8 }}>{s.activo ? "Sí" : "No"}</td>
              <td style={{ padding: 8 }}>
                <button
                  onClick={() => alternarActivo(s.id, s.activo)}
                  disabled={esUnoMismo}
                  style={{ padding: "4px 10px", background: "var(--bg-card-hover)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff", opacity: esUnoMismo ? 0.5 : 1, cursor: esUnoMismo ? "not-allowed" : "pointer" }}
                >
                  {s.activo ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
