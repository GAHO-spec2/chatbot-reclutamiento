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
const consultarStatusBtn = document.getElementById("consultarStatusBtn");
const folioConsulta = document.getElementById("folioConsulta");
const consultaStatusResultado = document.getElementById("consultaStatusResultado");
const chatbotToggle = document.getElementById("chatbot-toggle");

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

let chatHistory = [
  {
    role: "assistant",
    type: "welcome",
    content:
      "Hola. Soy tu asistente inteligente de reclutamiento. Puedo analizar tu CV o ayudarte con tu postulación.",
    options: [
      { label: "Analizar mi CV", value: "analizar_cv" },
      { label: "Buscar vacantes por ubicación", value: "buscar_ubicacion" }
    ]
  }
];

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

  if (chatbotToggle) {
    chatbotToggle.classList.add("is-open");
    chatbotToggle.setAttribute("aria-label", "Cerrar chat");
  }

  if (input) input.focus();
}

function closeChat() {
  if (!box) return;

  box.classList.add("hidden");
  deactivateListeningState();

  if (chatbotToggle) {
    chatbotToggle.classList.remove("is-open");
    chatbotToggle.setAttribute("aria-label", "Abrir chat");
  }
}

function toggleChat() {
  if (!box) return;

  if (box.classList.contains("hidden")) {
    openChat();
  } else {
    closeChat();
  }
}

function renderMessages() {
  if (!messagesDiv) return;

  messagesDiv.innerHTML = "";

  chatHistory.forEach((message) => {
    const wrapper = document.createElement("div");
    wrapper.className = `msg ${message.role}`;

    if (message.type === "welcome") {
      const text = document.createElement("div");
      text.textContent = message.content;
      wrapper.appendChild(text);

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "chat-options";

      (message.options || []).forEach((option) => {
        const btn = document.createElement("button");
        btn.className = "chat-option-btn";
        btn.textContent = option.label;
        btn.type = "button";

        btn.addEventListener("click", () => {
          if (option.value === "analizar_cv") {
            startCvAnalysisFlow();
          }

          if (option.value === "buscar_ubicacion") {
            window.location.href = "ubicaciones.html";
          }
        });

        optionsWrap.appendChild(btn);
      });

      wrapper.appendChild(optionsWrap);
    } else {
      wrapper.textContent = message.content;
    }

    messagesDiv.appendChild(wrapper);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
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

function resetChatHistory() {
  chatHistory = [];
  renderMessages();
}

function startCvAnalysisFlow() {
  applicationFlow.active = true;
  applicationFlow.mode = "cv_analysis";
  applicationFlow.cvFile = null;

  resetChatHistory();
  openChat();

  addAssistantText(
    "Perfecto. Adjunta tu CV en PDF o imagen JPG/PNG para analizar tu experiencia, habilidades y perfil profesional."
  );

  if (input) {
    input.placeholder = "Puedes escribir dudas sobre tu postulación...";
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
    addAssistantText("Primero debes adjuntar tu CV en PDF o imagen.");
    return;
  }

  addAssistantText("Analizando CV...");

  const formData = new FormData();
  formData.append("cvFile", applicationFlow.cvFile);

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

    addAssistantText(
      `Análisis completado.\n\nResumen detectado:\n${candidateProfile.resumenIA || "CV recibido correctamente."}`
    );

    addAssistantText(
      "Ahora puedes buscar una sucursal con vacantes disponibles desde el mapa de ubicaciones."
    );
  } catch (error) {
    console.error("Error analizando CV:", error);
    addAssistantText(error.message || "Ocurrió un error al analizar el CV.");
  }
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
    const response = await fetch(`${API_URL}/api/postulacion/${folio}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible consultar.");
    }

    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = `Estado actual: ${data.estadoSolicitud}`;
  } catch (error) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = error.message || "No fue posible consultar.";
  }
}

if (toggle) {
  toggle.addEventListener("click", toggleChat);
}

if (closeBtn) {
  closeBtn.addEventListener("click", closeChat);
}

if (startApplicationBtn) {
  startApplicationBtn.addEventListener("click", startCvAnalysisFlow);
}

if (consultarStatusBtn) {
  consultarStatusBtn.addEventListener("click", consultarEstatus);
}

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
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    addUserText(text);
    input.value = "";

    addAssistantText(
      "Gracias. Para continuar con una vacante específica, entra al mapa de ubicaciones y selecciona una sucursal disponible."
    );
  });
}
async function init() {
  renderMessages();
  await revisarAplicacionDesdeUrl();
}

async function revisarAplicacionDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  const vacanteId = params.get("aplicar");

  if (!vacanteId) return;

  try {
    const response = await fetch(`${API_URL}/api/vacantes`);
    const vacantes = await response.json();

    const vacante = vacantes.find((item) => item.id === vacanteId);

    if (!vacante) {
      openChat();
      addAssistantText("No pude encontrar la vacante seleccionada. Puedes buscar otra vacante desde ubicaciones.");
      return;
    }

    applicationFlow.active = true;
    applicationFlow.mode = "branch_vacancy_application";
    applicationFlow.cvFile = null;
    applicationFlow.selectedVacancy = vacante;

    resetChatHistory();
    openChat();

    addAssistantText(
      `Excelente. Iniciaremos tu postulación para:\n\n${vacante.titulo}\n${vacante.sucursal || ""}\n${vacante.direccion || ""}\n\nAdjunta tu CV en PDF o imagen JPG/PNG para continuar.`
    );

    if (input) {
      input.placeholder = "Escribe tu nombre, teléfono o dudas...";
    }

    if (chatCvFile) {
      chatCvFile.setAttribute("accept", ".pdf,.jpg,.jpeg,.png,application/pdf,image/*");
    }

    window.history.replaceState({}, document.title, "index.html#chatbot-toggle");
  } catch (error) {
    console.error("Error cargando vacante desde URL:", error);
  }
}

init();