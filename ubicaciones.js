/* =========================
   CONFIG API
========================= */

const API_URL = "https://chatbot-reclutamiento-cl32.onrender.com";

/* =========================
   ELEMENTOS
========================= */

const branchList = document.getElementById("branchList");

const branchSearch = document.getElementById("branchSearch");

const branchBrandFilter = document.getElementById("branchBrandFilter");

const branchCountryFilter = document.getElementById("branchCountryFilter");

const branchStateFilter = document.getElementById("branchStateFilter");

const branchCityFilter = document.getElementById("branchCityFilter");

const useMyLocationBtn = document.getElementById("useMyLocationBtn");

const findNearestBtn = document.getElementById("findNearestBtn");

const vacancyBoard = document.getElementById("vacancyBoard");

const branchVacancies = document.getElementById("branchVacancies");

const selectedBranchName = document.getElementById("selectedBranchName");

const selectedBranchAddress = document.getElementById("selectedBranchAddress");

const closeBranchVacanciesBtn = document.getElementById("closeBranchVacanciesBtn");

const selectedBranchMapLink = document.getElementById("selectedBranchMapLink");

const selectedBranchAppleMapLink = document.getElementById("selectedBranchAppleMapLink");

/* =========================
   DATA
========================= */

let branches = [];

let vacancies = [];

let selectedBranchId = "";

let userLocation = null;

let map;

let markersLayer;

/* =========================
   HELPERS
========================= */

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hasValidCoords(branch = {}) {
  return (
    typeof branch.lat === "number" &&
    typeof branch.lng === "number" &&
    !Number.isNaN(branch.lat) &&
    !Number.isNaN(branch.lng)
  );
}

function getBranchLatLng(branch = {}) {
  return [branch.lat, branch.lng];
}

function getBranchVacancies(branchId) {
  return vacancies.filter((vacancy) => {
    return (
      vacancy.sucursalId === branchId ||
      vacancy.branchId === branchId
    );
  });
}

function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;

  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* =========================
   MAPA
========================= */

function initMap() {
  map = L.map("realBranchMap", {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([23.6345, -102.5528], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

function getBrandShortName(branch = {}) {
  const brand = normalizarTexto(branch.marca || branch.grupo || "");

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
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34]
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

function renderMarkers(list, adjustView = true) {
  if (!markersLayer || !map) return;

  markersLayer.clearLayers();

  const bounds = [];

  list.forEach((branch) => {
    if (!hasValidCoords(branch)) return;

    const latLng = getBranchLatLng(branch);
    bounds.push(latLng);

    const marker = L.marker(latLng, {
      icon: createBranchIcon(branch.id === selectedBranchId, branch)
    });

    marker.bindPopup(`
      <div class="map-popup">
        <strong>${escapeHtml(branch.nombre || branch.sucursal || "Sucursal")}</strong>
        <span>${escapeHtml(branch.marca || "")}</span>
        <span>${escapeHtml(branch.direccion || "")}</span>
        <button type="button" data-branch-popup="${escapeHtml(branch.id)}">
          Ver vacantes
        </button>
      </div>
    `);

    marker.on("click", () => {
      selectBranch(branch.id, false);
    });

    marker.addTo(markersLayer);
  });

  map.on("popupopen", () => {
    document.querySelectorAll("[data-branch-popup]").forEach((button) => {
      button.addEventListener("click", () => {
        selectBranch(button.dataset.branchPopup, true);
      });
    });
  });

  if (bounds.length && adjustView) {
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 13
    });
  }
}

/* =========================
   FILTROS
========================= */

function populateFilters() {
  const brands = [...new Set(branches.map((b) => b.marca).filter(Boolean))].sort();
  const countries = [...new Set(branches.map((b) => b.pais).filter(Boolean))].sort();

  branchBrandFilter.innerHTML = `<option value="">Todas</option>`;
  branchCountryFilter.innerHTML = `<option value="">Todos</option>`;

  brands.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    branchBrandFilter.appendChild(option);
  });

  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    branchCountryFilter.appendChild(option);
  });

  populateStateFilter();
  populateCityFilter();
}

function populateStateFilter() {
  const country = branchCountryFilter.value;

  let filtered = branches;

  if (country) {
    filtered = filtered.filter((branch) => branch.pais === country);
  }

  const states = [...new Set(filtered.map((b) => b.estado).filter(Boolean))].sort();

  branchStateFilter.innerHTML = `<option value="">Todos</option>`;

  states.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    branchStateFilter.appendChild(option);
  });
}

function populateCityFilter() {
  const country = branchCountryFilter.value;
  const state = branchStateFilter.value;

  let filtered = branches;

  if (country) {
    filtered = filtered.filter((branch) => branch.pais === country);
  }

  if (state) {
    filtered = filtered.filter((branch) => branch.estado === state);
  }

  const cities = [...new Set(filtered.map((b) => b.ciudad).filter(Boolean))].sort();

  branchCityFilter.innerHTML = `<option value="">Todas</option>`;

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    branchCityFilter.appendChild(option);
  });
}

function getFilteredBranches() {
  const search = normalizarTexto(branchSearch.value || "");
  const brand = branchBrandFilter.value || "";
  const country = branchCountryFilter.value || "";
  const state = branchStateFilter.value || "";
  const city = branchCityFilter.value || "";

  let list = branches.filter((branch) => {
    const haystack = normalizarTexto(
      `${branch.nombre || ""} ${branch.marca || ""} ${branch.sucursal || ""} ${branch.ciudad || ""} ${branch.estado || ""} ${branch.pais || ""} ${branch.direccion || ""} ${branch.numeroTienda || ""}`
    );

    return (
      (!brand || branch.marca === brand) &&
      (!country || branch.pais === country) &&
      (!state || branch.estado === state) &&
      (!city || branch.ciudad === city) &&
      (!search || haystack.includes(search))
    );
  });

  if (userLocation) {
    list = list.map((branch) => {
      if (!hasValidCoords(branch)) return { ...branch, distanceKm: null };

      const distanceKm = calcularDistanciaKm(
        userLocation.lat,
        userLocation.lng,
        branch.lat,
        branch.lng
      );

      return {
        ...branch,
        distanceKm
      };
    });

    list.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return list;
}

/* =========================
   RENDER LISTA
========================= */

function renderBranches(adjustMap = true) {
  const filtered = getFilteredBranches();

  branchList.innerHTML = "";

  if (!filtered.length) {
    branchList.innerHTML = `
      <div class="status">
        No encontramos sucursales con esos filtros.
      </div>
    `;

    renderMarkers([], false);
    return;
  }

  filtered.forEach((branch) => {
    const jobs = getBranchVacancies(branch.id);
    const item = document.createElement("button");
    item.type = "button";
    item.className = `branch-item ${branch.id === selectedBranchId ? "is-active" : ""}`;

    const distanceText =
      branch.distanceKm !== null && branch.distanceKm !== undefined
        ? `<span class="branch-distance">${branch.distanceKm.toFixed(1)} km aprox.</span>`
        : "";

    item.innerHTML = `
      <strong>${escapeHtml(branch.nombre || branch.sucursal || "Sucursal")}</strong>
      <span>${escapeHtml(branch.marca || "")} · ${escapeHtml(branch.ciudad || "")}, ${escapeHtml(branch.estado || "")}</span>
      <span>${escapeHtml(branch.direccion || "Dirección no registrada")}</span>
      <span>${jobs.length} vacante(s) disponible(s)</span>
      ${distanceText}
    `;

    item.addEventListener("click", () => selectBranch(branch.id, true));

    branchList.appendChild(item);
  });

  renderMarkers(filtered, adjustMap);
}

/* =========================
   VACANTES
========================= */

function buildGoogleMapsUrl(branch = {}) {
  if (branch.googleMapsUrl) return branch.googleMapsUrl;

  const query = [
    branch.direccion,
    branch.nombre,
    branch.sucursal,
    branch.ciudad,
    branch.estado,
    branch.pais
  ].filter(Boolean).join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildAppleMapsUrl(branch = {}) {
  if (branch.appleMapsUrl) return branch.appleMapsUrl;

  const query = [
    branch.direccion,
    branch.nombre,
    branch.sucursal,
    branch.ciudad,
    branch.estado,
    branch.pais
  ].filter(Boolean).join(", ");

  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function selectBranch(branchId, moveMap = true) {
  selectedBranchId = branchId;

  const branch = branches.find((item) => item.id === branchId);

  if (!branch) return;

  if (moveMap && hasValidCoords(branch)) {
    map.setView(getBranchLatLng(branch), 14);
  }

  renderBranches(false);
  renderSelectedBranch(branch);
}

function closeVacancyBoard() {
  selectedBranchId = "";

  vacancyBoard.classList.add("hidden");
  selectedBranchMapLink.classList.add("hidden");
  selectedBranchAppleMapLink.classList.add("hidden");

  renderBranches(false);
}

function renderSelectedBranch(branch) {
  const jobs = getBranchVacancies(branch.id);

  selectedBranchName.textContent = branch.nombre || branch.sucursal || "Sucursal";
  selectedBranchAddress.textContent = [branch.direccion, branch.ciudad, branch.estado]
    .filter(Boolean)
    .join(" · ");

  selectedBranchMapLink.href = buildGoogleMapsUrl(branch);
  selectedBranchAppleMapLink.href = buildAppleMapsUrl(branch);

  selectedBranchMapLink.classList.remove("hidden");
  selectedBranchAppleMapLink.classList.remove("hidden");

  branchVacancies.innerHTML = "";

  if (!jobs.length) {
    branchVacancies.innerHTML = `
      <div class="status">
        Esta sucursal no tiene vacantes activas por ahora.
      </div>
    `;

    vacancyBoard.classList.remove("hidden");
    return;
  }

  jobs.forEach((vacancy) => {
    const card = document.createElement("article");
    card.className = "vacancy-card";

    const descripcion = Array.isArray(vacancy.requisitos)
      ? vacancy.requisitos.join(", ")
      : vacancy.descripcion || "Vacante disponible en esta sucursal.";

    card.innerHTML = `
      <div class="vacancy-meta">
        <span>${escapeHtml(vacancy.tipoVacante || "operativa")}</span>
        <span>${escapeHtml(vacancy.area || "Área por definir")}</span>
      </div>

      <h4>${escapeHtml(vacancy.titulo || "Vacante")}</h4>

      <p>${escapeHtml(descripcion)}</p>

      <p>
        <strong>${escapeHtml(vacancy.grupo || branch.marca || "GA Hospitality")}</strong>
      </p>

      <a class="btn btn--primary" href="index.html#chatbot-toggle">
        Aplicar
      </a>
    `;

    branchVacancies.appendChild(card);
  });

  vacancyBoard.classList.remove("hidden");
}
/* =========================
   GPS / UBICACIÓN
========================= */

function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Tu navegador no permite geolocalización.");
    return;
  }

  useMyLocationBtn.disabled = true;
  useMyLocationBtn.textContent = "Buscando ubicación...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserIcon()
      })
        .addTo(map)
        .bindPopup("Tu ubicación aproximada")
        .openPopup();

      map.setView([userLocation.lat, userLocation.lng], 13);

      useMyLocationBtn.disabled = false;
      useMyLocationBtn.textContent = "Actualizar mi ubicación";

      renderBranches(false);
    },
    () => {
      useMyLocationBtn.disabled = false;
      useMyLocationBtn.textContent = "Usar mi ubicación";

      alert("No fue posible obtener tu ubicación.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

function findNearestBranch() {
  if (!userLocation) {
    useMyLocation();
    return;
  }

  const validBranches = branches
    .filter(hasValidCoords)
    .map((branch) => ({
      ...branch,
      distanceKm: calcularDistanciaKm(
        userLocation.lat,
        userLocation.lng,
        branch.lat,
        branch.lng
      )
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (!validBranches.length) {
    alert("No hay sucursales con coordenadas disponibles.");
    return;
  }

  const nearest = validBranches[0];

  selectBranch(nearest.id, true);
}

/* =========================
   DATA API
========================= */

async function fetchJson(url, fallback = []) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    return Array.isArray(data) ? data : fallback;
  } catch (error) {
    console.error("Error cargando datos:", error);
    return fallback;
  }
}

async function loadData() {
  vacancies = await fetchJson(`${API_URL}/api/vacantes`, []);
  branches = await fetchJson(`${API_URL}/api/sucursales`, []);

  branches = branches
    .map((branch) => ({
      ...branch,
      lat: Number(branch.lat),
      lng: Number(branch.lng)
    }))
    .filter((branch) => branch.id);

  populateFilters();
  renderBranches(true);
}

/* =========================
   EVENTOS
========================= */

if (branchSearch) {
  branchSearch.addEventListener("input", () => {
    renderBranches(true);
  });
}

if (branchBrandFilter) {
  branchBrandFilter.addEventListener("change", () => {
    renderBranches(true);
  });
}

if (branchCountryFilter) {
  branchCountryFilter.addEventListener("change", () => {
    populateStateFilter();
    populateCityFilter();
    renderBranches(true);
  });
}

if (branchStateFilter) {
  branchStateFilter.addEventListener("change", () => {
    populateCityFilter();
    renderBranches(true);
  });
}

if (branchCityFilter) {
  branchCityFilter.addEventListener("change", () => {
    renderBranches(true);
  });
}

if (useMyLocationBtn) {
  useMyLocationBtn.addEventListener("click", useMyLocation);
}

if (findNearestBtn) {
  findNearestBtn.addEventListener("click", findNearestBranch);
}

if (closeBranchVacanciesBtn) {
  closeBranchVacanciesBtn.addEventListener("click", closeVacancyBoard);
}

/* =========================
   INIT
========================= */

async function init() {
  initMap();
  await loadData();

  setTimeout(() => {
    map.invalidateSize();
  }, 250);
}

init();

