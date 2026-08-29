import { MetricasPanel } from "./MetricasPanel";

export default function HomePage() {
  return (
    <div className="view-panel" style={{ position: "relative" }}>
      <div className="ambient-glow" aria-hidden="true"></div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Métricas</h1>
          <p>Estado general del ecosistema AgroVia en este momento.</p>
        </div>
        <div className="live-badge"><span className="live-dot"></span>En vivo</div>
      </div>
      <MetricasPanel />
    </div>
  );
}
