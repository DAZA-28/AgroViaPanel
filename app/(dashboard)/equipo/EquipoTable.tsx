"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StaffRow } from "@/lib/types";

export function EquipoTable({ equipoInicial }: { equipoInicial: StaffRow[] }) {
  const [equipo, setEquipo] = useState(equipoInicial);

  async function cambiarRol(id: number, rol: "admin" | "operador") {
    const supabase = createClient();
    await supabase.from("staff_dashboard").update({ rol }).eq("id", id);
    setEquipo((prev) => prev.map((s) => (s.id === id ? { ...s, rol } : s)));
  }

  async function alternarActivo(id: number, activo: boolean) {
    const supabase = createClient();
    await supabase.from("staff_dashboard").update({ activo: !activo }).eq("id", id);
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
        {equipo.map((s) => (
          <tr key={s.id} style={{ borderTop: "1px solid var(--border-color)" }}>
            <td style={{ padding: 8 }}>{s.nombre}</td>
            <td style={{ padding: 8 }}>{s.email}</td>
            <td style={{ padding: 8 }}>
              <select value={s.rol} onChange={(e) => cambiarRol(s.id, e.target.value as "admin" | "operador")}>
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
              </select>
            </td>
            <td style={{ padding: 8 }}>{s.activo ? "Sí" : "No"}</td>
            <td style={{ padding: 8 }}>
              <button onClick={() => alternarActivo(s.id, s.activo)} style={{ padding: "4px 10px", background: "var(--bg-card-hover)", border: "1px solid var(--border-color)", borderRadius: 6, color: "#fff" }}>
                {s.activo ? "Desactivar" : "Activar"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
