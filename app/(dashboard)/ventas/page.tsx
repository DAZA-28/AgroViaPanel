import { VentasPanel } from "./VentasPanel";

export default function VentasPage() {
  return (
    <div className="view-panel">
      <div className="page-header">
        <h1>Ventas</h1>
        <p>Plata movida por la plataforma: GMV, ticket promedio y tendencia por día.</p>
      </div>
      <VentasPanel />
    </div>
  );
}
