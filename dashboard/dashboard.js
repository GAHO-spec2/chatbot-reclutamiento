const API_URL = "https://chatbot-reclutamiento-dcqb.onrender.com";

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
   ELEMENTOS
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
const modalSucursal = document.getElementById("modalSucursal");
const modalPuesto = document.getElementById("modalPuesto");
const modalEscolaridad = document.getElementById("modalEscolaridad");
const modalFecha = document.getElementById("modalFecha");
const modalDireccion = document.getElementById("modalDireccion");
const modalExperiencia = document.getElementById("modalExperiencia");
const modalHabilidades = document.getElementById("modalHabilidades");
const modalCvLink = document.getElementById("modalCvLink");

const modalGoogleMapsLink = document.getElementById("modalGoogleMapsLink");
const modalAppleMapsLink = document.getElementById("modalAppleMapsLink");

const approveBtn = document.getElementById("approveBtn");
const rejectBtn = document.getElementById("rejectBtn");
const scheduleInterviewBtn = document.getElementById("scheduleInterviewBtn");

const interviewModal = document.getElementById("interviewModal");
const closeInterviewBtn = document.getElementById("closeInterviewBtn");
const closeInterviewBackdrop = document.getElementById("closeInterviewBackdrop");
const interviewDate = document.getElementById("interviewDate");
const interviewTime = document.getElementById("interviewTime");
const interviewRecruiter = document.getElementById("interviewRecruiter");
const interviewType = document.getElementById("interviewType");
const interviewComments = document.getElementById("interviewComments");
const saveInterviewBtn = document.getElementById("saveInterviewBtn");

let postulaciones = [];
let selectedCandidate = null;

const candidateSearch = document.getElementById("candidateSearch");
const candidateStatusFilter = document.getElementById(
  "candidateStatusFilter"
);
const candidateTypeFilter = document.getElementById(
  "candidateTypeFilter"
);
const clearCandidateFiltersBtn = document.getElementById(
  "clearCandidateFiltersBtn"
);

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
  if (isNaN(date.getTime())) return "-";

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

  if (estado === "rechazado") {
    return "estado estado--rechazado";
  }

  if (estado === "entrevista_agendada") {
    return "estado estado--entrevista";
  }

  return "estado estado--pendiente";
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: `Bearer ${adminToken}`
  };
}

function setMapLink(element, url) {
  if (!element) return;

  if (!url) {
    element.href = "#";
    element.classList.add("hidden");
    return;
  }

  element.href = url;
  element.classList.remove("hidden");
}

function getGoogleMapsUrl(candidate) {
  const direccion = candidate.direccion || candidate.sucursalDireccion || "";
  const ciudad = candidate.ciudad || "";
  const sucursal = candidate.sucursal || candidate.sucursalNombre || "";

  const query = [direccion, sucursal, ciudad].filter(Boolean).join(" ");
  if (!query) return "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getAppleMapsUrl(candidate) {
  const direccion = candidate.direccion || candidate.sucursalDireccion || "";
  const ciudad = candidate.ciudad || "";
  const sucursal = candidate.sucursal || candidate.sucursalNombre || "";

  const query = [direccion, sucursal, ciudad].filter(Boolean).join(" ");
  if (!query) return "";

  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

/* =========================
   STATS
========================= */
function updateStats() {
  const total = postulaciones.length;
  const pendientes = postulaciones.filter(p => p.estadoSolicitud === "pendiente").length;
  const aprobados = postulaciones.filter(p => p.estadoSolicitud === "aprobado" || p.estadoSolicitud === "entrevista_agendada").length;
  const rechazados = postulaciones.filter(p => p.estadoSolicitud === "rechazado").length;

  if (statTotal) statTotal.textContent = total;
  if (statPendiente) statPendiente.textContent = pendientes;
  if (statAprobado) statAprobado.textContent = aprobados;
  if (statRechazado) statRechazado.textContent = rechazados;
}


function normalizarBusqueda(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getPostulacionesFiltradas() {
  const search = normalizarBusqueda(
    candidateSearch?.value || ""
  );

  const status =
    candidateStatusFilter?.value || "";

  const tipo =
    candidateTypeFilter?.value || "";

  return postulaciones.filter((postulacion) => {
    const contenido = normalizarBusqueda(`
      ${postulacion.nombre || ""}
      ${postulacion.vacanteTitulo || ""}
      ${postulacion.puestoInteres || ""}
      ${postulacion.ciudad || ""}
      ${postulacion.sucursal || ""}
      ${postulacion.grupoSeleccionado || ""}
      ${postulacion.correo || ""}
      ${postulacion.telefono || ""}
    `);

    const coincideBusqueda =
      !search || contenido.includes(search);

    const coincideEstado =
      !status ||
      postulacion.estadoSolicitud === status;

    const coincideTipo =
      !tipo ||
      postulacion.tipoVacante === tipo;

    return (
      coincideBusqueda &&
      coincideEstado &&
      coincideTipo
    );
  });
}

function getIniciales(nombre = "") {
  const partes = String(nombre)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) return "RH";

  return partes
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

function formatInterviewDate(fecha = "", hora = "") {
  if (!fecha) {
    return "Sin entrevista";
  }

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return `${fecha} ${hora}`.trim();
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}${hora ? ` · ${hora}` : ""}`;
}



/* =========================
   RENDER POSTULACIONES
========================= */
function renderPostulaciones() {
  if (!postulacionesList) return;

  postulacionesList.innerHTML = "";

  const data = getPostulacionesFiltradas();

  if (!data.length) {
    postulacionesList.innerHTML = `
      <div class="candidate-empty">
        <div class="candidate-empty__icon">🔎</div>
        <h3>No se encontraron candidatos</h3>
        <p>
          Intenta modificar los filtros o actualizar las postulaciones.
        </p>
      </div>
    `;

    updateStats();
    return;
  }

  const fragment = document.createDocumentFragment();

  data.forEach((postulacion) => {
    const card = document.createElement("article");

    card.className = "dashboard-card";
    card.dataset.id = postulacion.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `Ver información de ${postulacion.nombre || "candidato"}`
    );

    const puesto =
      postulacion.vacanteTitulo ||
      postulacion.puestoInteres ||
      "Sin puesto asignado";

    const sucursal =
      postulacion.sucursal ||
      postulacion.sucursalNombre ||
      "Sin sucursal";

    const marca =
      postulacion.grupoSeleccionado ||
      "GA Hospitality";

    const estado =
      postulacion.estadoSolicitud ||
      "pendiente";

    const entrevista = formatInterviewDate(
      postulacion.fechaEntrevista,
      postulacion.horaEntrevista
    );

    card.innerHTML = `
      <div class="candidate-primary">
        <div class="candidate-avatar">
          ${getIniciales(postulacion.nombre)}
        </div>

        <div class="candidate-identity">
          <h3>${postulacion.nombre || "Sin nombre"}</h3>

          <p>
            ${postulacion.correo || postulacion.telefono || "Sin contacto"}
          </p>
        </div>
      </div>

      <div class="candidate-position">
        <strong>${puesto}</strong>

        <span>
          ${marca} · ${sucursal}
        </span>

        <small>
          ${postulacion.ciudad || "Ciudad no registrada"}
        </small>
      </div>

      <div class="candidate-process">
        <span class="${getEstadoClass(estado)}">
          ${estado.replaceAll("_", " ")}
        </span>

        <small>
          ${entrevista}
        </small>
      </div>

      <div class="candidate-actions">
        <button
          class="btn btn--secondary view-btn"
          type="button"
          data-id="${postulacion.id}"
        >
          Ver
        </button>
      </div>
    `;

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;

      openCandidateModal(postulacion);
    });

    card.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openCandidateModal(postulacion);
      }
    });

    fragment.appendChild(card);
  });

  postulacionesList.appendChild(fragment);

  document
    .querySelectorAll(".view-btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;

        const candidate =
          postulaciones.find(
            (item) => item.id === id
          );

        if (candidate) {
          openCandidateModal(candidate);
        }
      });
    });

  updateStats();
}


/* =========================
   MODAL CANDIDATO
========================= */
function openCandidateModal(candidate) {
  selectedCandidate = candidate;

  modalNombre.textContent = candidate.nombre || "Sin nombre";
  modalEstado.textContent = `Estado: ${candidate.estadoSolicitud || "pendiente"}`;
  modalCiudad.textContent = candidate.ciudad || "-";
  modalSucursal.textContent = candidate.sucursal || candidate.sucursalNombre || candidate.sucursalId || "-";
  modalPuesto.textContent = candidate.vacanteTitulo || candidate.puestoInteres || "-";
  modalEscolaridad.textContent = candidate.escolaridad || "-";
  modalFecha.textContent = formatFecha(candidate.fechaRegistro);
  modalDireccion.textContent = candidate.direccion || candidate.sucursalDireccion || "No registrada";
  modalExperiencia.textContent = candidate.experiencia || "No proporcionada";
  modalHabilidades.textContent = candidate.habilidades || "No proporcionadas";

  if (candidate.cvRuta) {
    if (candidate.cvRuta.startsWith("http")) {
      modalCvLink.href = candidate.cvRuta;
    } else {
      modalCvLink.href = `${API_URL}${candidate.cvRuta}`;
    }

    modalCvLink.classList.remove("hidden");
  } else {
    modalCvLink.href = "#";
    modalCvLink.classList.add("hidden");
  }

  setMapLink(modalGoogleMapsLink, getGoogleMapsUrl(candidate));
  setMapLink(modalAppleMapsLink, getAppleMapsUrl(candidate));

  modal.classList.remove("hidden");
}

function closeCandidateModal() {
  modal.classList.add("hidden");
  selectedCandidate = null;
}

/* =========================
   MODAL ENTREVISTA
========================= */
function openInterviewModal() {
  if (!selectedCandidate) {
    setStatus("⚠️ Primero selecciona un candidato.");
    return;
  }

  if (interviewDate) interviewDate.value = "";
  if (interviewTime) interviewTime.value = "";
  if (interviewRecruiter) interviewRecruiter.value = "";
  if (interviewType) interviewType.value = "presencial";
  if (interviewComments) interviewComments.value = "";

  interviewModal.classList.remove("hidden");
}

function closeInterviewModal() {
  interviewModal.classList.add("hidden");
}

async function guardarEntrevista() {
  if (!selectedCandidate?.id) {
    setStatus("⚠️ No hay candidato seleccionado.");
    return;
  }

  const fecha = interviewDate?.value || "";
  const hora = interviewTime?.value || "";
  const reclutador = interviewRecruiter?.value.trim() || "";
  const tipo = interviewType?.value || "presencial";
  const comentarios = interviewComments?.value.trim() || "";

  if (!fecha || !hora) {
    setStatus("⚠️ Selecciona fecha y hora para la entrevista.");
    return;
  }

  try {
    if (saveInterviewBtn) {
      saveInterviewBtn.disabled = true;
      saveInterviewBtn.textContent = "Guardando...";
    }

    const res = await fetch(`${API_URL}/api/entrevistas`, {
      method: "POST",
      headers: authHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
  candidatoId: selectedCandidate.id,
  candidatoNombre: selectedCandidate.nombre || "Sin nombre",
  correo: selectedCandidate.correo || "",
  telefono: selectedCandidate.telefono || "",

  puesto:
    selectedCandidate.vacanteTitulo ||
    selectedCandidate.puestoInteres ||
    "",

  marca:
    selectedCandidate.grupoSeleccionado ||
    selectedCandidate.grupo ||
    "GA Hospitality",

  sucursal:
    selectedCandidate.sucursal ||
    selectedCandidate.sucursalNombre ||
    "",

  ciudad: selectedCandidate.ciudad || "",
  fecha,
  hora,
  reclutador,
  tipo,
  comentarios
})
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No fue posible guardar la entrevista.");
    }

    closeInterviewModal();
    closeCandidateModal();

    await cargarPostulaciones();

    setStatus("✅ Entrevista agendada correctamente.");
  } catch (error) {
    console.error("Error guardando entrevista:", error);
    setStatus(`⚠️ ${error.message}`);
  } finally {
    if (saveInterviewBtn) {
      saveInterviewBtn.disabled = false;
      saveInterviewBtn.textContent = "Guardar entrevista";
    }
  }
}

/* =========================
   API
========================= */
async function cargarPostulaciones() {
  try {
    setStatus("Cargando postulaciones...");

    const res = await fetch(`${API_URL}/api/postulaciones`, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }

    postulaciones = Array.isArray(data) ? data : [];
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

    if (!res.ok) {
      throw new Error(data.error || "No fue posible actualizar el estado.");
    }

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
    window.location.href = "login-admin.html";
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    setStatus("⚠️ No fue posible cerrar sesión.");
  }
}

/* =========================
   EVENTS
========================= */


if (refreshBtn) {
  refreshBtn.addEventListener("click", cargarPostulaciones);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", cerrarSesion);
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeCandidateModal);
}

if (closeModalBackdrop) {
  closeModalBackdrop.addEventListener("click", closeCandidateModal);
}

if (approveBtn) {
  approveBtn.addEventListener("click", () => {
    actualizarEstado("aprobado");
  });
}

if (rejectBtn) {
  rejectBtn.addEventListener("click", () => {
    actualizarEstado("rechazado");
  });
}

if (scheduleInterviewBtn) {
  scheduleInterviewBtn.addEventListener(
    "click",
    openInterviewModal
  );
}

if (closeInterviewBtn) {
  closeInterviewBtn.addEventListener(
    "click",
    closeInterviewModal
  );
}

if (closeInterviewBackdrop) {
  closeInterviewBackdrop.addEventListener(
    "click",
    closeInterviewModal
  );
}

if (saveInterviewBtn) {
  saveInterviewBtn.addEventListener(
    "click",
    guardarEntrevista
  );
}

/* =========================
   FILTROS DE CANDIDATOS
========================= */

[
  candidateSearch,
  candidateStatusFilter,
  candidateTypeFilter
].forEach((element) => {
  if (!element) return;

  element.addEventListener(
    "input",
    renderPostulaciones
  );

  element.addEventListener(
    "change",
    renderPostulaciones
  );
});

if (clearCandidateFiltersBtn) {
  clearCandidateFiltersBtn.addEventListener(
    "click",
    () => {
      if (candidateSearch) {
        candidateSearch.value = "";
      }

      if (candidateStatusFilter) {
        candidateStatusFilter.value = "";
      }

      if (candidateTypeFilter) {
        candidateTypeFilter.value = "";
      }

      renderPostulaciones();
    }
  );
}
/* =========================
   INIT
========================= */
async function init() {
  await cargarPostulaciones();
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login-admin.html";
    return;
  }

  try {
    adminToken = await user.getIdToken(true);
    await init();
  } catch (error) {
    console.error("Error obteniendo token:", error);
    window.location.href = "login-admin.html";
  }
});