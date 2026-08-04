const API_URL = "https://chatbot-reclutamiento-dcqb.onrender.com";
const DASHBOARD_CACHE_KEY = "rh_postulaciones_cache";
const DASHBOARD_CACHE_TIME = 2 * 60 * 1000;
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
const statMuyRecomendados =
  document.getElementById(
    "statMuyRecomendados"
  );

const statTrasladoCompatible =
  document.getElementById(
    "statTrasladoCompatible"
  );

const statPendientesRevision =
  document.getElementById(
    "statPendientesRevision"
  );

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
const modalCodigoPostal =
  document.getElementById("modalCodigoPostal");

const modalMedioTransporte =
  document.getElementById("modalMedioTransporte");

const modalVehiculoPropio =
  document.getElementById("modalVehiculoPropio");

const modalTiempoMaximoTraslado =
  document.getElementById(
    "modalTiempoMaximoTraslado"
  );

const modalDistanciaSucursal =
  document.getElementById(
    "modalDistanciaSucursal"
  );

const modalTiempoEstimado =
  document.getElementById(
    "modalTiempoEstimado"
  );

const modalEtiquetaDistancia =
  document.getElementById(
    "modalEtiquetaDistancia"
  );

const modalDistanciaBadge =
  document.getElementById(
    "modalDistanciaBadge"
  );
const modalCompatibilidadTraslado =
  document.getElementById(
    "modalCompatibilidadTraslado"
  );

const modalCompatibilidadAlert =
  document.getElementById(
    "modalCompatibilidadAlert"
  );

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

const candidateCompatibilityFilter =
  document.getElementById(
    "candidateCompatibilityFilter"
  );

const candidateTransportFilter =
  document.getElementById(
    "candidateTransportFilter"
  );

const candidateSort =
  document.getElementById(
    "candidateSort"
  );

const candidateResultsCount =
  document.getElementById(
    "candidateResultsCount"
  );

const candidateActiveFilters =
  document.getElementById(
    "candidateActiveFilters"
  );

const modalCompatibilityScore =
  document.getElementById(
    "modalCompatibilityScore"
  );

const modalCompatibilityScoreValue =
  document.getElementById(
    "modalCompatibilityScoreValue"
  );

const modalCompatibilityLevel =
  document.getElementById(
    "modalCompatibilityLevel"
  );

const modalScoreCv =
  document.getElementById("modalScoreCv");

const modalScoreExperience =
  document.getElementById(
    "modalScoreExperience"
  );

const modalScoreAvailability =
  document.getElementById(
    "modalScoreAvailability"
  );

const modalScoreGeography =
  document.getElementById(
    "modalScoreGeography"
  );

const modalScoreQuestions =
  document.getElementById(
    "modalScoreQuestions"
  );

const modalCompatibilityReasons =
  document.getElementById(
    "modalCompatibilityReasons"
  );

const modalCompatibilityAlerts =
  document.getElementById(
    "modalCompatibilityAlerts"
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
   DISTANCIA Y TRASLADO
========================= */

function formatDistance(distance) {
  const value = Number(distance);

  if (!Number.isFinite(value)) {
    return "No disponible";
  }

  return `${value.toFixed(1)} km`;
}

function formatTravelTime(minutes) {
  const value = Number(minutes);

  if (!Number.isFinite(value)) {
    return "No disponible";
  }

  if (value < 60) {
    return `${Math.round(value)} min`;
  }

  const hours = Math.floor(value / 60);
  const remainingMinutes =
    Math.round(value % 60);

  if (!remainingMinutes) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function getDistanceBadgeClass(
  classification = ""
) {
  const normalized =
    String(classification || "")
      .toLowerCase()
      .trim();

  const classes = {
    cercana:
      "distance-badge distance-badge--near",

    moderada:
      "distance-badge distance-badge--moderate",

    considerable:
      "distance-badge distance-badge--considerable",

    lejana:
      "distance-badge distance-badge--far",

    no_disponible:
      "distance-badge distance-badge--unknown"
  };

  return (
    classes[normalized] ||
    classes.no_disponible
  );
}

function getDistanceBadgeText(
  classification = ""
) {
  const normalized =
    String(classification || "")
      .toLowerCase()
      .trim();

  const labels = {
    cercana: "Muy cerca",
    moderada: "Moderada",
    considerable: "Considerable",
    lejana: "Distancia alta",
    no_disponible: "No disponible"
  };

  return (
    labels[normalized] ||
    labels.no_disponible
  );
}

function getTransportCompatibilityClass(
  status = ""
) {
  const classes = {
    compatible:
      "transport-compatibility transport-compatibility--compatible",

    al_limite:
      "transport-compatibility transport-compatibility--limit",

    no_recomendado:
      "transport-compatibility transport-compatibility--not-recommended",

    no_disponible:
      "transport-compatibility transport-compatibility--unknown"
  };

  return (
    classes[status] ||
    classes.no_disponible
  );
}

function getTransportCompatibilityMessage(
  candidate = {}
) {
  const compatibility =
    candidate.compatibilidadTraslado || {};

  const status =
    compatibility.estado ||
    candidate.compatibilidadGeografica ||
    "no_disponible";

  const estimated =
    Number(
      candidate.tiempoTrasladoEstimadoMin
    );

  const maximum =
    candidate.tiempoMaximoTraslado ||
    "no indicado";

  if (status === "compatible") {
    return `✅ El traslado estimado de ${
      Number.isFinite(estimated)
        ? `${Math.round(estimated)} minutos`
        : "tiempo disponible"
    } está dentro del máximo aceptado por el candidato (${maximum}).`;
  }

  if (status === "al_limite") {
    return `⚠️ El tiempo estimado está ligeramente por encima del máximo aceptado (${maximum}). Conviene confirmarlo con el candidato.`;
  }

  if (status === "no_recomendado") {
    return `❌ El tiempo estimado supera considerablemente el máximo aceptado por el candidato (${maximum}).`;
  }

  return "No fue posible evaluar la compatibilidad del traslado.";
}

/* =========================
   STATS
========================= */
function updateStats() {
  const total = postulaciones.length;

  const pendientes =
    postulaciones.filter(
      (item) =>
        item.estadoSolicitud ===
        "pendiente"
    ).length;

  const aprobados =
    postulaciones.filter(
      (item) =>
        item.estadoSolicitud ===
          "aprobado" ||
        item.estadoSolicitud ===
          "entrevista_agendada"
    ).length;

  const rechazados =
    postulaciones.filter(
      (item) =>
        item.estadoSolicitud ===
        "rechazado"
    ).length;

  const muyRecomendados =
    postulaciones.filter(
      (item) =>
        item.nivelCompatibilidad ===
        "muy_recomendado"
    ).length;

  const trasladoCompatible =
    postulaciones.filter((item) => {
      const estado =
        item.compatibilidadTraslado
          ?.estado ||
        item.compatibilidadGeografica;

      return estado === "compatible";
    }).length;

  const pendientesRevision =
    postulaciones.filter((item) => {
      return (
        item.estadoSolicitud ===
          "pendiente" &&
        (
          item.nivelCompatibilidad ===
            "revisar" ||
          item.nivelCompatibilidad ===
            "baja_compatibilidad" ||
          !Number.isFinite(
            Number(
              item.puntuacionCompatibilidad
            )
          )
        )
      );
    }).length;

  if (statTotal) {
    statTotal.textContent = total;
  }

  if (statPendiente) {
    statPendiente.textContent =
      pendientes;
  }

  if (statAprobado) {
    statAprobado.textContent =
      aprobados;
  }

  if (statRechazado) {
    statRechazado.textContent =
      rechazados;
  }

  if (statMuyRecomendados) {
    statMuyRecomendados.textContent =
      muyRecomendados;
  }

  if (statTrasladoCompatible) {
    statTrasladoCompatible.textContent =
      trasladoCompatible;
  }

  if (statPendientesRevision) {
    statPendientesRevision.textContent =
      pendientesRevision;
  }
}

function normalizarBusqueda(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCandidateCompatibilityScore(
  candidate = {}
) {
  const value =
    Number(
      candidate
        .puntuacionCompatibilidad
    );

  return Number.isFinite(value)
    ? value
    : null;
}

function getCandidateDistance(
  candidate = {}
) {
  const value =
    Number(
      candidate.distanciaSucursalKm
    );

  return Number.isFinite(value)
    ? value
    : null;
}

function getCandidateDate(
  candidate = {}
) {
  const date =
    new Date(
      candidate.fechaRegistro || 0
    );

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
}

function sortCandidates(
  candidates = [],
  sortValue = ""
) {
  const result = [...candidates];

  switch (sortValue) {
    case "compatibility_asc":
      return result.sort((a, b) => {
        const scoreA =
          getCandidateCompatibilityScore(
            a
          );

        const scoreB =
          getCandidateCompatibilityScore(
            b
          );

        if (
          scoreA === null &&
          scoreB === null
        ) {
          return 0;
        }

        if (scoreA === null) return 1;
        if (scoreB === null) return -1;

        return scoreA - scoreB;
      });

    case "distance_asc":
      return result.sort((a, b) => {
        const distanceA =
          getCandidateDistance(a);

        const distanceB =
          getCandidateDistance(b);

        if (
          distanceA === null &&
          distanceB === null
        ) {
          return 0;
        }

        if (distanceA === null) return 1;
        if (distanceB === null) return -1;

        return distanceA - distanceB;
      });

    case "date_asc":
      return result.sort(
        (a, b) =>
          getCandidateDate(a) -
          getCandidateDate(b)
      );

    case "name_asc":
      return result.sort((a, b) =>
        String(a.nombre || "")
          .localeCompare(
            String(b.nombre || ""),
            "es",
            {
              sensitivity: "base"
            }
          )
      );

    case "date_desc":
      return result.sort(
        (a, b) =>
          getCandidateDate(b) -
          getCandidateDate(a)
      );

    case "compatibility_desc":
    default:
      return result.sort((a, b) => {
        const scoreA =
          getCandidateCompatibilityScore(
            a
          );

        const scoreB =
          getCandidateCompatibilityScore(
            b
          );

        if (
          scoreA === null &&
          scoreB === null
        ) {
          return (
            getCandidateDate(b) -
            getCandidateDate(a)
          );
        }

        if (scoreA === null) return 1;
        if (scoreB === null) return -1;

        return scoreB - scoreA;
      });
  }
}


function getPostulacionesFiltradas() {
  const search =
    normalizarBusqueda(
      candidateSearch?.value || ""
    );

  const status =
    candidateStatusFilter?.value || "";

  const tipo =
    candidateTypeFilter?.value || "";

  const compatibility =
    candidateCompatibilityFilter
      ?.value || "";

  const transport =
    candidateTransportFilter
      ?.value || "";

  const sort =
    candidateSort?.value ||
    "compatibility_desc";

  const filtered =
    postulaciones.filter(
      (postulacion) => {
        const contenido =
          normalizarBusqueda(`
            ${postulacion.nombre || ""}
            ${postulacion.vacanteTitulo || ""}
            ${postulacion.puestoInteres || ""}
            ${postulacion.ciudad || ""}
            ${postulacion.sucursal || ""}
            ${postulacion.grupoSeleccionado || ""}
            ${postulacion.correo || ""}
            ${postulacion.telefono || ""}
            ${postulacion.codigoPostal || ""}
            ${postulacion.medioTransporte || ""}
          `);

        const coincideBusqueda =
          !search ||
          contenido.includes(search);

        const coincideEstado =
          !status ||
          postulacion
            .estadoSolicitud ===
            status;

        const coincideTipo =
          !tipo ||
          postulacion.tipoVacante ===
            tipo;

        const score =
          getCandidateCompatibilityScore(
            postulacion
          );

        const coincideCompatibilidad =
          !compatibility ||
          (
            compatibility ===
              "sin_evaluar"
              ? score === null
              : postulacion
                  .nivelCompatibilidad ===
                compatibility
          );

        const estadoTraslado =
          postulacion
            .compatibilidadTraslado
            ?.estado ||
          postulacion
            .compatibilidadGeografica ||
          "no_disponible";

        const coincideTraslado =
          !transport ||
          estadoTraslado === transport;

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideTipo &&
          coincideCompatibilidad &&
          coincideTraslado
        );
      }
    );

  return sortCandidates(
    filtered,
    sort
  );
}

function updateCandidateResultsSummary(
  filteredCandidates = []
) {
  const total =
    filteredCandidates.length;

  if (candidateResultsCount) {
    candidateResultsCount.textContent =
      `${total} ${
        total === 1
          ? "candidato encontrado"
          : "candidatos encontrados"
      }`;
  }

  const activeFilters = [];

  if (candidateSearch?.value.trim()) {
    activeFilters.push(
      `Búsqueda: "${candidateSearch.value.trim()}"`
    );
  }

  if (
    candidateStatusFilter?.value
  ) {
    activeFilters.push(
      `Estatus: ${
        candidateStatusFilter
          .selectedOptions[0]
          ?.textContent.trim()
      }`
    );
  }

  if (candidateTypeFilter?.value) {
    activeFilters.push(
      `Tipo: ${
        candidateTypeFilter
          .selectedOptions[0]
          ?.textContent.trim()
      }`
    );
  }

  if (
    candidateCompatibilityFilter
      ?.value
  ) {
    activeFilters.push(
      `Compatibilidad: ${
        candidateCompatibilityFilter
          .selectedOptions[0]
          ?.textContent.trim()
      }`
    );
  }

  if (
    candidateTransportFilter?.value
  ) {
    activeFilters.push(
      `Traslado: ${
        candidateTransportFilter
          .selectedOptions[0]
          ?.textContent.trim()
      }`
    );
  }

  if (candidateActiveFilters) {
    candidateActiveFilters.textContent =
      activeFilters.length
        ? activeFilters.join(" · ")
        : "Sin filtros adicionales";
  }
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
   COMPATIBILIDAD GENERAL
========================= */

function getCompatibilityLevelClass(
  level = ""
) {
  const classes = {
    muy_recomendado:
      "compatibility-level compatibility-level--excellent",

    recomendado:
      "compatibility-level compatibility-level--good",

    revisar:
      "compatibility-level compatibility-level--review",

    baja_compatibilidad:
      "compatibility-level compatibility-level--low"
  };

  return (
    classes[level] ||
    "compatibility-level compatibility-level--unknown"
  );
}

function getCompatibilityCircleClass(
  score
) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return "candidate-score-circle candidate-score-circle--unknown";
  }

  if (value >= 85) {
    return "candidate-score-circle candidate-score-circle--excellent";
  }

  if (value >= 70) {
    return "candidate-score-circle candidate-score-circle--good";
  }

  if (value >= 55) {
    return "candidate-score-circle candidate-score-circle--review";
  }

  return "candidate-score-circle candidate-score-circle--low";
}

function formatComponentScore(
  value,
  maximum
) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return "No evaluado";
  }

  return `${score.toFixed(1)} / ${maximum}`;
}

function renderEvaluationList(
  element,
  items,
  emptyMessage
) {
  if (!element) return;

  const values =
    Array.isArray(items)
      ? items.filter(Boolean)
      : [];

  if (!values.length) {
    element.innerHTML =
      `<li>${emptyMessage}</li>`;
    return;
  }

  element.innerHTML = values
    .map(
      (item) =>
        `<li>${item}</li>`
    )
    .join("");
}


/* =========================
   RENDER POSTULACIONES
========================= */
function renderPostulaciones() {
  if (!postulacionesList) return;

  postulacionesList.innerHTML = "";

  const data = getPostulacionesFiltradas();
  updateCandidateResultsSummary(data);

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
    const distanciaResumen =
  Number.isFinite(
    Number(
      postulacion.distanciaSucursalKm
    )
  )
    ? `${Number(
        postulacion.distanciaSucursalKm
      ).toFixed(1)} km`
    : "Distancia no disponible";

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

        <small class="candidate-distance-summary">
          📍 ${distanciaResumen}
        </small>
      </div>

      <div class="candidate-process">
  <span class="${getEstadoClass(estado)}">
    ${estado.replaceAll("_", " ")}
  </span>

  <div class="candidate-compatibility-mini">
    <strong>
      ${compatibilityText}
    </strong>

    <span>
      ${compatibilityLabel}
    </span>
  </div>

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
const compatibilityScore =
  Number(
    postulacion.puntuacionCompatibilidad
  );

const compatibilityAvailable =
  Number.isFinite(compatibilityScore);

const compatibilityText =
  compatibilityAvailable
    ? `${Math.round(
        compatibilityScore
      )}%`
    : "Sin evaluar";

const compatibilityLabel =
  postulacion
    .etiquetaNivelCompatibilidad ||
  "Compatibilidad no disponible";


/* =========================
   MODAL CANDIDATO
========================= */

function openCandidateModal(candidate) {
  selectedCandidate = candidate;

  modalNombre.textContent =
    candidate.nombre || "Sin nombre";

  modalEstado.textContent =
    `Estado: ${
      candidate.estadoSolicitud ||
      "pendiente"
    }`;

  modalCiudad.textContent =
    candidate.ciudad || "-";

  modalSucursal.textContent =
    candidate.sucursal ||
    candidate.sucursalNombre ||
    candidate.sucursalId ||
    "-";

  modalPuesto.textContent =
    candidate.vacanteTitulo ||
    candidate.puestoInteres ||
    "-";

  modalEscolaridad.textContent =
    candidate.escolaridad ||
    "No solicitada";

  modalFecha.textContent =
    formatFecha(
      candidate.fechaRegistro
    );

  modalDireccion.textContent =
    candidate.direccion ||
    candidate.sucursalDireccion ||
    "No registrada";

  modalExperiencia.textContent =
    candidate.experiencia ||
    "No proporcionada";

  modalHabilidades.textContent =
    candidate.habilidades ||
    "No proporcionadas";

  /* Ubicación y transporte */

  if (modalCodigoPostal) {
    modalCodigoPostal.textContent =
      candidate.codigoPostal ||
      "No proporcionado";
  }

  if (modalMedioTransporte) {
    modalMedioTransporte.textContent =
      candidate.medioTransporte ||
      "No proporcionado";
  }

  if (modalVehiculoPropio) {
    modalVehiculoPropio.textContent =
      candidate.vehiculoPropio ||
      "No proporcionado";
  }

  if (modalTiempoMaximoTraslado) {
    modalTiempoMaximoTraslado.textContent =
      candidate.tiempoMaximoTraslado ||
      "No proporcionado";
  }

  if (modalDistanciaSucursal) {
    modalDistanciaSucursal.textContent =
      formatDistance(
        candidate.distanciaSucursalKm
      );
  }

  if (modalTiempoEstimado) {
    modalTiempoEstimado.textContent =
      formatTravelTime(
        candidate.tiempoTrasladoEstimadoMin
      );
  }

  if (modalEtiquetaDistancia) {
    modalEtiquetaDistancia.textContent =
      candidate.etiquetaDistancia ||
      "Distancia no disponible";
  }

  if (modalDistanciaBadge) {
    modalDistanciaBadge.className =
      getDistanceBadgeClass(
        candidate.clasificacionDistancia
      );

    modalDistanciaBadge.textContent =
      getDistanceBadgeText(
        candidate.clasificacionDistancia
      );
    const compatibilidad =
  candidate.compatibilidadTraslado || {};

const estadoCompatibilidad =
  compatibilidad.estado ||
  candidate.compatibilidadGeografica ||
  "no_disponible";

if (modalCompatibilidadTraslado) {
  modalCompatibilidadTraslado.textContent =
    compatibilidad.etiqueta ||
    candidate.etiquetaCompatibilidadGeografica ||
    "Compatibilidad no disponible";
}
    const compatibilityScore =
  Number(
    candidate.puntuacionCompatibilidad
  );

const compatibilityLevel =
  candidate.nivelCompatibilidad || "";

const compatibilityBreakdown =
  candidate.desgloseCompatibilidad || {};

if (modalCompatibilityScoreValue) {
  modalCompatibilityScoreValue.textContent =
    Number.isFinite(compatibilityScore)
      ? `${Math.round(
          compatibilityScore
        )}%`
      : "-";
}

if (modalCompatibilityScore) {
  modalCompatibilityScore.className =
    getCompatibilityCircleClass(
      compatibilityScore
    );
}

if (modalCompatibilityLevel) {
  modalCompatibilityLevel.className =
    getCompatibilityLevelClass(
      compatibilityLevel
    );

  modalCompatibilityLevel.textContent =
    candidate
      .etiquetaNivelCompatibilidad ||
    "Compatibilidad no disponible";
}

if (modalScoreCv) {
  modalScoreCv.textContent =
    formatComponentScore(
      compatibilityBreakdown.cv,
      35
    );
}

if (modalScoreExperience) {
  modalScoreExperience.textContent =
    formatComponentScore(
      compatibilityBreakdown.experiencia,
      20
    );
}

if (modalScoreAvailability) {
  modalScoreAvailability.textContent =
    formatComponentScore(
      compatibilityBreakdown.disponibilidad,
      15
    );
}

if (modalScoreGeography) {
  modalScoreGeography.textContent =
    formatComponentScore(
      compatibilityBreakdown.geografia,
      15
    );
}

if (modalScoreQuestions) {
  modalScoreQuestions.textContent =
    formatComponentScore(
      compatibilityBreakdown.preguntas,
      15
    );
}

renderEvaluationList(
  modalCompatibilityReasons,
  candidate.motivosCompatibilidad,
  "No se registraron motivos favorables."
);

renderEvaluationList(
  modalCompatibilityAlerts,
  candidate.alertasCompatibilidad,
  "No se detectaron alertas."
);

if (modalCompatibilidadAlert) {
  modalCompatibilidadAlert.className =
    getTransportCompatibilityClass(
      estadoCompatibilidad
    );

  modalCompatibilidadAlert.textContent =
    getTransportCompatibilityMessage(
      candidate
    );
}
    
  }

  /* CV */

  if (candidate.cvRuta) {
    if (
      candidate.cvRuta.startsWith(
        "http"
      )
    ) {
      modalCvLink.href =
        candidate.cvRuta;
    } else {
      modalCvLink.href =
        `${API_URL}${candidate.cvRuta}`;
    }

    modalCvLink.classList.remove(
      "hidden"
    );
  } else {
    modalCvLink.href = "#";

    modalCvLink.classList.add(
      "hidden"
    );
  }

  /* Mapas */

  setMapLink(
    modalGoogleMapsLink,
    getGoogleMapsUrl(candidate)
  );

  setMapLink(
    modalAppleMapsLink,
    getAppleMapsUrl(candidate)
  );

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
function guardarPostulacionesCache(data) {
  try {
    sessionStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data
      })
    );
  } catch (error) {
    console.warn("No se pudo guardar caché:", error);
  }
}

function leerPostulacionesCache() {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);

    if (!raw) return null;

    const cache = JSON.parse(raw);

    if (Date.now() - cache.timestamp > DASHBOARD_CACHE_TIME) {
      sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
      return null;
    }

    return Array.isArray(cache.data) ? cache.data : null;
  } catch (error) {
    return null;
  }
}
/* =========================
   API
========================= */
async function cargarPostulaciones(forceRefresh = false) {
  const cache = !forceRefresh
    ? leerPostulacionesCache()
    : null;

  if (cache) {
    postulaciones = cache;
    renderPostulaciones();
    setStatus("", false);
  } else {
    setStatus("Cargando postulaciones...");
  }

  try {
    const res = await fetch(`${API_URL}/api/postulaciones`, {
      headers: authHeaders(),
      cache: "no-store"
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || `Error HTTP ${res.status}`
      );
    }

    postulaciones = Array.isArray(data) ? data : [];

    guardarPostulacionesCache(postulaciones);
    renderPostulaciones();
    setStatus("", false);
  } catch (error) {
    console.error(
      "Error cargando postulaciones:",
      error
    );

    if (!cache) {
      setStatus(
        `⚠️ ${
          error.message ||
          "No fue posible cargar las postulaciones."
        }`
      );
    }
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
  refreshBtn.addEventListener("click", () => {
    cargarPostulaciones(true);
  });
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
   FILTROS Y ORDENAMIENTO
========================= */

[
  candidateSearch,
  candidateStatusFilter,
  candidateTypeFilter,
  candidateCompatibilityFilter,
  candidateTransportFilter,
  candidateSort
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

      if (
        candidateCompatibilityFilter
      ) {
        candidateCompatibilityFilter
          .value = "";
      }

      if (candidateTransportFilter) {
        candidateTransportFilter
          .value = "";
      }

      if (candidateSort) {
        candidateSort.value =
          "compatibility_desc";
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