const API_URL = window.location.origin;

const vacantesResultados = document.getElementById("vacantesResultados");
const vacantesStatus = document.getElementById("vacantesStatus");
const vacantesResumenFiltros = document.getElementById("vacantesResumenFiltros");

/* =========================
   IMÁGENES POR MARCA
========================= */
const BRAND_IMAGES = {
  "applebee's": "/img/Applebees.png",
  "ardeo": "/img/ardeo.png",
  "ga hospitality": "/img/gaho.png",
  "great american": "/img/greatamerican.png",
  "little caesars": "/img/littlecaesars.jpg",
  "wendy's": "/img/wendys.png",
  "yoko": "/img/yoko.png"
};

/* =========================
   HELPERS
========================= */
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

  if (normalizedTipo === "administrativa") {
    return BRAND_IMAGES["ga hospitality"];
  }

  if (normalizedGrupo.includes("applebee")) {
    return BRAND_IMAGES["applebee's"];
  }

  if (normalizedGrupo.includes("ardeo")) {
    return BRAND_IMAGES["ardeo"];
  }

  if (normalizedGrupo.includes("great american")) {
    return BRAND_IMAGES["great american"];
  }

  if (normalizedGrupo.includes("little caesar")) {
    return BRAND_IMAGES["little caesars"];
  }

  if (normalizedGrupo.includes("wendy")) {
    return BRAND_IMAGES["wendy's"];
  }

  if (normalizedGrupo.includes("yoko")) {
    return BRAND_IMAGES["yoko"];
  }

  if (normalizedGrupo.includes("ga hospitality")) {
    return BRAND_IMAGES["ga hospitality"];
  }

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

function buildSummaryText(filters) {
  const parts = [];

  if (filters.tipoVacante) {
    parts.push(`Tipo: ${filters.tipoVacante}`);
  }

  if (filters.pais) {
    parts.push(`País: ${filters.pais}`);
  }

  if (filters.estado) {
    parts.push(`Estado: ${filters.estado}`);
  }

  if (filters.ciudad) {
    parts.push(`Ciudad: ${filters.ciudad}`);
  }

  if (!parts.length) {
    return "Mostrando todas las vacantes disponibles.";
  }

  return `Filtros aplicados: ${parts.join(" | ")}`;
}

function setStatus(message, show = true) {
  if (!vacantesStatus) return;

  vacantesStatus.textContent = message;
  vacantesStatus.classList.toggle("hidden", !show);
}

/* =========================
   RENDER VACANTES
========================= */
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

  vacantes.forEach((vacante) => {
    const brandImage = getBrandImage(vacante.grupo, vacante.tipoVacante);

    const card = document.createElement("article");
    card.className = "vacante-card";

    card.innerHTML = `
      <div class="vacante-card__brand">
        <img
          src="${brandImage}"
          alt="${vacante.grupo || "GA Hospitality"}"
          class="vacante-card__brand-img"
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
          ${
            Array.isArray(vacante.requisitos)
              ? vacante.requisitos.map((req) => `<span>${req}</span>`).join("")
              : ""
          }
        </div>

        <button class="btn btn--secondary vacante-interest-btn" data-id="${vacante.id}">
          Me interesa
        </button>
      </div>
    `;

    vacantesResultados.appendChild(card);
  });

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

/* =========================
   CARGAR VACANTES FILTRADAS
========================= */
async function cargarVacantesFiltradas() {
  const filters = getSearchParams();

  if (vacantesResumenFiltros) {
    vacantesResumenFiltros.textContent = buildSummaryText(filters);
  }

  try {
    setStatus("Cargando vacantes...");

    const params = new URLSearchParams();

    if (filters.tipoVacante) {
      params.set("tipoVacante", filters.tipoVacante);
    }

    if (filters.pais) {
      params.set("pais", filters.pais);
    }

    if (filters.estado) {
      params.set("estado", filters.estado);
    }

    if (filters.ciudad) {
      params.set("ciudad", filters.ciudad);
    }

    const response = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible cargar las vacantes.");
    }

    renderVacantes(Array.isArray(data) ? data : []);
    setStatus("", false);
  } catch (error) {
    console.error("Error cargando vacantes:", error);
    setStatus(`⚠️ ${error.message}`);
  }
}

/* =========================
   INIT
========================= */
cargarVacantesFiltradas();