export type AccionCuenta = "suspender" | "reactivar";

export function accionCuentaDisponible(estado: string): AccionCuenta | null {
  if (estado === "aprobado") return "suspender";
  if (estado === "rechazado") return "reactivar";
  return null;
}

export function coincideBusqueda(nombre: string, email: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return nombre.toLowerCase().includes(q) || email.toLowerCase().includes(q);
}
