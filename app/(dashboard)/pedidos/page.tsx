import { PedidosTable } from "./PedidosTable";

export default function PedidosPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Pedidos en vivo</h1>
        <p>Pedidos activos en este momento: nuevos, listos para recoger y en camino.</p>
      </div>
      <PedidosTable />
    </div>
  );
}
