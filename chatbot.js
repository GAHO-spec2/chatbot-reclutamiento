const API_URL = window.location.origin;

const toggle = document.getElementById("chatbot-toggle");
const closeBtn = document.getElementById("chatbot-close");
const box = document.getElementById("chatbot-box");
const messagesDiv = document.getElementById("chatbot-messages");
const form = document.getElementById("chatbot-form");
const input = document.getElementById("chatbot-input");
const attachCvBtn = document.getElementById("attachCvBtn");
const chatCvFile = document.getElementById("chatCvFile");
const startApplicationBtn = document.getElementById("startApplicationBtn");
const buscarVacantesBtn = document.getElementById("buscarVacantesBtn");
const filtroTipo = document.getElementById("filtroTipo");
const filtroPais = document.getElementById("filtroPais");
const filtroEstado = document.getElementById("filtroEstado");
const filtroCiudad = document.getElementById("filtroCiudad");
const consultarStatusBtn = document.getElementById("consultarStatusBtn");
const folioConsulta = document.getElementById("folioConsulta");
const consultaStatusResultado = document.getElementById("consultaStatusResultado");
const chatbotToggle = document.getElementById("chatbot-toggle");

const branchMarkers = document.getElementById("branchMarkers");
const branchList = document.getElementById("branchList");
const branchSearch = document.getElementById("branchSearch");
const branchBrandFilter = document.getElementById("branchBrandFilter");
const branchVacancies = document.getElementById("branchVacancies");
const vacancyBoard = document.getElementById("vacancyBoard");
const selectedBranchName = document.getElementById("selectedBranchName");
const selectedBranchAddress = document.getElementById("selectedBranchAddress");
const selectedBranchMapLink = document.getElementById("selectedBranchMapLink");
const selectedBranchAppleMapLink = document.getElementById("selectedBranchAppleMapLink");
const closeBranchVacanciesBtn = document.getElementById("closeBranchVacanciesBtn");

let ubicaciones = {};
let branches = [];
let vacancies = [];
let selectedBranchId = "";

let applicationFlow = {
  active: false,
  mode: "",
  cvFile: null,
  selectedVacancy: null,
  selectedBranch: null
};

let candidateProfile = {
  nombre: "",
  correo: "",
  telefono: "",
  resumenIA: "",
  cvNombre: ""
};

const DEMO_BRANCHES = [
  {
    id: "lc-chihuahua-centro",
    nombre: "Little Caesars Chihuahua Centro",
    marca: "Little Caesars",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    direccion: "Av. Universidad 1301, Centro, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Av.%20Universidad%201301%20Chihuahua",
    mapX: 48,
    mapY: 43
  },
  {
    id: "wendys-juarez",
    nombre: "Wendy's Cd. Juarez",
    marca: "Wendy's",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Cd. Juarez",
    direccion: "Blvd. Tomas Fernandez, Cd. Juarez, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Blvd.%20Tomas%20Fernandez%20Cd.%20Juarez",
    mapX: 39,
    mapY: 26
  },
  {
    id: "applebees-monterrey",
    nombre: "Applebee's Monterrey",
    marca: "Applebee's",
    pais: "Mexico",
    estado: "Nuevo Leon",
    ciudad: "Monterrey",
    direccion: "Av. Eugenio Garza Sada, Monterrey, Nuevo Leon",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Av.%20Eugenio%20Garza%20Sada%20Monterrey",
    mapX: 58,
    mapY: 52
  },
  {
    id: "gaho-corporativo",
    nombre: "GA Hospitality Corporativo",
    marca: "GA Hospitality",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    direccion: "Corporativo GA Hospitality, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=GA%20Hospitality%20Chihuahua",
    mapX: 53,
    mapY: 38
  }
];

const DEMO_VACANCIES = [
  {
    id: "vac-barista-juarez",
    branchId: "wendys-juarez",
    titulo: "Cajero / Atencion al cliente",
    tipoVacante: "operativa",
    horario: "Tiempo completo",
    sueldo: "$2,700 semanal",
    descripcion: "Atencion a clientes, cobro, limpieza de area y apoyo en operacion."
  },
  {
    id: "vac-cocina-juarez",
    branchId: "wendys-juarez",
    titulo: "Auxiliar de cocina",
    tipoVacante: "operativa",
    horario: "Rol de turnos",
    sueldo: "$2,600 semanal",
    descripcion: "Preparacion de alimentos, control de calidad y apoyo al equipo de cocina."
  },
  {
    id: "vac-pizzero-chihuahua",
    branchId: "lc-chihuahua-centro",
    titulo: "Pizzero",
    tipoVacante: "operativa",
    horario: "Medio tiempo",
    sueldo: "$1,800 semanal",
    descripcion: "Preparacion de producto, horno, inventario basico y servicio."
  },
  {
    id: "vac-gerente-mty",
    branchId: "applebees-monterrey",
    titulo: "Gerente de restaurante",
    tipoVacante: "operativa",
    horario: "Tiempo completo",
    sueldo: "Segun experiencia",
    descripcion: "Supervision de equipo, indicadores operativos, servicio y administracion."
  },
  {
    id: "vac-rh-corp",
    branchId: "gaho-corporativo",
    titulo: "Auxiliar de recursos humanos",
    tipoVacante: "administrativa",
    horario: "Lunes a viernes",
    sueldo: "Segun experiencia",
    descripcion: "Apoyo en reclutamiento, seguimiento a candidatos y control documental."
  }
];

const chatHistory = [
  {
    role: "assistant",
    type: "welcome",
    content:
      "Hola. Soy tu asistente inteligente de reclutamiento. Puedo analizar tu CV o ayudarte a postularte a una vacante por sucursal.",
    options: [
      { label: "Analizar mi CV", value: "analizar_cv" },
      { label: "Buscar sucursal", value: "buscar_sucursal" }
    ]
  }
];

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(text = "") {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getBranchIdFromVacancy(vacancy = {}) {
  if (vacancy.branchId) return vacancy.branchId;

  return slugify(
    [
      vacancy.grupo,
      vacancy.sucursal,
      vacancy.ciudad,
      vacancy.estado,
      vacancy.pais
    ]
      .filter(Boolean)
      .join("-")
  );
}

function buildMapQuery(branch = {}) {
  return [
    branch.direccion,
    branch.sucursal,
    branch.nombre,
    branch.ciudad,
    branch.estado,
    branch.pais
  ]
    .filter(Boolean)
    .join(", ");
}

function buildGoogleMapsUrl(branch = {}) {
  if (branch.googleMapsUrl) return branch.googleMapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildMapQuery(branch))}`;
}

function buildAppleMapsUrl(branch = {}) {
  if (branch.appleMapsUrl) return branch.appleMapsUrl;
  return `https://maps.apple.com/?q=${encodeURIComponent(buildMapQuery(branch))}`;
}

function getBranchPosition(index, total) {
  if (total <= 1) return { mapX: 50, mapY: 50 };

  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const xStep = 70 / Math.max(cols - 1, 1);
  const rows = Math.ceil(total / cols);
  const yStep = 58 / Math.max(rows - 1, 1);

  return {
    mapX: 15 + col * xStep,
    mapY: 22 + row * yStep
  };
}

function normalizeVacancy(vacancy = {}) {
  return {
    ...vacancy,
    branchId: getBranchIdFromVacancy(vacancy)
  };
}

function buildBranchesFromVacancies(vacancyList = []) {
  const byBranch = new Map();

  vacancyList.forEach((vacancy) => {
    const id = getBranchIdFromVacancy(vacancy);

    if (!id || byBranch.has(id)) return;

    byBranch.set(id, {
      id,
      nombre: vacancy.sucursal || `${vacancy.grupo || "Sucursal"} ${vacancy.ciudad || ""}`.trim(),
      sucursal: vacancy.sucursal || "",
      marca: vacancy.grupo || "GA Hospitality",
      pais: vacancy.pais || "",
      estado: vacancy.estado || "",
      ciudad: vacancy.ciudad || "",
      direccion: vacancy.direccion || vacancy.direccionSucursal || "",
      googleMapsUrl: vacancy.googleMapsUrl || vacancy.mapsUrl || "",
      appleMapsUrl: vacancy.appleMapsUrl || "",
      lat: vacancy.lat || vacancy.latitude || "",
      lng: vacancy.lng || vacancy.longitude || ""
    });
  });

  return [...byBranch.values()].map((branch, index, list) => ({
    ...branch,
    ...getBranchPosition(index, list.length)
  }));
}

function activateListeningState() {
  chatbotToggle?.classList.add("is-listening");
}

function deactivateListeningState() {
  chatbotToggle?.classList.remove("is-listening");
}

function openChat() {
  if (!box) return;
  box.classList.remove("hidden");
  activateListeningState();
  input?.focus();
}

function closeChat() {
  if (!box) return;
  box.classList.add("hidden");
  deactivateListeningState();
}

function addAssistantText(content) {
  chatHistory.push({ role: "assistant", type: "text", content });
  renderMessages();
}

function addUserText(content) {
  chatHistory.push({ role: "user", type: "text", content });
  renderMessages();
}

function renderMessages() {
  if (!messagesDiv) return;

  messagesDiv.innerHTML = "";

  chatHistory.forEach((m) => {
    const wrapper = document.createElement("div");
    wrapper.className = `msg ${m.role}`;

    if (m.type === "welcome") {
      const text = document.createElement("div");
      text.textContent = m.content;
      wrapper.appendChild(text);

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "chat-options";

      (m.options || []).forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "chat-option-btn";
        btn.textContent = opt.label;
        btn.type = "button";

        btn.addEventListener("click", () => {
          if (opt.value === "analizar_cv") startCvAnalysisFlow();
          if (opt.value === "buscar_sucursal") {
            document.getElementById("postulate-sucursal")?.scrollIntoView({ behavior: "smooth" });
          }
        });

        optionsWrap.appendChild(btn);
      });

      wrapper.appendChild(optionsWrap);
    } else {
      wrapper.textContent = m.content;
    }

    messagesDiv.appendChild(wrapper);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function startCvAnalysisFlow() {
  applicationFlow.active = true;
  applicationFlow.mode = "cv_analysis";
  openChat();
  addAssistantText(
    "Perfecto. Adjunta tu CV en formato PDF y analizare automaticamente tu experiencia, habilidades y perfil profesional."
  );
}

function startVacancyApplication(vacancyId) {
  const vacancy = vacancies.find((item) => item.id === vacancyId);
  const branch = branches.find((item) => item.id === vacancy?.branchId);

  if (!vacancy || !branch) return;

  applicationFlow.active = true;
  applicationFlow.mode = "branch_vacancy_application";
  applicationFlow.selectedVacancy = vacancy;
  applicationFlow.selectedBranch = branch;

  openChat();
  addAssistantText(
    `Excelente. Iniciaremos tu postulacion para:\n\n${vacancy.titulo}\n${branch.nombre}\n${branch.direccion}\n\nPrimero adjunta tu CV en PDF. Si no lo tienes a la mano, escribe tu nombre completo y telefono para iniciar tu registro.`
  );
}

async function processCvAnalysisOnly() {
  if (!applicationFlow.cvFile) {
    addAssistantText("Primero debes adjuntar tu CV en formato PDF.");
    return;
  }

  const vacancy = applicationFlow.selectedVacancy;
  const branch = applicationFlow.selectedBranch;

  addAssistantText("Analizando CV y preparando tu postulacion...");

  const formData = new FormData();
  formData.append("cvFile", applicationFlow.cvFile);

  if (vacancy && branch) {
    formData.append("vacanteId", vacancy.id);
    formData.append("sucursalId", branch.id);
  }

  try {
    const response = await fetch(`${API_URL}/api/analizar-cv`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible analizar el CV.");
    }

    const analisis = data.analisis || {};
    candidateProfile.cvNombre = analisis.cvNombre || "";
    candidateProfile.resumenIA = analisis.resumenIA || "";

    addAssistantText(`Analisis completado.\n\nResumen detectado:\n${candidateProfile.resumenIA}`);

    if (vacancy && branch) {
      addAssistantText(
        `Tu CV quedo ligado a la vacante ${vacancy.titulo} en ${branch.nombre}. El siguiente paso es completar tus datos de contacto.`
      );
      return;
    }

    if (Array.isArray(analisis.sugerenciasIA) && analisis.sugerenciasIA.length) {
      mostrarVacantesIA(analisis.sugerenciasIA);
    } else {
      addAssistantText("No encontre recomendaciones automaticas en este momento.");
    }
  } catch (error) {
    console.error(error);
    addAssistantText(`${error.message}`);
  }
}

function mostrarVacantesIA(recomendaciones = []) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg assistant";
  wrapper.textContent = "Estas vacantes podrian adaptarse a tu perfil. Puedes revisarlas en el apartado de sucursales.";
  messagesDiv.appendChild(wrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function fetchJsonOrFallback(url, fallback) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Sin datos");
    const data = await response.json();
    return Array.isArray(data) ? data : fallback;
  } catch (error) {
    return fallback;
  }
}

async function cargarBranchData() {
  vacancies = (await fetchJsonOrFallback(`${API_URL}/api/vacantes`, DEMO_VACANCIES)).map(normalizeVacancy);
  branches = await fetchJsonOrFallback(`${API_URL}/api/sucursales`, []);

  if (!branches.length) {
    branches = buildBranchesFromVacancies(vacancies);
  }

  branches = branches.map((branch, index) => ({
    ...branch,
    id: branch.id || slugify(`${branch.marca || branch.grupo} ${branch.sucursal || branch.nombre} ${branch.ciudad}`),
    nombre: branch.nombre || branch.sucursal || `${branch.marca || "Sucursal"} ${branch.ciudad || ""}`.trim(),
    marca: branch.marca || branch.grupo || "GA Hospitality",
    mapX: branch.mapX || getBranchPosition(index, branches.length).mapX,
    mapY: branch.mapY || getBranchPosition(index, branches.length).mapY
  }));

  const brands = [...new Set(branches.map((branch) => branch.marca).filter(Boolean))].sort();
  if (branchBrandFilter) {
    branchBrandFilter.innerHTML = `<option value="">Todas</option>`;
  }

  brands.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    branchBrandFilter?.appendChild(option);
  });

  selectedBranchId = "";
  renderBranches();
}

function getFilteredBranches() {
  const search = normalizeText(branchSearch?.value || "");
  const brand = branchBrandFilter?.value || "";

  return branches.filter((branch) => {
    const matchesBrand = !brand || branch.marca === brand;
    const haystack = normalizeText(
      `${branch.nombre} ${branch.marca} ${branch.ciudad} ${branch.estado} ${branch.direccion}`
    );
    return matchesBrand && (!search || haystack.includes(search));
  });
}

function renderBranches() {
  if (!branchMarkers || !branchList) return;

  const filteredBranches = getFilteredBranches();
  branchMarkers.innerHTML = "";
  branchList.innerHTML = "";

  filteredBranches.forEach((branch) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `branch-marker ${branch.id === selectedBranchId ? "is-active" : ""}`;
    marker.style.left = `${branch.mapX || 50}%`;
    marker.style.top = `${branch.mapY || 50}%`;
    marker.title = branch.nombre;
    marker.innerHTML = `<span>${getBranchVacancies(branch.id).length}</span>`;
    marker.addEventListener("click", () => selectBranch(branch.id));
    branchMarkers.appendChild(marker);

    const item = document.createElement("button");
    item.type = "button";
    item.className = `branch-item ${branch.id === selectedBranchId ? "is-active" : ""}`;
    item.innerHTML = `
      <strong>${branch.nombre}</strong>
      <span>${branch.marca} - ${branch.ciudad}, ${branch.estado}</span>
      <span>${branch.direccion}</span>
    `;
    item.addEventListener("click", () => selectBranch(branch.id));
    branchList.appendChild(item);
  });

  if (!filteredBranches.some((branch) => branch.id === selectedBranchId)) {
    selectedBranchId = filteredBranches[0]?.id || "";
  }

  renderSelectedBranch();
}

function selectBranch(branchId) {
  selectedBranchId = branchId;
  renderBranches();
  vacancyBoard?.classList.remove("hidden");
  selectedBranchMapLink?.classList.remove("hidden");
  selectedBranchAppleMapLink?.classList.remove("hidden");
  vacancyBoard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeBranchVacancies() {
  selectedBranchId = "";
  vacancyBoard?.classList.add("hidden");
  selectedBranchMapLink?.classList.add("hidden");
  selectedBranchAppleMapLink?.classList.add("hidden");
  renderBranches();
}

function getBranchVacancies(branchId) {
  return vacancies.filter((vacancy) => getBranchIdFromVacancy(vacancy) === branchId);
}

function renderSelectedBranch() {
  const branch = branches.find((item) => item.id === selectedBranchId);

  if (!branch || !branchVacancies) {
    if (branchVacancies) branchVacancies.innerHTML = "";
    return;
  }

  const branchJobs = getBranchVacancies(branch.id);
  selectedBranchName.textContent = branch.nombre;
  selectedBranchAddress.textContent = [branch.direccion, branch.ciudad, branch.estado]
    .filter(Boolean)
    .join(" - ");

  selectedBranchMapLink.href = buildGoogleMapsUrl(branch);
  selectedBranchAppleMapLink.href = buildAppleMapsUrl(branch);

  branchVacancies.innerHTML = "";

  if (!branchJobs.length) {
    const empty = document.createElement("div");
    empty.className = "status";
    empty.textContent = "Esta sucursal no tiene vacantes activas por ahora.";
    branchVacancies.appendChild(empty);
    return;
  }

  branchJobs.forEach((vacancy) => {
    const card = document.createElement("article");
    card.className = "vacancy-card";
    card.innerHTML = `
      <div class="vacancy-meta">
        <span>${vacancy.tipoVacante || "operativa"}</span>
        <span>${vacancy.area || vacancy.horario || "Area por definir"}</span>
      </div>
      <h4>${vacancy.titulo}</h4>
      <p>${vacancy.descripcion || (Array.isArray(vacancy.requisitos) ? vacancy.requisitos.join(", ") : "Vacante disponible en esta sucursal.")}</p>
      <p><strong>${vacancy.grupo || vacancy.sueldo || "GA Hospitality"}</strong></p>
      <button class="btn btn--primary" type="button" data-apply="${vacancy.id}">
        Aplicar
      </button>
    `;
    branchVacancies.appendChild(card);
  });

  branchVacancies.querySelectorAll("[data-apply]").forEach((button) => {
    button.addEventListener("click", () => startVacancyApplication(button.dataset.apply));
  });
}

async function cargarUbicaciones() {
  try {
    const res = await fetch(`${API_URL}/api/ubicaciones`);
    ubicaciones = await res.json();
  } catch (error) {
    ubicaciones = {
      Mexico: {
        Chihuahua: ["Chihuahua", "Cd. Juarez"],
        "Nuevo Leon": ["Monterrey"]
      }
    };
  }
}

function llenarEstados() {
  const pais = filtroPais.value;
  filtroEstado.innerHTML = `<option value="">Todos</option>`;
  filtroCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais]).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    filtroEstado.appendChild(option);
  });
}

function llenarCiudades() {
  const pais = filtroPais.value;
  const estado = filtroEstado.value;
  filtroCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    filtroCiudad.appendChild(option);
  });
}

function buscarVacantes() {
  const params = new URLSearchParams({
    tipoVacante: filtroTipo.value || "",
    pais: filtroPais.value || "",
    estado: filtroEstado.value || "",
    ciudad: filtroCiudad.value || ""
  });

  window.location.href = `/vacantes.html?${params.toString()}`;
}

async function consultarEstatus() {
  const folio = folioConsulta.value.trim();

  if (!folio) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = "Ingresa un folio.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/postulacion/${folio}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No fue posible consultar.");
    }

    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = `Estado actual: ${data.estadoSolicitud}`;
  } catch (error) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = `${error.message}`;
  }
}

toggle?.addEventListener("click", openChat);
closeBtn?.addEventListener("click", closeChat);
startApplicationBtn?.addEventListener("click", startCvAnalysisFlow);
buscarVacantesBtn?.addEventListener("click", buscarVacantes);
filtroPais?.addEventListener("change", llenarEstados);
filtroEstado?.addEventListener("change", llenarCiudades);
consultarStatusBtn?.addEventListener("click", consultarEstatus);
branchSearch?.addEventListener("input", renderBranches);
branchBrandFilter?.addEventListener("change", renderBranches);
closeBranchVacanciesBtn?.addEventListener("click", closeBranchVacancies);

if (attachCvBtn && chatCvFile) {
  attachCvBtn.addEventListener("click", () => {
    openChat();

    if (!applicationFlow.active) {
      startCvAnalysisFlow();
    }

    chatCvFile.click();
  });

  chatCvFile.addEventListener("change", async () => {
    const file = chatCvFile.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      addAssistantText("Solo se permiten archivos PDF.");
      return;
    }

    applicationFlow.cvFile = file;
    addAssistantText(`CV cargado correctamente:\n${file.name}`);
    await processCvAnalysisOnly();
  });
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  addUserText(text);
  input.value = "";

  if (applicationFlow.mode === "branch_vacancy_application") {
    addAssistantText(
      "Gracias. Ya registre esta informacion para tu postulacion. Cuando conectemos el backend, aqui se enviara a la ruta de postulaciones con la sucursal y vacante seleccionadas."
    );
    return;
  }

  addAssistantText("Estoy procesando tu mensaje...");
});

async function init() {
  renderMessages();
  await Promise.all([cargarUbicaciones(), cargarBranchData()]);
}

init();