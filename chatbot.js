const API_URL = window.location.origin;

/* =========================
   ELEMENTOS
========================= */

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

/* =========================
   VARIABLES
========================= */

let ubicaciones = {};

let applicationFlow = {
  active: false,
  mode: "",
  cvFile: null
};

let candidateProfile = {
  nombre: "",
  correo: "",
  telefono: "",
  resumenIA: "",
  cvNombre: ""
};

const BRAND_IMAGES = {
  "applebee's": "/img/Applebees.png",
  "ardeo": "/img/ardeo.png",
  "ga hospitality": "/img/gaho.png",
  "great american": "/img/greatamerican.png",
  "little caesars": "/img/littlecaesars.jpg",
  "wendy's": "/img/wendys.png",
  "yoko": "/img/yoko.png"
};

const chatHistory = [
  {
    role: "assistant",
    type: "welcome",
    content:
      "Hola 👋 Soy tu asistente inteligente de reclutamiento. Analizaré tu CV para recomendarte vacantes acordes a tu perfil.",
    options: [
      {
        label: "Analizar mi CV",
        value: "analizar_cv"
      },
      {
        label: "Buscar vacantes",
        value: "buscar_vacantes"
      }
    ]
  }
];

/* =========================
   NORMALIZAR
========================= */

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/* =========================
   BURBUJA
========================= */

function activateListeningState() {
  if (!chatbotToggle) return;
  chatbotToggle.classList.add("is-listening");
}

function deactivateListeningState() {
  if (!chatbotToggle) return;
  chatbotToggle.classList.remove("is-listening");
}

/* =========================
   CHAT
========================= */

function openChat() {
  if (!box) return;

  box.classList.remove("hidden");
  activateListeningState();

  if (input) {
    input.focus();
  }
}

function closeChat() {
  if (!box) return;

  box.classList.add("hidden");
  deactivateListeningState();
}

function addAssistantText(content) {
  chatHistory.push({
    role: "assistant",
    type: "text",
    content
  });

  renderMessages();
}

function addUserText(content) {
  chatHistory.push({
    role: "user",
    type: "text",
    content
  });

  renderMessages();
}

/* =========================
   RENDER MENSAJES
========================= */

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

        btn.addEventListener("click", async () => {
          if (opt.value === "analizar_cv") {
            startCvAnalysisFlow();
          }

          if (opt.value === "buscar_vacantes") {
            document
              .getElementById("busqueda-vacantes")
              ?.scrollIntoView({
                behavior: "smooth"
              });
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

/* =========================
   ANALISIS CV
========================= */

function startCvAnalysisFlow() {
  applicationFlow.active = true;
  applicationFlow.mode = "cv_analysis";

  openChat();

  addAssistantText(
    "Perfecto. Adjunta tu CV en formato PDF y analizaré automáticamente tu experiencia, habilidades y perfil profesional."
  );
}

async function processCvAnalysisOnly() {
  if (!applicationFlow.cvFile) {
    addAssistantText(
      "⚠️ Primero debes adjuntar tu CV en formato PDF."
    );
    return;
  }

  addAssistantText(
    "⏳ Analizando CV y buscando vacantes relacionadas..."
  );

  const formData = new FormData();

  formData.append(
    "cvFile",
    applicationFlow.cvFile
  );

  try {
    const response = await fetch(
      `${API_URL}/api/analizar-cv`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "No fue posible analizar el CV."
      );
    }

    const analisis = data.analisis || {};

    candidateProfile.cvNombre =
      analisis.cvNombre || "";

    candidateProfile.resumenIA =
      analisis.resumenIA || "";

    addAssistantText(
      `✅ Análisis completado.\n\nResumen detectado:\n${candidateProfile.resumenIA}`
    );

    if (
      Array.isArray(analisis.sugerenciasIA) &&
      analisis.sugerenciasIA.length
    ) {
      mostrarVacantesIA(
        analisis.sugerenciasIA
      );
    } else {
      addAssistantText(
        "No encontré recomendaciones automáticas en este momento."
      );
    }

  } catch (error) {
    console.error(error);

    addAssistantText(
      `⚠️ ${error.message}`
    );
  }
}

/* =========================
   VACANTES IA
========================= */

function getBrandImage(grupo = "") {
  const normalized = normalizeText(grupo);

  if (normalized.includes("applebee")) {
    return BRAND_IMAGES["applebee's"];
  }

  if (normalized.includes("wendy")) {
    return BRAND_IMAGES["wendy's"];
  }

  if (normalized.includes("ardeo")) {
    return BRAND_IMAGES["ardeo"];
  }

  if (normalized.includes("great")) {
    return BRAND_IMAGES["great american"];
  }

  if (normalized.includes("little")) {
    return BRAND_IMAGES["little caesars"];
  }

  if (normalized.includes("yoko")) {
    return BRAND_IMAGES["yoko"];
  }

  return BRAND_IMAGES["ga hospitality"];
}

function mostrarVacantesIA(vacantes = []) {
  const wrapper = document.createElement("div");

  wrapper.className =
    "msg assistant";

  const title = document.createElement("div");

  title.innerHTML =
    "🎯 Estas vacantes podrían adaptarse a tu perfil:";

  wrapper.appendChild(title);

  const vacancies = document.createElement("div");

  vacancies.className =
    "chat-vacancies";

  vacantes.forEach((vacante) => {
    const card =
      document.createElement("div");

    card.className =
      "chat-vacancy-card";

    card.innerHTML = `
      <div class="chat-vacancy-card__brand">
        <img
          src="${getBrandImage(vacante.grupo)}"
          class="chat-vacancy-card__brand-img"
          alt="${vacante.grupo}"
        />
      </div>

      <h4>${vacante.titulo}</h4>

      <p><strong>${vacante.grupo}</strong></p>

      <p>
        ${vacante.ciudad},
        ${vacante.estado}
      </p>

      <button
        class="chat-option-btn"
        onclick="window.location.href='/vacantes.html'"
      >
        Ver vacante
      </button>
    `;

    vacancies.appendChild(card);
  });

  wrapper.appendChild(vacancies);

  messagesDiv.appendChild(wrapper);

  messagesDiv.scrollTop =
    messagesDiv.scrollHeight;
}

/* =========================
   UBICACIONES
========================= */

async function cargarUbicaciones() {
  try {
    const res = await fetch(
      `${API_URL}/api/ubicaciones`
    );

    ubicaciones = await res.json();
  } catch (error) {
    console.error(
      "Error ubicaciones:",
      error
    );
  }
}

function llenarEstados() {
  const pais = filtroPais.value;

  filtroEstado.innerHTML =
    `<option value="">Todos</option>`;

  filtroCiudad.innerHTML =
    `<option value="">Todas</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais])
    .forEach((estado) => {
      const option =
        document.createElement("option");

      option.value = estado;
      option.textContent = estado;

      filtroEstado.appendChild(option);
    });
}

function llenarCiudades() {
  const pais = filtroPais.value;
  const estado = filtroEstado.value;

  filtroCiudad.innerHTML =
    `<option value="">Todas</option>`;

  if (
    !pais ||
    !estado ||
    !ubicaciones[pais]?.[estado]
  ) return;

  ubicaciones[pais][estado]
    .forEach((ciudad) => {
      const option =
        document.createElement("option");

      option.value = ciudad;
      option.textContent = ciudad;

      filtroCiudad.appendChild(option);
    });
}

/* =========================
   BUSQUEDA VACANTES
========================= */

function buscarVacantes() {
  const params =
    new URLSearchParams({
      tipoVacante:
        filtroTipo.value || "",
      pais:
        filtroPais.value || "",
      estado:
        filtroEstado.value || "",
      ciudad:
        filtroCiudad.value || ""
    });

  window.location.href =
    `/vacantes.html?${params.toString()}`;
}

/* =========================
   ESTATUS
========================= */

async function consultarEstatus() {
  const folio =
    folioConsulta.value.trim();

  if (!folio) {
    consultaStatusResultado
      .classList.remove("hidden");

    consultaStatusResultado.textContent =
      "⚠️ Ingresa un folio.";

    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/api/postulacion/${folio}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
        "No fue posible consultar."
      );
    }

    consultaStatusResultado
      .classList.remove("hidden");

    consultaStatusResultado.textContent =
      `✅ Estado actual: ${data.estadoSolicitud}`;
  } catch (error) {
    consultaStatusResultado
      .classList.remove("hidden");

    consultaStatusResultado.textContent =
      `⚠️ ${error.message}`;
  }
}

/* =========================
   EVENTOS
========================= */

if (toggle) {
  toggle.addEventListener(
    "click",
    openChat
  );
}

if (closeBtn) {
  closeBtn.addEventListener(
    "click",
    closeChat
  );
}

if (startApplicationBtn) {
  startApplicationBtn.addEventListener(
    "click",
    startCvAnalysisFlow
  );
}

if (buscarVacantesBtn) {
  buscarVacantesBtn.addEventListener(
    "click",
    buscarVacantes
  );
}

if (filtroPais) {
  filtroPais.addEventListener(
    "change",
    llenarEstados
  );
}

if (filtroEstado) {
  filtroEstado.addEventListener(
    "change",
    llenarCiudades
  );
}

if (consultarStatusBtn) {
  consultarStatusBtn.addEventListener(
    "click",
    consultarEstatus
  );
}

if (attachCvBtn && chatCvFile) {
  attachCvBtn.addEventListener(
    "click",
    () => {
      openChat();

      if (!applicationFlow.active) {
        startCvAnalysisFlow();
      }

      chatCvFile.click();
    }
  );

  chatCvFile.addEventListener(
    "change",
    async () => {
      const file =
        chatCvFile.files?.[0];

      if (!file) return;

      const isPdf =
        file.type ===
          "application/pdf" ||
        file.name
          .toLowerCase()
          .endsWith(".pdf");

      if (!isPdf) {
        addAssistantText(
          "⚠️ Solo se permiten archivos PDF."
        );

        return;
      }

      applicationFlow.cvFile = file;

      addAssistantText(
        `✅ CV cargado correctamente:\n${file.name}`
      );

      await processCvAnalysisOnly();
    }
  );
}

if (form) {
  form.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();

      const text =
        input.value.trim();

      if (!text) return;

      addUserText(text);

      input.value = "";

      addAssistantText(
        "Estoy procesando tu mensaje..."
      );
    }
  );
}

/* =========================
   INIT
========================= */

async function init() {
  renderMessages();

  await cargarUbicaciones();
}

init();