"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { etiquetaEstado, filtraPorEstado, varianteBadgeEstado, type FiltroEstado } from "@/lib/aprobaciones";
import type { ProveedorRow, RepartidorRow } from "@/lib/types";

type Fila = { tipo: "proveedor" | "repartidor"; id: number; nombre: string; email: string; estado: string; created_at: string };

const COLUMNAS_PROVEEDOR =
  "id, nombre, email, tienda_id, telefono, tipo_proveedor, cedula, cedula_juridica, nombre_representante, cedula_representante, verificado_mag, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";
const COLUMNAS_REPARTIDOR =
  "id, nombre, email, telefono, activo, foto_url, cedula, tipo_vehiculo, placa, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";

const FILTROS_ESTADO: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: "pendientes", etiqueta: "Pendientes" },
  { valor: "aprobado", etiqueta: "Aprobados" },
  { valor: "rechazado", etiqueta: "Rechazados" },
  { valor: "todos", etiqueta: "Todos" },
];

export function AprobacionesTable() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "proveedor" | "repartidor">("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("pendientes");

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      const [{ data: proveedores }, { data: repartidores }] = await Promise.all([
        supabase.from("proveedores").select(COLUMNAS_PROVEEDOR).returns<ProveedorRow[]>(),
        supabase.from("repartidores").select(COLUMNAS_REPARTIDOR).returns<RepartidorRow[]>(),
      ]);

      const filasProveedores: Fila[] = (proveedores ?? [])
        .map((p) => ({ tipo: "proveedor" as const, id: p.id, nombre: p.nombre, email: p.email, estado: p.estado_aprobacion, created_at: p.created_at }));

      const filasRepartidores: Fila[] = (repartidores ?? [])
        .map((r) => ({ tipo: "repartidor" as const, id: r.id, nombre: r.nombre, email: r.email, estado: r.estado_aprobacion, created_at: r.created_at }));

      setFilas([...filasProveedores, ...filasRepartidores]);
    }

    cargar();

    const channel = supabase
      .channel("aprobaciones-pendientes")
      .on("postgres_changes", { event: "*", schema: "public", table: "proveedores" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "repartidores" }, cargar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visibles = filas.filter(
    (f) => (filtroTipo === "todos" || f.tipo === filtroTipo) && filtraPorEstado(f.estado, filtroEstado)
  );

  return (
    <div>
      <div className="filter-tabs">
        {(["todos", "proveedor", "repartidor"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroTipo(f)}
            className={`filter-tab${filtroTipo === f ? " is-active" : ""}`}
          >
            {f === "todos" ? "Todos" : f === "proveedor" ? "Proveedores" : "Repartidores"}
          </button>
        ))}
      </div>
      <div className="filter-tabs">
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltroEstado(f.valor)}
            className={`filter-tab${filtroEstado === f.valor ? " is-active" : ""}`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Registrado</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((f) => (
            <tr key={`${f.tipo}-${f.id}`}>
              <td>
                <Link href={`/aprobaciones/${f.tipo}/${f.id}`} style={{ color: "var(--primary)" }}>
                  {f.tipo === "proveedor" ? "Proveedor" : "Repartidor"}
                </Link>
              </td>
              <td>{f.nombre}</td>
              <td className="cell-muted">{f.email}</td>
              <td>
                <span className={`badge badge--${varianteBadgeEstado(f.estado)}`}>{etiquetaEstado(f.estado)}</span>
              </td>
              <td className="cell-muted">{new Date(f.created_at).toLocaleDateString("es-CR")}</td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr className="empty-row"><td colSpan={5}>No hay solicitudes para este filtro.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
