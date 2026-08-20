export interface NavItem {
  href: string;
  label: string;
  enabled: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Métricas", enabled: true },
  { href: "/aprobaciones", label: "Aprobaciones", enabled: true },
  { href: "/pedidos", label: "Pedidos en vivo", enabled: false },
  { href: "/salud", label: "Salud del sistema", enabled: false },
  { href: "/usuarios", label: "Usuarios y actividad", enabled: false },
];
