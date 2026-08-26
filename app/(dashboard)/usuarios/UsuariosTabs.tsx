"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { etiquetaEstado, filtraPorEstado, varianteBadgeEstado, type FiltroEstado } from "@/lib/aprobaciones";
import { coincideBusqueda } from "@/lib/usuarios";
import type { ProveedorConTienda, RepartidorRow, UsuarioRow } from "@/lib/types";
import { DetalleModal, type Seleccion } from "./DetalleModal";

type Pestana = "repartidor" | "proveedor" | "cliente";

const FILTROS_ESTADO: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "aprobado", etiqueta: "Aprobados" },
  { valor: "pendientes", etiqueta: "Pendientes" },
  { valor: "rechazado", etiqueta: "Rechazados" },
];

const COLUMNAS_REPARTIDOR =
  "id, nombre, email, telefono, activo, foto_url, cedula, tipo_vehiculo, placa, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at";
const COLUMNAS_PROVEEDOR =
  "id, nombre, email, tienda_id, telefono, tipo_proveedor, cedula, cedula_juridica, nombre_representante, cedula_representante, verificado_mag, estado_aprobacion, comentario_revision, revisado_por, revisado_en, created_at, tiendas(nombre, categoria, logo_url)";
const COLUMNAS_CLIENTE = "id, username, email, direccion, avatar_url, creditos, verificado, created_at";

export function UsuariosTabs() {
  const [pestana, setPestana] = useState<Pestana>("repartidor");
  const [repartidores, setRepartidores] = useState<RepartidorRow[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorConTienda[]>([]);
  const [clientes, setClientes] = useState<UsuarioRow[]>([]);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  useEffect(() => {
    const supabase = createClient();

    async function cargar() {
      const [{ data: rep }, { data: prov }, { data: cli }] = await Promise.all([
        supabase.from("repartidores").select(COLUMNAS_REPARTIDOR).order("nombre").returns<RepartidorRow[]>(),
        supabase.from("proveedores").select(COLUMNAS_PROVEEDOR).order("nombre").returns<ProveedorConTienda[]>(),
        supabase.from("usuarios").select(COLUMNAS_CLIENTE).order("created_at", { ascending: false }).returns<UsuarioRow[]>(),
      ]);
      setRepartidores(rep ?? []);
      setProveedores(prov ?? []);
      setClientes(cli ?? []);
    }

    cargar();

    const channel = supabase
      .channel("usuarios-todos")
      .on("postgres_changes", { event: "*", schema: "public", table: "repartidores" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "proveedores" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "usuarios" }, cargar)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function onCambiado(nuevoEstado: string) {
    if (seleccion?.tipo === "repartidor") {
      setRepartidores((prev) => prev.map((r) => (r.id === seleccion.data.id ? { ...r, estado_aprobacion: nuevoEstado as RepartidorRow["estado_aprobacion"] } : r)));
      setSeleccion({ tipo: "repartidor", data: { ...seleccion.data, estado_aprobacion: nuevoEstado as RepartidorRow["estado_aprobacion"] } });
    } else if (seleccion?.tipo === "proveedor") {
      setProveedores((prev) => prev.map((p) => (p.id === seleccion.data.id ? { ...p, estado_aprobacion: nuevoEstado as ProveedorConTienda["estado_aprobacion"] } : p)));
      setSeleccion({ tipo: "proveedor", data: { ...seleccion.data, estado_aprobacion: nuevoEstado as ProveedorConTienda["estado_aprobacion"] } });
    }
  }

  const repartidoresVisibles = repartidores
    .filter((r) => coincideBusqueda(r.nombre, r.email, busqueda))
    .filter((r) => filtraPorEstado(r.estado_aprobacion, filtroEstado));
  const proveedoresVisibles = proveedores
    .filter((p) => coincideBusqueda(p.nombre, p.email, busqueda))
    .filter((p) => filtraPorEstado(p.estado_aprobacion, filtroEstado));
  const clientesVisibles = clientes.filter((c) => coincideBusqueda(c.username ?? "", c.email, busqueda));

  const muestraFiltroEstado = pestana !== "cliente";

  return (
    <div>
      <div className="filter-tabs">
        <button onClick={() => setPestana("repartidor")} className={`filter-tab${pestana === "repartidor" ? " is-active" : ""}`}>
          Repartidores
        </button>
        <button onClick={() => setPestana("proveedor")} className={`filter-tab${pestana === "proveedor" ? " is-active" : ""}`}>
          Tiendas
        </button>
        <button onClick={() => setPestana("cliente")} className={`filter-tab${pestana === "cliente" ? " is-active" : ""}`}>
          Clientes
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email…"
          style={{ background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: "8px 12px", fontSize: 14, minWidth: 240 }}
        />
        {muestraFiltroEstado && (
          <div className="filter-tabs" style={{ marginBottom: 0 }}>
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
        )}
      </div>

      {pestana === "repartidor" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Vehículo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {repartidoresVisibles.map((r) => (
              <tr key={r.id} onClick={() => setSeleccion({ tipo: "repartidor", data: r })} style={{ cursor: "pointer" }}>
                <td>{r.nombre}</td>
                <td className="cell-muted">{r.email}</td>
                <td className="cell-muted">{r.tipo_vehiculo}</td>
                <td>
                  <span className={`badge badge--${varianteBadgeEstado(r.estado_aprobacion)}`}>{etiquetaEstado(r.estado_aprobacion)}</span>
                </td>
              </tr>
            ))}
            {repartidoresVisibles.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No hay repartidores para este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {pestana === "proveedor" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tienda</th>
              <th>Email</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {proveedoresVisibles.map((p) => (
              <tr key={p.id} onClick={() => setSeleccion({ tipo: "proveedor", data: p })} style={{ cursor: "pointer" }}>
                <td>{p.nombre}</td>
                <td className="cell-muted">{p.tiendas?.nombre ?? "—"}</td>
                <td className="cell-muted">{p.email}</td>
                <td>
                  <span className={`badge badge--${varianteBadgeEstado(p.estado_aprobacion)}`}>{etiquetaEstado(p.estado_aprobacion)}</span>
                </td>
              </tr>
            ))}
            {proveedoresVisibles.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No hay tiendas para este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {pestana === "cliente" && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Créditos</th>
              <th>Registrado</th>
            </tr>
          </thead>
          <tbody>
            {clientesVisibles.map((c) => (
              <tr key={c.id} onClick={() => setSeleccion({ tipo: "cliente", data: c })} style={{ cursor: "pointer" }}>
                <td>{c.username ?? "—"}</td>
                <td className="cell-muted">{c.email}</td>
                <td className="cell-muted">{c.creditos}</td>
                <td className="cell-muted">{new Date(c.created_at).toLocaleDateString("es-CR")}</td>
              </tr>
            ))}
            {clientesVisibles.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No hay clientes para este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {seleccion && <DetalleModal seleccion={seleccion} onClose={() => setSeleccion(null)} onCambiado={onCambiado} />}
    </div>
  );
}
