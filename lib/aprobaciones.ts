const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export function estaPendienteDeRevision(estado: string): boolean {
  return estado === "pendiente" || estado === "en_revision";
}

export function etiquetaEstado(estado: string): string {
  return ETIQUETAS[estado] ?? estado;
}
