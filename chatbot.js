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
const buscarVacantesBtn = document.getElementById("buscarVacantesBtn");
const filtroTipo = document.getElementById("filtroTipo");
const filtroPais = document.getElementById("filtroPais");
const filtroEstado = document.getElementById("filtroEstado");
const filtroCiudad = document.getElementById("filtroCiudad");
const busquedaStatus = document.getElementById("busquedaStatus");

let applicationFlow = {
  active: false,
  mode: "",
  step: 0,
  cvFile: null,
  selectedVacancy: null,
  data: {}
};

let candidateProfile = {
  nombre: "",
  correo: "",
  telefono: "",
  resumenIA: "",
  cvNombre: "",
  habilidadesDetectadas: [],
  perfilRecomendado: "",
  palabrasClave: [],
  areasCompatibles: [],
  suggestedVacancies: []
};

let chatHistory = [
  {
    role: "assistant",
    type: "welcome",
    content: "👋 ¡Hola! Soy tu asistente de reclutamiento inteligente. Estoy aquí para ayudarte a encontrar la oportunidad perfecta para ti. ¿Qué te gustaría hacer hoy?",
    options: [
      { label: "📄 Analizar mi CV", value: "analizar_cv" },
      { label: "📍 Buscar por ubicación", value: "buscar_ubicacion" },
      { label: "🎯 Recomendaciones personalizadas", value: "recomendar_vacantes" },
      { label: "📋 Consultar estatus", value: "consultar_estatus" }
    ]
  }
];

// =========================
// VENTANA DE BIENVENIDA
// =========================

let welcomeShown = false;

function showWelcomeOverlay() {
  const overlay = document.getElementById('chatbot-welcome-overlay');
  if (overlay && !welcomeShown) {
    overlay.classList.remove('hidden');
    welcomeShown = true;
  }
}

function hideWelcomeOverlay() {
  const overlay = document.getElementById('chatbot-welcome-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// =========================
// FUNCIONES DE UTILERÍA
// =========================

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "msg assistant typing-indicator";
  indicator.innerHTML = `
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  messagesDiv.appendChild(indicator);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return indicator;
}

function updateProgressBar(progress) {
  const progressBar = document.getElementById("chatbot-progress");
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;
  }
}

function showProgressStep(currentStep, totalSteps = 6) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  const stepNames = [
    "Nombre",
    "Correo", 
    "Teléfono",
    "Disponibilidad",
    "Experiencia",
    "CV y Envío"
  ];
  
  const progressMessage = `📋 Paso ${currentStep} de ${totalSteps}: ${stepNames[currentStep - 1] || "Completando..."}`;
  
  addAssistantText(`🔄 ${progressMessage}`);
  updateProgressBar(progress);
}

/* =========================
   BURBUJA CHAT
========================= */

function buscarVacantesDesdeFiltros() {
  const tipoVacante = filtroTipo?.value || "";
  const pais = filtroPais?.value || "";
  const estado = filtroEstado?.value || "";
  const ciudad = filtroCiudad?.value || "";

  const params = new URLSearchParams();

  if (tipoVacante) params.set("tipoVacante", tipoVacante);
  if (pais) params.set("pais", pais);
  if (estado) params.set("estado", estado);
  if (ciudad) params.set("ciudad", ciudad);

  window.location.href = `vacantes.html?${params.toString()}`;
}

if (buscarVacantesBtn) {
  buscarVacantesBtn.addEventListener("click", buscarVacantesDesdeFiltros);
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

  if (chatbotToggle) {
    chatbotToggle.classList.add("is-open");
    chatbotToggle.setAttribute("aria-label", "Cerrar chat");
  }

  if (input) input.focus();
  
  // Mostrar bienvenida SOLO si no hay mensajes previos
  if (chatHistory.length <= 1) {
    setTimeout(showWelcomeOverlay, 400);
  } else {
    hideWelcomeOverlay();
  }
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

/* =========================
   NORMALIZACIÓN
========================= */

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function userWantsRecommendations(text = "") {
  const t = normalizeText(text);

  return (
    t.includes("que vacante") ||
    t.includes("cual vacante") ||
    t.includes("que puesto") ||
    t.includes("cual puesto") ||
    t.includes("me recomiendas") ||
    t.includes("recomiendame") ||
    t.includes("se adapta") ||
    t.includes("de acuerdo a mi cv") ||
    t.includes("segun mi cv") ||
    t.includes("mis conocimientos") ||
    t.includes("mi perfil") ||
    t.includes("que puedo aplicar") ||
    t.includes("donde puedo aplicar")
  );
}

function userWantsLocation(text = "") {
  const t = normalizeText(text);

  return (
    t.includes("ubicacion") ||
    t.includes("sucursal") ||
    t.includes("mapa") ||
    t.includes("cerca") ||
    t.includes("ciudad") ||
    t.includes("tienda")
  );
}

function userWantsStatus(text = "") {
  const t = normalizeText(text);

  return (
    t.includes("estatus") ||
    t.includes("estado de mi solicitud") ||
    t.includes("folio") ||
    t.includes("seguimiento") ||
    t.includes("como va mi solicitud")
  );
}

/* =========================
   FAQ RECLUTAMIENTO
========================= */

function handleFaqResponse(text = "") {
  const t = normalizeText(text);

  if (
    t.includes("documentos") ||
    t.includes("que necesito") ||
    t.includes("requisitos") ||
    t.includes("papeles")
  ) {
    addAssistantText(
      "📋 Para iniciar tu postulación normalmente necesitas tu CV actualizado. Dependiendo del proceso, el equipo de reclutamiento podría solicitar identificación oficial, CURP, comprobante de domicilio u otros documentos después de revisar tu perfil."
    );
    return true;
  }

  if (
    t.includes("sin experiencia") ||
    t.includes("no tengo experiencia") ||
    t.includes("primer empleo") ||
    t.includes("mi primer trabajo")
  ) {
    addAssistantText(
      "💪 ¡Sí puedes postularte aunque no tengas experiencia! Para perfiles sin experiencia, puedo ayudarte a buscar vacantes operativas, atención al cliente, cocina, apoyo general o puestos donde se valore la actitud, disponibilidad y ganas de aprender."
    );

    addOptions("Puedes continuar con:", [
      { label: "📍 Buscar vacantes por ubicación", value: "buscar_ubicacion" },
      { label: "📄 Analizar mi CV", value: "analizar_cv" }
    ]);

    return true;
  }

  if (
    t.includes("medio tiempo") ||
    t.includes("tiempo parcial") ||
    t.includes("fines de semana") ||
    t.includes("horario") ||
    t.includes("disponibilidad")
  ) {
    addAssistantText(
      "⏰ Puedes indicar tu disponibilidad durante la postulación. Algunas vacantes pueden requerir tiempo completo, pero el equipo de reclutamiento revisará tu disponibilidad y te orientará si existe una opción compatible."
    );
    return true;
  }

  if (
    t.includes("subir mi cv") ||
    t.includes("cv en imagen") ||
    t.includes("foto del cv") ||
    t.includes("pdf") ||
    t.includes("jpg") ||
    t.includes("png")
  ) {
    addAssistantText(
      "📎 Adjunta tu CV en PDF para analizar tu experiencia, habilidades y perfil profesional."
    );

    addOptions("¿Deseas cargar tu CV ahora?", [
      { label: "📄 Analizar mi CV", value: "analizar_cv" }
    ]);

    return true;
  }

  if (
    t.includes("solicitud enviada") ||
    t.includes("como se si se envio") ||
    t.includes("se envio mi solicitud") ||
    t.includes("folio")
  ) {
    addAssistantText(
      "🔑 Cuando tu postulación se envía correctamente, el sistema te muestra un folio. Guarda ese folio porque con él puedes consultar el estatus de tu solicitud."
    );
    return true;
  }

  if (
    t.includes("ciudad juarez") ||
    t.includes("juarez") ||
    t.includes("chihuahua") ||
    t.includes("mexicali") ||
    t.includes("guadalajara") ||
    t.includes("el paso")
  ) {
    addAssistantText(
      "📍 Puedo ayudarte a buscar vacantes por ciudad o sucursal. La forma más clara es usar el mapa de ubicaciones para ver las sucursales disponibles y sus vacantes activas."
    );

    addOptions("Continuar con búsqueda por ubicación:", [
      { label: "📍 Abrir mapa de ubicaciones", value: "buscar_ubicacion" }
    ]);

    return true;
  }

  if (
    t.includes("donde estan") ||
    t.includes("sucursales") ||
    t.includes("ubicadas") ||
    t.includes("direccion")
  ) {
    addAssistantText(
      "📍 Puedes revisar las ubicaciones disponibles en el mapa de sucursales. Ahí podrás seleccionar la sucursal que te interese y ver vacantes relacionadas."
    );

    addOptions("Abrir mapa:", [
      { label: "📍 Buscar vacantes por ubicación", value: "buscar_ubicacion" }
    ]);

    return true;
  }

  return false;
}

/* =========================
   RENDER
========================= */

function renderMessages() {
  if (!messagesDiv) return;

  messagesDiv.innerHTML = "";

  chatHistory.forEach((message) => {
    const wrapper = document.createElement("div");
    wrapper.className = `msg ${message.role}`;

    if (message.type === "welcome" || message.type === "options") {
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

        btn.addEventListener("click", () => handleOption(option.value, option.label));

        optionsWrap.appendChild(btn);
      });

      wrapper.appendChild(optionsWrap);
    } else if (message.type === "vacancies") {
      const text = document.createElement("div");
      text.textContent = message.content;
      wrapper.appendChild(text);

      const list = document.createElement("div");
      list.className = "chat-vacancies";

      (message.vacancies || []).forEach((vacante) => {
        const card = document.createElement("div");
        card.className = "chat-vacancy-card";

        card.innerHTML = `
          <h4>${vacante.titulo || "Vacante disponible"}</h4>
          <p><strong>${vacante.grupo || "GA Hospitality"}</strong></p>
          <p>${vacante.area || ""}</p>
          <p>${vacante.ciudad || ""}${vacante.estado ? ", " + vacante.estado : ""}</p>
          <p>${vacante.sucursal || ""}</p>
        `;

        const btn = document.createElement("button");
        btn.className = "chat-option-btn";
        btn.textContent = "💼 Me interesa";
        btn.type = "button";

        btn.addEventListener("click", () => {
          startApplicationFromVacancy(vacante);
        });

        card.appendChild(btn);
        list.appendChild(card);
      });

      wrapper.appendChild(list);
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

function addOptions(content, options = []) {
  chatHistory.push({
    role: "assistant",
    type: "options",
    content,
    options
  });

  renderMessages();
}

function addVacancyCards(content, vacancies = []) {
  chatHistory.push({
    role: "assistant",
    type: "vacancies",
    content,
    vacancies
  });

  renderMessages();
}

function resetChatHistory() {
  chatHistory = [];
  renderMessages();
}

/* =========================
   OPCIONES
========================= */

function handleOption(value, label = "") {
  if (value === "analizar_cv") {
    startCvAnalysisFlow();
    return;
  }

  if (value === "buscar_ubicacion") {
    window.location.href = "ubicaciones.html";
    return;
  }

  if (value === "recomendar_vacantes") {
    showCvRecommendations();
    return;
  }

  if (value === "enviar_postulacion") {
    submitApplicationFromChat();
    return;
  }

  if (value === "consultar_estatus") {
    addAssistantText(
      "🔑 Para consultar tu estatus, escribe tu folio en la sección 'Consultar estatus de mi solicitud'."
    );
    return;
  }

  if (label) {
    addUserText(label);
  }
}

/* =========================
   ANÁLISIS CV
========================= */

function startCvAnalysisFlow() {
  applicationFlow.active = true;
  applicationFlow.mode = "cv_analysis";
  applicationFlow.step = 0;
  applicationFlow.cvFile = null;
  applicationFlow.selectedVacancy = null;

  resetChatHistory();
  openChat();

  addAssistantText(
    "📎 Perfecto. Adjunta tu CV en PDF o imagen JPG/PNG para analizar tu experiencia, habilidades y perfil profesional."
  );

  if (input) {
    input.placeholder = "Puedes escribir dudas sobre tu postulación...";
  }

  if (chatCvFile) {
    chatCvFile.setAttribute("accept", ".pdf,.jpg,.jpeg,.png,application/pdf,image/*");
  }

  if (attachCvBtn) {
    attachCvBtn.textContent = "📎 Adjuntar CV";
  }
}

async function processCvAnalysisOnly() {
  if (!applicationFlow.cvFile) {
    addAssistantText("⚠️ Primero debes adjuntar tu CV en PDF o imagen.");
    return;
  }

  const indicator = showTypingIndicator();
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  indicator.remove();
  
  addAssistantText("🔍 Analizando tu CV y buscando las mejores oportunidades para ti...");

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
    const sugerencias = Array.isArray(analisis.sugerenciasIA) ? analisis.sugerenciasIA : [];

    candidateProfile.cvNombre = analisis.cvNombre || "";
    candidateProfile.resumenIA = analisis.resumenIA || "";
    candidateProfile.habilidadesDetectadas = Array.isArray(analisis.habilidadesDetectadas)
      ? analisis.habilidadesDetectadas
      : [];
    candidateProfile.perfilRecomendado = analisis.perfilRecomendado || "";
    candidateProfile.palabrasClave = Array.isArray(analisis.palabrasClave)
      ? analisis.palabrasClave
      : [];
    candidateProfile.areasCompatibles = Array.isArray(analisis.areasCompatibles)
      ? analisis.areasCompatibles
      : [];
    candidateProfile.suggestedVacancies = sugerencias;

    addAssistantText(
      `✅ Análisis completado.\n\n📝 Resumen detectado:\n${candidateProfile.resumenIA || "CV recibido correctamente."}`
    );

    if (sugerencias.length) {
      addVacancyCards(
        "🎯 Con base en tu CV, estas vacantes podrían adaptarse mejor a tu perfil:",
        sugerencias
      );

      addOptions("Puedes seleccionar una vacante o seguir explorando opciones:", [
        { label: "📍 Buscar por ubicación", value: "buscar_ubicacion" },
        { label: "🎯 Ver recomendaciones otra vez", value: "recomendar_vacantes" }
      ]);
    } else {
      addAssistantText(
        "😅 No encontré una coincidencia directa con las vacantes actuales. Aun así, puedes buscar por ubicación o revisar vacantes disponibles."
      );

      addOptions("¿Cómo deseas continuar?", [
        { label: "📍 Buscar vacantes por ubicación", value: "buscar_ubicacion" }
      ]);
    }
  } catch (error) {
    console.error("Error analizando CV:", error);
    addAssistantText(`❌ ${error.message || "Ocurrió un error al analizar el CV."}`);
  }
}

function showCvRecommendations() {
  const sugerencias = candidateProfile.suggestedVacancies || [];

  if (!candidateProfile.resumenIA && !sugerencias.length) {
    addAssistantText(
      "📄 Para recomendarte vacantes de forma precisa, primero necesito analizar tu CV."
    );

    addOptions("Puedes comenzar aquí:", [
      { label: "📄 Analizar mi CV", value: "analizar_cv" },
      { label: "📍 Buscar por ubicación", value: "buscar_ubicacion" }
    ]);

    return;
  }

  if (sugerencias.length) {
    addVacancyCards(
      "🎯 Según el análisis de tu CV, estas vacantes son las que más podrían interesarte:",
      sugerencias
    );
    return;
  }

  addAssistantText(
    "🔍 Ya tengo el análisis de tu CV, pero no encontré vacantes con coincidencia directa. Te recomiendo buscar por ubicación para revisar opciones disponibles."
  );

  addOptions("Puedes continuar aquí:", [
    { label: "📍 Buscar vacantes por ubicación", value: "buscar_ubicacion" }
  ]);
}

/* =========================
   POSTULACIÓN
========================= */

function startApplicationFromVacancy(vacante) {
  applicationFlow.active = true;
  applicationFlow.mode = "application";
  applicationFlow.step = 1;
  applicationFlow.selectedVacancy = vacante;
  applicationFlow.data = {
    vacanteSeleccionada: vacante.id,
    puestoInteres: vacante.titulo,
    tipoVacante: vacante.tipoVacante,
    grupoSeleccionado: vacante.grupo,
    pais: vacante.pais,
    estado: vacante.estado,
    ciudad: vacante.ciudad
  };

  addAssistantText(
    `✨ Perfecto. Iniciaremos tu postulación para:\n\n📌 ${vacante.titulo}\n🏢 ${vacante.grupo || ""}\n📍 ${vacante.sucursal || ""}\n🌎 ${vacante.ciudad || ""}${vacante.estado ? ", " + vacante.estado : ""}\n\n📝 Para continuar, dime tu nombre completo.`
  );

  if (input) {
    input.placeholder = "Escribe tu nombre completo...";
  }
  
  showProgressStep(1);
}

async function handleApplicationFlow(text) {
  switch (applicationFlow.step) {
    case 1:
      applicationFlow.data.nombre = text;
      candidateProfile.nombre = text;
      applicationFlow.step = 2;
      showProgressStep(2);
      addAssistantText("📧 ¡Excelente! Ahora compárteme tu correo electrónico.");
      if (input) input.placeholder = "correo@ejemplo.com...";
      break;

    case 2:
      if (!isValidEmail(text)) {
        addAssistantText("❌ El correo electrónico no parece válido. ¿Podrías verificarlo? (ejemplo: nombre@dominio.com)");
        return;
      }
      applicationFlow.data.correo = text;
      candidateProfile.correo = text;
      applicationFlow.step = 3;
      showProgressStep(3);
      addAssistantText("📱 Perfecto. Ahora compárteme tu número de teléfono.");
      if (input) input.placeholder = "10 dígitos...";
      break;

    case 3:
      const phoneClean = text.replace(/[\s\-()]/g, '');
      if (phoneClean.length < 10) {
        addAssistantText("❌ El número de teléfono debe tener al menos 10 dígitos. ¿Podrías revisarlo?");
        return;
      }
      applicationFlow.data.telefono = text;
      candidateProfile.telefono = text;
      applicationFlow.step = 4;
      showProgressStep(4);
      addAssistantText("⏰ ¿Cuál es tu disponibilidad para trabajar? Ejemplo: tiempo completo, medio tiempo o fines de semana.");
      if (input) input.placeholder = "Disponibilidad...";
      break;

    case 4:
      applicationFlow.data.disponibilidad = text;
      applicationFlow.step = 5;
      showProgressStep(5);
      addAssistantText("💼 Cuéntame brevemente tu experiencia laboral o habilidades principales.");
      if (input) input.placeholder = "Experiencia o habilidades...";
      break;

    case 5:
      applicationFlow.data.experiencia = text;
      applicationFlow.data.habilidades = text;
      applicationFlow.step = 6;
      showProgressStep(6);

      if (applicationFlow.cvFile) {
        addOptions("✅ Ya tengo tu CV cargado. ¿Deseas enviar tu postulación?", [
          { label: "🚀 Enviar postulación", value: "enviar_postulacion" }
        ]);
      } else {
        addAssistantText("📎 Muy bien. Ahora adjunta tu CV para enviar tu postulación.");
      }

      if (input) input.placeholder = "Adjunta tu CV o escribe una duda...";
      break;

    default:
      addAssistantText("Ya tengo tu información. Puedes adjuntar tu CV o escribir 'enviar' para finalizar.");
      break;
  }
}

async function submitApplicationFromChat() {
  const vacante = applicationFlow.selectedVacancy;

  if (!vacante) {
    addAssistantText("⚠️ Primero necesitas seleccionar una vacante.");
    return;
  }

  if (!applicationFlow.cvFile) {
    addAssistantText("⚠️ Antes de enviar tu postulación, adjunta tu CV en PDF o imagen.");
    return;
  }

  const requiredFields = ["nombre", "correo", "telefono"];
  const missingField = requiredFields.find((field) => !applicationFlow.data[field]);

  if (missingField) {
    addAssistantText("⚠️ Antes de enviar, necesito completar tus datos principales: nombre, correo y teléfono.");
    return;
  }

  const formData = new FormData();

  Object.entries(applicationFlow.data).forEach(([key, value]) => {
    if (value) formData.append(key, value);
  });

  formData.append("cvFile", applicationFlow.cvFile);

  try {
    const indicator = showTypingIndicator();
    await new Promise(resolve => setTimeout(resolve, 1000));
    indicator.remove();
    
    addAssistantText("📤 Enviando tu postulación...");

    const response = await fetch(`${API_URL}/api/postulacion`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible enviar tu postulación.");
    }

    const postulacion = data.postulacion || {};

    applicationFlow.active = false;
    applicationFlow.mode = "";
    applicationFlow.step = 0;

    addAssistantText(`🎉 ¡Felicidades! Tu postulación fue enviada exitosamente!
    
📋 Vacante: ${postulacion.vacanteTitulo || vacante.titulo}
🔑 Folio: ${postulacion.id}

⚠️ **Importante**: Guarda tu folio para consultar el estatus de tu solicitud.

📧 Recibirás un correo de confirmación en los próximos minutos.`);

    addOptions("¿Qué te gustaría hacer ahora?", [
      { label: "🔍 Consultar estatus", value: "consultar_estatus" },
      { label: "📍 Buscar otra vacante", value: "buscar_ubicacion" },
      { label: "🎯 Ver recomendaciones", value: "recomendar_vacantes" }
    ]);
  } catch (error) {
    console.error("Error enviando postulación:", error);
    addAssistantText(`❌ ${error.message || "No fue posible enviar tu postulación."}`);
  }
}

/* =========================
   ESTATUS
========================= */

async function consultarEstatus() {
  if (!folioConsulta || !consultaStatusResultado) return;

  const folio = folioConsulta.value.trim();

  if (!folio) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = "⚠️ Ingresa un folio.";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/postulacion/${folio}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible consultar.");
    }

    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = `📊 Estado actual: ${data.estadoSolicitud}`;
  } catch (error) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = `❌ ${error.message || "No fue posible consultar."}`;
  }
}

/* =========================
   INPUT LIBRE
========================= */

async function handleFreeText(text) {
  const normalized = normalizeText(text);

  if (applicationFlow.mode === "application") {
    if (
      normalized === "enviar" ||
      normalized.includes("enviar postulacion") ||
      normalized.includes("finalizar")
    ) {
      await submitApplicationFromChat();
      return;
    }

    await handleApplicationFlow(text);
    return;
  }

  if (userWantsRecommendations(text)) {
    showCvRecommendations();
    return;
  }

  if (handleFaqResponse(text)) {
    return;
  }

  if (userWantsLocation(text)) {
    addAssistantText(
      "📍 Claro. Puedes buscar vacantes por ubicación en nuestro mapa de sucursales."
    );

    addOptions("Continuar con búsqueda por ubicación:", [
      { label: "📍 Abrir mapa de ubicaciones", value: "buscar_ubicacion" }
    ]);

    return;
  }

  if (userWantsStatus(text)) {
    addAssistantText(
      "🔑 Para consultar tu estatus, usa tu folio en la sección 'Consultar estatus de mi solicitud'."
    );
    return;
  }

  if (normalized.includes("hola") || normalized.includes("buenas")) {
    addOptions("👋 Hola. ¿Cómo deseas continuar?", [
      { label: "📄 Analizar mi CV", value: "analizar_cv" },
      { label: "📍 Buscar vacantes por ubicación", value: "buscar_ubicacion" },
      { label: "🎯 Recomendaciones personalizadas", value: "recomendar_vacantes" }
    ]);
    return;
  }

  if (candidateProfile.resumenIA) {
    addAssistantText(
      "🎯 Puedo ayudarte con recomendaciones basadas en tu CV. Si quieres, escribe: 'qué vacante se adapta a mi perfil' o selecciona una opción."
    );

    addOptions("Opciones disponibles:", [
      { label: "🎯 Ver vacantes recomendadas", value: "recomendar_vacantes" },
      { label: "📍 Buscar por ubicación", value: "buscar_ubicacion" }
    ]);

    return;
  }

  addAssistantText(
    "🤖 Puedo ayudarte a analizar tu CV, recomendarte vacantes, buscar oportunidades por ubicación o resolver dudas del proceso."
  );

  addOptions("Selecciona una opción:", [
    { label: "📄 Analizar mi CV", value: "analizar_cv" },
    { label: "📍 Buscar vacantes por ubicación", value: "buscar_ubicacion" }
  ]);
}

/* =========================
   EVENTOS
========================= */

// Evento para el botón de bienvenida
document.addEventListener('DOMContentLoaded', () => {
  const welcomeBtn = document.getElementById('chatbot-welcome-btn');
  if (welcomeBtn) {
    welcomeBtn.addEventListener('click', () => {
      hideWelcomeOverlay();
      if (input) {
        setTimeout(() => input.focus(), 300);
      }
    });
  }
});

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
    const isValidFile = file.type === "application/pdf" || 
                       file.type.startsWith("image/") ||
                       name.endsWith(".pdf") || 
                       name.endsWith(".jpg") || 
                       name.endsWith(".jpeg") || 
                       name.endsWith(".png");

    if (!isValidFile) {
      addAssistantText("❌ Solo se permiten archivos PDF o imágenes JPG/PNG.");
      return;
    }

    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    addAssistantText(`✅ CV cargado correctamente!\n📄 ${file.name} (${fileSize} MB)`);

    applicationFlow.cvFile = file;

    if (applicationFlow.mode === "application") {
      addAssistantText("🎯 ¡Perfecto! Ahora tienes todo listo para postularte.");
      addOptions("¿Listo para enviar tu postulación?", [
        { label: "🚀 Enviar postulación", value: "enviar_postulacion" }
      ]);
      return;
    }

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

    await handleFreeText(text);
  });
}

/* =========================
   URL DESDE UBICACIONES
========================= */

async function revisarAplicacionDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  const vacanteId = params.get("aplicar") || params.get("interes");

  if (!vacanteId) return;

  try {
    const response = await fetch(`${API_URL}/api/vacantes`);
    const vacantes = await response.json();

    const vacante = vacantes.find((item) => item.id === vacanteId);

    if (!vacante) {
      openChat();
      addAssistantText("❌ No pude encontrar la vacante seleccionada. Puedes buscar otra vacante desde ubicaciones.");
      return;
    }

    resetChatHistory();
    openChat();
    startApplicationFromVacancy(vacante);

    window.history.replaceState({}, document.title, "index.html#chatbot-toggle");
  } catch (error) {
    console.error("Error cargando vacante desde URL:", error);
  }
}

async function init() {
  renderMessages();
  await revisarAplicacionDesdeUrl();
}

init();