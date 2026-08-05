const API_URL = "https://chatbot-reclutamiento-dcqb.onrender.com";

/* =========================
   FIREBASE AUTH
   Después se conectará aquí con Firestore o con tu API protegida.
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

if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = typeof firebase !== "undefined" ? firebase.auth() : null;
let adminToken = "";

/* =========================
   DATOS DEMO TEMPORALES
   Cuando conectemos Firestore, estos datos se reemplazan por:
   GET /api/entrevistas
========================= */
const demoEntrevistas = [
  {
    id: "ent-001",
    candidatoNombre: "Carlos Ramírez",
    correo: "carlos@email.com",
    telefono: "6561234567",
    puesto: "Cajero",
    marca: "Wendy's",
    sucursal: "Las Misiones",
    ciudad: "Ciudad Juárez",
    fecha: new Date().toISOString().slice(0, 10),
    hora: "10:30",
    reclutador: "Alejandro Ayala",
    tipo: "presencial",
    estado: "agendada",
    comentarios: "Llevar solicitud elaborada e identificación."
  },
  {
    id: "ent-002",
    candidatoNombre: "María González",
    correo: "maria@email.com",
    telefono: "6569876543",
    puesto: "Hostess",
    marca: "Applebee's",
    sucursal: "Tecnológico",
    ciudad: "Ciudad Juárez",
    fecha: new Date().toISOString().slice(0, 10),
    hora: "12:00",
    reclutador: "RH Corporativo",
    tipo: "presencial",
    estado: "confirmada",
    comentarios: "Candidata con experiencia previa en atención al cliente."
  },
  {
    id: "ent-003",
    candidatoNombre: "Luis Hernández",
    correo: "luis@email.com",
    telefono: "6141112233",
    puesto: "Auxiliar de Cocina",
    marca: "Little Caesars",
    sucursal: "Chihuahua",
    ciudad: "Chihuahua",
    fecha: "2026-07-03",
    hora: "16:00",
    reclutador: "Recursos Humanos",
    tipo: "telefonica",
    estado: "realizada",
    comentarios: "Buen perfil operativo."
  }
];

let entrevistas = [];
let selectedInterview = null;

/* =========================
   DISPONIBILIDADES RH
========================= */
let disponibilidadesEntrevista = [];
let selectedAvailability = null;

/* Vacantes utilizadas para construir región, sucursal y puesto */
let vacantesDisponibilidad = [];

/* =========================
   ELEMENTOS
========================= */
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const statusBox = document.getElementById("statusBox");

const statHoy = document.getElementById("statHoy");
const statPendientes = document.getElementById("statPendientes");
const statConfirmadas = document.getElementById("statConfirmadas");
const statCanceladas = document.getElementById("statCanceladas");
const statFinalizadas = document.getElementById("statFinalizadas");

const interviewsTable = document.getElementById("interviewsTable");

const calendarGrid = document.getElementById("calendarGrid");
const calendarTitle = document.getElementById("calendarTitle");
const calendarSummaryText = document.getElementById("calendarSummaryText");

const prevWeekBtn = document.getElementById("prevWeekBtn");
const todayWeekBtn = document.getElementById("todayWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");

let currentWeekStart = getStartOfWeek(new Date());

const searchInput = document.getElementById("searchInput");
const filterDate = document.getElementById("filterDate");
const filterMarca = document.getElementById("filterMarca");
const filterSucursal = document.getElementById("filterSucursal");
const filterPuesto = document.getElementById("filterPuesto");
const filterStatus = document.getElementById("filterStatus");

const detailModal = document.getElementById("detailModal");
const closeDetailBtn = document.getElementById("closeDetailBtn");
const closeDetailBackdrop = document.getElementById("closeDetailBackdrop");

const detailCandidate = document.getElementById("detailCandidate");
const detailStatusText = document.getElementById("detailStatusText");
const detailNombre = document.getElementById("detailNombre");
const detailPuesto = document.getElementById("detailPuesto");
const detailMarca = document.getElementById("detailMarca");
const detailSucursal = document.getElementById("detailSucursal");
const detailFecha = document.getElementById("detailFecha");
const detailHora = document.getElementById("detailHora");
const detailEntrevistador = document.getElementById("detailEntrevistador");
const detailTipo = document.getElementById("detailTipo");
const detailComentarios = document.getElementById("detailComentarios");

const confirmBtn = document.getElementById("confirmBtn");
const rescheduleBtn = document.getElementById("rescheduleBtn");
const doneBtn = document.getElementById("doneBtn");
const cancelBtn = document.getElementById("cancelBtn");

const rescheduleModal = document.getElementById("rescheduleModal");
const closeRescheduleBtn = document.getElementById("closeRescheduleBtn");
const closeRescheduleBackdrop = document.getElementById("closeRescheduleBackdrop");
const newDate = document.getElementById("newDate");
const newTime = document.getElementById("newTime");
const saveRescheduleBtn = document.getElementById("saveRescheduleBtn");
const deleteModal = document.getElementById("deleteModal");
const closeDeleteBtn = document.getElementById("closeDeleteBtn");
const closeDeleteBackdrop = document.getElementById("closeDeleteBackdrop");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteCandidateName = document.getElementById("deleteCandidateName");
/* =========================
   ELEMENTOS DISPONIBILIDAD
========================= */

const openAvailabilityModalBtn =
  document.getElementById(
    "openAvailabilityModalBtn"
  );

const availabilitySummaryBadge =
  document.getElementById(
    "availabilitySummaryBadge"
  );

const availabilityList =
  document.getElementById(
    "availabilityList"
  );

const availabilityModal =
  document.getElementById(
    "availabilityModal"
  );

const closeAvailabilityBackdrop =
  document.getElementById(
    "closeAvailabilityBackdrop"
  );

const closeAvailabilityModalBtn =
  document.getElementById(
    "closeAvailabilityModalBtn"
  );

const cancelAvailabilityBtn =
  document.getElementById(
    "cancelAvailabilityBtn"
  );

const saveAvailabilityBtn =
  document.getElementById(
    "saveAvailabilityBtn"
  );

const availabilityModalTitle =
  document.getElementById(
    "availabilityModalTitle"
  );

const availabilityForm =
  document.getElementById(
    "availabilityForm"
  );

const availabilityId =
  document.getElementById(
    "availabilityId"
  );

const availabilityRecruiter =
  document.getElementById(
    "availabilityRecruiter"
  );

const availabilityType =
  document.getElementById(
    "availabilityType"
  );
const availabilityRegion =
  document.getElementById(
    "availabilityRegion"
  );

const availabilityCoverageSummary =
  document.getElementById(
    "availabilityCoverageSummary"
  );

const availabilitySucursal =
  document.getElementById(
    "availabilitySucursal"
  );

const availabilityVacancy =
  document.getElementById(
    "availabilityVacancy"
  );

const availabilityStartDate =
  document.getElementById(
    "availabilityStartDate"
  );

const availabilityEndDate =
  document.getElementById(
    "availabilityEndDate"
  );

const availabilityStartTime =
  document.getElementById(
    "availabilityStartTime"
  );

const availabilityEndTime =
  document.getElementById(
    "availabilityEndTime"
  );

const availabilityDuration =
  document.getElementById(
    "availabilityDuration"
  );

const availabilityBreak =
  document.getElementById(
    "availabilityBreak"
  );

const availabilityActive =
  document.getElementById(
    "availabilityActive"
  );

let interviewToDelete = null;

/* =========================
   HELPERS
========================= */
function setStatus(message, show = true) {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.classList.toggle("hidden", !show);
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: `Bearer ${adminToken}`
  };
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function estadoLabel(estado = "") {
  const labels = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    realizada: "Realizada",
    cancelada: "Cancelada",
    reagendada: "Reagendada",
    pendiente_confirmacion:
  "Pendiente de confirmación",
  };

  return labels[estado] || "Agendada";
}

function estadoBadge(estado = "") {
  return `badge badge--${estado || "agendada"}`;
}

/* =========================
   HELPERS DISPONIBILIDAD
========================= */

const DAY_NAMES = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado"
};

function getAvailabilityDayInputs() {
  return [
    ...document.querySelectorAll(
      'input[name="availabilityDay"]'
    )
  ];
}

function getSelectedAvailabilityDays() {
  return getAvailabilityDayInputs()
    .filter((input) => input.checked)
    .map((input) => Number(input.value));
}

function setSelectedAvailabilityDays(
  days = []
) {
  const normalizedDays =
    Array.isArray(days)
      ? days.map(Number)
      : [];

  getAvailabilityDayInputs()
    .forEach((input) => {
      input.checked =
        normalizedDays.includes(
          Number(input.value)
        );
    });
}

function formatAvailabilityDays(
  days = []
) {
  if (!Array.isArray(days) || !days.length) {
    return "Sin días configurados";
  }

  return days
    .map((day) => DAY_NAMES[day])
    .filter(Boolean)
    .join(", ");
}

function formatAvailabilityPeriod(
  startDate,
  endDate
) {
  if (!startDate && !endDate) {
    return "Sin periodo definido";
  }

  if (startDate === endDate) {
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} al ${formatDate(endDate)}`;
}

function getTodayInputValue() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function getDatePlusDays(days = 30) {
  const date = new Date();

  date.setDate(
    date.getDate() + days
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizar(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
/* =========================
   COBERTURA DE RECLUTAMIENTO
========================= */

function obtenerRegionVacante(
  vacante = {}
) {
  return String(
    vacante.ciudad ||
    vacante.region ||
    vacante.zona ||
    ""
  ).trim();
}

function obtenerSucursalId(
  vacante = {}
) {
  return String(
    vacante.sucursalId ||
    vacante.numeroTienda ||
    vacante.sucursal ||
    ""
  ).trim();
}

function obtenerSucursalNombre(
  vacante = {}
) {
  return String(
    vacante.sucursal ||
    vacante.sucursalNombre ||
    "Sucursal sin nombre"
  ).trim();
}

function obtenerVacantesPorRegion(
  region = ""
) {
  if (!region) return [];

  return vacantesDisponibilidad.filter(
    (vacante) =>
      normalizar(
        obtenerRegionVacante(vacante)
      ) === normalizar(region)
  );
}

function obtenerVacantesPorCobertura({
  region = "",
  sucursalId = ""
} = {}) {
  let resultado =
    obtenerVacantesPorRegion(region);

  if (sucursalId) {
    resultado = resultado.filter(
      (vacante) =>
        normalizar(
          obtenerSucursalId(vacante)
        ) === normalizar(sucursalId)
    );
  }

  return resultado;
}

function obtenerOpcionSeleccionada(
  select
) {
  return select
    ?.selectedOptions?.[0] || null;
}

function obtenerTextoSeleccionado(
  select
) {
  const option =
    obtenerOpcionSeleccionada(select);

  return option
    ? option.textContent.trim()
    : "";
}

function crearOpcion({
  value = "",
  text = "",
  dataset = {}
} = {}) {
  const option =
    document.createElement("option");

  option.value = value;
  option.textContent = text;

  Object.entries(dataset)
    .forEach(([key, datasetValue]) => {
      option.dataset[key] =
        String(datasetValue ?? "");
    });

  return option;
}

function actualizarResumenCobertura() {
  if (!availabilityCoverageSummary) {
    return;
  }

  const region =
    availabilityRegion?.value || "";

  const sucursal =
    availabilitySucursal?.value
      ? obtenerTextoSeleccionado(
          availabilitySucursal
        )
      : "Todas las sucursales";

  const vacante =
    availabilityVacancy?.value
      ? obtenerTextoSeleccionado(
          availabilityVacancy
        )
      : "Todas las vacantes";

  if (!region) {
    availabilityCoverageSummary.innerHTML = `
      <span class="availability-coverage-summary__icon">
        ℹ️
      </span>

      <p>
        Selecciona una región para configurar la cobertura del reclutador.
      </p>
    `;

    return;
  }

  availabilityCoverageSummary.innerHTML = `
    <span class="availability-coverage-summary__icon">
      📍
    </span>

    <p>
      Esta agenda se aplicará en
      <strong>${escapeHtml(region)}</strong>,
      para
      <strong>${escapeHtml(sucursal)}</strong>
      y
      <strong>${escapeHtml(vacante)}</strong>.
    </p>
  `;
}
function poblarRegionesDisponibilidad(
  selectedRegion = ""
) {
  if (!availabilityRegion) return;

  const regiones = [
    ...new Set(
      vacantesDisponibilidad
        .map(obtenerRegionVacante)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "es",
      {
        sensitivity: "base"
      }
    )
  );

  availabilityRegion.innerHTML = `
    <option value="">
      Selecciona una región
    </option>
  `;

  regiones.forEach((region) => {
    availabilityRegion.appendChild(
      crearOpcion({
        value: region,
        text: region
      })
    );
  });

  availabilityRegion.value =
    selectedRegion;

  poblarSucursalesDisponibilidad();
}

function poblarSucursalesDisponibilidad(
  selectedSucursalId = ""
) {
  if (!availabilitySucursal) return;

  const region =
    availabilityRegion?.value || "";

  availabilitySucursal.innerHTML = "";

  if (!region) {
    availabilitySucursal.disabled = true;

    availabilitySucursal.appendChild(
      crearOpcion({
        value: "",
        text:
          "Primero selecciona una región"
      })
    );

    poblarVacantesDisponibilidad();

    actualizarResumenCobertura();
    return;
  }

  const vacantesRegion =
    obtenerVacantesPorRegion(region);

  const mapaSucursales = new Map();

  vacantesRegion.forEach((vacante) => {
    const id =
      obtenerSucursalId(vacante);

    const nombre =
      obtenerSucursalNombre(vacante);

    if (!id || mapaSucursales.has(id)) {
      return;
    }

    mapaSucursales.set(id, nombre);
  });

  availabilitySucursal.disabled =
    false;

  availabilitySucursal.appendChild(
    crearOpcion({
      value: "",
      text:
        "Todas las sucursales"
    })
  );

  [...mapaSucursales.entries()]
    .sort((a, b) =>
      a[1].localeCompare(
        b[1],
        "es",
        {
          sensitivity: "base"
        }
      )
    )
    .forEach(([id, nombre]) => {
      availabilitySucursal.appendChild(
        crearOpcion({
          value: id,
          text: nombre
        })
      );
    });

  availabilitySucursal.value =
    selectedSucursalId;

  poblarVacantesDisponibilidad();

  actualizarResumenCobertura();
}

function poblarVacantesDisponibilidad(
  selectedVacanteId = ""
) {
  if (!availabilityVacancy) return;

  const region =
    availabilityRegion?.value || "";

  const sucursalId =
    availabilitySucursal?.value || "";

  availabilityVacancy.innerHTML = "";

  if (!region) {
    availabilityVacancy.disabled = true;

    availabilityVacancy.appendChild(
      crearOpcion({
        value: "",
        text:
          "Primero selecciona una región"
      })
    );

    actualizarResumenCobertura();
    return;
  }

  const vacantesFiltradas =
    obtenerVacantesPorCobertura({
      region,
      sucursalId
    });

  availabilityVacancy.disabled =
    false;

  availabilityVacancy.appendChild(
    crearOpcion({
      value: "",
      text:
        "Todas las vacantes"
    })
  );

  vacantesFiltradas
    .sort((a, b) => {
      const tituloA =
        String(a.titulo || "");

      const tituloB =
        String(b.titulo || "");

      return tituloA.localeCompare(
        tituloB,
        "es",
        {
          sensitivity: "base"
        }
      );
    })
    .forEach((vacante) => {
      const titulo =
        vacante.titulo ||
        "Vacante";

      const sucursal =
        obtenerSucursalNombre(vacante);

      availabilityVacancy.appendChild(
        crearOpcion({
          value: vacante.id,
          text:
            `${titulo} — ${sucursal}`,

          dataset: {
            sucursalId:
              obtenerSucursalId(
                vacante
              ),

            sucursalNombre:
              sucursal,

            region:
              obtenerRegionVacante(
                vacante
              )
          }
        })
      );
    });

  availabilityVacancy.value =
    selectedVacanteId;

  actualizarResumenCobertura();
}
/* =========================
   CARGA DE DATOS
========================= */
async function cargarEntrevistas() {
  try {
    setStatus("Cargando entrevistas...");

    const res = await fetch(`${API_URL}/api/entrevistas`, {
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || `No fue posible cargar entrevistas. Error ${res.status}`
      );
    }

    entrevistas = Array.isArray(data) ? data : [];

    poblarFiltros();
    render();
    setStatus("", false);
  } catch (error) {
    console.error("Error cargando entrevistas:", error);
    setStatus(
      `⚠️ ${error.message || "No fue posible cargar entrevistas."}`
    );
  }
}

/* =========================
   CARGAR DISPONIBILIDADES
========================= */

async function cargarDisponibilidades() {
  try {
    const res = await fetch(
      `${API_URL}/api/disponibilidades-entrevista`,
      {
        headers: authHeaders()
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
        "No fue posible cargar las disponibilidades."
      );
    }

    disponibilidadesEntrevista =
      Array.isArray(data)
        ? data
        : [];

    renderDisponibilidades();
  } catch (error) {
    console.error(
      "Error cargando disponibilidades:",
      error
    );

    setStatus(
      `⚠️ ${
        error.message ||
        "No fue posible cargar las disponibilidades."
      }`
    );
  }
}

/* =========================
   RENDER DISPONIBILIDADES
========================= */

function renderDisponibilidades() {
  if (!availabilityList) return;

  const activeCount =
    disponibilidadesEntrevista.filter(
      (item) => item.activo !== false
    ).length;

  if (availabilitySummaryBadge) {
    availabilitySummaryBadge.textContent =
      `${activeCount} ${
        activeCount === 1
          ? "configuración activa"
          : "configuraciones activas"
      }`;
  }

  if (!disponibilidadesEntrevista.length) {
    availabilityList.innerHTML = `
      <div class="availability-empty">
        Aún no hay horarios de reclutadores configurados.
      </div>
    `;

    return;
  }

  availabilityList.innerHTML =
    disponibilidadesEntrevista
      .map((item) => {
        const active =
          item.activo !== false;

        const region =
  item.region ||
  item.zona ||
  item.ciudad ||
  "Región no configurada";

const vacancy =
  item.vacanteTitulo ||
  "Todas las vacantes";

const branch =
  item.sucursal ||
  "Todas las sucursales";

const recruiterInitials =
  String(
    item.reclutador ||
    "RH"
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");

        return `
          <article class="availability-item">
            <div class="availability-item__main">
              <div class="availability-item__header">
                <div>
                  <strong>
                    ${escapeHtml(
                      item.reclutador ||
                      "Reclutador sin nombre"
                    )}
                  </strong>

                  <span
                    class="availability-status ${
                      active
                        ? "availability-status--active"
                        : "availability-status--inactive"
                    }"
                  >
                    ${
                      active
                        ? "Activa"
                        : "Inactiva"
                    }
                  </span>
                </div>

                <small>
                  ${escapeHtml(
                    item.tipo ||
                    "presencial"
                  )}
                </small>
              </div>

              <div class="availability-item__details">
                <span>
                  📅 ${escapeHtml(
                    formatAvailabilityDays(
                      item.diasSemana
                    )
                  )}
                </span>

                <span>
                  🕒 ${escapeHtml(
                    item.horaInicio || "-"
                  )}
                  a
                  ${escapeHtml(
                    item.horaFin || "-"
                  )}
                </span>

                <span>
                  ⏱ ${
                    Number(
                      item.duracionMinutos
                    ) || 30
                  } min
                </span>

                <span>
                  🏢 ${escapeHtml(branch)}
                </span>

                <span>
                  💼 ${escapeHtml(vacancy)}
                </span>

                <span>
                  📆 ${escapeHtml(
                    formatAvailabilityPeriod(
                      item.fechaInicio,
                      item.fechaFin
                    )
                  )}
                </span>
              </div>
            </div>

            <div class="availability-item__actions">
              <button
                type="button"
                class="btn btn--secondary"
                data-availability-action="edit"
                data-id="${escapeHtml(item.id)}"
              >
                Editar
              </button>

              <button
                type="button"
                class="btn btn--secondary"
                data-availability-action="toggle"
                data-id="${escapeHtml(item.id)}"
              >
                ${
                  active
                    ? "Desactivar"
                    : "Activar"
                }
              </button>

              <button
                type="button"
                class="btn btn--danger"
                data-availability-action="delete"
                data-id="${escapeHtml(item.id)}"
              >
                Eliminar
              </button>
            </div>
          </article>
        `;
      })
      .join("");

  document
    .querySelectorAll(
      "[data-availability-action]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          handleAvailabilityAction(
            button.dataset
              .availabilityAction,
            button.dataset.id
          );
        }
      );
    });
}

/* =========================
   MODAL DISPONIBILIDAD
========================= */

function resetAvailabilityForm() {
  selectedAvailability = null;

  if (availabilityForm) {
    availabilityForm.reset();
  }

  if (availabilityId) {
    availabilityId.value = "";
  }

  if (availabilityModalTitle) {
    availabilityModalTitle.textContent =
      "Configuración de disponibilidad";
  }

  if (availabilityStartDate) {
    availabilityStartDate.value =
      getTodayInputValue();
  }

  if (availabilityEndDate) {
    availabilityEndDate.value =
      getDatePlusDays(30);
  }

  if (availabilityStartTime) {
    availabilityStartTime.value =
      "09:00";
  }

  if (availabilityEndTime) {
    availabilityEndTime.value =
      "17:00";
  }

  if (availabilityDuration) {
    availabilityDuration.value =
      "30";
  }

  if (availabilityBreak) {
    availabilityBreak.value =
      "15";
  }

  if (availabilityType) {
    availabilityType.value =
      "presencial";
  }

  if (availabilityActive) {
    availabilityActive.checked =
      true;
  }

  setSelectedAvailabilityDays([
    1, 2, 3, 4, 5
  ]);

  poblarRegionesDisponibilidad();

  actualizarResumenCobertura();
}


function openAvailabilityModal(
  item = null
) {
  resetAvailabilityForm();

  if (item) {
    selectedAvailability = item;

    if (availabilityId) {
      availabilityId.value =
        item.id || "";
    }

    if (availabilityModalTitle) {
      availabilityModalTitle.textContent =
        "Editar configuración";
    }

    if (availabilityRecruiter) {
      availabilityRecruiter.value =
        item.reclutador || "";
    }

    if (availabilityType) {
      availabilityType.value =
        item.tipo || "presencial";
    }

    if (availabilityStartDate) {
      availabilityStartDate.value =
        item.fechaInicio || "";
    }

    if (availabilityEndDate) {
      availabilityEndDate.value =
        item.fechaFin || "";
    }

    if (availabilityStartTime) {
      availabilityStartTime.value =
        item.horaInicio || "";
    }

    if (availabilityEndTime) {
      availabilityEndTime.value =
        item.horaFin || "";
    }

    if (availabilityDuration) {
      availabilityDuration.value =
        String(
          item.duracionMinutos || 30
        );
    }

    if (availabilityBreak) {
      availabilityBreak.value =
        String(
          item.descansoMinutos || 0
        );
    }

    if (availabilityActive) {
      availabilityActive.checked =
        item.activo !== false;
    }

    setSelectedAvailabilityDays(
      item.diasSemana || []
    );

    const region =
      item.region ||
      item.zona ||
      item.ciudad ||
      "";

    poblarRegionesDisponibilidad(
      region
    );

    const sucursalId =
      item.sucursalId ||
      item.numeroTienda ||
      "";

    poblarSucursalesDisponibilidad(
      sucursalId
    );

    if (
      !sucursalId &&
      item.sucursal &&
      availabilitySucursal
    ) {
      const option =
        [...availabilitySucursal.options]
          .find(
            (currentOption) =>
              normalizar(
                currentOption.textContent
              ) ===
              normalizar(
                item.sucursal
              )
          );

      if (option) {
        availabilitySucursal.value =
          option.value;

        poblarVacantesDisponibilidad(
          item.vacanteId || ""
        );
      }
    } else {
      poblarVacantesDisponibilidad(
        item.vacanteId || ""
      );
    }
  }

  actualizarResumenCobertura();

  availabilityModal?.classList.remove(
    "hidden"
  );

  availabilityRecruiter?.focus();
}


function closeAvailabilityModal() {
  if (availabilityModal) {
    availabilityModal.classList.add(
      "hidden"
    );
  }

  resetAvailabilityForm();

  if (saveAvailabilityBtn) {
    saveAvailabilityBtn.disabled =
      false;

    saveAvailabilityBtn.textContent =
  "💾 Guardar configuración";
  }
}
/* =========================
   FILTROS
========================= */
function poblarSelect(select, values) {
  if (!select) return;

  const current = select.value;
  const firstOption = select.querySelector("option")?.outerHTML || `<option value="">Todos</option>`;

  select.innerHTML = firstOption;

  [...new Set(values.filter(Boolean))]
    .sort()
    .forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

  select.value = current;
}

function poblarFiltros() {
  poblarSelect(filterMarca, entrevistas.map(e => e.marca));
  poblarSelect(filterSucursal, entrevistas.map(e => e.sucursal));
  poblarSelect(filterPuesto, entrevistas.map(e => e.puesto));
}

function getEntrevistasFiltradas() {
  const search = normalizar(searchInput?.value || "");
  const fecha = filterDate?.value || "";
  const marca = filterMarca?.value || "";
  const sucursal = filterSucursal?.value || "";
  const puesto = filterPuesto?.value || "";
  const status = filterStatus?.value || "";

  return entrevistas.filter((item) => {
    return (
      (!search || normalizar(item.candidatoNombre).includes(search)) &&
      (!fecha || item.fecha === fecha) &&
      (!marca || item.marca === marca) &&
      (!sucursal || item.sucursal === sucursal) &&
      (!puesto || item.puesto === puesto) &&
      (!status || item.estado === status)
    );
  });
}

/* =========================
   RENDER
========================= */
function updateStats() {
  const today = new Date().toISOString().slice(0, 10);

  statHoy.textContent = entrevistas.filter(e => e.fecha === today).length;
  statPendientes.textContent = entrevistas.filter(e => e.estado === "agendada" || e.estado === "reagendada").length;
  statConfirmadas.textContent = entrevistas.filter(e => e.estado === "confirmada").length;
  statCanceladas.textContent = entrevistas.filter(e => e.estado === "cancelada").length;
  statFinalizadas.textContent = entrevistas.filter(e => e.estado === "realizada").length;
}

function renderTable() {
  const data = getEntrevistasFiltradas();

  if (!data.length) {
    interviewsTable.innerHTML = `
      <tr>
        <td colspan="9">No hay entrevistas con los filtros seleccionados.</td>
      </tr>
    `;
    return;
  }

  interviewsTable.innerHTML = data.map((item) => `
    <tr>
      <td>
        <strong>${item.candidatoNombre || "-"}</strong><br>
        <small>${item.telefono || ""}</small>
      </td>
      <td>${item.puesto || "-"}</td>
      <td>${item.marca || "-"}</td>
      <td>${item.sucursal || "-"}</td>
      <td>${formatDate(item.fecha)}</td>
      <td>${item.hora || "-"}</td>
      <td>${item.reclutador || "-"}</td>
      <td>
        <span class="${estadoBadge(item.estado)}">
          ${estadoLabel(item.estado)}
        </span>
      </td>
      <td>
        <div class="actions">
          <button class="btn btn--secondary" data-action="detail" data-id="${item.id}">Ver</button>
          <button class="btn btn--secondary" data-action="confirm" data-id="${item.id}">Confirmar</button>
          <button class="btn btn--secondary" data-action="done" data-id="${item.id}">Realizada</button>
          <button class="btn btn--danger" data-action="cancel" data-id="${item.id}">Cancelar</button>
          <button
            class="btn btn--danger btn--icon btn--delete"
            data-action="delete"
            data-id="${item.id}"
            type="button"
            title="Eliminar entrevista"
            aria-label="Eliminar entrevista de ${item.candidatoNombre || "candidato"}"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleTableAction(btn.dataset.action, btn.dataset.id));
  });
}

function render() {
  updateStats();
  renderCalendar();
  renderTable();
}

if (prevWeekBtn) {
  prevWeekBtn.addEventListener("click", () => {
    currentWeekStart = addDays(currentWeekStart, -7);
    render();
  });
}

if (todayWeekBtn) {
  todayWeekBtn.addEventListener("click", () => {
    currentWeekStart = getStartOfWeek(new Date());
    render();
  });
}

if (nextWeekBtn) {
  nextWeekBtn.addEventListener("click", () => {
    currentWeekStart = addDays(currentWeekStart, 7);
    render();
  });
}

function getSelectedVacancyData() {
  const option =
    obtenerOpcionSeleccionada(
      availabilityVacancy
    );

  if (
    !option ||
    !availabilityVacancy.value
  ) {
    return {
      vacanteId: "",
      vacanteTitulo: ""
    };
  }

  const vacante =
    vacantesDisponibilidad.find(
      (item) =>
        item.id ===
        availabilityVacancy.value
    );

  return {
    vacanteId:
      availabilityVacancy.value,

    vacanteTitulo:
      vacante?.titulo ||
      option.textContent.trim()
  };
}

function buildAvailabilityPayload() {
  const vacancy =
    getSelectedVacancyData();

  const selectedBranch =
    obtenerOpcionSeleccionada(
      availabilitySucursal
    );

  const region =
    availabilityRegion?.value || "";

  const sucursalId =
    availabilitySucursal?.value || "";

  const sucursal =
    sucursalId
      ? selectedBranch
          ?.textContent
          ?.trim() || ""
      : "";

  return {
    reclutador:
      availabilityRecruiter
        ?.value.trim() || "",

    tipo:
      availabilityType?.value ||
      "presencial",

    region,
    zona: region,
    ciudad: region,

    sucursalId,
    sucursal,

    vacanteId:
      vacancy.vacanteId,

    vacanteTitulo:
      vacancy.vacanteTitulo,

    fechaInicio:
      availabilityStartDate?.value ||
      "",

    fechaFin:
      availabilityEndDate?.value ||
      "",

    horaInicio:
      availabilityStartTime?.value ||
      "",

    horaFin:
      availabilityEndTime?.value ||
      "",

    diasSemana:
      getSelectedAvailabilityDays(),

    duracionMinutos:
      Number(
        availabilityDuration?.value ||
        30
      ),

    descansoMinutos:
      Number(
        availabilityBreak?.value ||
        0
      ),

    activo:
      Boolean(
        availabilityActive?.checked
      )
  };
}

function validateAvailabilityPayload(
  payload
) {
  if (!payload.reclutador) {
    return "Ingresa el nombre del reclutador.";
  }
  
  if (!payload.region) {
  return "Selecciona la región de reclutamiento.";
}

  if (
    !payload.fechaInicio ||
    !payload.fechaFin
  ) {
    return "Selecciona el periodo de vigencia.";
  }

  if (
    payload.fechaFin <
    payload.fechaInicio
  ) {
    return "La fecha final no puede ser anterior a la inicial.";
  }

  if (
    !payload.horaInicio ||
    !payload.horaFin
  ) {
    return "Selecciona el horario inicial y final.";
  }

  if (
    payload.horaFin <=
    payload.horaInicio
  ) {
    return "La hora final debe ser posterior a la inicial.";
  }

  if (!payload.diasSemana.length) {
    return "Selecciona al menos un día disponible.";
  }

  return "";
}


/* =========================
   GUARDAR DISPONIBILIDAD
========================= */

async function guardarDisponibilidad() {
  const payload =
    buildAvailabilityPayload();

  const validationError =
    validateAvailabilityPayload(
      payload
    );

  if (validationError) {
    setStatus(
      `⚠️ ${validationError}`
    );
    return;
  }

  const editingId =
    availabilityId?.value || "";

  const isEditing =
    Boolean(editingId);

  try {
    if (saveAvailabilityBtn) {
      saveAvailabilityBtn.disabled =
        true;

      saveAvailabilityBtn.textContent =
        isEditing
          ? "Actualizando..."
          : "Guardando...";
    }

    setStatus(
      isEditing
        ? "Actualizando disponibilidad..."
        : "Guardando disponibilidad..."
    );

    const url =
      isEditing
        ? `${API_URL}/api/disponibilidades-entrevista/${encodeURIComponent(
            editingId
          )}`
        : `${API_URL}/api/disponibilidades-entrevista`;

    const res = await fetch(url, {
      method:
        isEditing
          ? "PUT"
          : "POST",

      headers: authHeaders({
        "Content-Type":
          "application/json"
      }),

      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
        "No fue posible guardar la disponibilidad."
      );
    }

    closeAvailabilityModal();

    await cargarDisponibilidades();

    setStatus(
      isEditing
        ? "✅ Disponibilidad actualizada correctamente."
        : "✅ Disponibilidad creada correctamente."
    );
  } catch (error) {
    console.error(
      "Error guardando disponibilidad:",
      error
    );

    setStatus(
      `⚠️ ${
        error.message ||
        "No fue posible guardar la disponibilidad."
      }`
    );
  } finally {
    if (saveAvailabilityBtn) {
      saveAvailabilityBtn.disabled =
        false;

      saveAvailabilityBtn.textContent =
        "💾 Guardar configuración";
    }
  }
}
/* =========================
   MODAL DETALLE
========================= */
function openDetailModal(item) {
  selectedInterview = item;

  detailCandidate.textContent = item.candidatoNombre || "Detalle de entrevista";
  detailStatusText.textContent = `Estatus: ${estadoLabel(item.estado)}`;

  detailNombre.textContent = item.candidatoNombre || "-";
  detailPuesto.textContent = item.puesto || "-";
  detailMarca.textContent = item.marca || "-";
  detailSucursal.textContent = item.sucursal || "-";
  detailFecha.textContent = formatDate(item.fecha);
  detailHora.textContent = item.hora || "-";
  detailEntrevistador.textContent = item.reclutador || "-";
  detailTipo.textContent = item.tipo || "-";
  detailComentarios.textContent = item.comentarios || "Sin comentarios internos.";

  detailModal.classList.remove("hidden");
}

function closeDetailModal() {
  detailModal.classList.add("hidden");
}

/* =========================
   ACCIONES
========================= */
function findInterview(id) {
  return entrevistas.find((item) => item.id === id);
}

async function cambiarEstado(id, estado) {
  const item = findInterview(id);

  if (!item) {
    setStatus("⚠️ No se encontró la entrevista seleccionada.");
    return;
  }

  try {
    setStatus("Actualizando entrevista...");

    const res = await fetch(
      `${API_URL}/api/entrevistas/${encodeURIComponent(id)}/estado`,
      {
        method: "PATCH",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ estado })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "No fue posible actualizar la entrevista."
      );
    }

    await Promise.all([
  cargarEntrevistas(),
  cargarDisponibilidades(),
  cargarVacantesDisponibilidad()
]);
    closeDetailModal();

    setStatus(
      `✅ Entrevista marcada como ${estadoLabel(estado)}.`
    );
  } catch (error) {
    console.error("Error actualizando entrevista:", error);
    setStatus(`⚠️ ${error.message}`);
  }
}


function openDeleteModal(item) {
  if (!item) return;

  interviewToDelete = item;

  if (deleteCandidateName) {
    deleteCandidateName.textContent =
      item.candidatoNombre || "este candidato";
  }

  if (deleteModal) {
    deleteModal.classList.remove("hidden");
  }
}

function closeDeleteModal() {
  if (deleteModal) {
    deleteModal.classList.add("hidden");
  }

  interviewToDelete = null;

  if (confirmDeleteBtn) {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.innerHTML = "🗑️ Eliminar";
  }
}

function handleTableAction(action, id) {
  const item = findInterview(id);

  if (!item) {
    setStatus("⚠️ No se encontró la entrevista seleccionada.");
    return;
  }

  if (action === "detail") {
    openDetailModal(item);
    return;
  }

  if (action === "confirm") {
    cambiarEstado(id, "confirmada");
    return;
  }

  if (action === "done") {
    cambiarEstado(id, "realizada");
    return;
  }

  if (action === "cancel") {
    cambiarEstado(id, "cancelada");
    return;
  }

  if (action === "delete") {
    openDeleteModal(item);
  }
}

async function eliminarEntrevistaSeleccionada() {
  if (!interviewToDelete?.id) {
    setStatus("⚠️ No hay una entrevista seleccionada para eliminar.");
    return;
  }

  const entrevistaId = interviewToDelete.id;
  const candidatoNombre =
    interviewToDelete.candidatoNombre || "el candidato";

  try {
    if (confirmDeleteBtn) {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Eliminando...";
    }

    setStatus("Eliminando entrevista...");

    const res = await fetch(
      `${API_URL}/api/entrevistas/${encodeURIComponent(entrevistaId)}`,
      {
        method: "DELETE",
        headers: authHeaders()
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "No fue posible eliminar la entrevista."
      );
    }

    closeDeleteModal();
    closeDetailModal();

    await Promise.all([
  cargarEntrevistas(),
  cargarDisponibilidades(),
  cargarVacantesDisponibilidad()
]);

    setStatus(
      `✅ La entrevista de ${candidatoNombre} fue eliminada correctamente.`
    );
  } catch (error) {
    console.error("Error eliminando entrevista:", error);

    setStatus(
      `⚠️ ${error.message || "No fue posible eliminar la entrevista."}`
    );

    if (confirmDeleteBtn) {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = "🗑️ Eliminar";
    }
  }
}

async function cambiarEstadoDisponibilidad(
  item
) {
  if (!item?.id) return;

  const nuevoEstado =
    item.activo === false;

  try {
    setStatus(
      nuevoEstado
        ? "Activando disponibilidad..."
        : "Desactivando disponibilidad..."
    );

    const res = await fetch(
      `${API_URL}/api/disponibilidades-entrevista/${encodeURIComponent(
        item.id
      )}/estado`,
      {
        method: "PATCH",

        headers: authHeaders({
          "Content-Type":
            "application/json"
        }),

        body: JSON.stringify({
          activo: nuevoEstado
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
        "No fue posible cambiar el estado."
      );
    }

    await cargarDisponibilidades();

    setStatus(
      nuevoEstado
        ? "✅ Disponibilidad activada."
        : "✅ Disponibilidad desactivada."
    );
  } catch (error) {
    console.error(
      "Error cambiando disponibilidad:",
      error
    );

    setStatus(
      `⚠️ ${error.message}`
    );
  }
}

async function eliminarDisponibilidad(
  item
) {
  if (!item?.id) return;

  const confirmed =
    window.confirm(
      `¿Seguro que deseas eliminar la disponibilidad de ${
        item.reclutador ||
        "este reclutador"
      }?\n\nEsta acción no se puede deshacer.`
    );

  if (!confirmed) return;

  try {
    setStatus(
      "Eliminando disponibilidad..."
    );

    const res = await fetch(
      `${API_URL}/api/disponibilidades-entrevista/${encodeURIComponent(
        item.id
      )}`,
      {
        method: "DELETE",
        headers: authHeaders()
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
        "No fue posible eliminar la disponibilidad."
      );
    }

    await cargarDisponibilidades();

    setStatus(
      "✅ Disponibilidad eliminada correctamente."
    );
  } catch (error) {
    console.error(
      "Error eliminando disponibilidad:",
      error
    );

    setStatus(
      `⚠️ ${error.message}`
    );
  }
}

function openRescheduleModal() {
  if (!selectedInterview) return;

  newDate.value = selectedInterview.fecha || "";
  newTime.value = selectedInterview.hora || "";
  rescheduleModal.classList.remove("hidden");
}

function closeRescheduleModal() {
  rescheduleModal.classList.add("hidden");
}

async function guardarReprogramacion() {
  if (!selectedInterview?.id) {
    setStatus("⚠️ No hay una entrevista seleccionada.");
    return;
  }

  if (!newDate.value || !newTime.value) {
    setStatus("⚠️ Selecciona nueva fecha y hora.");
    return;
  }

  try {
    if (saveRescheduleBtn) {
      saveRescheduleBtn.disabled = true;
      saveRescheduleBtn.textContent = "Guardando...";
    }

    const res = await fetch(
      `${API_URL}/api/entrevistas/${encodeURIComponent(
        selectedInterview.id
      )}`,
      {
        method: "PATCH",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          fecha: newDate.value,
          hora: newTime.value,
          estado: "reagendada"
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "No fue posible reprogramar la entrevista."
      );
    }

    closeRescheduleModal();
    closeDetailModal();

   await Promise.all([
  cargarEntrevistas(),
  cargarDisponibilidades(),
  cargarVacantesDisponibilidad()
]);

    setStatus("✅ Entrevista reprogramada correctamente.");
  } catch (error) {
    console.error("Error reprogramando entrevista:", error);
    setStatus(`⚠️ ${error.message}`);
  } finally {
    if (saveRescheduleBtn) {
      saveRescheduleBtn.disabled = false;
      saveRescheduleBtn.textContent = "Guardar cambios";
    }
  }
}

function findAvailability(id) {
  return disponibilidadesEntrevista
    .find(
      (item) => item.id === id
    );
}

function handleAvailabilityAction(
  action,
  id
) {
  const item =
    findAvailability(id);

  if (!item) {
    setStatus(
      "⚠️ No se encontró la disponibilidad seleccionada."
    );
    return;
  }

  if (action === "edit") {
    openAvailabilityModal(item);
    return;
  }

  if (action === "toggle") {
    cambiarEstadoDisponibilidad(item);
    return;
  }

  if (action === "delete") {
    eliminarDisponibilidad(item);
  }
}


/* =========================
   LOGOUT
========================= */
async function cerrarSesion() {
  try {
    if (auth) {
      await auth.signOut();
    }

    window.location.href = "login-admin.html";
  } catch (error) {
    console.error(error);
    setStatus("⚠️ No fue posible cerrar sesión.");
  }
}


async function cargarVacantesDisponibilidad() {
  try {
    const res = await fetch(
      `${API_URL}/api/vacantes`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
        "No fue posible cargar vacantes."
      );
    }

    vacantesDisponibilidad =
      Array.isArray(data)
        ? data
        : [];

    poblarRegionesDisponibilidad(
      availabilityRegion?.value || ""
    );
  } catch (error) {
    console.error(
      "Error cargando vacantes:",
      error
    );

    vacantesDisponibilidad = [];

    if (availabilityRegion) {
      availabilityRegion.innerHTML = `
        <option value="">
          No fue posible cargar las regiones
        </option>
      `;
    }

    if (availabilitySucursal) {
      availabilitySucursal.innerHTML = `
        <option value="">
          No fue posible cargar sucursales
        </option>
      `;

      availabilitySucursal.disabled =
        true;
    }

    if (availabilityVacancy) {
      availabilityVacancy.innerHTML = `
        <option value="">
          No fue posible cargar vacantes
        </option>
      `;

      availabilityVacancy.disabled =
        true;
    }
  }
}

if (availabilityRegion) {
  availabilityRegion.addEventListener(
    "change",
    () => {
      poblarSucursalesDisponibilidad();
    }
  );
}

if (availabilitySucursal) {
  availabilitySucursal.addEventListener(
    "change",
    () => {
      poblarVacantesDisponibilidad();
    }
  );
}

if (availabilityVacancy) {
  availabilityVacancy.addEventListener(
    "change",
    actualizarResumenCobertura
  );
}


/* =========================
   EVENTOS DISPONIBILIDAD
========================= */

if (openAvailabilityModalBtn) {
  openAvailabilityModalBtn
    .addEventListener(
      "click",
      () =>
        openAvailabilityModal()
    );
}

if (closeAvailabilityModalBtn) {
  closeAvailabilityModalBtn
    .addEventListener(
      "click",
      closeAvailabilityModal
    );
}

if (closeAvailabilityBackdrop) {
  closeAvailabilityBackdrop
    .addEventListener(
      "click",
      closeAvailabilityModal
    );
}

if (cancelAvailabilityBtn) {
  cancelAvailabilityBtn
    .addEventListener(
      "click",
      closeAvailabilityModal
    );
}

if (saveAvailabilityBtn) {
  saveAvailabilityBtn
    .addEventListener(
      "click",
      guardarDisponibilidad
    );
}

if (availabilityForm) {
  availabilityForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      guardarDisponibilidad();
    }
  );
}

/* =========================
   EVENTOS
========================= */
[searchInput, filterDate, filterMarca, filterSucursal, filterPuesto, filterStatus].forEach((input) => {
  if (input) input.addEventListener("input", render);
});

if (refreshBtn) refreshBtn.addEventListener("click", cargarEntrevistas);
if (logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);

if (closeDetailBtn) closeDetailBtn.addEventListener("click", closeDetailModal);
if (closeDetailBackdrop) closeDetailBackdrop.addEventListener("click", closeDetailModal);

if (confirmBtn) confirmBtn.addEventListener("click", () => selectedInterview && cambiarEstado(selectedInterview.id, "confirmada"));
if (doneBtn) doneBtn.addEventListener("click", () => selectedInterview && cambiarEstado(selectedInterview.id, "realizada"));
if (cancelBtn) cancelBtn.addEventListener("click", () => selectedInterview && cambiarEstado(selectedInterview.id, "cancelada"));
if (rescheduleBtn) rescheduleBtn.addEventListener("click", openRescheduleModal);

if (closeRescheduleBtn) closeRescheduleBtn.addEventListener("click", closeRescheduleModal);
if (closeRescheduleBackdrop) closeRescheduleBackdrop.addEventListener("click", closeRescheduleModal);
if (saveRescheduleBtn) saveRescheduleBtn.addEventListener("click", guardarReprogramacion);

if (closeDeleteBtn) {
  closeDeleteBtn.addEventListener("click", closeDeleteModal);
}

if (closeDeleteBackdrop) {
  closeDeleteBackdrop.addEventListener("click", closeDeleteModal);
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener(
    "click",
    eliminarEntrevistaSeleccionada
  );
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  closeDetailModal();
  closeRescheduleModal();
  closeDeleteModal();
});

/* =========================
   INIT
========================= */
async function init() {
  await Promise.all([
  cargarEntrevistas(),
  cargarDisponibilidades(),
  cargarVacantesDisponibilidad()
]);
}

if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login-admin.html";
      return;
    }

    adminToken = await user.getIdToken(true);
    await init();
  });
} else {
  init();
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);

  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekDays(startDate) {
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}

function getHourFromTime(time = "") {
  const hour = Number(String(time).split(":")[0]);
  return Number.isFinite(hour) ? hour : 9;
}

function getCalendarHours(items = []) {
  const hours = items.map(item => getHourFromTime(item.hora));

  const minHour = Math.min(9, ...hours);
  const maxHour = Math.max(18, ...hours);

  return Array.from(
    { length: maxHour - minHour + 1 },
    (_, index) => minHour + index
  );
}

function formatWeekTitle(days) {
  const first = days[0];
  const last = days[6];

  return `Semana del ${formatDate(toDateInputValue(first))} al ${formatDate(toDateInputValue(last))}`;
}


function renderCalendar() {
  if (!calendarGrid) return;

  const days = getWeekDays(currentWeekStart);
  const dayKeys = days.map(day => toDateInputValue(day));

  const weekInterviews = getEntrevistasFiltradas().filter(item =>
    dayKeys.includes(item.fecha)
  );

  const hours = getCalendarHours(weekInterviews);

  if (calendarTitle) {
    calendarTitle.textContent = formatWeekTitle(days);
  }

  if (calendarSummaryText) {
    calendarSummaryText.textContent =
      `${weekInterviews.length} entrevista${weekInterviews.length === 1 ? "" : "s"} agendada${weekInterviews.length === 1 ? "" : "s"} esta semana`;
  }

  let html = `
    <div class="calendar-cell calendar-header-cell"></div>
  `;

  days.forEach((day) => {
    const label = day.toLocaleDateString("es-MX", { weekday: "short" });
    const number = day.getDate();

    html += `
      <div class="calendar-cell calendar-header-cell">
        <span class="calendar-day-name">${label}</span>
        <span class="calendar-day-date">${number}</span>
      </div>
    `;
  });

  hours.forEach((hour) => {
    html += `
      <div class="calendar-cell calendar-time-cell">
        ${String(hour).padStart(2, "0")}:00
      </div>
    `;

    days.forEach((day) => {
      const key = toDateInputValue(day);

      const events = weekInterviews.filter((item) => {
        return item.fecha === key && getHourFromTime(item.hora) === hour;
      });

      html += `<div class="calendar-cell">`;

      events.forEach((item) => {
        html += `
          <button
            class="calendar-event calendar-event--${item.estado || "agendada"}"
            data-calendar-id="${item.id}"
            type="button">
            <strong>${item.hora || ""} · ${item.candidatoNombre || "Candidato"}</strong>
            <span>${item.puesto || "-"} · ${item.sucursal || "-"}</span>
          </button>
        `;
      });

      html += `</div>`;
    });
  });

  calendarGrid.innerHTML = html;

  document.querySelectorAll("[data-calendar-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = entrevistas.find(e => e.id === btn.dataset.calendarId);
      if (item) openDetailModal(item);
    });
  });
}