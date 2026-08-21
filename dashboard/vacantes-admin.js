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

let auth = null;
let adminToken = "";

if (window.firebase) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  auth = firebase.auth();
}

/* =========================
   ELEMENTOS
========================= */
const vacantesAdminList = document.getElementById("vacantesAdminList");
const vacantesAdminStatus = document.getElementById("vacantesAdminStatus");
const refreshVacantesBtn = document.getElementById("refreshVacantesBtn");
const openVacanteModalBtn = document.getElementById("openVacanteModalBtn");

const adminFiltroTipo = document.getElementById("adminFiltroTipo");
const adminFiltroPais = document.getElementById("adminFiltroPais");
const adminFiltroEstado = document.getElementById("adminFiltroEstado");
const adminFiltroCiudad = document.getElementById("adminFiltroCiudad");

const vacanteModal = document.getElementById("vacanteModal");
const closeVacanteModalBtn = document.getElementById("closeVacanteModalBtn");
const closeVacanteBackdrop = document.getElementById("closeVacanteBackdrop");
const vacanteModalTitle = document.getElementById("vacanteModalTitle");
const saveVacanteBtn = document.getElementById("saveVacanteBtn");

const vacanteForm =
  document.getElementById(
    "vacanteForm"
  );

const vacanteValidationSummary =
  document.getElementById(
    "vacanteValidationSummary"
  );

const vacanteValidationSummaryText =
  document.getElementById(
    "vacanteValidationSummaryText"
  );

const vacanteIdEdit = document.getElementById("vacanteIdEdit");
const vacanteTipo = document.getElementById("vacanteTipo");
const vacanteGrupo = document.getElementById("vacanteGrupo");
const vacanteTituloInput = document.getElementById("vacanteTituloInput");
const vacanteArea = document.getElementById("vacanteArea");
const vacantePais = document.getElementById("vacantePais");
const vacanteEstado = document.getElementById("vacanteEstado");
const vacanteCiudad = document.getElementById("vacanteCiudad");
const vacanteSucursal = document.getElementById("vacanteSucursal");
const vacanteNumeroTienda = document.getElementById("vacanteNumeroTienda");
const vacanteDireccion = document.getElementById("vacanteDireccion");
const vacanteGoogleMapsUrl = document.getElementById("vacanteGoogleMapsUrl");
const vacanteAppleMapsUrl = document.getElementById("vacanteAppleMapsUrl");
const vacanteLat = document.getElementById("vacanteLat");
const vacanteLng = document.getElementById("vacanteLng");
const vacanteRequisitos = document.getElementById("vacanteRequisitos");
const vacanteCvPolicy =
  document.getElementById("vacanteCvPolicy");

const vacanteSolicitarTelefono =
  document.getElementById("vacanteSolicitarTelefono");

const vacanteSolicitarCorreo =
  document.getElementById("vacanteSolicitarCorreo");

const vacanteSolicitarExperiencia =
  document.getElementById("vacanteSolicitarExperiencia");

const vacanteSolicitarEscolaridad =
  document.getElementById("vacanteSolicitarEscolaridad");

const vacanteSolicitarDisponibilidad =
  document.getElementById("vacanteSolicitarDisponibilidad");

const addCustomQuestionBtn =
  document.getElementById("addCustomQuestionBtn");

const customQuestionsList =
  document.getElementById("customQuestionsList");

const customQuestionsEmpty =
  document.getElementById("customQuestionsEmpty");

const vacanteSolicitarCodigoPostal =
  document.getElementById(
    "vacanteSolicitarCodigoPostal"
  );

const vacanteSolicitarTransporte =
  document.getElementById(
    "vacanteSolicitarTransporte"
  );

const vacanteSolicitarVehiculoPropio =
  document.getElementById(
    "vacanteSolicitarVehiculoPropio"
  );

const vacanteSolicitarTiempoTraslado =
  document.getElementById(
    "vacanteSolicitarTiempoTraslado"
  );

/* =========================
   ELEMENTOS QR VACANTE
========================= */

const vacanteQrModal =
  document.getElementById("vacanteQrModal");

const closeVacanteQrModalBtn =
  document.getElementById(
    "closeVacanteQrModalBtn"
  );

const closeVacanteQrBackdrop =
  document.getElementById(
    "closeVacanteQrBackdrop"
  );

const qrVacanteTitulo =
  document.getElementById(
    "qrVacanteTitulo"
  );

const qrVacanteUbicacion =
  document.getElementById(
    "qrVacanteUbicacion"
  );

const qrVacanteStatus =
  document.getElementById(
    "qrVacanteStatus"
  );

const qrCodeContainer =
  document.getElementById(
    "qrCodeContainer"
  );

const qrVacanteUrl =
  document.getElementById(
    "qrVacanteUrl"
  );

const qrVacanteVisitas =
  document.getElementById(
    "qrVacanteVisitas"
  );

const qrVacantePostulaciones =
  document.getElementById(
    "qrVacantePostulaciones"
  );

const qrVacanteConversion =
  document.getElementById(
    "qrVacanteConversion"
  );

const copyQrVacanteUrlBtn =
  document.getElementById(
    "copyQrVacanteUrlBtn"
  );

const openQrVacanteUrlBtn =
  document.getElementById(
    "openQrVacanteUrlBtn"
  );

const downloadQrPngBtn =
  document.getElementById(
    "downloadQrPngBtn"
  );

const downloadQrSvgBtn =
  document.getElementById(
    "downloadQrSvgBtn"
  );

const toggleVacanteQrBtn =
  document.getElementById(
    "toggleVacanteQrBtn"
  );

let preguntasPersonalizadas = [];

let vacantes = [];
let ubicaciones = {};

let vacanteQrActual = null;

/* =========================
   HELPERS
========================= */
function setVacantesStatus(message, show = true) {
  if (!vacantesAdminStatus) return;

  vacantesAdminStatus.textContent = message;
  vacantesAdminStatus.classList.toggle("hidden", !show);
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    Authorization: `Bearer ${adminToken}`
  };
}

function normalizarUrl(url = "") {
  return String(url || "").trim();
}

function obtenerNumero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function escapeHtml(texto = "") {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function crearGoogleMapsUrlDesdeDatos(data = {}) {
  if (data.googleMapsUrl) return data.googleMapsUrl;

  const query = [
    data.direccion,
    data.sucursal,
    data.ciudad,
    data.estado,
    data.pais
  ].filter(Boolean).join(", ");

  if (!query) return "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function crearAppleMapsUrlDesdeDatos(data = {}) {
  if (data.appleMapsUrl) return data.appleMapsUrl;

  const query = [
    data.direccion,
    data.sucursal,
    data.ciudad,
    data.estado,
    data.pais
  ].filter(Boolean).join(", ");

  if (!query) return "";

  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

/* =========================
   UBICACIONES
========================= */
async function cargarUbicaciones() {
  try {
    const res = await fetch(`${API_URL}/api/ubicaciones`);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    ubicaciones = await res.json();
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
    ubicaciones = {};
  }
}

function llenarEstados(selectPais, targetEstado, targetCiudad) {
  if (!selectPais || !targetEstado || !targetCiudad) return;

  const pais = selectPais.value;

  targetEstado.innerHTML = `<option value="">Todos</option>`;
  targetCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais]).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    targetEstado.appendChild(option);
  });
}

function llenarCiudades(selectPais, selectEstado, targetCiudad) {
  if (!selectPais || !selectEstado || !targetCiudad) return;

  const pais = selectPais.value;
  const estado = selectEstado.value;

  targetCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    targetCiudad.appendChild(option);
  });
}

function llenarEstadosModal() {
  const pais = vacantePais.value;

  vacanteEstado.innerHTML = `<option value="">Selecciona</option>`;
  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais]).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    vacanteEstado.appendChild(option);
  });
}

function llenarCiudadesModal() {
  const pais = vacantePais.value;
  const estado = vacanteEstado.value;

  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    vacanteCiudad.appendChild(option);
  });
}

/* =========================
   CARGAR VACANTES
========================= */
async function cargarVacantesAdmin() {
  try {
    setVacantesStatus("Cargando vacantes...");

    const params = new URLSearchParams({
      tipoVacante: adminFiltroTipo?.value || "",
      pais: adminFiltroPais?.value || "",
      estado: adminFiltroEstado?.value || "",
      ciudad: adminFiltroCiudad?.value || ""
    });

    const res = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    vacantes = await res.json();
    renderVacantesAdmin();
    setVacantesStatus("", false);
  } catch (error) {
    console.error("Error cargando vacantes:", error);
    setVacantesStatus("⚠️ No fue posible cargar las vacantes.");
  }
}

/* =========================
   RENDER VACANTES
========================= */
function renderVacantesAdmin() {
  if (!vacantesAdminList) return;

  vacantesAdminList.innerHTML = "";

  if (!vacantes.length) {
    vacantesAdminList.innerHTML = `
      <div class="status">
        No hay vacantes registradas con esos filtros.
      </div>
    `;
    return;
  }

  vacantes.forEach((vacante) => {
    const googleUrl = vacante.googleMapsUrl || crearGoogleMapsUrlDesdeDatos(vacante);
    const appleUrl = vacante.appleMapsUrl || crearAppleMapsUrlDesdeDatos(vacante);

    let coordenadasTexto = "-";

    if (vacante.lat !== null && vacante.lat !== undefined && vacante.lng !== null && vacante.lng !== undefined) {
      coordenadasTexto = `${escapeHtml(vacante.lat)} , ${escapeHtml(vacante.lng)}`;
    }

    let requisitosTexto = "-";

    if (Array.isArray(vacante.requisitos)) {
      requisitosTexto = escapeHtml(vacante.requisitos.join(", "));
    }

    let googleBtnHtml = "";

    if (googleUrl) {
      googleBtnHtml = `<a class="btn btn--secondary" href="${escapeHtml(googleUrl)}" target="_blank" rel="noopener">Google Maps</a>`;
    }

    let appleBtnHtml = "";

    if (appleUrl) {
      appleBtnHtml = `<a class="btn btn--secondary" href="${escapeHtml(appleUrl)}" target="_blank" rel="noopener">Apple Maps</a>`;
    }

    const card = document.createElement("article");
    card.className = "dashboard-card";

    card.innerHTML = `
  <div class="vacancy-card__header">
    <div class="vacancy-card__heading">
      <span class="vacancy-card__eyebrow">
        ${escapeHtml(vacante.grupo || "GA Hospitality")}
      </span>

      <h3 class="vacancy-card__title">
        ${escapeHtml(vacante.titulo || "Sin título")}
      </h3>

      <p class="vacancy-card__area">
        ${escapeHtml(vacante.area || "Área no especificada")}
      </p>
    </div>

    <span class="vacancy-card__type">
      ${escapeHtml(vacante.tipoVacante || "Sin tipo")}
    </span>
  </div>

  <div class="vacancy-card__grid">
    <div class="vacancy-card__item">
      <span class="vacancy-card__label">
        📍 Ubicación
      </span>

      <strong>
        ${escapeHtml(vacante.ciudad || "-")}
      </strong>

      <small>
        ${escapeHtml(vacante.estado || "-")},
        ${escapeHtml(vacante.pais || "-")}
      </small>
    </div>

    <div class="vacancy-card__item">
      <span class="vacancy-card__label">
        🏢 Sucursal
      </span>

      <strong>
        ${escapeHtml(vacante.sucursal || "-")}
      </strong>

      <small>
        Tienda:
        ${escapeHtml(vacante.numeroTienda || "-")}
      </small>
    </div>

    <div class="vacancy-card__item">
      <span class="vacancy-card__label">
        📌 Coordenadas
      </span>

      <strong>
        ${coordenadasTexto}
      </strong>

      <small>
        Ubicación geográfica
      </small>
    </div>
  </div>

  

  <div class="vacancy-card__footer">
    <div class="vacancy-card__maps">
      ${googleBtnHtml}
      ${appleBtnHtml}
    </div>

   <div class="vacancy-card__admin-actions">

  <button
    class="btn btn--secondary qr-vacante-btn"
    type="button"
    data-id="${escapeHtml(vacante.id)}"
    ${vacante.qr?.slug ? "" : "disabled"}
  >
    ▣ QR vacante
  </button>

  <button
    class="btn btn--secondary edit-vacante-btn"
    type="button"
    data-id="${escapeHtml(vacante.id)}"
  >
    ✏ Editar
  </button>

  <button
    class="btn btn--danger delete-vacante-btn"
    type="button"
    data-id="${escapeHtml(vacante.id)}"
  >
    🗑 Eliminar
  </button>

</div>
`;

    vacantesAdminList.appendChild(card);
  });
document
  .querySelectorAll(".qr-vacante-btn")
  .forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        const item =
          vacantes.find(
            (v) =>
              v.id === btn.dataset.id
          );

        if (item) {
          openVacanteQrModal(item);
        }
      }
    );
  });
  document
  .querySelectorAll(".qr-vacante-btn")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const item =
        vacantes.find(
          (v) =>
            v.id === btn.dataset.id
        );

      if (item) {
        openVacanteQrModal(item);
      }
    });
  });
  document.querySelectorAll(".edit-vacante-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = vacantes.find((v) => v.id === btn.dataset.id);
      if (item) openVacanteModal(item);
    });
  });

  document.querySelectorAll(".delete-vacante-btn").forEach((btn) => {
    btn.addEventListener("click", () => eliminarVacante(btn.dataset.id));
  });
}
/* =========================================================
   QR DE VACANTE
========================================================= */

function construirUrlQrVacante(vacante) {
  const slug =
    String(
      vacante?.qr?.slug || ""
    ).trim();

  if (!slug) return "";

  return `${API_URL}/?v=${encodeURIComponent(slug)}`;
}


function calcularConversionQr(vacante) {
  const visitas =
    Number(
      vacante?.qr?.visitas || 0
    );

  const postulaciones =
    Number(
      vacante?.qr?.postulaciones || 0
    );

  if (
    !Number.isFinite(visitas) ||
    visitas <= 0
  ) {
    return 0;
  }

  const porcentaje =
    (
      postulaciones /
      visitas
    ) * 100;

  return Math.round(
    porcentaje * 10
  ) / 10;
}


function renderQrVacante(url) {
  if (!qrCodeContainer) return;

  qrCodeContainer.innerHTML = "";

  if (!url) {
    qrCodeContainer.innerHTML = `
      <div class="qr-placeholder">
        QR no disponible
      </div>
    `;

    return;
  }

  if (
    typeof window.QRCode !==
    "function"
  ) {
    qrCodeContainer.innerHTML = `
      <div class="qr-placeholder">
        No fue posible cargar
        el generador QR.
      </div>
    `;

    console.error(
      "QRCode no está disponible."
    );

    return;
  }

  new QRCode(
    qrCodeContainer,
    {
      text: url,
      width: 220,
      height: 220,
      correctLevel:
        QRCode.CorrectLevel.H
    }
  );
}


function openVacanteQrModal(
  vacante
) {
  if (
    !vacanteQrModal ||
    !vacante
  ) {
    return;
  }

  vacanteQrActual =
    vacante;

  const qr =
    vacante.qr || {};

  const url =
    construirUrlQrVacante(
      vacante
    );

  if (qrVacanteTitulo) {
    qrVacanteTitulo.textContent =
      vacante.titulo ||
      "Vacante";
  }

  if (qrVacanteUbicacion) {
    qrVacanteUbicacion.textContent =
      [
        vacante.grupo,
        vacante.sucursal,
        vacante.ciudad
      ]
        .filter(Boolean)
        .join(" · ");
  }

  if (qrVacanteUrl) {
    qrVacanteUrl.value =
      url;
  }

  if (qrVacanteVisitas) {
    qrVacanteVisitas.textContent =
      Number(
        qr.visitas || 0
      ).toLocaleString("es-MX");
  }

  if (
    qrVacantePostulaciones
  ) {
    qrVacantePostulaciones
      .textContent =
      Number(
        qr.postulaciones || 0
      ).toLocaleString("es-MX");
  }

  if (qrVacanteConversion) {
    qrVacanteConversion
      .textContent =
      `${calcularConversionQr(
        vacante
      )}%`;
  }

  const qrActivo =
    qr.activo !== false;

  if (qrVacanteStatus) {
    qrVacanteStatus
      .textContent =
      qrActivo
        ? "● QR activo"
        : "● QR desactivado";

    qrVacanteStatus
      .classList.toggle(
        "qr-status--active",
        qrActivo
      );

    qrVacanteStatus
      .classList.toggle(
        "qr-status--inactive",
        !qrActivo
      );
  }

  if (toggleVacanteQrBtn) {
    toggleVacanteQrBtn
      .textContent =
      qrActivo
        ? "Desactivar QR"
        : "Activar QR";
  }

  renderQrVacante(url);

  vacanteQrModal
    .classList
    .remove("hidden");
}


function closeVacanteQrModal() {
  if (!vacanteQrModal) return;

  vacanteQrModal
    .classList
    .add("hidden");

  vacanteQrActual = null;

  if (qrCodeContainer) {
    qrCodeContainer.innerHTML = "";
  }
}

async function copiarEnlaceQr() {
  const url =
    qrVacanteUrl?.value?.trim() || "";

  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);

    if (copyQrVacanteUrlBtn) {
      const original =
        copyQrVacanteUrlBtn.textContent;

      copyQrVacanteUrlBtn.textContent =
        "✓ Copiado";

      setTimeout(() => {
        copyQrVacanteUrlBtn.textContent =
          original || "Copiar enlace";
      }, 1500);
    }
  } catch (error) {
    console.error(
      "Error copiando enlace:",
      error
    );

    qrVacanteUrl?.select();
    document.execCommand("copy");
  }
}


function abrirEnlaceQr() {
  const url =
    qrVacanteUrl?.value?.trim() || "";

  if (!url) return;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


function descargarQrPng() {
  if (!qrCodeContainer) return;

  const canvas =
    qrCodeContainer.querySelector(
      "canvas"
    );

  const img =
    qrCodeContainer.querySelector(
      "img"
    );

  let dataUrl = "";

  if (canvas) {
    dataUrl =
      canvas.toDataURL("image/png");
  } else if (img) {
    dataUrl =
      img.src;
  }

  if (!dataUrl) {
    alert(
      "No fue posible obtener la imagen del QR."
    );
    return;
  }

  const nombre =
    String(
      vacanteQrActual?.titulo ||
      "vacante"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/gi,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  const link =
    document.createElement("a");

  link.href = dataUrl;

  link.download =
    `qr-${nombre || "vacante"}.png`;

  document.body.appendChild(link);

  link.click();

  link.remove();
}

async function copiarEnlaceQr() {
  const url =
    qrVacanteUrl?.value || "";

  if (!url) return;

  try {
    await navigator.clipboard
      .writeText(url);

    const textoAnterior =
      copyQrVacanteUrlBtn
        ?.textContent;

    if (copyQrVacanteUrlBtn) {
      copyQrVacanteUrlBtn
        .textContent =
        "✓ Copiado";

      setTimeout(() => {
        copyQrVacanteUrlBtn
          .textContent =
          textoAnterior ||
          "Copiar enlace";
      }, 1600);
    }
  } catch (error) {
    console.error(
      "Error copiando enlace QR:",
      error
    );

    if (qrVacanteUrl) {
      qrVacanteUrl.select();

      document.execCommand(
        "copy"
      );
    }
  }
}


function abrirEnlaceQr() {
  const url =
    qrVacanteUrl?.value || "";

  if (!url) return;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


function descargarQrPng() {
  if (
    !qrCodeContainer ||
    !vacanteQrActual
  ) {
    return;
  }

  const canvas =
    qrCodeContainer
      .querySelector("canvas");

  const image =
    qrCodeContainer
      .querySelector("img");

  let dataUrl = "";

  if (canvas) {
    dataUrl =
      canvas.toDataURL(
        "image/png"
      );
  } else if (image) {
    dataUrl =
      image.src;
  }

  if (!dataUrl) {
    alert(
      "No fue posible generar la imagen del QR."
    );

    return;
  }

  const nombre =
    String(
      vacanteQrActual.titulo ||
      "vacante"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/gi,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  const link =
    document.createElement("a");

  link.href =
    dataUrl;

  link.download =
    `qr-${nombre || "vacante"}.png`;

  document.body
    .appendChild(link);

  link.click();
  link.remove();
}

/* =========================================================
   QR DE VACANTE
========================================================= */

function construirUrlQrVacante(vacante) {
  const slug =
    String(
      vacante?.qr?.slug || ""
    ).trim();

  if (!slug) return "";

  return `${API_URL}/?v=${encodeURIComponent(slug)}`;
}


function calcularConversionQr(vacante) {
  const visitas =
    Number(vacante?.qr?.visitas || 0);

  const postulaciones =
    Number(
      vacante?.qr?.postulaciones || 0
    );

  if (!visitas) return 0;

  return Math.round(
    (
      postulaciones /
      visitas *
      100
    ) * 10
  ) / 10;
}


function renderQrVacante(url) {
  if (!qrCodeContainer) return;

  qrCodeContainer.innerHTML = "";

  if (!url) {
    qrCodeContainer.innerHTML =
      `<div class="qr-placeholder">
        QR no disponible
      </div>`;

    return;
  }

  if (
    typeof window.QRCode !==
    "function"
  ) {
    qrCodeContainer.innerHTML =
      `<div class="qr-placeholder">
        No fue posible cargar el QR
      </div>`;

    return;
  }

  new QRCode(
    qrCodeContainer,
    {
      text: url,
      width: 220,
      height: 220,
      correctLevel:
        QRCode.CorrectLevel.H
    }
  );
}


function openVacanteQrModal(vacante) {
  if (!vacanteQrModal) return;

  vacanteQrActual = vacante;

  const qr =
    vacante.qr || {};

  const url =
    construirUrlQrVacante(vacante);

  if (qrVacanteTitulo) {
    qrVacanteTitulo.textContent =
      vacante.titulo || "Vacante";
  }

  if (qrVacanteUbicacion) {
    qrVacanteUbicacion.textContent =
      [
        vacante.grupo,
        vacante.sucursal,
        vacante.ciudad
      ]
        .filter(Boolean)
        .join(" · ");
  }

  if (qrVacanteUrl) {
    qrVacanteUrl.value = url;
  }

  if (qrVacanteVisitas) {
    qrVacanteVisitas.textContent =
      Number(
        qr.visitas || 0
      );
  }

  if (qrVacantePostulaciones) {
    qrVacantePostulaciones.textContent =
      Number(
        qr.postulaciones || 0
      );
  }

  if (qrVacanteConversion) {
    qrVacanteConversion.textContent =
      `${calcularConversionQr(
        vacante
      )}%`;
  }

  const activo =
    qr.activo !== false;

  if (qrVacanteStatus) {
    qrVacanteStatus.textContent =
      activo
        ? "● QR activo"
        : "● QR desactivado";
  }

  if (toggleVacanteQrBtn) {
    toggleVacanteQrBtn.textContent =
      activo
        ? "Desactivar QR"
        : "Activar QR";
  }

  renderQrVacante(url);

  vacanteQrModal
    .classList
    .remove("hidden");
}


function closeVacanteQrModal() {
  if (!vacanteQrModal) return;

  vacanteQrModal
    .classList
    .add("hidden");

  vacanteQrActual = null;

  if (qrCodeContainer) {
    qrCodeContainer.innerHTML = "";
  }
}
/* =========================
   PREGUNTAS PERSONALIZADAS
========================= */

function generarPreguntaId() {
  return `pregunta-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function crearPreguntaVacia() {
  return {
    id: generarPreguntaId(),
    texto: "",
    tipo: "texto_corto",
    obligatoria: true,
    opciones: [],
    orden: preguntasPersonalizadas.length + 1
  };
}

function actualizarOrdenPreguntas() {
  preguntasPersonalizadas = preguntasPersonalizadas.map(
    (pregunta, index) => ({
      ...pregunta,
      orden: index + 1
    })
  );
}

function eliminarPreguntaPersonalizada(id) {
  preguntasPersonalizadas =
    preguntasPersonalizadas.filter(
      (pregunta) => pregunta.id !== id
    );

  actualizarOrdenPreguntas();
  renderPreguntasPersonalizadas();
}

function moverPregunta(id, direccion) {
  const index = preguntasPersonalizadas.findIndex(
    (pregunta) => pregunta.id === id
  );

  if (index === -1) return;

  const nuevoIndex = index + direccion;

  if (
    nuevoIndex < 0 ||
    nuevoIndex >= preguntasPersonalizadas.length
  ) {
    return;
  }

  const copia = [...preguntasPersonalizadas];

  [copia[index], copia[nuevoIndex]] = [
    copia[nuevoIndex],
    copia[index]
  ];

  preguntasPersonalizadas = copia;

  actualizarOrdenPreguntas();
  renderPreguntasPersonalizadas();
}

function actualizarPregunta(id, campo, valor) {
  const pregunta = preguntasPersonalizadas.find(
    (item) => item.id === id
  );

  if (!pregunta) return;

  pregunta[campo] = valor;

  if (campo === "tipo") {
    if (valor === "si_no") {
      pregunta.opciones = ["Sí", "No"];
    } else if (valor !== "seleccion") {
      pregunta.opciones = [];
    }

    renderPreguntasPersonalizadas();
  }
}

function renderPreguntasPersonalizadas() {
  if (!customQuestionsList) return;

  customQuestionsList.innerHTML = "";

  if (customQuestionsEmpty) {
    customQuestionsEmpty.classList.toggle(
      "hidden",
      preguntasPersonalizadas.length > 0
    );
  }

  preguntasPersonalizadas.forEach((pregunta, index) => {
    const card = document.createElement("article");

    card.className = "custom-question-card";
    card.dataset.id = pregunta.id;

    const requiereOpciones =
      pregunta.tipo === "seleccion";

    card.innerHTML = `
      <div class="custom-question-card__head">
        <div class="question-order">
          ${index + 1}
        </div>

        <div>
          <strong>Pregunta ${index + 1}</strong>
          <small>Configura el texto y tipo de respuesta.</small>
        </div>

        <div class="question-order-actions">
          <button
            class="question-icon-btn move-question-up"
            type="button"
            title="Subir pregunta"
            ${index === 0 ? "disabled" : ""}
          >
            ↑
          </button>

          <button
            class="question-icon-btn move-question-down"
            type="button"
            title="Bajar pregunta"
            ${
              index === preguntasPersonalizadas.length - 1
                ? "disabled"
                : ""
            }
          >
            ↓
          </button>

          <button
            class="question-icon-btn question-icon-btn--danger delete-question"
            type="button"
            title="Eliminar pregunta"
          >
            ✕
          </button>
        </div>
      </div>

      <div class="custom-question-grid">
        <div class="field custom-question-text">
          <label>Texto de la pregunta</label>

          <input
            class="question-text-input"
            type="text"
            value="${escapeHtml(pregunta.texto || "")}"
            placeholder="Ej. ¿Tienes experiencia manejando efectivo?"
          />
        </div>

        <div class="field">
          <label>Tipo de respuesta</label>

          <select class="question-type-select">
            <option
              value="texto_corto"
              ${
                pregunta.tipo === "texto_corto"
                  ? "selected"
                  : ""
              }
            >
              Texto corto
            </option>

            <option
              value="texto_largo"
              ${
                pregunta.tipo === "texto_largo"
                  ? "selected"
                  : ""
              }
            >
              Texto largo
            </option>

            <option
              value="numero"
              ${
                pregunta.tipo === "numero"
                  ? "selected"
                  : ""
              }
            >
              Número
            </option>

            <option
              value="si_no"
              ${
                pregunta.tipo === "si_no"
                  ? "selected"
                  : ""
              }
            >
              Sí / No
            </option>

            <option
              value="seleccion"
              ${
                pregunta.tipo === "seleccion"
                  ? "selected"
                  : ""
              }
            >
              Selección
            </option>
          </select>
        </div>

        ${
          requiereOpciones
            ? `
              <div class="field field--full">
                <label>Opciones de respuesta</label>

                <input
                  class="question-options-input"
                  type="text"
                  value="${escapeHtml(
                    (pregunta.opciones || []).join(", ")
                  )}"
                  placeholder="Ej. Mañana, Tarde, Noche"
                />

                <small class="field-help">
                  Separa cada opción con una coma.
                </small>
              </div>
            `
            : ""
        }

        <label class="question-required">
          <input
            class="question-required-input"
            type="checkbox"
            ${pregunta.obligatoria ? "checked" : ""}
          />

          <span>
            Pregunta obligatoria
          </span>
        </label>
      </div>
    `;

    const textInput =
      card.querySelector(".question-text-input");

    const typeSelect =
      card.querySelector(".question-type-select");

    const optionsInput =
      card.querySelector(".question-options-input");

    const requiredInput =
      card.querySelector(".question-required-input");

    const deleteBtn =
      card.querySelector(".delete-question");

    const moveUpBtn =
      card.querySelector(".move-question-up");

    const moveDownBtn =
      card.querySelector(".move-question-down");

    textInput?.addEventListener("input", () => {
      actualizarPregunta(
        pregunta.id,
        "texto",
        textInput.value
      );
    });

    typeSelect?.addEventListener("change", () => {
      actualizarPregunta(
        pregunta.id,
        "tipo",
        typeSelect.value
      );
    });

    optionsInput?.addEventListener("input", () => {
      actualizarPregunta(
        pregunta.id,
        "opciones",
        optionsInput.value
          .split(",")
          .map((opcion) => opcion.trim())
          .filter(Boolean)
      );
    });

    requiredInput?.addEventListener("change", () => {
      actualizarPregunta(
        pregunta.id,
        "obligatoria",
        requiredInput.checked
      );
    });

    deleteBtn?.addEventListener("click", () => {
      eliminarPreguntaPersonalizada(pregunta.id);
    });

    moveUpBtn?.addEventListener("click", () => {
      moverPregunta(pregunta.id, -1);
    });

    moveDownBtn?.addEventListener("click", () => {
      moverPregunta(pregunta.id, 1);
    });

    customQuestionsList.appendChild(card);
  });
}

/* =========================================================
   CAMPOS BASE RESERVADOS DEL CHATBOT
========================================================= */

function normalizarPreguntaReservada(texto = "") {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}


function detectarCampoBaseReservado(texto = "") {
  const pregunta =
    normalizarPreguntaReservada(texto);

  if (!pregunta) {
    return null;
  }


  /* =========================
     NOMBRE
  ========================= */

  const nombreReservado = [
    "nombre",
    "nombre completo",
    "cual es tu nombre",
    "cual es tu nombre completo",
    "nombre del candidato"
  ];

  if (
    nombreReservado.some(
      (item) =>
        pregunta === item ||
        pregunta.includes(item)
    )
  ) {
    return {
      campo: "nombre",
      etiqueta: "Nombre completo"
    };
  }


  /* =========================
     CORREO
  ========================= */

  const correoReservado = [
    "correo",
    "correo electronico",
    "email",
    "e mail",
    "cual es tu correo",
    "cual es tu correo electronico"
  ];

  if (
    correoReservado.some(
      (item) =>
        pregunta === item ||
        pregunta.includes(item)
    )
  ) {
    return {
      campo: "correo",
      etiqueta: "Correo electrónico"
    };
  }


  /* =========================
     TELÉFONO
  ========================= */

  const telefonoReservado = [
    "telefono",
    "numero de telefono",
    "numero telefonico",
    "telefono celular",
    "celular",
    "numero celular",
    "cual es tu numero de telefono"
  ];

  if (
    telefonoReservado.some(
      (item) =>
        pregunta === item ||
        pregunta.includes(item)
    )
  ) {
    return {
      campo: "telefono",
      etiqueta: "Número de teléfono"
    };
  }


  return null;
}


function validarPreguntasPersonalizadas() {

  /* 1. Evitar Nombre / Correo / Teléfono */

  for (
    let i = 0;
    i < preguntasPersonalizadas.length;
    i++
  ) {

    const pregunta =
      preguntasPersonalizadas[i];

    const texto =
      String(
        pregunta?.texto || ""
      ).trim();

    const campoReservado =
      detectarCampoBaseReservado(
        texto
      );

    if (campoReservado) {
      return {
        ok: false,

        error:
          `La pregunta ${i + 1} intenta solicitar "${campoReservado.etiqueta}". ` +
          `Ese dato ya se solicita automáticamente durante la postulación.`
      };
    }
  }


  /* 2. Validaciones normales de preguntas */

  for (
    const pregunta of
    preguntasPersonalizadas
  ) {

    if (
      !String(
        pregunta?.texto || ""
      ).trim()
    ) {
      return {
        ok: false,

        error:
          `Completa el texto de la pregunta ${pregunta.orden}.`
      };
    }


    if (
      pregunta.tipo === "seleccion" &&
      (
        !Array.isArray(
          pregunta.opciones
        ) ||
        pregunta.opciones.length < 2
      )
    ) {
      return {
        ok: false,

        error:
          `La pregunta ${pregunta.orden} debe tener al menos dos opciones.`
      };
    }
  }


  return {
    ok: true
  };
}


/* =========================
   FORMULARIO
========================= */
function resetVacanteForm() {
  vacanteIdEdit.value = "";
  vacanteTipo.value = "";
  vacanteGrupo.value = "";
  vacanteTituloInput.value = "";
  vacanteArea.value = "";
  vacantePais.value = "";

  vacanteEstado.innerHTML =
    `<option value="">Selecciona</option>`;

  vacanteCiudad.innerHTML =
    `<option value="">Selecciona</option>`;

  vacanteSucursal.value = "";

  if (vacanteNumeroTienda) {
    vacanteNumeroTienda.value = "";
  }

  if (vacanteDireccion) {
    vacanteDireccion.value = "";
  }

  if (vacanteGoogleMapsUrl) {
    vacanteGoogleMapsUrl.value = "";
  }

  if (vacanteAppleMapsUrl) {
    vacanteAppleMapsUrl.value = "";
  }

  if (vacanteLat) {
    vacanteLat.value = "";
  }

  if (vacanteLng) {
    vacanteLng.value = "";
  }

  vacanteRequisitos.value = "";

  /* Configuración general */

  if (vacanteCvPolicy) {
    vacanteCvPolicy.value = "opcional";
  }

  if (vacanteSolicitarTelefono) {
    vacanteSolicitarTelefono.checked = true;
  }

  if (vacanteSolicitarCorreo) {
    vacanteSolicitarCorreo.checked = true;
  }

  if (vacanteSolicitarCodigoPostal) {
    vacanteSolicitarCodigoPostal.checked = true;
  }

  if (vacanteSolicitarTransporte) {
    vacanteSolicitarTransporte.checked = true;
  }

  if (vacanteSolicitarVehiculoPropio) {
    vacanteSolicitarVehiculoPropio.checked = false;
  }

  if (vacanteSolicitarTiempoTraslado) {
    vacanteSolicitarTiempoTraslado.checked = true;
  }

  if (vacanteSolicitarExperiencia) {
    vacanteSolicitarExperiencia.checked = true;
  }

  if (vacanteSolicitarEscolaridad) {
    vacanteSolicitarEscolaridad.checked = false;
  }

  if (vacanteSolicitarDisponibilidad) {
    vacanteSolicitarDisponibilidad.checked = true;
  }

  preguntasPersonalizadas = [];
  renderPreguntasPersonalizadas();
}

function openVacanteModal(vacante = null) {
  resetVacanteForm();
  limpiarErroresVacante();
  if (!vacante) {
    vacanteModalTitle.textContent =
      "Nueva vacante";

    vacanteModal.classList.remove("hidden");
    return;
  }

  vacanteModalTitle.textContent =
    "Editar vacante";

  vacanteIdEdit.value =
    vacante.id || "";

  vacanteTipo.value =
    vacante.tipoVacante || "";

  vacanteGrupo.value =
    vacante.grupo || "";

  vacanteTituloInput.value =
    vacante.titulo || "";

  vacanteArea.value =
    vacante.area || "";

  vacantePais.value =
    vacante.pais || "";

  llenarEstadosModal();

  vacanteEstado.value =
    vacante.estado || "";

  llenarCiudadesModal();

  vacanteCiudad.value =
    vacante.ciudad || "";

  vacanteSucursal.value =
    vacante.sucursal || "";

  if (vacanteNumeroTienda) {
    vacanteNumeroTienda.value =
      vacante.numeroTienda || "";
  }

  if (vacanteDireccion) {
    vacanteDireccion.value =
      vacante.direccion || "";
  }

  if (vacanteGoogleMapsUrl) {
    vacanteGoogleMapsUrl.value =
      vacante.googleMapsUrl || "";
  }

  if (vacanteAppleMapsUrl) {
    vacanteAppleMapsUrl.value =
      vacante.appleMapsUrl || "";
  }

  if (vacanteLat) {
    vacanteLat.value =
      vacante.lat ?? "";
  }

  if (vacanteLng) {
    vacanteLng.value =
      vacante.lng ?? "";
  }
  /* =========================
   EVENTOS QR
========================= */

if (closeVacanteQrModalBtn) {
  closeVacanteQrModalBtn
    .addEventListener(
      "click",
      closeVacanteQrModal
    );
}

if (closeVacanteQrBackdrop) {
  closeVacanteQrBackdrop
    .addEventListener(
      "click",
      closeVacanteQrModal
    );
}

if (copyQrVacanteUrlBtn) {
  copyQrVacanteUrlBtn
    .addEventListener(
      "click",
      copiarEnlaceQr
    );
}

if (openQrVacanteUrlBtn) {
  openQrVacanteUrlBtn
    .addEventListener(
      "click",
      abrirEnlaceQr
    );
}

if (downloadQrPngBtn) {
  downloadQrPngBtn
    .addEventListener(
      "click",
      descargarQrPng
    );
}

  vacanteRequisitos.value =
    Array.isArray(vacante.requisitos)
      ? vacante.requisitos.join(", ")
      : "";

  /* Configuración de postulación */

  const configuracion =
    vacante.configuracionPostulacion || {};

  if (vacanteCvPolicy) {
    vacanteCvPolicy.value =
      configuracion.cv || "opcional";
  }

  if (vacanteSolicitarTelefono) {
    vacanteSolicitarTelefono.checked =
      configuracion.solicitarTelefono !== false;
  }

  if (vacanteSolicitarCorreo) {
    vacanteSolicitarCorreo.checked =
      configuracion.solicitarCorreo !== false;
  }

  if (vacanteSolicitarCodigoPostal) {
    vacanteSolicitarCodigoPostal.checked =
      configuracion.solicitarCodigoPostal !== false;
  }

  if (vacanteSolicitarTransporte) {
    vacanteSolicitarTransporte.checked =
      configuracion.solicitarTransporte !== false;
  }

  if (vacanteSolicitarVehiculoPropio) {
    vacanteSolicitarVehiculoPropio.checked =
      Boolean(
        configuracion.solicitarVehiculoPropio
      );
  }

  if (vacanteSolicitarTiempoTraslado) {
    vacanteSolicitarTiempoTraslado.checked =
      configuracion.solicitarTiempoTraslado !== false;
  }

  if (vacanteSolicitarExperiencia) {
    vacanteSolicitarExperiencia.checked =
      configuracion.solicitarExperiencia !== false;
  }

  if (vacanteSolicitarEscolaridad) {
    vacanteSolicitarEscolaridad.checked =
      Boolean(
        configuracion.solicitarEscolaridad
      );
  }

  if (vacanteSolicitarDisponibilidad) {
    vacanteSolicitarDisponibilidad.checked =
      configuracion.solicitarDisponibilidad !== false;
  }

  /* Preguntas personalizadas */

  preguntasPersonalizadas =
    Array.isArray(
      vacante.preguntasPersonalizadas
    )
      ? vacante.preguntasPersonalizadas.map(
          (pregunta, index) => ({
            id:
              pregunta.id ||
              generarPreguntaId(),

            texto:
              pregunta.texto || "",

            tipo:
              pregunta.tipo ||
              "texto_corto",

            obligatoria:
              pregunta.obligatoria !== false,

            opciones:
              Array.isArray(
                pregunta.opciones
              )
                ? pregunta.opciones
                : [],

            orden:
              pregunta.orden ||
              index + 1
          })
        )
      : [];

  actualizarOrdenPreguntas();
  renderPreguntasPersonalizadas();

  vacanteModal.classList.remove("hidden");
}

if (copyQrVacanteUrlBtn) {
  copyQrVacanteUrlBtn
    .addEventListener(
      "click",
      copiarEnlaceQr
    );
}

if (openQrVacanteUrlBtn) {
  openQrVacanteUrlBtn
    .addEventListener(
      "click",
      abrirEnlaceQr
    );
}

if (downloadQrPngBtn) {
  downloadQrPngBtn
    .addEventListener(
      "click",
      descargarQrPng
    );
}


function closeVacanteModal() {
  vacanteModal.classList.add("hidden");

  resetVacanteForm();
  limpiarErroresVacante();
}

/* =========================================================
   VALIDACIÓN VISUAL DE VACANTES
========================================================= */

const CAMPOS_OBLIGATORIOS_VACANTE = [
  {
    elemento: vacanteTipo,
    nombre: "Tipo de vacante",
    mensaje: "Selecciona el tipo de vacante."
  },
  {
    elemento: vacanteGrupo,
    nombre: "Marca / Departamento",
    mensaje: "Ingresa la marca o departamento."
  },
  {
    elemento: vacanteTituloInput,
    nombre: "Título",
    mensaje: "Ingresa el título de la vacante."
  },
  {
    elemento: vacanteArea,
    nombre: "Área",
    mensaje: "Ingresa el área de la vacante."
  },
  {
    elemento: vacantePais,
    nombre: "País",
    mensaje: "Selecciona un país."
  },
  {
    elemento: vacanteEstado,
    nombre: "Estado",
    mensaje: "Selecciona un estado."
  },
  {
    elemento: vacanteCiudad,
    nombre: "Ciudad",
    mensaje: "Selecciona una ciudad."
  },
  {
    elemento: vacanteSucursal,
    nombre: "Sucursal",
    mensaje: "Ingresa la sucursal."
  },
  {
    elemento: vacanteRequisitos,
    nombre: "Requisitos",
    mensaje:
      "Ingresa al menos un requisito para la vacante."
  }
];


function obtenerFieldContainer(elemento) {
  if (!elemento) return null;

  return elemento.closest(".field");
}


function obtenerMensajeErrorContainer(
  elemento
) {
  const field =
    obtenerFieldContainer(elemento);

  if (!field) return null;

  let error =
    field.querySelector(
      ".vacante-field-error"
    );

  if (!error) {
    error =
      document.createElement("small");

    error.className =
      "vacante-field-error";

    field.appendChild(error);
  }

  return error;
}


function campoVacanteTieneValor(
  elemento
) {
  if (!elemento) return true;

  if (
    elemento ===
    vacanteRequisitos
  ) {
    return String(
      elemento.value || ""
    )
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
      .length > 0;
  }

  return String(
    elemento.value || ""
  ).trim() !== "";
}



function configurarIndicadoresCamposVacante() {
  if (!vacanteForm) return;

  const fields =
    vacanteForm.querySelectorAll(
      ".field"
    );

  fields.forEach((field) => {
    const label =
      field.querySelector(
        ":scope > label"
      );

    const control =
      field.querySelector(
        ":scope > input, :scope > select, :scope > textarea"
      );

    if (
      !label ||
      !control ||
      control.type === "hidden"
    ) {
      return;
    }

    if (
      label.querySelector(
        ".field-required-badge, .field-optional-badge"
      )
    ) {
      return;
    }

    const badge =
      document.createElement("span");

    if (control.required) {
      badge.className =
        "field-required-badge";

      badge.textContent =
        "Obligatorio";
    } else {
      badge.className =
        "field-optional-badge";

      badge.textContent =
        "Opcional";
    }

    label.appendChild(badge);
  });
}


function marcarCampoVacanteError(
  elemento,
  mensaje
) {
  if (!elemento) return;

  const field =
    obtenerFieldContainer(elemento);

  const error =
    obtenerMensajeErrorContainer(
      elemento
    );

  elemento.classList.add(
    "vacante-input-error"
  );

  field?.classList.add(
    "field--error"
  );

  if (error) {
    error.textContent =
      `⚠ ${mensaje}`;

    error.classList.remove(
      "hidden"
    );
  }

  elemento.setAttribute(
    "aria-invalid",
    "true"
  );
}


function limpiarCampoVacanteError(
  elemento
) {
  if (!elemento) return;

  const field =
    obtenerFieldContainer(elemento);

  const error =
    field?.querySelector(
      ".vacante-field-error"
    );

  elemento.classList.remove(
    "vacante-input-error"
  );

  field?.classList.remove(
    "field--error"
  );

  if (error) {
    error.textContent = "";

    error.classList.add(
      "hidden"
    );
  }

  elemento.removeAttribute(
    "aria-invalid"
  );
}


function limpiarErroresVacante() {
  CAMPOS_OBLIGATORIOS_VACANTE
    .forEach(({ elemento }) => {
      limpiarCampoVacanteError(
        elemento
      );
    });

  if (vacanteValidationSummary) {
    vacanteValidationSummary
      .classList
      .add("hidden");
  }
}


function validarCamposObligatoriosVacante() {
  const faltantes = [];

  CAMPOS_OBLIGATORIOS_VACANTE
    .forEach(
      ({
        elemento,
        nombre,
        mensaje
      }) => {
        if (
          !campoVacanteTieneValor(
            elemento
          )
        ) {
          faltantes.push({
            elemento,
            nombre
          });

          marcarCampoVacanteError(
            elemento,
            mensaje
          );
        } else {
          limpiarCampoVacanteError(
            elemento
          );
        }
      }
    );

  if (!faltantes.length) {
    if (
      vacanteValidationSummary
    ) {
      vacanteValidationSummary
        .classList
        .add("hidden");
    }

    return {
      ok: true,
      faltantes: []
    };
  }

  if (
    vacanteValidationSummary
  ) {
    vacanteValidationSummary
      .classList
      .remove("hidden");
  }

  if (
    vacanteValidationSummaryText
  ) {
    vacanteValidationSummaryText
      .textContent =
      faltantes.length === 1
        ? `Falta completar: ${faltantes[0].nombre}.`
        : `Faltan ${faltantes.length} campos obligatorios: ${faltantes
            .map(
              (item) =>
                item.nombre
            )
            .join(", ")}.`;
  }

  const primero =
    faltantes[0]?.elemento;

  if (primero) {
    primero.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setTimeout(() => {
      primero.focus({
        preventScroll: true
      });
    }, 350);
  }

  return {
    ok: false,
    faltantes
  };
}


/* =========================
   QUITAR ERROR AL CORREGIR
========================= */

CAMPOS_OBLIGATORIOS_VACANTE
  .forEach(({ elemento }) => {
    if (!elemento) return;

    const evento =
      elemento.tagName === "SELECT"
        ? "change"
        : "input";

    elemento.addEventListener(
      evento,
      () => {
        if (
          campoVacanteTieneValor(
            elemento
          )
        ) {
          limpiarCampoVacanteError(
            elemento
          );
        }

        const quedanErrores =
          CAMPOS_OBLIGATORIOS_VACANTE
            .some(
              ({ elemento }) =>
                elemento?.classList
                  .contains(
                    "vacante-input-error"
                  )
            );

        if (
          !quedanErrores &&
          vacanteValidationSummary
        ) {
          vacanteValidationSummary
            .classList
            .add("hidden");
        }
      }
    );
  });

/* =========================
   GUARDAR VACANTE
========================= */
async function guardarVacante() {

  /* =========================================================
     1. VALIDAR CAMPOS OBLIGATORIOS
  ========================================================= */

  const validacionCampos =
    validarCamposObligatoriosVacante();

  if (!validacionCampos.ok) {
    setVacantesStatus(
      `⚠️ Revisa los ${validacionCampos.faltantes.length} campo(s) obligatorio(s) marcados en rojo.`
    );

    return;
  }

/* =========================================================
   VALIDAR CAMPOS OBLIGATORIOS DEL FORMULARIO
========================================================= */

const camposInvalidos = [
  ...vacanteForm.querySelectorAll(
    "[required]"
  )
].filter(
  (campo) =>
    !campo.checkValidity()
);


if (camposInvalidos.length) {

  /* Quitar errores anteriores */

  vacanteForm
    .querySelectorAll(
      ".field--error"
    )
    .forEach((field) => {
      field.classList.remove(
        "field--error"
      );
    });


  vacanteForm
    .querySelectorAll(
      ".field-error-message"
    )
    .forEach((mensaje) => {
      mensaje.remove();
    });


  /* Marcar campos incorrectos */

  camposInvalidos.forEach(
    (campo) => {

      const field =
        campo.closest(".field");

      if (!field) {
        return;
      }


      field.classList.add(
        "field--error"
      );


      const mensaje =
        document.createElement(
          "small"
        );

      mensaje.className =
        "field-error-message";


      if (
        campo.tagName === "SELECT"
      ) {
        mensaje.textContent =
          "Selecciona una opción.";
      } else {
        mensaje.textContent =
          "Este campo es obligatorio.";
      }


      field.appendChild(
        mensaje
      );
    }
  );


  /* Llevar al primer error */

  const primerCampo =
    camposInvalidos[0];


  primerCampo.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });


  setTimeout(() => {
    primerCampo.focus();
  }, 350);


  return;
}
  
  

  if (vacanteForm) {

  vacanteForm.addEventListener(
    "input",
    (event) => {

      const campo =
        event.target;

      if (
        !campo.matches(
          "input, select, textarea"
        )
      ) {
        return;
      }


      if (campo.checkValidity()) {

        const field =
          campo.closest(".field");

        if (!field) {
          return;
        }


        field.classList.remove(
          "field--error"
        );


        field
          .querySelector(
            ".field-error-message"
          )
          ?.remove();
      }
    }
  );


  vacanteForm.addEventListener(
    "change",
    (event) => {

      const campo =
        event.target;

      if (
        campo.matches(
          "select"
        ) &&
        campo.checkValidity()
      ) {

        const field =
          campo.closest(".field");

        field?.classList.remove(
          "field--error"
        );

        field
          ?.querySelector(
            ".field-error-message"
          )
          ?.remove();
      }
    }
  );
}
  /* =========================================================
     2. VALIDAR PREGUNTAS PERSONALIZADAS
  ========================================================= */

  const validacionPreguntas =
    validarPreguntasPersonalizadas();

  if (!validacionPreguntas.ok) {
    setVacantesStatus(
      `⚠️ ${validacionPreguntas.error}`
    );

    return;
  }


  /* =========================================================
     3. PREPARAR PAYLOAD
  ========================================================= */

  const payload = {

    tipoVacante:
      vacanteTipo.value,

    grupo:
      vacanteGrupo.value.trim(),

    titulo:
      vacanteTituloInput.value.trim(),

    area:
      vacanteArea.value.trim(),

    pais:
      vacantePais.value,

    estado:
      vacanteEstado.value,

    ciudad:
      vacanteCiudad.value,

    sucursal:
      vacanteSucursal.value.trim(),


    numeroTienda:
      vacanteNumeroTienda?.value.trim() || "",


    direccion:
      vacanteDireccion?.value.trim() || "",


    googleMapsUrl:
      normalizarUrl(
        vacanteGoogleMapsUrl?.value || ""
      ),


    appleMapsUrl:
      normalizarUrl(
        vacanteAppleMapsUrl?.value || ""
      ),


    lat:
      obtenerNumero(
        vacanteLat?.value
      ),


    lng:
      obtenerNumero(
        vacanteLng?.value
      ),


    requisitos:
      vacanteRequisitos.value
        .split(",")
        .map(
          (requisito) =>
            requisito.trim()
        )
        .filter(Boolean),


    /* =========================================================
       CONFIGURACIÓN DEL CHATBOT
    ========================================================= */

    configuracionPostulacion: {

      cv:
        vacanteCvPolicy?.value ||
        "opcional",


      solicitarCodigoPostal:
        Boolean(
          vacanteSolicitarCodigoPostal
            ?.checked
        ),


      solicitarTelefono:
        Boolean(
          vacanteSolicitarTelefono
            ?.checked
        ),


      solicitarCorreo:
        Boolean(
          vacanteSolicitarCorreo
            ?.checked
        ),


      solicitarExperiencia:
        Boolean(
          vacanteSolicitarExperiencia
            ?.checked
        ),


      solicitarEscolaridad:
        Boolean(
          vacanteSolicitarEscolaridad
            ?.checked
        ),


      solicitarDisponibilidad:
        Boolean(
          vacanteSolicitarDisponibilidad
            ?.checked
        ),


      solicitarTransporte:
        Boolean(
          vacanteSolicitarTransporte
            ?.checked
        ),


      solicitarVehiculoPropio:
        Boolean(
          vacanteSolicitarVehiculoPropio
            ?.checked
        ),


      solicitarTiempoTraslado:
        Boolean(
          vacanteSolicitarTiempoTraslado
            ?.checked
        )
    },


    /* =========================================================
       PREGUNTAS PERSONALIZADAS
    ========================================================= */

    preguntasPersonalizadas:
      preguntasPersonalizadas.map(
        (pregunta, index) => {

          let opciones = [];


          if (
            pregunta.tipo ===
            "si_no"
          ) {
            opciones = [
              "Sí",
              "No"
            ];
          }


          if (
            pregunta.tipo ===
            "seleccion"
          ) {
            opciones =
              Array.isArray(
                pregunta.opciones
              )
                ? pregunta.opciones
                    .map(
                      (opcion) =>
                        String(
                          opcion
                        ).trim()
                    )
                    .filter(Boolean)
                : [];
          }


          return {

            id:
              pregunta.id ||
              generarPreguntaId(),


            texto:
              String(
                pregunta.texto || ""
              ).trim(),


            tipo:
              pregunta.tipo ||
              "texto_corto",


            obligatoria:
              Boolean(
                pregunta.obligatoria
              ),


            opciones,


            orden:
              index + 1
          };
        }
      )
  };


  /* =========================================================
     4. GENERAR MAPAS AUTOMÁTICAMENTE
  ========================================================= */

  if (!payload.googleMapsUrl) {
    payload.googleMapsUrl =
      crearGoogleMapsUrlDesdeDatos(
        payload
      );
  }


  if (!payload.appleMapsUrl) {
    payload.appleMapsUrl =
      crearAppleMapsUrlDesdeDatos(
        payload
      );
  }


  /* =========================================================
     5. VALIDACIÓN DE RESPALDO
     Esta se mantiene aunque ya tengamos la validación visual.
  ========================================================= */

  if (
    !payload.tipoVacante ||
    !payload.grupo ||
    !payload.titulo ||
    !payload.area ||
    !payload.pais ||
    !payload.estado ||
    !payload.ciudad ||
    !payload.sucursal ||
    !payload.requisitos.length
  ) {

    setVacantesStatus(
      "⚠️ Faltan campos obligatorios. Revisa los campos marcados en rojo."
    );

    validarCamposObligatoriosVacante();

    return;
  }


  /* =========================================================
     6. VALIDAR CONFIGURACIÓN DE CV
  ========================================================= */

  const politicasCvValidas = [
    "obligatorio",
    "opcional",
    "no_solicitar"
  ];


  if (
    !politicasCvValidas.includes(
      payload
        .configuracionPostulacion
        .cv
    )
  ) {

    setVacantesStatus(
      "⚠️ Selecciona una configuración válida para el currículum."
    );

    return;
  }


  /* =========================================================
     7. VALIDAR SESIÓN ADMINISTRATIVA
  ========================================================= */

  if (!adminToken) {

    setVacantesStatus(
      "⚠️ Tu sesión administrativa no está lista. Cierra sesión e inicia sesión de nuevo."
    );

    return;
  }


  /* =========================================================
     8. GUARDAR / ACTUALIZAR VACANTE
  ========================================================= */

  try {

    const isEdit =
      Boolean(
        vacanteIdEdit.value
      );


    const vacanteId =
      encodeURIComponent(
        vacanteIdEdit.value
      );


    const url =
      isEdit
        ? `${API_URL}/api/vacantes/${vacanteId}`
        : `${API_URL}/api/vacantes`;


    const method =
      isEdit
        ? "PUT"
        : "POST";


    /* Desactivar botón mientras procesa */

    if (saveVacanteBtn) {

      saveVacanteBtn.disabled =
        true;


      saveVacanteBtn.textContent =
        isEdit
          ? "Actualizando..."
          : "Guardando...";
    }


    setVacantesStatus(
      isEdit
        ? "Actualizando vacante..."
        : "Guardando vacante..."
    );


    /* =========================================================
       PETICIÓN AL SERVIDOR
    ========================================================= */

    const res =
      await fetch(
        url,
        {
          method,

          headers:
            authHeaders({
              "Content-Type":
                "application/json"
            }),

          body:
            JSON.stringify(
              payload
            )
        }
      );


    let data = {};


    try {

      data =
        await res.json();

    } catch (jsonError) {

      console.warn(
        "La respuesta del servidor no contiene JSON válido:",
        jsonError
      );
    }


    /* =========================================================
       ERROR DEL BACKEND
    ========================================================= */

    if (!res.ok) {

      throw new Error(
        data.error ||
        data.message ||
        `No fue posible guardar la vacante. Error ${res.status}`
      );
    }


    /* =========================================================
       ÉXITO
    ========================================================= */

    closeVacanteModal();


    await cargarVacantesAdmin();


    setVacantesStatus(
      isEdit
        ? "✅ Vacante actualizada correctamente."
        : "✅ Vacante creada correctamente."
    );


  } catch (error) {

    console.error(
      "Error guardando vacante:",
      error
    );


    setVacantesStatus(
      `⚠️ ${
        error.message ||
        "No fue posible guardar la vacante."
      }`
    );


  } finally {

    /* =========================================================
       REACTIVAR BOTÓN
    ========================================================= */

    if (saveVacanteBtn) {

      saveVacanteBtn.disabled =
        false;


      saveVacanteBtn.textContent =
        "Guardar vacante";
    }
  }
}



/* =========================
   ELIMINAR VACANTE
========================= */
async function eliminarVacante(id) {
  const confirmDelete = confirm("¿Seguro que deseas eliminar esta vacante?");

  if (!confirmDelete) return;

  if (!adminToken) {
    setVacantesStatus("⚠️ Tu sesión administrativa no está lista. Cierra sesión e inicia sesión de nuevo.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/vacantes/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No fue posible eliminar la vacante.");
    }

    await cargarVacantesAdmin();
    setVacantesStatus("✅ Vacante eliminada correctamente.");
  } catch (error) {
    console.error("Error eliminando vacante:", error);
    setVacantesStatus(`⚠️ ${error.message}`);
  }
}

/* =========================
   EVENTOS
========================= */
if (openVacanteModalBtn) {
  openVacanteModalBtn.addEventListener("click", () => openVacanteModal());
}

if (refreshVacantesBtn) {
  refreshVacantesBtn.addEventListener("click", cargarVacantesAdmin);
}

if (closeVacanteModalBtn) {
  closeVacanteModalBtn.addEventListener("click", closeVacanteModal);
}

if (closeVacanteBackdrop) {
  closeVacanteBackdrop.addEventListener("click", closeVacanteModal);
}

if (saveVacanteBtn) {
  saveVacanteBtn.addEventListener("click", guardarVacante);
}

if (adminFiltroPais) {
  adminFiltroPais.addEventListener("change", () => {
    llenarEstados(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
    cargarVacantesAdmin();
  });
}

if (adminFiltroEstado) {
  adminFiltroEstado.addEventListener("change", () => {
    llenarCiudades(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
    cargarVacantesAdmin();
  });
}

if (adminFiltroCiudad) {
  adminFiltroCiudad.addEventListener("change", cargarVacantesAdmin);
}

if (adminFiltroTipo) {
  adminFiltroTipo.addEventListener("change", cargarVacantesAdmin);
}

if (vacantePais) {
  vacantePais.addEventListener("change", llenarEstadosModal);
}

if (vacanteEstado) {
  vacanteEstado.addEventListener("change", llenarCiudadesModal);
}
if (addCustomQuestionBtn) {
  addCustomQuestionBtn.addEventListener(
    "click",
    () => {
      preguntasPersonalizadas.push(
        crearPreguntaVacia()
      );

      renderPreguntasPersonalizadas();

      const ultimaPregunta =
        customQuestionsList?.lastElementChild;

      ultimaPregunta?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  );
}

if (closeVacanteQrModalBtn) {
  closeVacanteQrModalBtn
    .addEventListener(
      "click",
      closeVacanteQrModal
    );
}

if (closeVacanteQrBackdrop) {
  closeVacanteQrBackdrop
    .addEventListener(
      "click",
      closeVacanteQrModal
    );
}
/* =========================
   INIT
========================= */

async function init() {

  /* Etiquetas Obligatorio / Opcional */
  configurarIndicadoresCamposVacante();

  /* Cargar ubicaciones */
  await cargarUbicaciones();

  if (
    adminFiltroPais &&
    adminFiltroEstado &&
    adminFiltroCiudad
  ) {
    llenarEstados(
      adminFiltroPais,
      adminFiltroEstado,
      adminFiltroCiudad
    );
  }

  /* Cargar vacantes */
  await cargarVacantesAdmin();
}
/* =========================
   PROTECCIÓN ADMIN
========================= */
if (auth) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login-admin.html";
      return;
    }

    try {
      adminToken = await user.getIdToken(true);
      await init();
    } catch (error) {
      console.error("Error obteniendo token admin:", error);
      window.location.href = "login-admin.html";
    }
  });
} else {
  console.warn("Firebase Auth no está cargado en vacantes-admin.html.");
  init();
}