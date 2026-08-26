import { AprobacionesTable } from "./AprobacionesTable";

export default function AprobacionesPage() {
  return (
    <div className="view-panel">
      <div className="page-header">
        <h1>Aprobaciones</h1>
        <p>Solicitudes de proveedores y repartidores pendientes de revisión.</p>
      </div>
      <AprobacionesTable />
    </div>
  );
}
