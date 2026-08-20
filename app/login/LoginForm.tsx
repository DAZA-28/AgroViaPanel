"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getStaffForUser } from "@/lib/staff";
import { Robot } from "@/components/Robot";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const staff = await getStaffForUser(supabase, data.user.id);
    if (!staff || !staff.activo) {
      await supabase.auth.signOut();
      setError("Tu cuenta no tiene acceso al panel.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 60, alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <form onSubmit={onSubmit} style={{ background: "var(--bg-card)", padding: 32, borderRadius: 16, width: 320 }}>
        <h2 style={{ color: "var(--primary)", marginBottom: 20 }}>Iniciar sesión</h2>
        {error && <p style={{ color: "var(--error)", marginBottom: 12 }}>{error}</p>}
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 12, marginBottom: 10, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 12, marginBottom: 10, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 8 }}
        />
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, background: "var(--primary)", border: "none", borderRadius: 8, fontWeight: "bold" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <Robot message={error ?? "¡Hola! Iniciá sesión para continuar \u{1F44B}"} variant={error ? "error" : "greeting"} />
    </div>
  );
}
