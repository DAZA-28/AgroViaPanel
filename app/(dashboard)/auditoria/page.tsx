import { AuditoriaTable } from "./AuditoriaTable";

export default function AuditoriaPage() {
  return (
    <div className="view-panel">
      <div className="page-header">
        <h1>Auditoría</h1>
        <p>Historial de aprobaciones, rechazos y suspensiones de proveedores y repartidores.</p>
      </div>
      <AuditoriaTable />
    </div>
  );
}
