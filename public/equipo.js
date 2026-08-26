import { createBrowserClient } from "./vendor/supabase-ssr.js";

const SUPABASE_URL = "https://yoalngiolqwyrhmveosn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvYWxuZ2lvbHF3eXJobXZlb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTM2OTEsImV4cCI6MjA5NDc4OTY5MX0.CTm7CBuJS-8BKu3-AfvZEeoGORRGX4gIihrUuNZgUrM";

const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const sidebar = document.getElementById("sidebar");
const btnSignOut = document.getElementById("btnSignOut");
const formInvitar = document.getElementById("formInvitar");
const inputNombre = document.getElementById("inputNombre");
const inputEmail = document.getElementById("inputEmail");
const btnInvitar = document.getElementById("btnInvitar");
const tbodyEquipo = document.getElementById("tbodyEquipo");

let miPropioId = null;

function expandSidebar() {
  sidebar.classList.add("is-expanded");
}
function collapseSidebar() {
  sidebar.classList.remove("is-expanded");
}
sidebar.addEventListener("mouseenter", expandSidebar);
sidebar.addEventListener("mouseleave", collapseSidebar);
sidebar.addEventListener("focusin", expandSidebar);
sidebar.addEventListener("focusout", (e) => {
  if (!sidebar.contains(e.relatedTarget)) collapseSidebar();
});
sidebar.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") sidebar.classList.toggle("is-expanded");
});

btnSignOut.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
});

function crearBadge(texto, variante) {
  const span = document.createElement("span");
  span.className = `badge badge--${variante}`;
  span.textContent = texto;
  return span;
}

function crearFilaEquipo(s) {
  const tr = document.createElement("tr");
  const esUnoMismo = s.id === miPropioId;

  const tdNombre = document.createElement("td");
  tdNombre.textContent = s.nombre;
  if (esUnoMismo) {
    const span = document.createElement("span");
    span.className = "cell-muted";
    span.textContent = " (vos)";
    tdNombre.appendChild(span);
  }

  const tdEmail = document.createElement("td");
  tdEmail.className = "cell-muted";
  tdEmail.textContent = s.email;

  const tdRol = document.createElement("td");
  const select = document.createElement("select");
  select.disabled = esUnoMismo;
  for (const [valor, etiqueta] of [["admin", "Admin"], ["operador", "Operador"]]) {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = etiqueta;
    if (valor === s.rol) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener("change", () => cambiarRol(s.id, select.value, tr));
  tdRol.appendChild(select);

  const tdActivo = document.createElement("td");
  tdActivo.appendChild(crearBadge(s.activo ? "Sí" : "No", s.activo ? "success" : "neutral"));

  const tdAccion = document.createElement("td");
  const btnToggle = document.createElement("button");
  btnToggle.className = "btn btn-secondary";
  btnToggle.disabled = esUnoMismo;
  btnToggle.textContent = s.activo ? "Desactivar" : "Activar";
  btnToggle.addEventListener("click", () => alternarActivo(s.id, s.activo, tr));
  tdAccion.appendChild(btnToggle);

  tr.append(tdNombre, tdEmail, tdRol, tdActivo, tdAccion);
  tr.dataset.id = String(s.id);
  return tr;
}

async function cambiarRol(id, rol, filaActual) {
  const { data } = await supabase.from("staff_dashboard").update({ rol }).eq("id", id).select();
  if (!data || data.length === 0) {
    alert("No se pudo actualizar el rol. Puede que no tengas permiso o el registro ya no exista.");
    return;
  }
  filaActual.replaceWith(crearFilaEquipo(data[0]));
}

async function alternarActivo(id, activo, filaActual) {
  const { data } = await supabase.from("staff_dashboard").update({ activo: !activo }).eq("id", id).select();
  if (!data || data.length === 0) {
    alert("No se pudo actualizar el estado. Puede que no tengas permiso o el registro ya no exista.");
    return;
  }
  filaActual.replaceWith(crearFilaEquipo(data[0]));
}

function renderEquipo(equipo) {
  tbodyEquipo.innerHTML = "";
  if (equipo.length === 0) {
    const tr = document.createElement("tr");
    tr.className = "empty-row";
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "Sin staff registrado.";
    tr.appendChild(td);
    tbodyEquipo.appendChild(tr);
    return;
  }
  for (const s of equipo) {
    tbodyEquipo.appendChild(crearFilaEquipo(s));
  }
}

async function cargarEquipo() {
  const { data: equipo } = await supabase.from("staff_dashboard").select("*").order("nombre");
  renderEquipo(equipo ?? []);
}

formInvitar.addEventListener("submit", async (event) => {
  event.preventDefault();
  btnInvitar.disabled = true;
  btnInvitar.textContent = "Enviando...";

  try {
    const res = await fetch("/api/equipo/invitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: inputNombre.value, email: inputEmail.value }),
    });
    const data = await res.json();

    if (!data.ok) {
      alert(data.error ?? "No se pudo enviar la invitación.");
      return;
    }

    inputNombre.value = "";
    inputEmail.value = "";
    await cargarEquipo();
  } catch {
    alert("No se pudo conectar con el servidor. Intentá de nuevo.");
  } finally {
    btnInvitar.disabled = false;
    btnInvitar.textContent = "Invitar";
  }
});

async function init() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const { data: staff } = await supabase.from("staff_dashboard").select("*").eq("user_id", user.id).maybeSingle();
  if (!staff || !staff.activo) {
    window.location.href = "/login.html";
    return;
  }
  if (staff.rol !== "admin") {
    window.location.href = "/";
    return;
  }

  miPropioId = staff.id;
  await cargarEquipo();
}

init();
