"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StaffRow } from "@/lib/types";

export function EquipoTable({ equipoInicial, miPropioId }: { equipoInicial: StaffRow[]; miPropioId: number }) {
  const [equipo, setEquipo] = useState(equipoInicial);

  useEffect(() => {
    setEquipo(equipoInicial);
  }, [equipoInicial]);

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
    <table className="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Activo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {equipo.map((s) => {
          const esUnoMismo = s.id === miPropioId;
          return (
            <tr key={s.id}>
              <td>{s.nombre}{esUnoMismo && <span className="cell-muted"> (vos)</span>}</td>
              <td className="cell-muted">{s.email}</td>
              <td>
                <select
                  value={s.rol}
                  disabled={esUnoMismo}
                  onChange={(e) => cambiarRol(s.id, e.target.value as "admin" | "operador")}
                >
                  <option value="admin">Admin</option>
                  <option value="operador">Operador</option>
                </select>
              </td>
              <td>
                <span className={`badge badge--${s.activo ? "success" : "neutral"}`}>{s.activo ? "Sí" : "No"}</span>
              </td>
              <td>
                <button
                  onClick={() => alternarActivo(s.id, s.activo)}
                  disabled={esUnoMismo}
                  className="btn btn-secondary"
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
