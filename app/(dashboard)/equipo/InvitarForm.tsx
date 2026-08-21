"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitarForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    try {
      const res = await fetch("/api/equipo/invitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email }),
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.error ?? "No se pudo enviar la invitación.");
        return;
      }

      setNombre("");
      setEmail("");
      router.refresh();
    } catch {
      alert("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="card" style={{ marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div>
        <label className="cell-muted" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
          Nombre
        </label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 8 }} />
      </div>
      <div>
        <label className="cell-muted" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
          Email
        </label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8, padding: 8 }} />
      </div>
      <button type="submit" disabled={enviando} className="btn btn-primary">
        {enviando ? "Enviando..." : "Invitar"}
      </button>
    </form>
  );
}
