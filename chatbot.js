const API_URL = "https://chatbot-reclutamiento-dcqb.onrender.com";

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

  data: {},
  answers: {},

  questions: [],
  currentQuestionIndex: 0,

  waitingForCvDecision: false,
  waitingForCvUpload: false,

  /* Agenda inteligente */
  submittedApplication: null,
  availableDates: [],
  availableSlots: [],
  selectedInterviewDate: "",
  selectedInterviewSlot: null,
  bookingInterview: false
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

const DEFAULT_APPLICATION_CONFIG = {
  cv: "opcional",

  solicitarTelefono: true,
  solicitarCorreo: true,

  solicitarCodigoPostal: true,
  solicitarTransporte: true,
  solicitarVehiculoPropio: false,
  solicitarTiempoTraslado: true,

  solicitarExperiencia: true,
  solicitarEscolaridad: false,
  solicitarDisponibilidad: true
};

const VALID_QUESTION_TYPES = [
  "texto_corto",
  "texto_largo",
  "numero",
  "si_no",
  "seleccion"
];

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
// OBTENER IDIOMA ACTUAL PARA EL CHATBOT
// =========================

function getCurrentLanguage() {
  // Intentar obtener el idioma de la función global
  if (typeof window.getCurrentLanguage === 'function') {
    return window.getCurrentLanguage();
  }
  
  // Fallback: leer de localStorage
  try {
    const saved = localStorage.getItem('preferred_language');
    if (saved === 'es' || saved === 'en') return saved;
  } catch (e) {}
  
  return 'es'; // Default
}

// Mensajes del chatbot traducidos
const chatbotMessages = {
  es: {
    welcome: "👋 ¡Hola! Soy tu asistente de reclutamiento inteligente. Estoy aquí para ayudarte a encontrar la oportunidad perfecta para ti. ¿Qué te gustaría hacer hoy?",
    analyze_cv: "📄 Analizar mi CV",
    search_location: "📍 Buscar por ubicación",
    recommendations: "🎯 Recomendaciones personalizadas",
    check_status: "📋 Consultar estatus",
    cv_upload: "📎 Perfecto. Adjunta tu CV en PDF o imagen JPG/PNG para analizar tu experiencia, habilidades y perfil profesional.",
    // ... más mensajes
  },
  en: {
    welcome: "👋 Hello! I'm your intelligent recruitment assistant. I'm here to help you find the perfect opportunity for you. What would you like to do today?",
    analyze_cv: "📄 Analyze my CV",
    search_location: "📍 Search by location",
    recommendations: "🎯 Personalized recommendations",
    check_status: "📋 Check status",
    cv_upload: "📎 Perfect. Attach your CV in PDF or JPG/PNG image to analyze your experience, skills and professional profile.",
    // ... más mensajes
  }
};

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
   AGENDA INTELIGENTE
========================= */

function getLocalDateString(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getUpcomingDates(days = 14) {
  const dates = [];
  const today = new Date();

  today.setHours(12, 0, 0, 0);

  for (let index = 1; index <= days; index += 1) {
    const date = new Date(today);

    date.setDate(
      today.getDate() + index
    );

    dates.push(
      getLocalDateString(date)
    );
  }

  return dates;
}

function formatChatDate(dateString = "") {
  if (!dateString) {
    return "Fecha no disponible";
  }

  const date = new Date(
    `${dateString}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  ).format(date);
}

function formatChatTime(time = "") {
  if (!time) return "-";

  const [hours, minutes] =
    time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }
  ).format(date);
}

function resetInterviewBookingFlow() {
  applicationFlow.availableDates = [];
  applicationFlow.availableSlots = [];
  applicationFlow.selectedInterviewDate = "";
  applicationFlow.selectedInterviewSlot = null;
  applicationFlow.bookingInterview = false;
}

function getBookingApplication() {
  return (
    applicationFlow.submittedApplication ||
    null
  );
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
async function selectInterviewDate(
  optionIndex
) {
  const selectedDate =
    applicationFlow.availableDates[
      optionIndex
    ];

  if (!selectedDate?.date) {
    addAssistantText(
      "⚠️ La fecha seleccionada ya no está disponible."
    );

    return;
  }

  applicationFlow.selectedInterviewDate =
    selectedDate.date;

  addUserText(
    formatChatDate(
      selectedDate.date
    )
  );

  addAssistantText(
    "🕒 Consultando los horarios libres..."
  );

  const indicator =
    showTypingIndicator();

  try {
    const slots =
      await fetchAvailableSlotsForDate(
        selectedDate.date
      );

    indicator.remove();

    applicationFlow.availableSlots =
      slots;

    if (!slots.length) {
      addAssistantText(
        "⚠️ Los horarios de ese día ya fueron ocupados. Selecciona otra fecha."
      );

     addOptions(
  "Selecciona otra fecha:",
  applicationFlow.availableDates
    .map((item, originalIndex) => ({
      item,
      originalIndex
    }))
    .filter(
      ({ item }) =>
        item.date !==
        selectedDate.date
    )
    .map(
      ({ item, originalIndex }) => ({
        label:
          formatChatDate(item.date),

        value:
          `interview_date:${originalIndex}`
      })
    )
);

      return;
    }

    addOptions(
      `Horarios disponibles para ${formatChatDate(
        selectedDate.date
      )}:`,
      slots.map(
        (slot, index) => ({
          label:
            `${formatChatTime(
              slot.hora
            )} · ${
              slot.tipo ||
              "presencial"
            } · ${
              slot.reclutador ||
              "Reclutamiento"
            }`,

          value:
            `interview_slot:${index}`
        })
      )
    );
  } catch (error) {
    indicator.remove();

    console.error(
      "Error cargando horarios:",
      error
    );

    addAssistantText(
      `❌ ${
        error.message ||
        "No fue posible cargar los horarios."
      }`
    );
  }
}

function selectInterviewSlot(
  optionIndex
) {
  const slot =
    applicationFlow.availableSlots[
      optionIndex
    ];

  if (!slot) {
    addAssistantText(
      "⚠️ El horario seleccionado ya no está disponible."
    );

    return;
  }

  applicationFlow.selectedInterviewSlot =
    slot;

  addUserText(
    `${formatChatDate(
      slot.fecha
    )} a las ${formatChatTime(
      slot.hora
    )}`
  );

  addAssistantText(
    `📋 Confirma los datos de tu entrevista:

📅 Fecha: ${formatChatDate(slot.fecha)}
🕒 Hora: ${formatChatTime(slot.hora)}
⏱ Duración: ${slot.duracionMinutos || 30} minutos
👤 Reclutador: ${slot.reclutador || "Equipo de reclutamiento"}
💬 Modalidad: ${slot.tipo || "Presencial"}
📍 Sucursal: ${slot.sucursal || "Por confirmar"}`
  );

  addOptions(
    "¿Deseas reservar este horario?",
    [
      {
        label:
          "✅ Confirmar entrevista",

        value:
          "confirm_interview_booking"
      },
      {
        label:
          "🕒 Elegir otro horario",

        value:
          "choose_another_slot"
      },
      {
        label:
          "📆 Elegir otra fecha",

        value:
          "choose_another_date"
      }
    ]
  );
}

async function confirmInterviewBooking() {
  const slot =
    applicationFlow.selectedInterviewSlot;

  const postulacion =
    getBookingApplication();

  const vacante =
    applicationFlow.selectedVacancy;

  if (
    !slot ||
    !postulacion?.id ||
    !vacante
  ) {
    addAssistantText(
      "⚠️ No se pudo recuperar la información necesaria para reservar."
    );

    return;
  }

  if (applicationFlow.bookingInterview === "saving") {
    return;
  }

  applicationFlow.bookingInterview =
    "saving";

  addAssistantText(
    "📅 Reservando tu entrevista..."
  );

  const indicator =
    showTypingIndicator();

  try {
    const response = await fetch(
      `${API_URL}/api/entrevistas/reservar`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          disponibilidadId:
            slot.disponibilidadId,

          candidatoId:
            postulacion.id,

          candidatoNombre:
            postulacion.nombre ||
            applicationFlow.data.nombre ||
            candidateProfile.nombre ||
            "",

          correo:
            postulacion.correo ||
            applicationFlow.data.correo ||
            candidateProfile.correo ||
            "",

          telefono:
            postulacion.telefono ||
            applicationFlow.data.telefono ||
            candidateProfile.telefono ||
            "",

          puesto:
            postulacion.vacanteTitulo ||
            vacante.titulo ||
            "",

          marca:
            postulacion.grupoSeleccionado ||
            vacante.grupo ||
            "",

          vacanteId:
            vacante.id,

          sucursal:
            postulacion.sucursal ||
            vacante.sucursal ||
            "",

          sucursalId:
            vacante.sucursalId ||
            vacante.branchId ||
            postulacion.sucursalId ||
            "",

          ciudad:
            postulacion.ciudad ||
            vacante.ciudad ||
            "",

          fecha:
            slot.fecha,

          hora:
            slot.hora,

          comentarios:
            "Entrevista reservada por el candidato desde el chatbot."
        })
      }
    );

    const data =
      await response.json();

    indicator.remove();

    if (!response.ok) {
      if (response.status === 409) {
        applicationFlow
          .selectedInterviewSlot =
          null;

        applicationFlow
          .bookingInterview =
          true;

        addAssistantText(
          "⚠️ Otra persona reservó ese horario hace unos momentos. Te mostraré nuevamente los horarios disponibles."
        );

        await selectInterviewDate(
          applicationFlow
            .availableDates
            .findIndex(
              (item) =>
                item.date ===
                applicationFlow
                  .selectedInterviewDate
            )
        );

        return;
      }

      throw new Error(
        data.error ||
        "No fue posible reservar la entrevista."
      );
    }

    const entrevista =
      data.entrevista || {};

    applicationFlow.bookingInterview =
      false;

    applicationFlow.mode = "";

    applicationFlow.selectedInterviewSlot =
      entrevista;

    updateProgressBar(100);

    addAssistantText(
      `🎉 ¡Tu entrevista quedó reservada!

📅 Fecha: ${formatChatDate(
        entrevista.fecha
      )}

🕒 Hora: ${formatChatTime(
        entrevista.hora
      )}

👤 Reclutador: ${
        entrevista.reclutador ||
        "Equipo de reclutamiento"
      }

💬 Modalidad: ${
        entrevista.tipo ||
        "Presencial"
      }

📍 Sucursal: ${
        entrevista.sucursal ||
        "Por confirmar"
      }

⏳ Estado: Pendiente de confirmación por RH

El equipo de reclutamiento podrá confirmar o proponerte un nuevo horario.`
    );

    addOptions(
      "Puedes continuar con:",
      [
        {
          label:
            "🔍 Consultar estatus",

          value:
            "consultar_estatus"
        },
        {
          label:
            "📍 Buscar otra vacante",

          value:
            "buscar_ubicacion"
        }
      ]
    );
  } catch (error) {
    indicator.remove();

    applicationFlow.bookingInterview =
      true;

    console.error(
      "Error reservando entrevista:",
      error
    );

    addAssistantText(
      `❌ ${
        error.message ||
        "No fue posible reservar la entrevista."
      }`
    );
  }
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

  /* =========================
     RESPUESTAS DINÁMICAS
  ========================= */

  if (
    value.startsWith(
      "dynamic_answer:"
    )
  ) {
    const [
      ,
      questionKey,
      optionIndexText
    ] = value.split(":");

    const question =
      applicationFlow.questions[
        applicationFlow.currentQuestionIndex
      ];

    if (
      !question ||
      question.key !== questionKey
    ) {
      addAssistantText(
        "⚠️ La pregunta ya no está disponible. Intenta continuar nuevamente."
      );
      return;
    }

    const optionIndex =
      Number(optionIndexText);

    const selectedOption =
      question.options?.[
        optionIndex
      ];

    if (
      selectedOption === undefined
    ) {
      addAssistantText(
        "⚠️ La opción seleccionada no es válida."
      );
      return;
    }

    addUserText(selectedOption);

    saveDynamicAnswer(
      question,
      selectedOption
    );

    return;
  }

  /* =========================
     CV OPCIONAL
  ========================= */

  if (value === "cv_opcional_si") {
    addUserText(
      "Sí, adjuntar mi CV"
    );

    applicationFlow.waitingForCvDecision =
      false;

    applicationFlow.waitingForCvUpload =
      true;

    if (chatCvFile) {
      chatCvFile.click();
    }

    return;
  }

  if (value === "cv_opcional_no") {
    addUserText(
      "Continuar sin CV"
    );

    applicationFlow.waitingForCvDecision =
      false;

    applicationFlow.waitingForCvUpload =
      false;

    addOptions(
      "✅ Perfecto. Puedes enviar tu postulación sin currículum.",
      [
        {
          label:
            "🚀 Enviar postulación",
          value:
            "enviar_postulacion"
        }
      ]
    );

    return;
  }

  /* =========================
     AGENDA INTELIGENTE
  ========================= */

  if (value === "schedule_interview") {
    startInterviewBookingFlow();
    return;
  }

  if (
    value.startsWith(
      "interview_date:"
    )
  ) {
    const index =
      Number(
        value.split(":")[1]
      );

    selectInterviewDate(index);
    return;
  }

  if (
    value.startsWith(
      "interview_slot:"
    )
  ) {
    const index =
      Number(
        value.split(":")[1]
      );

    selectInterviewSlot(index);
    return;
  }

  if (
    value ===
    "confirm_interview_booking"
  ) {
    confirmInterviewBooking();
    return;
  }

  if (
    value ===
    "choose_another_slot"
  ) {
    const dateIndex =
      applicationFlow
        .availableDates
        .findIndex(
          (item) =>
            item.date ===
            applicationFlow
              .selectedInterviewDate
        );

    if (dateIndex >= 0) {
      selectInterviewDate(
        dateIndex
      );
    } else {
      addAssistantText(
        "⚠️ No fue posible recuperar la fecha seleccionada."
      );
    }

    return;
  }

  if (
    value ===
    "choose_another_date"
  ) {
    const availableDates =
      Array.isArray(
        applicationFlow.availableDates
      )
        ? applicationFlow.availableDates
        : [];

    if (!availableDates.length) {
      addAssistantText(
        "⚠️ No hay fechas disponibles para mostrar en este momento."
      );
      return;
    }

    addOptions(
      "📆 Selecciona otra fecha:",
      availableDates.map(
        (item, index) => ({
          label:
            formatChatDate(
              item.date
            ),

          value:
            `interview_date:${index}`
        })
      )
    );

    return;
  }

  if (
    value ===
    "skip_interview_booking"
  ) {
    applicationFlow.mode = "";

    resetInterviewBookingFlow();

    addAssistantText(
      "✅ No hay problema. El equipo de reclutamiento podrá contactarte para coordinar la entrevista."
    );

    return;
  }

  /* =========================
     OPCIÓN NO RECONOCIDA
  ========================= */

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
   FLUJO DINÁMICO DE VACANTE
========================= */

function getVacancyApplicationConfig(vacante = {}) {
  const config =
    vacante.configuracionPostulacion || {};

  const cvPolicies = [
    "obligatorio",
    "opcional",
    "no_solicitar"
  ];

  return {
    cv: cvPolicies.includes(config.cv)
      ? config.cv
      : DEFAULT_APPLICATION_CONFIG.cv,

    solicitarTelefono:
      config.solicitarTelefono !== false,

    solicitarCorreo:
      config.solicitarCorreo !== false,

    solicitarExperiencia:
      config.solicitarExperiencia !== false,

    solicitarEscolaridad:
      Boolean(config.solicitarEscolaridad),

    solicitarDisponibilidad:
      config.solicitarDisponibilidad !== false,
    solicitarCodigoPostal:
      config.solicitarCodigoPostal !== false,

    solicitarTransporte:
      config.solicitarTransporte !== false,

    solicitarVehiculoPropio:
      Boolean(
        config.solicitarVehiculoPropio
      ),

    solicitarTiempoTraslado:
      config.solicitarTiempoTraslado !== false
  };
}

async function findAvailableInterviewDates(
  maximumDates = 5
) {
  const upcomingDates =
    getUpcomingDates(21);

  const availableDates = [];

  for (const dateString of upcomingDates) {
    try {
      const slots =
        await fetchAvailableSlotsForDate(
          dateString
        );

      if (slots.length) {
        availableDates.push({
          date: dateString,
          total: slots.length
        });
      }

      if (
        availableDates.length >=
        maximumDates
      ) {
        break;
      }
    } catch (error) {
      console.warn(
        `No se pudieron consultar horarios para ${dateString}:`,
        error
      );
    }
  }

  return availableDates;
}

async function startInterviewBookingFlow() {
  const postulacion =
    getBookingApplication();

  if (!postulacion?.id) {
    addAssistantText(
      "⚠️ No encontré una postulación válida para agendar la entrevista."
    );

    return;
  }

  applicationFlow.mode =
    "interview_booking";

  resetInterviewBookingFlow();

  applicationFlow.mode =
    "interview_booking";

  applicationFlow.bookingInterview =
    true;

  addAssistantText(
    "📅 Consultando las próximas fechas disponibles para tu entrevista..."
  );

  const indicator =
    showTypingIndicator();

  try {
    const dates =
      await findAvailableInterviewDates();

    indicator.remove();

    applicationFlow.availableDates =
      dates;

    if (!dates.length) {
      applicationFlow.bookingInterview =
        false;

      addAssistantText(
        "😕 Por ahora no encontré horarios disponibles para esta vacante. El equipo de reclutamiento podrá contactarte para coordinar la entrevista."
      );

      addOptions(
        "Puedes continuar con:",
        [
          {
            label: "🔍 Consultar estatus",
            value: "consultar_estatus"
          },
          {
            label: "📍 Buscar otra vacante",
            value: "buscar_ubicacion"
          }
        ]
      );

      return;
    }

    addOptions(
      "📆 Selecciona el día que más te convenga:",
      dates.map(
        (item, index) => ({
          label:
            `${formatChatDate(item.date)} · ${item.total} ${
              item.total === 1
                ? "horario"
                : "horarios"
            }`,

          value:
            `interview_date:${index}`
        })
      )
    );
  } catch (error) {
    indicator.remove();

    applicationFlow.bookingInterview =
      false;

    console.error(
      "Error iniciando agenda:",
      error
    );

    addAssistantText(
      `❌ ${
        error.message ||
        "No fue posible consultar la agenda."
      }`
    );
  }
}

async function fetchAvailableSlotsForDate(
  dateString
) {
  const postulacion =
    getBookingApplication();

  const vacante =
    applicationFlow.selectedVacancy;

  if (!postulacion || !vacante) {
    throw new Error(
      "No se encontró la postulación o la vacante seleccionada."
    );
  }

  const params =
    new URLSearchParams();

  params.set(
    "fecha",
    dateString
  );

  if (vacante.id) {
    params.set(
      "vacanteId",
      vacante.id
    );
  }

  const sucursalId =
    vacante.sucursalId ||
    vacante.branchId ||
    postulacion.sucursalId ||
    "";

  if (sucursalId) {
    params.set(
      "sucursalId",
      sucursalId
    );
  }

  const sucursal =
    vacante.sucursal ||
    postulacion.sucursal ||
    "";

  if (sucursal) {
    params.set(
      "sucursal",
      sucursal
    );
  }

  const response = await fetch(
    `${API_URL}/api/entrevistas/horarios-disponibles?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      "No fue posible consultar los horarios."
    );
  }

  return Array.isArray(data.horarios)
    ? data.horarios
    : [];
}
function normalizeCustomQuestions(vacante = {}) {
  const questions = Array.isArray(
    vacante.preguntasPersonalizadas
  )
    ? vacante.preguntasPersonalizadas
    : [];

  return questions
    .filter((question) => {
      return (
        question &&
        String(question.texto || "").trim()
      );
    })
    .map((question, index) => {
      const type = VALID_QUESTION_TYPES.includes(
        question.tipo
      )
        ? question.tipo
        : "texto_corto";

      let options = [];

      if (type === "si_no") {
        options = ["Sí", "No"];
      }

      if (
        type === "seleccion" &&
        Array.isArray(question.opciones)
      ) {
        options = question.opciones
          .map((option) =>
            String(option || "").trim()
          )
          .filter(Boolean);
      }

      return {
        id:
          question.id ||
          `pregunta-${index + 1}`,

        key:
          `custom_${question.id || index + 1}`,

        label:
          String(question.texto).trim(),

        type,

        required:
          question.obligatoria !== false,

        options,

        order:
          Number(question.orden) || index + 1,

        custom: true
      };
    })
    .sort((a, b) => a.order - b.order);
}

function buildApplicationQuestions(vacante = {}) {
  const config =
    getVacancyApplicationConfig(vacante);

  const questions = [
    {
      key: "nombre",
      label: "¿Cuál es tu nombre completo?",
      type: "texto_corto",
      required: true,
      custom: false
    }
  ];

  if (config.solicitarCorreo) {
    questions.push({
      key: "correo",
      label:
        "¿Cuál es tu correo electrónico?",
      type: "correo",
      required: true,
      custom: false
    });
  }

  if (config.solicitarTelefono) {
    questions.push({
      key: "telefono",
      label:
        "¿Cuál es tu número de teléfono?",
      type: "telefono",
      required: true,
      custom: false
    });
  }

  if (config.solicitarEscolaridad) {
    questions.push({
      key: "escolaridad",
      label:
        "¿Cuál es tu último nivel de escolaridad?",
      type: "texto_corto",
      required: true,
      custom: false
    });
  }

  if (config.solicitarDisponibilidad) {
    questions.push({
      key: "disponibilidad",
      label:
        "¿Cuál es tu disponibilidad para trabajar?",
      type: "texto_largo",
      required: true,
      custom: false
    });
  }

  if (config.solicitarExperiencia) {
    questions.push({
      key: "experiencia",
      label:
        "Cuéntame brevemente sobre tu experiencia laboral o habilidades principales.",
      type: "texto_largo",
      required: true,
      custom: false
    });
  }

  if (config.solicitarCodigoPostal) {
  questions.push({
    key: "codigoPostal",
    label:
      "¿Cuál es el código postal de la zona donde vives?",
    type: "codigo_postal",
    required: true,
    custom: false
  });
}

if (config.solicitarTransporte) {
  questions.push({
    key: "medioTransporte",
    label:
      "¿Cómo te trasladarías normalmente al lugar de trabajo?",
    type: "seleccion",
    required: true,
    options: [
      "Automóvil propio",
      "Transporte público",
      "Servicio de transporte",
      "Motocicleta",
      "Bicicleta",
      "Caminando",
      "Otro"
    ],
    custom: false
  });
}

if (config.solicitarVehiculoPropio) {
  questions.push({
    key: "vehiculoPropio",
    label:
      "¿Cuentas con vehículo propio?",
    type: "si_no",
    required: true,
    options: ["Sí", "No"],
    custom: false
  });
}

if (config.solicitarTiempoTraslado) {
  questions.push({
    key: "tiempoMaximoTraslado",
    label:
      "¿Cuál es el tiempo máximo que estarías dispuesto a trasladarte para llegar al trabajo?",
    type: "seleccion",
    required: true,
    options: [
      "Hasta 15 minutos",
      "Hasta 30 minutos",
      "Hasta 45 minutos",
      "Hasta 60 minutos",
      "Más de 60 minutos"
    ],
    custom: false
  });
}

  questions.push(
    ...normalizeCustomQuestions(vacante)
  );

  return questions;
}

function getQuestionPlaceholder(question = {}) {
  const placeholders = {
    nombre:
      "Escribe tu nombre completo...",

    correo:
      "correo@ejemplo.com",

    telefono:
      "Número de teléfono...",

    escolaridad:
      "Ej. Secundaria, preparatoria, universidad...",

    disponibilidad:
      "Ej. Tiempo completo, turno vespertino...",

    experiencia:
      "Describe brevemente tu experiencia...",

    numero:
      "Escribe un número...",

    texto_corto:
      "Escribe tu respuesta...",

    texto_largo:
      "Escribe tu respuesta...",
    
    codigoPostal:
      "Ej. 32618",

    medioTransporte:
      "Selecciona tu medio de transporte...",

    vehiculoPropio:
      "Selecciona Sí o No...",

    tiempoMaximoTraslado:
      "Selecciona el tiempo máximo..."

  };

  return (
    placeholders[question.key] ||
    placeholders[question.type] ||
    "Escribe tu respuesta..."
  );
}

function updateDynamicProgress() {
  const total =
    applicationFlow.questions.length;

  const current =
    applicationFlow.currentQuestionIndex + 1;

  if (!total) {
    updateProgressBar(0);
    return;
  }

  const progress = Math.min(
    85,
    Math.round(
      (applicationFlow.currentQuestionIndex /
        total) *
        85
    )
  );

  updateProgressBar(progress);

  if (current <= total) {
    addAssistantText(
      `📋 Pregunta ${current} de ${total}`
    );
  }
}

function showCurrentApplicationQuestion() {
  const question =
    applicationFlow.questions[
      applicationFlow.currentQuestionIndex
    ];

  if (!question) {
    handleCvPolicyAfterQuestions();
    return;
  }

  updateDynamicProgress();

  if (
    question.type === "si_no" ||
    question.type === "seleccion"
  ) {
    const options =
      Array.isArray(question.options)
        ? question.options
        : [];

    addOptions(
      question.label,
      options.map((option, index) => ({
        label: option,
        value:
          `dynamic_answer:${question.key}:${index}`
      }))
    );

    if (input) {
      input.placeholder =
        "Selecciona una opción...";
    }

    return;
  }

  addAssistantText(question.label);

  if (input) {
    input.placeholder =
      getQuestionPlaceholder(question);
  }
}

function validateDynamicAnswer(
  question,
  answer
) {
  const value = String(answer || "").trim();

  if (question.required && !value) {
    return {
      ok: false,
      error:
        "Esta respuesta es obligatoria."
    };
  }

  if (
    question.type === "correo" &&
    value &&
    !isValidEmail(value)
  ) {
    return {
      ok: false,
      error:
        "El correo electrónico no parece válido. Ejemplo: nombre@dominio.com"
    };
  }

  if (
    question.type === "telefono" &&
    value
  ) {
    const clean = value.replace(
      /[\s\-()+]/g,
      ""
    );

    if (
      clean.length < 10 ||
      !/^\d+$/.test(clean)
    ) {
      return {
        ok: false,
        error:
          "El teléfono debe incluir al menos 10 dígitos."
      };
    }
  }
  if (
  question.type === "codigo_postal" &&
  value
) {
  const codigoPostal = value.replace(
    /\s+/g,
    ""
  );

  if (!/^\d{5}$/.test(codigoPostal)) {
    return {
      ok: false,
      error:
        "El código postal debe contener exactamente 5 números. Ejemplo: 32618."
    };
  }

  return {
    ok: true,
    value: codigoPostal
  };
}

  if (
    question.type === "numero" &&
    value &&
    !Number.isFinite(Number(value))
  ) {
    return {
      ok: false,
      error:
        "Escribe una cantidad numérica válida."
    };
  }

  return {
    ok: true,
    value
  };
}

function saveDynamicAnswer(
  question,
  answer
) {
  const validation =
    validateDynamicAnswer(
      question,
      answer
    );

  if (!validation.ok) {
    addAssistantText(
      `⚠️ ${validation.error}`
    );

    showCurrentApplicationQuestion();
    return false;
  }

  const value = validation.value;

  if (question.custom) {
    applicationFlow.answers[
      question.id
    ] = {
      preguntaId: question.id,
      pregunta: question.label,
      tipo: question.type,
      respuesta: value
    };
  } else {
    applicationFlow.data[
      question.key
    ] = value;
  }

  if (question.key === "nombre") {
    candidateProfile.nombre = value;
  }

  if (question.key === "correo") {
    candidateProfile.correo = value;
  }

  if (question.key === "telefono") {
    candidateProfile.telefono = value;
  }

  if (question.key === "experiencia") {
    applicationFlow.data.habilidades =
      value;
  }

  applicationFlow.currentQuestionIndex += 1;

  showCurrentApplicationQuestion();

  return true;
}

function handleCvPolicyAfterQuestions() {
  const vacante =
    applicationFlow.selectedVacancy;

  const config =
    getVacancyApplicationConfig(
      vacante
    );

  applicationFlow.waitingForCvDecision =
    false;

  applicationFlow.waitingForCvUpload =
    false;

  if (config.cv === "no_solicitar") {
    updateProgressBar(95);

    addOptions(
      "✅ Ya completaste la información requerida. ¿Deseas enviar tu postulación?",
      [
        {
          label:
            "🚀 Enviar postulación",
          value:
            "enviar_postulacion"
        }
      ]
    );

    return;
  }

  if (
    applicationFlow.cvFile
  ) {
    updateProgressBar(95);

    addOptions(
      "✅ Ya tengo tu CV cargado. ¿Deseas enviar tu postulación?",
      [
        {
          label:
            "🚀 Enviar postulación",
          value:
            "enviar_postulacion"
        }
      ]
    );

    return;
  }

  if (config.cv === "obligatorio") {
    applicationFlow.waitingForCvUpload =
      true;

    addAssistantText(
      "📎 Para esta vacante es obligatorio adjuntar tu CV antes de enviar la postulación."
    );

    if (attachCvBtn) {
      attachCvBtn.textContent =
        "📎 Adjuntar CV obligatorio";
    }

    return;
  }

  applicationFlow.waitingForCvDecision =
    true;

  addOptions(
    "📄 Para esta vacante el CV es opcional. ¿Deseas adjuntarlo?",
    [
      {
        label:
          "📎 Sí, adjuntar mi CV",
        value:
          "cv_opcional_si"
      },
      {
        label:
          "Continuar sin CV",
        value:
          "cv_opcional_no"
      }
    ]
  );
}

/* =========================
   POSTULACIÓN
========================= */

function startApplicationFromVacancy(
  vacante
) {
  if (!vacante?.id) {
    addAssistantText(
      "⚠️ No fue posible identificar la vacante seleccionada."
    );
    return;
  }

  const config =
    getVacancyApplicationConfig(
      vacante
    );

  applicationFlow.active = true;
  applicationFlow.mode =
    "dynamic_application";
  applicationFlow.step = 0;

  applicationFlow.selectedVacancy =
    vacante;

  applicationFlow.questions =
    buildApplicationQuestions(vacante);

  applicationFlow.currentQuestionIndex =
    0;

  applicationFlow.answers = {};

  applicationFlow.waitingForCvDecision =
    false;

  applicationFlow.waitingForCvUpload =
    false;

  applicationFlow.data = {
    vacanteSeleccionada:
      vacante.id,

    puestoInteres:
      vacante.titulo || "",

    tipoVacante:
      vacante.tipoVacante || "",

    grupoSeleccionado:
      vacante.grupo || "",

    pais:
      vacante.pais || "",

    estado:
      vacante.estado || "",

    ciudad:
      vacante.ciudad || "",

    sucursal:
      vacante.sucursal || "",

    politicaCv:
      config.cv
  };

  openChat();
  hideWelcomeOverlay();

  addAssistantText(
    `✨ Iniciaremos tu postulación para:

📌 ${vacante.titulo || "Vacante disponible"}
🏢 ${vacante.grupo || "GA Hospitality"}
📍 ${vacante.sucursal || ""}
🌎 ${vacante.ciudad || ""}${
      vacante.estado
        ? `, ${vacante.estado}`
        : ""
    }

El proceso se adaptará a la información solicitada para esta vacante.`
  );

  showCurrentApplicationQuestion();
}

async function handleApplicationFlow(
  text
) {
  const question =
    applicationFlow.questions[
      applicationFlow.currentQuestionIndex
    ];

  if (!question) {
    handleCvPolicyAfterQuestions();
    return;
  }

  saveDynamicAnswer(
    question,
    text
  );
}

async function submitApplicationFromChat() {
  const vacante = applicationFlow.selectedVacancy;

  if (!vacante) {
    addAssistantText(
      "⚠️ Primero necesitas seleccionar una vacante."
    );
    return;
  }

  const config =
    getVacancyApplicationConfig(vacante);

  if (
    config.cv === "obligatorio" &&
    !applicationFlow.cvFile
  ) {
    addAssistantText(
      "⚠️ Para esta vacante es obligatorio adjuntar tu CV antes de enviar la postulación."
    );

    applicationFlow.waitingForCvUpload = true;

    if (attachCvBtn) {
      attachCvBtn.textContent =
        "📎 Adjuntar CV obligatorio";
    }

    return;
  }

  const requiredFields = ["nombre"];

  if (config.solicitarCorreo) {
    requiredFields.push("correo");
  }

  if (config.solicitarTelefono) {
    requiredFields.push("telefono");
  }

  if (config.solicitarExperiencia) {
    requiredFields.push("experiencia");
  }

  if (config.solicitarEscolaridad) {
    requiredFields.push("escolaridad");
  }

  if (config.solicitarDisponibilidad) {
    requiredFields.push("disponibilidad");
  }
  if (config.solicitarCodigoPostal) {
  requiredFields.push(
    "codigoPostal"
  );
}

if (config.solicitarTransporte) {
  requiredFields.push(
    "medioTransporte"
  );
}

if (config.solicitarVehiculoPropio) {
  requiredFields.push(
    "vehiculoPropio"
  );
}

if (config.solicitarTiempoTraslado) {
  requiredFields.push(
    "tiempoMaximoTraslado"
  );
}

  const missingField =
    requiredFields.find(
      (field) =>
        !String(
          applicationFlow.data[field] || ""
        ).trim()
    );

  if (missingField) {
    addAssistantText(
      "⚠️ Aún falta completar información obligatoria antes de enviar la postulación."
    );

    return;
  }

  const formData = new FormData();

  Object.entries(
    applicationFlow.data
  ).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      formData.append(
        key,
        String(value)
      );
    }
  });

  formData.append(
    "respuestasPersonalizadas",
    JSON.stringify(
      applicationFlow.answers || {}
    )
  );

  formData.append(
    "configuracionPostulacion",
    JSON.stringify(config)
  );

  if (applicationFlow.cvFile) {
    formData.append(
      "cvFile",
      applicationFlow.cvFile
    );
  }

  try {
    if (input) {
      input.disabled = true;
    }

    if (attachCvBtn) {
      attachCvBtn.disabled = true;
    }

    const indicator =
      showTypingIndicator();

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 800)
    );

    indicator.remove();

    addAssistantText(
      "📤 Enviando tu postulación..."
    );

    updateProgressBar(98);

    const response = await fetch(
      `${API_URL}/api/postulacion`,
      {
        method: "POST",
        body: formData
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch (jsonError) {
      console.warn(
        "La respuesta del servidor no contiene JSON válido:",
        jsonError
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        `No fue posible enviar tu postulación. Error ${response.status}`
      );
    }

    const postulacion =
      data.postulacion || {};

    applicationFlow.submittedApplication =
  postulacion;
    applicationFlow.submittedApplication =
  postulacion;
  applicationFlow.active = false;
applicationFlow.mode = "";
applicationFlow.step = 0;

applicationFlow.questions = [];
applicationFlow.currentQuestionIndex = 0;
applicationFlow.answers = {};

applicationFlow.waitingForCvDecision =
  false;

applicationFlow.waitingForCvUpload =
  false;

/*
 * No eliminamos selectedVacancy ni
 * submittedApplication porque se usarán
 * para reservar la entrevista.
 */
resetInterviewBookingFlow();
    


    updateProgressBar(100);

    addAssistantText(
      `🎉 ¡Tu postulación fue enviada correctamente!

📋 Vacante: ${
        postulacion.vacanteTitulo ||
        vacante.titulo
      }

🔑 Folio: ${
        postulacion.id || "No disponible"
      }

⚠️ Guarda tu folio para consultar el estatus de tu solicitud.`
    );

    addOptions(
  "¿Qué te gustaría hacer ahora?",
  [
    {
      label:
        "📅 Agendar mi entrevista",

      value:
        "schedule_interview"
    },
    {
      label:
        "🔍 Consultar estatus",

      value:
        "consultar_estatus"
    },
    {
      label:
        "Ahora no, continuar después",

      value:
        "skip_interview_booking"
    }
  ]
);
  } catch (error) {
    console.error(
      "Error enviando postulación:",
      error
    );

    addAssistantText(
      `❌ ${
        error.message ||
        "No fue posible enviar tu postulación."
      }`
    );

    updateProgressBar(90);
  } finally {
    if (input) {
      input.disabled = false;
      input.focus();
    }

    if (attachCvBtn) {
      attachCvBtn.disabled = false;
      attachCvBtn.textContent =
        "📎 Adjuntar CV";
    }
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

  if (
  applicationFlow.mode ===
  "interview_booking"
) {
  if (
    normalized.includes(
      "cancelar"
    ) ||
    normalized.includes(
      "despues"
    ) ||
    normalized.includes(
      "ahora no"
    )
  ) {
    applicationFlow.mode = "";

    resetInterviewBookingFlow();

    addAssistantText(
      "✅ La agenda quedó pendiente. RH podrá contactarte para coordinar tu entrevista."
    );

    return;
  }

  addAssistantText(
    "📅 Para continuar con la agenda, selecciona una de las fechas u horarios disponibles en los botones."
  );

  return;
}

  /* =========================
     FLUJO DE POSTULACIÓN DINÁMICA
  ========================= */
  if (
    applicationFlow.mode ===
    "dynamic_application"
  ) {
    if (
      normalized === "enviar" ||
      normalized.includes(
        "enviar postulacion"
      ) ||
      normalized.includes(
        "finalizar"
      )
    ) {
      await submitApplicationFromChat();
      return;
    }

    await handleApplicationFlow(text);
    return;
  }

  /* =========================
     RECOMENDACIONES POR CV
  ========================= */
  if (userWantsRecommendations(text)) {
    showCvRecommendations();
    return;
  }

  /* =========================
     PREGUNTAS FRECUENTES
  ========================= */
  if (handleFaqResponse(text)) {
    return;
  }

  /* =========================
     BÚSQUEDA POR UBICACIÓN
  ========================= */
  if (userWantsLocation(text)) {
    addAssistantText(
      "📍 Claro. Puedes buscar vacantes por ubicación en nuestro mapa de sucursales."
    );

    addOptions(
      "Continuar con búsqueda por ubicación:",
      [
        {
          label:
            "📍 Abrir mapa de ubicaciones",
          value:
            "buscar_ubicacion"
        }
      ]
    );

    return;
  }

  /* =========================
     CONSULTA DE ESTATUS
  ========================= */
  if (userWantsStatus(text)) {
    addAssistantText(
      "🔑 Para consultar tu estatus, usa tu folio en la sección 'Consultar estatus de mi solicitud'."
    );

    return;
  }

  /* =========================
     SALUDO
  ========================= */
  if (
    normalized.includes("hola") ||
    normalized.includes("buenas")
  ) {
    addOptions(
      "👋 Hola. ¿Cómo deseas continuar?",
      [
        {
          label:
            "📄 Analizar mi CV",
          value:
            "analizar_cv"
        },
        {
          label:
            "📍 Buscar vacantes por ubicación",
          value:
            "buscar_ubicacion"
        },
        {
          label:
            "🎯 Recomendaciones personalizadas",
          value:
            "recomendar_vacantes"
        }
      ]
    );

    return;
  }

  /* =========================
     YA EXISTE ANÁLISIS DE CV
  ========================= */
  if (candidateProfile.resumenIA) {
    addAssistantText(
      "🎯 Puedo ayudarte con recomendaciones basadas en tu CV. Si quieres, escribe: 'qué vacante se adapta a mi perfil' o selecciona una opción."
    );

    addOptions(
      "Opciones disponibles:",
      [
        {
          label:
            "🎯 Ver vacantes recomendadas",
          value:
            "recomendar_vacantes"
        },
        {
          label:
            "📍 Buscar por ubicación",
          value:
            "buscar_ubicacion"
        }
      ]
    );

    return;
  }

  /* =========================
     RESPUESTA GENERAL
  ========================= */
  addAssistantText(
    "🤖 Puedo ayudarte a analizar tu CV, recomendarte vacantes, buscar oportunidades por ubicación o resolver dudas del proceso."
  );

  addOptions(
    "Selecciona una opción:",
    [
      {
        label:
          "📄 Analizar mi CV",
        value:
          "analizar_cv"
      },
      {
        label:
          "📍 Buscar vacantes por ubicación",
        value:
          "buscar_ubicacion"
      }
    ]
  );
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

    if (
  applicationFlow.mode ===
  "dynamic_application"
) {
  applicationFlow.waitingForCvUpload =
    false;

  const config =
    getVacancyApplicationConfig(
      applicationFlow.selectedVacancy
    );

  if (config.cv === "obligatorio") {
    addOptions(
      "✅ CV recibido correctamente. Ya puedes enviar tu postulación.",
      [
        {
          label:
            "🚀 Enviar postulación",
          value:
            "enviar_postulacion"
        }
      ]
    );

    return;
  }

  addOptions(
    "✅ CV recibido correctamente. ¿Deseas enviar tu postulación?",
    [
      {
        label:
          "🚀 Enviar postulación",
        value:
          "enviar_postulacion"
      }
    ]
  );

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


// =========================
// SISTEMA DE TRADUCCIÓN
// =========================

const translations = {
  es: {
    // Footer
    footer_description: "Desde franquicias de gran volumen hasta conceptos originales dirigidos a audiencias específicas, el grupo ha desempeñado un papel versátil e influyente con más de 80 ubicaciones en mercados de toda la República Mexicana y mercados dentro de la línea fronteriza en Texas.",
    site_map: "Mapa del sitio",
    home: "Inicio",
    about_us: "Nosotros",
    concepts: "Conceptos",
    franchises: "Franquicias",
    vacancies: "Vacantes",
    locations: "Ubicaciones",
    contact: "Contacto",
    address: "Cd. Juárez, Chihuahua, México",
    founded: "Fundado en 1994",
    restaurants: "80+ restaurantes",
    stay_updated: "Manténgase actualizado",
    subscribe_text: "Suscríbete para recibir las últimas vacantes y novedades.",
    subscribe_btn: "Suscribirse",
    copyright: "© 2026 Great American Hospitality. Todos los derechos reservados.",
    
    // Placeholders
    email_placeholder: "Tu correo electrónico",
    
    // Mensajes de éxito
    subscribe_success: "¡Gracias por suscribirte!",
    subscribe_error: "Por favor, ingresa un correo válido."
  },
  en: {
    // Footer
    footer_description: "From high-volume franchises to original concepts targeting specific audiences, the group has played a versatile and influential role with over 80 locations in markets throughout the Mexican Republic and border markets in Texas.",
    site_map: "Site Map",
    home: "Home",
    about_us: "About Us",
    concepts: "Concepts",
    franchises: "Franchises",
    vacancies: "Vacancies",
    locations: "Locations",
    contact: "Contact",
    address: "Cd. Juárez, Chihuahua, Mexico",
    founded: "Founded in 1994",
    restaurants: "80+ restaurants",
    stay_updated: "Stay Updated",
    subscribe_text: "Subscribe to receive the latest vacancies and news.",
    subscribe_btn: "Subscribe",
    copyright: "© 2026 Great American Hospitality. All rights reserved.",
    
    // Placeholders
    email_placeholder: "Your email address",
    
    // Mensajes de éxito
    subscribe_success: "Thank you for subscribing!",
    subscribe_error: "Please enter a valid email."
  }
};

let currentLang = 'es';

function setLanguage(lang) {
  currentLang = lang;
  
  // Actualizar botones de idioma
  document.querySelectorAll('.footer__lang').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  
  // Traducir todos los elementos con data-translate
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.dataset.translate;
    if (translations[lang] && translations[lang][key]) {
      // Si es un input, traducir placeholder
      if (element.tagName === 'INPUT' && element.type === 'email') {
        element.placeholder = translations[lang].email_placeholder || translations[lang][key];
      } else {
        element.textContent = translations[lang][key];
      }
    }
  });
  
  // Traducir placeholder del email específicamente
  const emailInput = document.getElementById('footerEmailInput');
  if (emailInput) {
    emailInput.placeholder = translations[lang].email_placeholder || 'Tu correo electrónico';
  }
  
  // Guardar preferencia en localStorage
  try {
    localStorage.setItem('preferred_language', lang);
  } catch (e) {
    // Ignorar errores de localStorage
  }
}

// Event listeners para los botones de idioma
document.addEventListener('DOMContentLoaded', () => {
  const langEs = document.getElementById('lang-es');
  const langEn = document.getElementById('lang-en');
  
  // Cargar idioma guardado
  try {
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
      currentLang = savedLang;
    }
  } catch (e) {
    // Ignorar errores
  }
  
  if (langEs) {
    langEs.addEventListener('click', () => setLanguage('es'));
  }
  
  if (langEn) {
    langEn.addEventListener('click', () => setLanguage('en'));
  }
  
  // Aplicar idioma inicial
  setLanguage(currentLang);
  
  // Manejar suscripción
  const subscribeForm = document.getElementById('footerSubscribeForm');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('footerEmailInput');
      const email = input?.value.trim();
      
      if (email && email.includes('@')) {
        alert(translations[currentLang].subscribe_success);
        input.value = '';
      } else {
        alert(translations[currentLang].subscribe_error);
      }
    });
  }
});



init();