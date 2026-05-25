const API_URL = window.location.origin;

/* =========================
   FIREBASE AUTH
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyD6t7kfGjBllkzuDVarL7oaECryUa2-fx4",
  authDomain: "chatbotgpt-2eb38.firebaseapp.com",
  projectId: "chatbotgpt-2eb38",
  storageBucket: "chatbotgpt-2eb38.firebasestorage.app",
  messagingSenderId: "762904867561",
  appId: "1:762904867561:web:984b481d3c469ccd057678",
  measurementId: "G-0W817YXQ6T"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
let adminToken = "";

/* =========================
   POSTULACIONES
========================= */
const postulacionesList = document.getElementById("postulacionesList");
const dashboardStatus = document.getElementById("dashboardStatus");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

const statTotal = document.getElementById("statTotal");
const statPendiente = document.getElementById("statPendiente");
const statAprobado = document.getElementById("statAprobado");
const statRechazado = document.getElementById("statRechazado");

const modal = document.getElementById("candidateModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const closeModalBackdrop = document.getElementById("closeModalBackdrop");

const modalNombre = document.getElementById("modalNombre");
const modalEstado = document.getElementById("modalEstado");
const modalCiudad = document.getElementById("modalCiudad");
const modalPuesto = document.getElementById("modalPuesto");
const modalEscolaridad = document.getElementById("modalEscolaridad");
const modalFecha = document.getElementById("modalFecha");
const modalExperiencia = document.getElementById("modalExperiencia");
const modalHabilidades = document.getElementById("modalHabilidades");
const modalCvLink = document.getElementById("modalCvLink");

const approveBtn = document.getElementById("approveBtn");
const rejectBtn = document.getElementById("rejectBtn");

let postulaciones = [];
let selectedCandidate = null;

/* =========================
   HELPERS
========================= */
function setStatus(message, show = true) {
  if (!dashboardStatus) return;
  dashboardStatus.textContent = message;
  dashboardStatus.classList.toggle("hidden", !show);
}

function formatFecha(fechaIso) {
  if (!fechaIso) return "-";
  const date = new Date(fechaIso);
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getEstadoClass(estado) {
  if (estado === "aprobado") return "estado estado--aprobado";
  if (estado === "rechazado") return "estado estado--rechazado";
  return "estado estado--pendiente";
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: `Bearer ${adminToken}`
  };
}

/* =========================
   POSTULACIONES
========================= */
function updateStats() {
  const total = postulaciones.length;
  const pendientes = postulaciones.filter(p => p.estadoSolicitud === "pendiente").length;
  const aprobados = postulaciones.filter(p => p.estadoSolicitud === "aprobado").length;
  const rechazados = postulaciones.filter(p => p.estadoSolicitud === "rechazado").length;

  statTotal.textContent = total;
  statPendiente.textContent = pendientes;
  statAprobado.textContent = aprobados;
  statRechazado.textContent = rechazados;
}

function renderPostulaciones() {
  if (!postulacionesList) return;

  postulacionesList.innerHTML = "";

  if (!postulaciones.length) {
    postulacionesList.innerHTML = `
      <div class="status">
        No hay postulaciones registradas todavía.
      </div>
    `;
    updateStats();
    return;
  }

  postulaciones.forEach((postulacion) => {
    const card = document.createElement("article");
    card.className = "dashboard-card";

    card.innerHTML = `
      <div class="dashboard-card__top">
        <div>
          <h3>${postulacion.nombre || "Sin nombre"}</h3>
          <p>${postulacion.vacanteTitulo || postulacion.puestoInteres || "Sin puesto de interés"}</p>
        </div>
        <span class="${getEstadoClass(postulacion.estadoSolicitud)}">
          ${postulacion.estadoSolicitud || "pendiente"}
        </span>
      </div>

      <div class="dashboard-card__info">
        <p><strong>Ciudad:</strong> ${postulacion.ciudad || "-"}</p>
        <p><strong>Grupo:</strong> ${postulacion.grupoSeleccionado || "-"}</p>
        <p><strong>Tipo:</strong> ${postulacion.tipoVacante || "-"}</p>
        <p><strong>CV:</strong> ${postulacion.cvNombre || "No disponible"}</p>
      </div>

      <div class="dashboard-card__actions">
        <button class="btn btn--secondary view-btn" data-id="${postulacion.id}">
          Ver datos
        </button>
      </div>
    `;

    postulacionesList.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const candidate = postulaciones.find((p) => p.id === id);
      if (candidate) openCandidateModal(candidate);
    });
  });

  updateStats();
}

function openCandidateModal(candidate) {
  selectedCandidate = candidate;

  modalNombre.textContent = candidate.nombre || "Sin nombre";
  modalEstado.textContent = `Estado: ${candidate.estadoSolicitud || "pendiente"}`;
  modalCiudad.textContent = candidate.ciudad || "-";
  modalPuesto.textContent = candidate.vacanteTitulo || candidate.puestoInteres || "-";
  modalEscolaridad.textContent = candidate.escolaridad || "-";
  modalFecha.textContent = formatFecha(candidate.fechaRegistro);
  modalExperiencia.textContent = candidate.experiencia || "No proporcionada";
  modalHabilidades.textContent = candidate.habilidades || "No proporcionadas";
  modalCvLink.href = candidate.cvRuta ? `${API_URL}${candidate.cvRuta}` : "#";

  modal.classList.remove("hidden");
}

function closeCandidateModal() {
  modal.classList.add("hidden");
  selectedCandidate = null;
}

async function cargarPostulaciones() {
  try {
    setStatus("Cargando postulaciones...");

    const res = await fetch(`${API_URL}/api/postulaciones`, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `Error HTTP ${res.status}`);

    postulaciones = data;
    renderPostulaciones();
    setStatus("", false);
  } catch (error) {
    console.error("Error cargando postulaciones:", error);
    setStatus(`⚠️ ${error.message || "No fue posible cargar las postulaciones."}`);
  }
}

async function actualizarEstado(nuevoEstado) {
  if (!selectedCandidate?.id) return;

  try {
    const res = await fetch(`${API_URL}/api/postulaciones/${selectedCandidate.id}/estado`, {
      method: "PATCH",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible actualizar el estado.");

    await cargarPostulaciones();
    closeCandidateModal();
    setStatus(`✅ Solicitud marcada como ${nuevoEstado}.`);
  } catch (error) {
    console.error("Error actualizando estado:", error);
    setStatus(`⚠️ ${error.message}`);
  }
}

async function cerrarSesion() {
  try {
    await auth.signOut();
    window.location.href = "/login-admin.html";
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    setStatus("⚠️ No fue posible cerrar sesión.");
  }
}

/* =========================
   EVENTS
========================= */
if (refreshBtn) refreshBtn.addEventListener("click", cargarPostulaciones);
if (logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeCandidateModal);
if (closeModalBackdrop) closeModalBackdrop.addEventListener("click", closeCandidateModal);
if (approveBtn) approveBtn.addEventListener("click", () => actualizarEstado("aprobado"));
if (rejectBtn) rejectBtn.addEventListener("click", () => actualizarEstado("rechazado"));

/* =========================
   INIT
========================= */
async function init() {
  await cargarPostulaciones();
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "/login-admin.html";
    return;
  }

  try {
    adminToken = await user.getIdToken(true);
    init();
  } catch (error) {
    console.error("Error obteniendo token:", error);
    window.location.href = "/login-admin.html";
  }
});  modalNombre.textContent = candidate.nombre || "Sin nombre";
  modalEstado.textContent = `Estado: ${candidate.estadoSolicitud || "pendiente"}`;
  modalCiudad.textContent = candidate.ciudad || "-";
  modalSucursal.textContent = candidate.sucursal || candidate.sucursalNombre || candidate.sucursalId || "-";
  modalPuesto.textContent = candidate.vacanteTitulo || candidate.puestoInteres || "-";
  modalEscolaridad.textContent = candidate.escolaridad || "-";
  modalFecha.textContent = formatFecha(candidate.fechaRegistro);
  modalDireccion.textContent = candidate.direccion || "No registrada";
  modalExperiencia.textContent = candidate.experiencia || "No proporcionada";
  modalHabilidades.textContent = candidate.habilidades || "No proporcionadas";
  modalCvLink.href = candidate.cvRuta ? `${API_URL}${candidate.cvRuta}` : "#";

  setMapLink(modalGoogleMapsLink, getGoogleMapsUrl(candidate));
  setMapLink(modalAppleMapsLink, getAppleMapsUrl(candidate));

  modal.classList.remove("hidden");


function closeCandidateModal() {
  modal.classList.add("hidden");
  selectedCandidate = null;
}

async function cargarPostulaciones() {
  try {
    setStatus("Cargando postulaciones...");

    const res = await fetch(`${API_URL}/api/postulaciones`, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `Error HTTP ${res.status}`);

    postulaciones = data;
    renderPostulaciones();
    setStatus("", false);
  } catch (error) {
    console.error("Error cargando postulaciones:", error);
    setStatus(`${error.message || "No fue posible cargar las postulaciones."}`);
  }
}

async function actualizarEstado(nuevoEstado) {
  if (!selectedCandidate?.id) return;

  try {
    const res = await fetch(`${API_URL}/api/postulaciones/${selectedCandidate.id}/estado`, {
      method: "PATCH",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible actualizar el estado.");

    await cargarPostulaciones();
    closeCandidateModal();
    setStatus(`Solicitud marcada como ${nuevoEstado}.`);
  } catch (error) {
    console.error("Error actualizando estado:", error);
    setStatus(`${error.message}`);
  }
}

async function cerrarSesion() {
  try {
    await auth.signOut();
    window.location.href = "/login-admin.html";
  } catch (error) {
    console.error("Error cerrando sesion:", error);
    setStatus("No fue posible cerrar sesion.");
  }
}

/* =========================
   EVENTS
========================= */
if (refreshBtn) refreshBtn.addEventListener("click", cargarPostulaciones);
if (logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeCandidateModal);
if (closeModalBackdrop) closeModalBackdrop.addEventListener("click", closeCandidateModal);
if (approveBtn) approveBtn.addEventListener("click", () => actualizarEstado("aprobado"));
if (rejectBtn) rejectBtn.addEventListener("click", () => actualizarEstado("rechazado"));

/* =========================
   INIT
========================= */
async function init() {
  await cargarPostulaciones();
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "/login-admin.html";
    return;
  }

  try {
    adminToken = await user.getIdToken(true);
    init();
  } catch (error) {
    console.error("Error obteniendo token:", error);
    window.location.href = "/login-admin.html";
  }
});