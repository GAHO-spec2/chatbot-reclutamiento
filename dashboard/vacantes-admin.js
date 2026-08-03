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

let preguntasPersonalizadas = [];

let vacantes = [];
let ubicaciones = {};

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
      <div class="dashboard-card__top">
        <div>
          <h3>${escapeHtml(vacante.titulo || "Sin título")}</h3>
          <p>${escapeHtml(vacante.grupo || "-")} • ${escapeHtml(vacante.area || "-")}</p>
        </div>
        <span class="estado estado--pendiente">${escapeHtml(vacante.tipoVacante || "-")}</span>
      </div>

      <div class="dashboard-card__info">
        <p><strong>Ubicación:</strong> ${escapeHtml(vacante.pais || "-")} / ${escapeHtml(vacante.estado || "-")} / ${escapeHtml(vacante.ciudad || "-")}</p>
        <p><strong>Sucursal:</strong> ${escapeHtml(vacante.sucursal || "-")}</p>
        <p><strong>Número tienda:</strong> ${escapeHtml(vacante.numeroTienda || "-")}</p>
        <p><strong>Dirección:</strong> ${escapeHtml(vacante.direccion || "-")}</p>
        <p><strong>Coordenadas:</strong> ${coordenadasTexto}</p>
        <p><strong>Requisitos:</strong> ${requisitosTexto}</p>
      </div>

      <div class="dashboard-card__actions">
        ${googleBtnHtml}
        ${appleBtnHtml}
        <button class="btn btn--secondary edit-vacante-btn" data-id="${escapeHtml(vacante.id)}">Editar</button>
        <button class="btn btn--secondary delete-vacante-btn" data-id="${escapeHtml(vacante.id)}">Eliminar</button>
      </div>
    `;

    vacantesAdminList.appendChild(card);
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

function validarPreguntasPersonalizadas() {
  for (const pregunta of preguntasPersonalizadas) {
    if (!pregunta.texto.trim()) {
      return {
        ok: false,
        error:
          `Completa el texto de la pregunta ${pregunta.orden}.`
      };
    }

    if (
      pregunta.tipo === "seleccion" &&
      (!Array.isArray(pregunta.opciones) ||
        pregunta.opciones.length < 2)
    ) {
      return {
        ok: false,
        error:
          `La pregunta ${pregunta.orden} debe tener al menos dos opciones.`
      };
    }
  }

  return { ok: true };
}

if (vacanteCvPolicy) {
  vacanteCvPolicy.value = "opcional";
}

if (vacanteSolicitarTelefono) {
  vacanteSolicitarTelefono.checked = true;
}

if (vacanteSolicitarCorreo) {
  vacanteSolicitarCorreo.checked = true;
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
  vacanteEstado.innerHTML = `<option value="">Selecciona</option>`;
  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;
  vacanteSucursal.value = "";

  if (vacanteNumeroTienda) vacanteNumeroTienda.value = "";
  if (vacanteDireccion) vacanteDireccion.value = "";
  if (vacanteGoogleMapsUrl) vacanteGoogleMapsUrl.value = "";
  if (vacanteAppleMapsUrl) vacanteAppleMapsUrl.value = "";
  if (vacanteLat) vacanteLat.value = "";
  if (vacanteLng) vacanteLng.value = "";

  vacanteRequisitos.value = "";
}

function openVacanteModal(vacante = null) {
  resetVacanteForm();

  if (vacante) {
    vacanteModalTitle.textContent = "Editar vacante";

    vacanteIdEdit.value = vacante.id || "";
    vacanteTipo.value = vacante.tipoVacante || "";
    vacanteGrupo.value = vacante.grupo || "";
    vacanteTituloInput.value = vacante.titulo || "";
    vacanteArea.value = vacante.area || "";
    vacantePais.value = vacante.pais || "";

    llenarEstadosModal();

    vacanteEstado.value = vacante.estado || "";

    llenarCiudadesModal();

    vacanteCiudad.value = vacante.ciudad || "";
    vacanteSucursal.value = vacante.sucursal || "";

    if (vacanteNumeroTienda) vacanteNumeroTienda.value = vacante.numeroTienda || "";
    if (vacanteDireccion) vacanteDireccion.value = vacante.direccion || "";
    if (vacanteGoogleMapsUrl) vacanteGoogleMapsUrl.value = vacante.googleMapsUrl || "";
    if (vacanteAppleMapsUrl) vacanteAppleMapsUrl.value = vacante.appleMapsUrl || "";

    if (vacanteLat) {
      vacanteLat.value = "";
      if (vacante.lat !== null && vacante.lat !== undefined) {
        vacanteLat.value = vacante.lat;
      }
    }

    if (vacanteLng) {
      vacanteLng.value = "";
      if (vacante.lng !== null && vacante.lng !== undefined) {
        vacanteLng.value = vacante.lng;
      }
    }

    if (Array.isArray(vacante.requisitos)) {
      vacanteRequisitos.value = vacante.requisitos.join(", ");
    } else {
      vacanteRequisitos.value = "";
    }
  } else {
    vacanteModalTitle.textContent = "Nueva vacante";
  }

  vacanteModal.classList.remove("hidden");
}

function closeVacanteModal() {
  vacanteModal.classList.add("hidden");
  resetVacanteForm();
}

/* =========================
   GUARDAR VACANTE
========================= */
async function guardarVacante() {
  const validacionPreguntas =
    validarPreguntasPersonalizadas();

  if (!validacionPreguntas.ok) {
    setVacantesStatus(
      `⚠️ ${validacionPreguntas.error}`
    );
    return;
  }

  const payload = {
    tipoVacante: vacanteTipo.value,
    grupo: vacanteGrupo.value.trim(),
    titulo: vacanteTituloInput.value.trim(),
    area: vacanteArea.value.trim(),
    pais: vacantePais.value,
    estado: vacanteEstado.value,
    ciudad: vacanteCiudad.value,
    sucursal: vacanteSucursal.value.trim(),

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
      obtenerNumero(vacanteLat?.value),

    lng:
      obtenerNumero(vacanteLng?.value),

    requisitos:
      vacanteRequisitos.value
        .split(",")
        .map((requisito) => requisito.trim())
        .filter(Boolean),

    configuracionPostulacion: {
      cv:
        vacanteCvPolicy?.value ||
        "opcional",

      solicitarTelefono:
        Boolean(
          vacanteSolicitarTelefono?.checked
        ),

      solicitarCorreo:
        Boolean(
          vacanteSolicitarCorreo?.checked
        ),

      solicitarExperiencia:
        Boolean(
          vacanteSolicitarExperiencia?.checked
        ),

      solicitarEscolaridad:
        Boolean(
          vacanteSolicitarEscolaridad?.checked
        ),

      solicitarDisponibilidad:
        Boolean(
          vacanteSolicitarDisponibilidad?.checked
        )
    },

    preguntasPersonalizadas:
      preguntasPersonalizadas.map(
        (pregunta, index) => {
          let opciones = [];

          if (pregunta.tipo === "si_no") {
            opciones = ["Sí", "No"];
          }

          if (
            pregunta.tipo === "seleccion"
          ) {
            opciones = Array.isArray(
              pregunta.opciones
            )
              ? pregunta.opciones
                  .map((opcion) =>
                    String(opcion).trim()
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

            orden: index + 1
          };
        }
      )
  };

  if (!payload.googleMapsUrl) {
    payload.googleMapsUrl =
      crearGoogleMapsUrlDesdeDatos(payload);
  }

  if (!payload.appleMapsUrl) {
    payload.appleMapsUrl =
      crearAppleMapsUrlDesdeDatos(payload);
  }

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
      "⚠️ Completa todos los campos obligatorios de la vacante."
    );
    return;
  }

  const politicasCvValidas = [
    "obligatorio",
    "opcional",
    "no_solicitar"
  ];

  if (
    !politicasCvValidas.includes(
      payload.configuracionPostulacion.cv
    )
  ) {
    setVacantesStatus(
      "⚠️ Selecciona una configuración válida para el currículum."
    );
    return;
  }

  if (!adminToken) {
    setVacantesStatus(
      "⚠️ Tu sesión administrativa no está lista. Cierra sesión e inicia sesión de nuevo."
    );
    return;
  }

  try {
    const isEdit = Boolean(
      vacanteIdEdit.value
    );

    const vacanteId =
      encodeURIComponent(
        vacanteIdEdit.value
      );

    const url = isEdit
      ? `${API_URL}/api/vacantes/${vacanteId}`
      : `${API_URL}/api/vacantes`;

    const method = isEdit
      ? "PUT"
      : "POST";

    if (saveVacanteBtn) {
      saveVacanteBtn.disabled = true;

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

    const res = await fetch(url, {
      method,
      headers: authHeaders({
        "Content-Type":
          "application/json"
      }),
      body: JSON.stringify(payload)
    });

    let data = {};

    try {
      data = await res.json();
    } catch (jsonError) {
      console.warn(
        "La respuesta del servidor no contiene JSON válido:",
        jsonError
      );
    }

    if (!res.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `No fue posible guardar la vacante. Error ${res.status}`
      );
    }

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
    if (saveVacanteBtn) {
      saveVacanteBtn.disabled = false;
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
/* =========================
   INIT
========================= */
async function init() {
  await cargarUbicaciones();

  if (adminFiltroPais && adminFiltroEstado && adminFiltroCiudad) {
    llenarEstados(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
  }

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