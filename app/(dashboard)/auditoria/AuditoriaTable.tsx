"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { etiquetaEstado, varianteBadgeEstado } from "@/lib/aprobaciones";
import { fechaDesde, type RangoFecha } from "@/lib/fechas";
import type { AuditoriaRow, StaffRow } from "@/lib/types";

const PAGINA = 50;

const ETIQUETAS_RANGO: Record<RangoFecha, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  todo: "Todo",
};

export function AuditoriaTable() {
  const [filas, setFilas] = useState<AuditoriaRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [rango, setRango] = useState<RangoFecha>("30d");
  const [tipo, setTipo] = useState<"todos" | "proveedor" | "repartidor">("todos");
  const [staffId, setStaffId] = useState<string>("todos");
  const [hayMas, setHayMas] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);

  const ahora = useMemo(() => new Date(), [rango, tipo, staffId]);

  const cargarPagina = useCallback(
    async (desde: number) => {
      const supabase = createClient();
      let query = supabase
        .from("auditoria_aprobaciones")
        .select("*")
        .order("creado_en", { ascending: false })
        .range(desde, desde + PAGINA - 1);

      const corte = fechaDesde(rango, ahora);
      if (corte) query = query.gte("creado_en", corte);
      if (tipo !== "todos") query = query.eq("entidad_tipo", tipo);
      if (staffId !== "todos") query = query.eq("staff_id", staffId);

      const { data, error } = await query.returns<AuditoriaRow[]>();
      if (error) {
        toast.error("No se pudo cargar el historial de auditoría.");
        return [];
      }
      return data ?? [];
    },
    [rango, tipo, staffId, ahora]
  );

  useEffect(() => {
    const supabase = createClient();

    async function cargarInicial() {
      const pagina = await cargarPagina(0);
      setFilas(pagina);
      setHayMas(pagina.length === PAGINA);
    }

    cargarInicial();

    const channel = supabase
      .channel("auditoria-aprobaciones")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "auditoria_aprobaciones" }, (payload) => {
        const fila = payload.new as AuditoriaRow;
        if (tipo !== "todos" && fila.entidad_tipo !== tipo) return;
        if (staffId !== "todos" && fila.staff_id !== staffId) return;
        setFilas((actuales) => [fila, ...actuales]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarPagina, tipo, staffId]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("staff_dashboard")
      .select("*")
      .returns<StaffRow[]>()
      .then(({ data }) => setStaff(data ?? []));
  }, []);

  async function cargarMas() {
    setCargandoMas(true);
    const pagina = await cargarPagina(filas.length);
    setFilas((actuales) => [...actuales, ...pagina]);
    setHayMas(pagina.length === PAGINA);
    setCargandoMas(false);
  }

  return (
    <div>
      <div className="filter-tabs">
        {(["7d", "30d", "90d", "todo"] as const).map((r) => (
          <button key={r} onClick={() => setRango(r)} className={`filter-tab${rango === r ? " is-active" : ""}`}>
            {ETIQUETAS_RANGO[r]}
          </button>
        ))}
      </div>
      <div className="filter-tabs">
        {(["todos", "proveedor", "repartidor"] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)} className={`filter-tab${tipo === t ? " is-active" : ""}`}>
            {t === "todos" ? "Todos" : t === "proveedor" ? "Proveedores" : "Repartidores"}
          </button>
        ))}
      </div>
      <div className="filter-tabs">
        <button onClick={() => setStaffId("todos")} className={`filter-tab${staffId === "todos" ? " is-active" : ""}`}>
          Todo el staff
        </button>
        {staff.map((s) => (
          <button key={s.user_id} onClick={() => setStaffId(s.user_id)} className={`filter-tab${staffId === s.user_id ? " is-active" : ""}`}>
            {s.nombre}
          </button>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Entidad</th>
            <th>Transición</th>
            <th>Staff</th>
            <th>Comentario</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id}>
              <td className="cell-muted">{new Date(f.creado_en).toLocaleString("es-CR")}</td>
              <td>
                {f.entidad_tipo === "proveedor" ? "Proveedor" : "Repartidor"} · {f.entidad_nombre}
              </td>
              <td>
                {f.estado_anterior ? (
                  <span className={`badge badge--${varianteBadgeEstado(f.estado_anterior)}`}>{etiquetaEstado(f.estado_anterior)}</span>
                ) : (
                  <span className="cell-muted">—</span>
                )}
                {" → "}
                <span className={`badge badge--${varianteBadgeEstado(f.estado_nuevo)}`}>{etiquetaEstado(f.estado_nuevo)}</span>
              </td>
              <td className="cell-muted">{f.staff_nombre ?? f.staff_id ?? "—"}</td>
              <td className="cell-muted">{f.comentario ?? "—"}</td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr className="empty-row">
              <td colSpan={5}>No hay eventos para este filtro.</td>
            </tr>
          )}
        </tbody>
      </table>
      {hayMas && (
        <button onClick={cargarMas} disabled={cargandoMas} className="btn btn-secondary" style={{ marginTop: 16 }}>
          {cargandoMas ? "Cargando..." : "Cargar más"}
        </button>
      )}
    </div>
  );
}
