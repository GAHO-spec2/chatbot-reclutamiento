const API_URL = "https://chatbot-reclutamiento-dcqb.onrender.com";

const vacantesResultados = document.getElementById("vacantesResultados");
const vacantesStatus = document.getElementById("vacantesStatus");
const vacantesResumenFiltros = document.getElementById("vacantesResumenFiltros");

const CACHE_TIME_MS = 5 * 60 * 1000;

const BRAND_IMAGES = {
  "applebee's": "/img/Applebees.png",
  "ardeo": "/img/ardeo.png",
  "ga hospitality": "/img/gaho.png",
  "great american": "/img/greatamerican.png",
  "little caesars": "/img/littlecaesars.jpg",
  "wendy's": "/img/wendys.png",
  "yoko": "/img/yoko.png"
};

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b(cd|cd\.|ciudad)\b/g, "ciudad")
    .replace(/\s+/g, " ")
    .trim();
}

function getBrandImage(grupo = "", tipoVacante = "") {
  const normalizedGrupo = normalizeText(grupo);
  const normalizedTipo = normalizeText(tipoVacante);

  if (normalizedTipo === "administrativa") return BRAND_IMAGES["ga hospitality"];
  if (normalizedGrupo.includes("applebee")) return BRAND_IMAGES["applebee's"];
  if (normalizedGrupo.includes("ardeo")) return BRAND_IMAGES["ardeo"];
  if (normalizedGrupo.includes("great american")) return BRAND_IMAGES["great american"];
  if (normalizedGrupo.includes("little caesar")) return BRAND_IMAGES["little caesars"];
  if (normalizedGrupo.includes("wendy")) return BRAND_IMAGES["wendy's"];
  if (normalizedGrupo.includes("yoko")) return BRAND_IMAGES["yoko"];

  return BRAND_IMAGES["ga hospitality"];
}

function getSearchParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    tipoVacante: params.get("tipoVacante") || "",
    pais: params.get("pais") || "",
    estado: params.get("estado") || "",
    ciudad: params.get("ciudad") || ""
  };
}

function buildApiParams(filters) {
  const params = new URLSearchParams();

  if (filters.tipoVacante) params.set("tipoVacante", filters.tipoVacante);
  if (filters.pais) params.set("pais", filters.pais);
  if (filters.estado) params.set("estado", filters.estado);
  if (filters.ciudad) params.set("ciudad", filters.ciudad);

  return params;
}

function buildSummaryText(filters) {
  const parts = [];

  if (filters.tipoVacante) parts.push(`Tipo: ${filters.tipoVacante}`);
  if (filters.pais) parts.push(`País: ${filters.pais}`);
  if (filters.estado) parts.push(`Estado: ${filters.estado}`);
  if (filters.ciudad) parts.push(`Ciudad: ${filters.ciudad}`);

  return parts.length
    ? `Filtros aplicados: ${parts.join(" | ")}`
    : "Mostrando todas las vacantes disponibles.";
}

function setStatus(message, show = true) {
  if (!vacantesStatus) return;
  vacantesStatus.textContent = message;
  vacantesStatus.classList.toggle("hidden", !show);
}

function getCacheKey(params) {
  return `vacantes_cache_${params.toString() || "all"}`;
}

function getCachedVacantes(cacheKey) {
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const isFresh = Date.now() - parsed.timestamp < CACHE_TIME_MS;

    if (!isFresh) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedVacantes(cacheKey, data) {
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        data
      })
    );
  } catch {
    // Si el navegador no permite sessionStorage, no detenemos el flujo.
  }
}

function renderVacantes(vacantes = []) {
  if (!vacantesResultados) return;

  vacantesResultados.innerHTML = "";

  if (!Array.isArray(vacantes) || !vacantes.length) {
    vacantesResultados.innerHTML = `
      <div class="status">
        No se encontraron vacantes con esos filtros.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  vacantes.forEach((vacante) => {
    const brandImage = getBrandImage(vacante.grupo, vacante.tipoVacante);
    const requisitos = Array.isArray(vacante.requisitos)
      ? vacante.requisitos.slice(0, 4)
      : [];

    const card = document.createElement("article");
    card.className = "vacante-card";

    card.innerHTML = `
      <div class="vacante-card__brand">
        <img
          src="${brandImage}"
          alt="${vacante.grupo || "GA Hospitality"}"
          class="vacante-card__brand-img"
          loading="lazy"
          onerror="this.src='/img/gaho.png'"
        />
      </div>

      <div class="vacante-card__body">
        <h3>${vacante.titulo || "Vacante disponible"}</h3>

        <p><strong>Tipo:</strong> ${vacante.tipoVacante || "-"}</p>
        <p><strong>Grupo:</strong> ${vacante.grupo || "-"}</p>
        <p><strong>Área:</strong> ${vacante.area || "-"}</p>
        <p><strong>Ubicación:</strong> ${vacante.pais || "-"} / ${vacante.estado || "-"} / ${vacante.ciudad || "-"}</p>
        <p><strong>Sucursal:</strong> ${vacante.sucursal || "-"}</p>

        <div class="tags">
          ${requisitos.map((req) => `<span>${req}</span>`).join("")}
        </div>

        <button class="btn btn--secondary vacante-interest-btn" data-id="${vacante.id}">
          Me interesa
        </button>
      </div>
    `;

    fragment.appendChild(card);
  });

  vacantesResultados.appendChild(fragment);

  document.querySelectorAll(".vacante-interest-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const vacanteId = btn.dataset.id;

      if (!vacanteId) {
        alert("No se pudo identificar la vacante.");
        return;
      }

      window.location.href = `/index.html?interes=${encodeURIComponent(vacanteId)}`;
    });
  });
}

async function cargarVacantesFiltradas() {
  const filters = getSearchParams();
  const params = buildApiParams(filters);
  const cacheKey = getCacheKey(params);

  if (vacantesResumenFiltros) {
    vacantesResumenFiltros.textContent = buildSummaryText(filters);
  }

  const cachedData = getCachedVacantes(cacheKey);

  if (cachedData) {
    renderVacantes(cachedData);
    setStatus("", false);
    return;
  }

  try {
    setStatus("Cargando vacantes...");

    const response = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible cargar las vacantes.");
    }

    const vacantes = Array.isArray(data) ? data : [];

    setCachedVacantes(cacheKey, vacantes);
    renderVacantes(vacantes);
    setStatus("", false);
  } catch (error) {
    console.error("Error cargando vacantes:", error);
    setStatus(`⚠️ ${error.message}`);
  }
}

cargarVacantesFiltradas();


