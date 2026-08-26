import { PedidosTable } from "./PedidosTable";

export default function PedidosPage() {
  return (
    <div className="view-panel" style={{ position: "relative" }}>
      <div className="ambient-glow" aria-hidden="true"></div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Pedidos en vivo</h1>
          <p>Pedidos activos en este momento: nuevos, listos para recoger y en camino.</p>
        </div>
        <div className="live-badge"><span className="live-dot"></span>En vivo</div>
      </div>
      <PedidosTable />
    </div>
  );
}
