"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { createClient } from "@/lib/supabase/client";

export function Nav({ rol }: { rol: "admin" | "operador" }) {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login.html";
    router.refresh();
  }

  return (
    <nav style={{ width: 220, background: "var(--bg-card)", padding: 20, minHeight: "100vh" }}>
      <div style={{ color: "var(--primary)", fontWeight: "bold", fontSize: 20, marginBottom: 24 }}>
        AgroVia Panel
      </div>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.enabled ? item.href : "#"}
          style={{
            display: "block",
            padding: "10px 12px",
            marginBottom: 4,
            borderRadius: 8,
            color: item.enabled ? "var(--text-light)" : "var(--text-muted)",
            background: pathname === item.href ? "rgba(76,175,80,0.15)" : "transparent",
            pointerEvents: item.enabled ? "auto" : "none",
          }}
        >
          {item.label}{!item.enabled && " (próximamente)"}
        </Link>
      ))}
      {rol === "admin" && (
        <Link href="/equipo" style={{ display: "block", padding: "10px 12px", marginTop: 20, color: "var(--text-light)" }}>
          Equipo
        </Link>
      )}
      <button
        onClick={cerrarSesion}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "10px 12px",
          marginTop: 20,
          background: "transparent",
          border: "none",
          borderTop: "1px solid var(--border-color)",
          color: "var(--text-muted)",
          cursor: "pointer",
        }}
      >
        Cerrar sesión
      </button>
    </nav>
  );
}
