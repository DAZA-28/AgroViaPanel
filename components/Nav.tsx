"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { createClient } from "@/lib/supabase/client";

const ICONS: Record<string, React.ReactNode> = {
  "/": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  "/aprobaciones": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  "/pedidos": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
      <circle cx="9" cy="21" r="1.5" />
      <circle cx="18" cy="21" r="1.5" />
    </svg>
  ),
  "/salud": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  "/usuarios": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

const EQUIPO_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const SIGNOUT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export function Nav({ rol }: { rol: "admin" | "operador" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login.html";
    router.refresh();
  }

  function handleTouchToggle(e: React.PointerEvent) {
    if (e.pointerType === "touch") {
      setExpanded((prev) => !prev);
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setExpanded(false);
    }
  }

  return (
    <nav
      className={`sidebar${expanded ? " is-expanded" : ""}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onPointerDown={handleTouchToggle}
      onFocus={() => setExpanded(true)}
      onBlur={handleBlur}
    >
      <div className="sidebar-brand">AgroVia Panel</div>
      <div className="sidebar-section">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.enabled ? item.href : "#"}
            className={`sidebar-link${pathname === item.href ? " is-active" : ""}${!item.enabled ? " is-disabled" : ""}`}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {ICONS[item.href]}
            <span className="sidebar-link-label">
              {item.label}
              {!item.enabled && " (próximamente)"}
            </span>
          </Link>
        ))}
        {rol === "admin" && (
          <a href="/equipo.html" className="sidebar-link">
            {EQUIPO_ICON}
            <span className="sidebar-link-label">Equipo</span>
          </a>
        )}
      </div>
      <div className="sidebar-spacer" />
      <div className="sidebar-divider" />
      <button onClick={cerrarSesion} className="sidebar-signout">
        {SIGNOUT_ICON}
        <span className="sidebar-link-label">Cerrar sesión</span>
      </button>
    </nav>
  );
}
