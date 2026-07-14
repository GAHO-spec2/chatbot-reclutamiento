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
    reagendada: "Reagendada"
  };

  return labels[estado] || "Agendada";
}

function estadoBadge(estado = "") {
  return `badge badge--${estado || "agendada"}`;
}

function normalizar(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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

    await cargarEntrevistas();
    closeDetailModal();

    setStatus(
      `✅ Entrevista marcada como ${estadoLabel(estado)}.`
    );
  } catch (error) {
    console.error("Error actualizando entrevista:", error);
    setStatus(`⚠️ ${error.message}`);
  }
}
function handleTableAction(action, id) {
  const item = findInterview(id);
  if (!item) return;

  if (action === "detail") openDetailModal(item);
  if (action === "confirm") cambiarEstado(id, "confirmada");
  if (action === "done") cambiarEstado(id, "realizada");
  if (action === "cancel") cambiarEstado(id, "cancelada");
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

    await cargarEntrevistas();

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

/* =========================
   INIT
========================= */
async function init() {
  await cargarEntrevistas();
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