"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { etiquetaEstado } from "@/lib/aprobaciones";
import type { ProveedorRow, RepartidorRow } from "@/lib/types";

type Fila = { tipo: "proveedor" | "repartidor"; id: number; nombre: string; email: string; estado: string; created_at: string };

const COLUMNAS_PROVEEDOR =
  "id, nombre, email, tienda_id, telefono, tipo_proveedor, cedula, cedula_juridica, nombre_representante, cedula_representante, verificado_mag, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";
const COLUMNAS_REPARTIDOR =
  "id, nombre, email, telefono, activo, foto_url, cedula, tipo_vehiculo, placa, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";

const ESTADOS_PENDIENTES = ["pendiente", "en_revision"];

export function AprobacionesTable() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "proveedor" | "repartidor">("todos");

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      const [{ data: proveedores }, { data: repartidores }] = await Promise.all([
        supabase.from("proveedores").select(COLUMNAS_PROVEEDOR).in("estado_aprobacion", ESTADOS_PENDIENTES).returns<ProveedorRow[]>(),
        supabase.from("repartidores").select(COLUMNAS_REPARTIDOR).in("estado_aprobacion", ESTADOS_PENDIENTES).returns<RepartidorRow[]>(),
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

  const visibles = filas.filter((f) => filtro === "todos" || f.tipo === filtro);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {(["todos", "proveedor", "repartidor"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{ marginRight: 8, padding: "6px 12px", background: filtro === f ? "var(--primary)" : "var(--bg-card)", border: "none", borderRadius: 6, color: "#fff" }}
          >
            {f === "todos" ? "Todos" : f === "proveedor" ? "Proveedores" : "Repartidores"}
          </button>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
            <th style={{ padding: 8 }}>Tipo</th>
            <th style={{ padding: 8 }}>Nombre</th>
            <th style={{ padding: 8 }}>Email</th>
            <th style={{ padding: 8 }}>Estado</th>
            <th style={{ padding: 8 }}>Registrado</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((f) => (
            <tr key={`${f.tipo}-${f.id}`} style={{ borderTop: "1px solid var(--border-color)" }}>
              <td style={{ padding: 8 }}>
                <Link href={`/aprobaciones/${f.tipo}/${f.id}`} style={{ color: "var(--primary)" }}>
                  {f.tipo === "proveedor" ? "Proveedor" : "Repartidor"}
                </Link>
              </td>
              <td style={{ padding: 8 }}>{f.nombre}</td>
              <td style={{ padding: 8 }}>{f.email}</td>
              <td style={{ padding: 8 }}>{etiquetaEstado(f.estado)}</td>
              <td style={{ padding: 8 }}>{new Date(f.created_at).toLocaleDateString("es-CR")}</td>
            </tr>
          ))}
          {visibles.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 16, color: "var(--text-muted)" }}>No hay solicitudes pendientes.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
