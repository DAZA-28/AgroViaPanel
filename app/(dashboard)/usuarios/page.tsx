import { UsuariosTabs } from "./UsuariosTabs";

export default function UsuariosPage() {
  return (
    <div className="view-panel">
      <div className="page-header">
        <h1>Usuarios</h1>
        <p>Repartidores, tiendas y clientes registrados en AgroVia.</p>
      </div>
      <UsuariosTabs />
    </div>
  );
}
