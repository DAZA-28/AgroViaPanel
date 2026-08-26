import { createBrowserClient } from "./vendor/supabase-ssr.js";

const SUPABASE_URL = "https://yoalngiolqwyrhmveosn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvYWxuZ2lvbHF3eXJobXZlb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTM2OTEsImV4cCI6MjA5NDc4OTY5MX0.CTm7CBuJS-8BKu3-AfvZEeoGORRGX4gIihrUuNZgUrM";

const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submitButton");

emailInput.addEventListener("focus", () => window.RobotController.onInputFocus("email"));
passwordInput.addEventListener("focus", () => window.RobotController.onInputFocus("password"));
emailInput.addEventListener("input", () => window.RobotController.onTyping());
passwordInput.addEventListener("input", () => {
  window.RobotController.onPasswordTyping(passwordInput.value.length);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  submitButton.textContent = "Entrando...";

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (authError || !data.user) {
      window.RobotController.showError("Correo o contraseña incorrectos.");
      submitButton.disabled = false;
      submitButton.textContent = "Entrar";
      return;
    }

    const { data: staff, error: staffError } = await supabase
      .from("staff_dashboard")
      .select("*")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (staffError || !staff || !staff.activo) {
      await supabase.auth.signOut();
      window.RobotController.showError("Tu cuenta no tiene acceso al panel.");
      submitButton.disabled = false;
      submitButton.textContent = "Entrar";
      return;
    }

    window.RobotController.fullCelebration("¡Bienvenido!");
    setTimeout(() => {
      window.location.href = "/";
    }, 1200);
  } catch (err) {
    window.RobotController.showError("No se pudo conectar. Revisá tu conexión.");
    submitButton.disabled = false;
    submitButton.textContent = "Entrar";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  window.RobotController.init();
  window.initParticles();

  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "invite") {
    window.RobotController.showError("El link de invitación no es válido o ya expiró. Pedile a un admin que te invite de nuevo.");
  }
});
