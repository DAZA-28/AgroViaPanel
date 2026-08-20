"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { estaPendienteDeRevision, etiquetaEstado } from "@/lib/aprobaciones";
import type { ProveedorRow, RepartidorRow } from "@/lib/types";

type Fila = { tipo: "proveedor" | "repartidor"; id: number; nombre: string; email: string; estado: string; created_at: string };

export function AprobacionesTable() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "proveedor" | "repartidor">("todos");

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      const [{ data: proveedores }, { data: repartidores }] = await Promise.all([
        supabase.from("proveedores").select("*").returns<ProveedorRow[]>(),
        supabase.from("repartidores").select("*").returns<RepartidorRow[]>(),
      ]);

      const filasProveedores: Fila[] = (proveedores ?? [])
        .filter((p) => estaPendienteDeRevision(p.estado_aprobacion))
        .map((p) => ({ tipo: "proveedor", id: p.id, nombre: p.nombre, email: p.email, estado: p.estado_aprobacion, created_at: p.created_at }));

      const filasRepartidores: Fila[] = (repartidores ?? [])
        .filter((r) => estaPendienteDeRevision(r.estado_aprobacion))
        .map((r) => ({ tipo: "repartidor", id: r.id, nombre: r.nombre, email: r.email, estado: r.estado_aprobacion, created_at: r.created_at }));

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
