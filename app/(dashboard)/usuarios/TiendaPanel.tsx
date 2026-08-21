"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TiendaInfo = {
  nombre: string;
  descripcion: string | null;
  logo_url: string | null;
  banner_url: string | null;
  categoria: string | null;
  calificacion: number | null;
};

type ProductoInfo = {
  id: number;
  nombre: string;
  precio: number;
  imagen_url: string | null;
};

function formatearColones(total: number): string {
  return `₡${total.toLocaleString("es-CR")}`;
}

function urlPublica(path: string | null): string | null {
  if (!path) return null;
  const supabase = createClient();
  return supabase.storage.from("productos").getPublicUrl(path).data.publicUrl;
}

export function TiendaPanel({ tiendaId, onClose }: { tiendaId: number; onClose: () => void }) {
  const [tienda, setTienda] = useState<TiendaInfo | null>(null);
  const [productos, setProductos] = useState<ProductoInfo[] | null>(null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      const supabase = createClient();
      const [{ data: tiendaData }, { data: productosData }] = await Promise.all([
        supabase
          .from("tiendas")
          .select("nombre, descripcion, logo_url, banner_url, categoria, calificacion")
          .eq("id", tiendaId)
          .maybeSingle(),
        supabase.from("productos").select("id, nombre, precio, imagen_url").eq("tienda_id", tiendaId).order("nombre"),
      ]);
      if (activo) {
        setTienda(tiendaData ?? null);
        setProductos(productosData ?? []);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [tiendaId]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close tienda-panel-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        {!tienda ? (
          <div className="historial-empty">Cargando...</div>
        ) : (
          <>
            <div className="tienda-panel-banner" style={tienda.banner_url ? { backgroundImage: `url(${urlPublica(tienda.banner_url)})` } : undefined}>
              <div className="tienda-panel-logo">
                {tienda.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlPublica(tienda.logo_url) ?? undefined} alt={tienda.nombre} />
                ) : (
                  <span>{tienda.nombre.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="tienda-panel-header">
              <h2>{tienda.nombre}</h2>
              <div className="tienda-panel-meta">
                {tienda.categoria && <span className="badge badge--neutral">{tienda.categoria}</span>}
                {tienda.calificacion != null && <span className="badge badge--success">★ {tienda.calificacion.toFixed(1)}</span>}
              </div>
              {tienda.descripcion && <p className="tienda-panel-descripcion">{tienda.descripcion}</p>}
            </div>

            <div className="historial-title">Productos</div>
            {productos === null || productos.length === 0 ? (
              <div className="historial-empty">Sin productos registrados.</div>
            ) : (
              <div className="productos-grid">
                {productos.map((p) => (
                  <div key={p.id} className="producto-card">
                    <div className="producto-card-img">
                      {p.imagen_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={urlPublica(p.imagen_url) ?? undefined} alt={p.nombre} />
                      ) : (
                        <span>Sin foto</span>
                      )}
                    </div>
                    <div className="producto-card-nombre">{p.nombre}</div>
                    <div className="producto-card-precio">{formatearColones(p.precio)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
