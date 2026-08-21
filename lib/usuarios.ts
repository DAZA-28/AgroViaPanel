export type AccionCuenta = "suspender" | "reactivar";

export function accionCuentaDisponible(estado: string): AccionCuenta | null {
  if (estado === "aprobado") return "suspender";
  if (estado === "rechazado") return "reactivar";
  return null;
}
