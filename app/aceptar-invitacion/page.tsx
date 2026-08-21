"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AceptarInvitacionPage() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("No se pudo conectar. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form onSubmit={enviar} className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div className="page-header">
          <h1>Definí tu contraseña</h1>
          <p>Ya tenés acceso al panel de AgroVia. Elegí una contraseña para entrar.</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="cell-muted" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
            Nueva contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="cell-muted" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 10 }}
          />
        </div>

        {error && (
          <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        <button type="submit" disabled={enviando} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          {enviando ? "Guardando..." : "Entrar al panel"}
        </button>
      </form>
    </div>
  );
}
