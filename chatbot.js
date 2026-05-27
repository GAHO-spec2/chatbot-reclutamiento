const API_URL = "https://chatbot-reclutamiento-cl32.onrender.com";

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

const realBranchMap = document.getElementById("realBranchMap");
const useMyLocationBtn = document.getElementById("useMyLocationBtn");
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
let map = null;
let branchLayer = null;
let userMarker = null;
let userLocation = null;

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

const DEFAULT_CENTER = [23.6345, -102.5528];
const DEFAULT_ZOOM = 5;

let chatHistory = [
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

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getBranchIdFromVacancy(vacancy = {}) {
  if (vacancy.branchId) return vacancy.branchId;
  if (vacancy.sucursalId) return vacancy.sucursalId;

  return slugify(
    [
      vacancy.grupo,
      vacancy.sucursal,
      vacancy.ciudad,
      vacancy.estado,
      vacancy.pais
    ].filter(Boolean).join("-")
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
  ].filter(Boolean).join(", ");
}

function buildGoogleMapsUrl(branch = {}) {
  if (branch.googleMapsUrl) return branch.googleMapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildMapQuery(branch))}`;
}

function buildAppleMapsUrl(branch = {}) {
  if (branch.appleMapsUrl) return branch.appleMapsUrl;
  return `https://maps.apple.com/?q=${encodeURIComponent(buildMapQuery(branch))}`;
}

function hasValidCoords(branch = {}) {
  const lat = Number(branch.lat);
  const lng = Number(branch.lng);

  return Number.isFinite(lat) && Number.isFinite(lng);
}

function getBranchLatLng(branch = {}) {
  return [Number(branch.lat), Number(branch.lng)];
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
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
      direccion: vacancy.direccion || "",
      googleMapsUrl: vacancy.googleMapsUrl || "",
      appleMapsUrl: vacancy.appleMapsUrl || "",
      numeroTienda: vacancy.numeroTienda || "",
      lat: vacancy.lat || "",
      lng: vacancy.lng || ""
    });
  });

  return Array.from(byBranch.values());
}

function activateListeningState() {
  if (chatbotToggle) chatbotToggle.classList.add("is-listening");
}

function deactivateListeningState() {
  if (chatbotToggle) chatbotToggle.classList.remove("is-listening");
}

function openChat() {
  if (!box) return;
  box.classList.remove("hidden");
  activateListeningState();
  if (input) input.focus();
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
            const section = document.getElementById("postulate-sucursal");
            if (section) section.scrollIntoView({ behavior: "smooth" });
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
    "Perfecto. Adjunta tu CV en formato PDF y analizaré automáticamente tu experiencia, habilidades y perfil profesional."
  );
}

function resetChatHistory() {
  chatHistory = [];
  renderMessages();
}

function startVacancyApplication(vacancyId) {
  const vacancy = vacancies.find((item) => item.id === vacancyId);
  const branch = branches.find((item) => item.id === getBranchIdFromVacancy(vacancy || {}));

  if (!vacancy || !branch) return;

  applicationFlow.active = true;
  applicationFlow.mode = "branch_vacancy_application";
  applicationFlow.cvFile = null;
  applicationFlow.selectedVacancy = vacancy;
  applicationFlow.selectedBranch = branch;

  resetChatHistory();
  openChat();

  addAssistantText(
    `Excelente. Iniciaremos tu postulación para:\n\n${vacancy.titulo}\n${branch.nombre}\n${branch.direccion || ""}\n\nAdjunta tu CV en PDF o imagen para continuar.`
  );

  if (input) {
    input.placeholder = "Escribe tu nombre, teléfono o dudas...";
  }

  if (chatCvFile) {
    chatCvFile.setAttribute("accept", ".pdf,.jpg,.jpeg,.png,application/pdf,image/*");
  }

  if (attachCvBtn) {
    attachCvBtn.textContent = "Adjuntar CV";
  }
}

async function processCvAnalysisOnly() {
  if (!applicationFlow.cvFile) {
    addAssistantText("Primero debes adjuntar tu CV en formato PDF.");
    return;
  }

  const vacancy = applicationFlow.selectedVacancy;
  const branch = applicationFlow.selectedBranch;

  addAssistantText("Analizando CV y preparando tu postulación...");

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

    addAssistantText(`Análisis completado.\n\nResumen detectado:\n${candidateProfile.resumenIA}`);

    if (vacancy && branch) {
      addAssistantText(
        `Tu CV quedó ligado a la vacante ${vacancy.titulo} en ${branch.nombre}.`
      );
      return;
    }

    addAssistantText("Puedes revisar las vacantes disponibles en el mapa de sucursales.");
  } catch (error) {
    console.error(error);
    addAssistantText(`${error.message}`);
  }
}

async function fetchJsonOrFallback(url, fallback) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Sin datos");
    const data = await response.json();
    return Array.isArray(data) ? data : fallback;
  } catch (error) {
    console.error("Error cargando:", url, error);
    return fallback;
  }
}

async function cargarBranchData() {
  vacancies = (await fetchJsonOrFallback(`${API_URL}/api/vacantes`, [])).map(normalizeVacancy);
  branches = await fetchJsonOrFallback(`${API_URL}/api/sucursales`, []);

  if (!branches.length) {
    branches = buildBranchesFromVacancies(vacancies);
  }

  branches = branches.map((branch) => ({
    ...branch,
    id: branch.id || slugify(`${branch.marca || branch.grupo} ${branch.sucursal || branch.nombre} ${branch.ciudad}`),
    nombre: branch.nombre || branch.sucursal || `${branch.marca || "Sucursal"} ${branch.ciudad || ""}`.trim(),
    marca: branch.marca || branch.grupo || "GA Hospitality",
    googleMapsUrl: branch.googleMapsUrl || buildGoogleMapsUrl(branch),
    appleMapsUrl: branch.appleMapsUrl || buildAppleMapsUrl(branch)
  }));

  const brands = Array.from(new Set(branches.map((branch) => branch.marca).filter(Boolean))).sort();

  if (branchBrandFilter) {
    branchBrandFilter.innerHTML = `<option value="">Todas</option>`;

    brands.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand;
      option.textContent = brand;
      branchBrandFilter.appendChild(option);
    });
  }

  selectedBranchId = "";
  initMap();
  renderBranches();
}

function initMap() {
  if (!realBranchMap || !window.L) return;

  if (map) {
    map.remove();
    map = null;
  }

  map = L.map("realBranchMap", {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  branchLayer = L.layerGroup().addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 250);
}

function createBranchIcon(isActive) {
  const activeClass = isActive ? " is-active" : "";

  return L.divIcon({
    className: "",
    html: `<div class="branch-pin${activeClass}"><span>GA</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
  });
}

function createUserIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="user-location-marker"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function renderMapMarkers(filteredBranches, ajustarVista = true) {
  if (!map || !branchLayer) return;

  branchLayer.clearLayers();

  const bounds = [];

  filteredBranches.forEach((branch) => {
    if (!hasValidCoords(branch)) return;

    const latLng = getBranchLatLng(branch);
    bounds.push(latLng);

    const marker = L.marker(latLng, {
      icon: createBranchIcon(branch.id === selectedBranchId, branch)
    });

    marker.bindPopup(`
      <div class="map-popup">
        <strong>${escapeHtml(branch.nombre)}</strong>
        <span>${escapeHtml(branch.marca || "")}</span>
        <span>${escapeHtml(branch.direccion || "")}</span>
        <button type="button" data-map-branch="${escapeHtml(branch.id)}">Ver vacantes</button>
      </div>
    `);

    marker.on("click", () => {
      selectBranch(branch.id, false);
    });

    marker.addTo(branchLayer);
  });

  map.on("popupopen", () => {
    document.querySelectorAll("[data-map-branch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectBranch(btn.dataset.mapBranch, true);
      });
    });
  });

  if (bounds.length && ajustarVista) {
  map.fitBounds(bounds, {
    padding: [35, 35],
    maxZoom: 13
  });
}
}

function getFilteredBranches() {
  const search = normalizeText(branchSearch ? branchSearch.value : "");
  const brand = branchBrandFilter ? branchBrandFilter.value : "";

  let list = branches.filter((branch) => {
    const matchesBrand = !brand || branch.marca === brand;
    const haystack = normalizeText(
      `${branch.nombre} ${branch.marca} ${branch.ciudad} ${branch.estado} ${branch.direccion} ${branch.numeroTienda || ""}`
    );

    return matchesBrand && (!search || haystack.includes(search));
  });

  if (userLocation) {
    list = list.map((branch) => {
      if (!hasValidCoords(branch)) return { ...branch, distanceKm: null };

      const distanceKm = getDistanceKm(
        userLocation.lat,
        userLocation.lng,
        Number(branch.lat),
        Number(branch.lng)
      );

      return { ...branch, distanceKm };
    });

    list.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return list;
}

function renderBranches() {
  if (!branchList) return;

  const filteredBranches = getFilteredBranches();
  branchList.innerHTML = "";

  filteredBranches.forEach((branch) => {
    const jobsCount = getBranchVacancies(branch.id).length;
    const item = document.createElement("button");
    item.type = "button";
    item.className = `branch-item ${branch.id === selectedBranchId ? "is-active" : ""}`;

    let distanceHtml = "";

    if (branch.distanceKm !== null && branch.distanceKm !== undefined) {
      distanceHtml = `<span class="branch-distance">${branch.distanceKm.toFixed(1)} km aprox.</span>`;
    }

    item.innerHTML = `
      <strong>${escapeHtml(branch.nombre)}</strong>
      <span>${escapeHtml(branch.marca || "")} - ${escapeHtml(branch.ciudad || "")}, ${escapeHtml(branch.estado || "")}</span>
      <span>${escapeHtml(branch.direccion || "Dirección no registrada")}</span>
      <span>${jobsCount} vacante(s) disponible(s)</span>
      ${distanceHtml}
    `;

    item.addEventListener("click", () => selectBranch(branch.id, true));
    branchList.appendChild(item);
  });

  if (!filteredBranches.some((branch) => branch.id === selectedBranchId)) {
    selectedBranchId = "";
  }

  renderMapMarkers(filteredBranches);
  renderSelectedBranch();
}

function renderBranchListOnly() {
  if (!branchList) return;

  const filteredBranches = getFilteredBranches();
  branchList.innerHTML = "";

  filteredBranches.forEach((branch) => {
    const jobsCount = getBranchVacancies(branch.id).length;
    const item = document.createElement("button");
    item.type = "button";
    item.className = `branch-item ${branch.id === selectedBranchId ? "is-active" : ""}`;

    let distanceHtml = "";

    if (branch.distanceKm !== null && branch.distanceKm !== undefined) {
      distanceHtml = `<span class="branch-distance">${branch.distanceKm.toFixed(1)} km aprox.</span>`;
    }

    item.innerHTML = `
      <strong>${escapeHtml(branch.nombre)}</strong>
      <span>${escapeHtml(branch.marca || "")} - ${escapeHtml(branch.ciudad || "")}, ${escapeHtml(branch.estado || "")}</span>
      <span>${escapeHtml(branch.direccion || "Dirección no registrada")}</span>
      <span>${jobsCount} vacante(s) disponible(s)</span>
      ${distanceHtml}
    `;

    item.addEventListener("click", () => selectBranch(branch.id, true));
    branchList.appendChild(item);
  });

  renderMapMarkers(filteredBranches, false);
}


function selectBranch(branchId, moveMap = true) {
  selectedBranchId = branchId;

  const branch = branches.find((item) => item.id === branchId);

  if (branch && map && hasValidCoords(branch) && moveMap) {
    map.setView(getBranchLatLng(branch), 14);
  }

  renderBranchListOnly();
  renderSelectedBranch();

  if (vacancyBoard) {
    vacancyBoard.classList.remove("hidden");
  }

  if (selectedBranchMapLink) selectedBranchMapLink.classList.remove("hidden");
  if (selectedBranchAppleMapLink) selectedBranchAppleMapLink.classList.remove("hidden");
}

function closeBranchVacancies() {
  selectedBranchId = "";

  if (vacancyBoard) vacancyBoard.classList.add("hidden");
  if (selectedBranchMapLink) selectedBranchMapLink.classList.add("hidden");
  if (selectedBranchAppleMapLink) selectedBranchAppleMapLink.classList.add("hidden");

  renderBranchListOnly();
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

  if (selectedBranchName) selectedBranchName.textContent = branch.nombre;

  if (selectedBranchAddress) {
    selectedBranchAddress.textContent = [branch.direccion, branch.ciudad, branch.estado]
      .filter(Boolean)
      .join(" - ");
  }

  if (selectedBranchMapLink) selectedBranchMapLink.href = buildGoogleMapsUrl(branch);
  if (selectedBranchAppleMapLink) selectedBranchAppleMapLink.href = buildAppleMapsUrl(branch);

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

    let descripcion = "Vacante disponible en esta sucursal.";

    if (vacancy.descripcion) {
      descripcion = vacancy.descripcion;
    } else if (Array.isArray(vacancy.requisitos)) {
      descripcion = vacancy.requisitos.join(", ");
    }

    card.innerHTML = `
      <div class="vacancy-meta">
        <span>${escapeHtml(vacancy.tipoVacante || "operativa")}</span>
        <span>${escapeHtml(vacancy.area || vacancy.horario || "Área por definir")}</span>
      </div>
      <h4>${escapeHtml(vacancy.titulo || "Vacante")}</h4>
      <p>${escapeHtml(descripcion)}</p>
      <p><strong>${escapeHtml(vacancy.grupo || vacancy.sueldo || "GA Hospitality")}</strong></p>
      <button class="btn btn--primary" type="button" data-apply="${escapeHtml(vacancy.id)}">
        Aplicar
      </button>
    `;

    branchVacancies.appendChild(card);
  });

  branchVacancies.querySelectorAll("[data-apply]").forEach((button) => {
    button.addEventListener("click", () => startVacancyApplication(button.dataset.apply));
  });
}

function useMyLocation() {
  if (!navigator.geolocation) {
    addAssistantText("Tu navegador no permite geolocalización.");
    return;
  }

  if (useMyLocationBtn) {
    useMyLocationBtn.disabled = true;
    useMyLocationBtn.textContent = "Buscando ubicación...";
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      if (map) {
        if (userMarker) {
          userMarker.remove();
        }

        userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: createUserIcon()
        }).addTo(map);

        userMarker.bindPopup("Tu ubicación aproximada").openPopup();
        map.setView([userLocation.lat, userLocation.lng], 13);
      }

      renderBranches();

      if (useMyLocationBtn) {
        useMyLocationBtn.disabled = false;
        useMyLocationBtn.textContent = "Actualizar mi ubicación";
      }
    },
    () => {
      if (useMyLocationBtn) {
        useMyLocationBtn.disabled = false;
        useMyLocationBtn.textContent = "Usar mi ubicación";
      }

      addAssistantText("No fue posible obtener tu ubicación. Puedes buscar manualmente por ciudad, marca o dirección.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

async function cargarUbicaciones() {
  try {
    const res = await fetch(`${API_URL}/api/ubicaciones`);
    ubicaciones = await res.json();
  } catch (error) {
    ubicaciones = {
      Mexico: {
        Chihuahua: ["Ciudad Juarez", "Chihuahua"],
        Jalisco: ["Guadalajara"]
      },
      "Estados Unidos": {
        Texas: ["El Paso"]
      }
    };
  }
}

function llenarEstados() {
  if (!filtroPais || !filtroEstado || !filtroCiudad) return;

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
  if (!filtroPais || !filtroEstado || !filtroCiudad) return;

  const pais = filtroPais.value;
  const estado = filtroEstado.value;

  filtroCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !estado || !ubicaciones[pais] || !ubicaciones[pais][estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    filtroCiudad.appendChild(option);
  });
}

function buscarVacantes() {
  const params = new URLSearchParams({
    tipoVacante: filtroTipo ? filtroTipo.value || "" : "",
    pais: filtroPais ? filtroPais.value || "" : "",
    estado: filtroEstado ? filtroEstado.value || "" : "",
    ciudad: filtroCiudad ? filtroCiudad.value || "" : ""
  });

  window.location.href = `vacantes.html?${params.toString()}`;
}

async function consultarEstatus() {
  if (!folioConsulta || !consultaStatusResultado) return;

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

if (toggle) toggle.addEventListener("click", openChat);
if (closeBtn) closeBtn.addEventListener("click", closeChat);
if (startApplicationBtn) startApplicationBtn.addEventListener("click", startCvAnalysisFlow);
if (buscarVacantesBtn) buscarVacantesBtn.addEventListener("click", buscarVacantes);
if (filtroPais) filtroPais.addEventListener("change", llenarEstados);
if (filtroEstado) filtroEstado.addEventListener("change", llenarCiudades);
if (consultarStatusBtn) consultarStatusBtn.addEventListener("click", consultarEstatus);
if (branchSearch) branchSearch.addEventListener("input", renderBranches);
if (branchBrandFilter) branchBrandFilter.addEventListener("change", renderBranches);
if (closeBranchVacanciesBtn) closeBranchVacanciesBtn.addEventListener("click", closeBranchVacancies);
if (useMyLocationBtn) useMyLocationBtn.addEventListener("click", useMyLocation);

if (attachCvBtn && chatCvFile) {
  attachCvBtn.addEventListener("click", () => {
    openChat();

    if (!applicationFlow.active) {
      startCvAnalysisFlow();
    }

    chatCvFile.click();
  });

  chatCvFile.addEventListener("change", async () => {
    const file = chatCvFile.files && chatCvFile.files[0];

    if (!file) return;

   const name = file.name.toLowerCase();

const isValidFile =
  file.type === "application/pdf" ||
  file.type.startsWith("image/") ||
  name.endsWith(".pdf") ||
  name.endsWith(".jpg") ||
  name.endsWith(".jpeg") ||
  name.endsWith(".png");

if (!isValidFile) {
  addAssistantText("Solo se permiten archivos PDF o imágenes JPG/PNG.");
  return;
}

    applicationFlow.cvFile = file;
    addAssistantText(`CV cargado correctamente:\n${file.name}`);
    await processCvAnalysisOnly();
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    addUserText(text);
    input.value = "";

    if (applicationFlow.mode === "branch_vacancy_application") {
      addAssistantText(
        "Gracias. El siguiente paso será completar el formulario de postulación con tus datos y adjuntar tu CV."
      );
      return;
    }

    addAssistantText("Estoy procesando tu mensaje...");
  });
}

async function init() {
  renderMessages();
  await Promise.all([cargarUbicaciones(), cargarBranchData()]);
}

function getBrandShortName(branch = {}) {
  const brand = normalizeText(branch.marca || branch.grupo || "");

  if (brand.includes("wendy")) return "W";
  if (brand.includes("applebee")) return "A";
  if (brand.includes("little")) return "LC";
  if (brand.includes("great")) return "GA";
  if (brand.includes("ardeo")) return "AR";
  if (brand.includes("yoko")) return "YK";

  return "GA";
}

function createBranchIcon(isActive, branch = {}) {
  const activeClass = isActive ? " is-active" : "";
  const brandShort = getBrandShortName(branch);

  return L.divIcon({
    className: "",
    html: `<div class="branch-pin${activeClass}"><span>${brandShort}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
  });
}


init();