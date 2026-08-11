"use strict";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const API_URL =
  "https://chatbot-reclutamiento-dcqb.onrender.com";

const firebaseConfig = {
  apiKey: "AIzaSyD6t7kfGjBllkzuDVarL7oaECryUa2-fx4",
  authDomain: "chatbotgpt-2eb38.firebaseapp.com",
  projectId: "chatbotgpt-2eb38",
  storageBucket: "chatbotgpt-2eb38.firebasestorage.app",
  messagingSenderId: "762904867561",
  appId: "1:762904867561:web:984b481d3c469ccd057678",
  measurementId: "G-0W817YXQ6T"
};

/*
 * Si Firebase ya se inicializa desde otro archivo
 * o tienes la configuración completa en este mismo
 * proyecto, conserva esa configuración original.
 */
if (
  typeof firebase !== "undefined" &&
  !firebase.apps.length &&
  !firebaseConfig.apiKey.startsWith(
    "REEMPLAZA"
  )
) {
  firebase.initializeApp(
    firebaseConfig
  );
}

const auth =
  typeof firebase !== "undefined" &&
  firebase.apps.length
    ? firebase.auth()
    : null;

/* =========================================================
   ESTADO GENERAL
========================================================= */

let adminToken = "";
let plantillas = [];
let comunicaciones = [];

let activeEditorField = null;
let plantillaSeleccionada = null;

/* =========================================================
   ELEMENTOS GENERALES
========================================================= */

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

const newTemplateBtn =
  document.getElementById(
    "newTemplateBtn"
  );

const sendTestEmailBtn =
  document.getElementById(
    "sendTestEmailBtn"
  );

const quickNewTemplateBtn =
  document.getElementById(
    "quickNewTemplateBtn"
  );

const quickSendTestBtn =
  document.getElementById(
    "quickSendTestBtn"
  );

const quickHistoryBtn =
  document.getElementById(
    "quickHistoryBtn"
  );

const quickAutomationBtn =
  document.getElementById(
    "quickAutomationBtn"
  );

const viewAllTemplatesBtn =
  document.getElementById(
    "viewAllTemplatesBtn"
  );

const refreshCommunicationsBtn =
  document.getElementById(
    "refreshCommunicationsBtn"
  );

/* =========================================================
   ESTADÍSTICAS
========================================================= */

const statSentToday =
  document.getElementById(
    "statSentToday"
  );

const statPending =
  document.getElementById(
    "statPending"
  );

const statErrors =
  document.getElementById(
    "statErrors"
  );

const statDeliveryRate =
  document.getElementById(
    "statDeliveryRate"
  );

/* =========================================================
   LISTADOS
========================================================= */

const templatesGrid =
  document.getElementById(
    "templatesGrid"
  );

const communicationsList =
  document.getElementById(
    "communicationsList"
  );

/* =========================================================
   MODAL DE PLANTILLA
========================================================= */

const templateModal =
  document.getElementById(
    "templateModal"
  );

const closeTemplateBackdrop =
  document.getElementById(
    "closeTemplateBackdrop"
  );

const closeTemplateModalBtn =
  document.getElementById(
    "closeTemplateModalBtn"
  );

const cancelTemplateBtn =
  document.getElementById(
    "cancelTemplateBtn"
  );

const saveTemplateBtn =
  document.getElementById(
    "saveTemplateBtn"
  );

const refreshPreviewBtn =
  document.getElementById(
    "refreshPreviewBtn"
  );

const templateModalTitle =
  document.getElementById(
    "templateModalTitle"
  );

const templateForm =
  document.getElementById(
    "templateForm"
  );

const templateId =
  document.getElementById(
    "templateId"
  );

const templateName =
  document.getElementById(
    "templateName"
  );

const templateType =
  document.getElementById(
    "templateType"
  );

const templateChannel =
  document.getElementById(
    "templateChannel"
  );

const templateLanguage =
  document.getElementById(
    "templateLanguage"
  );

const templateSubject =
  document.getElementById(
    "templateSubject"
  );

const templateText =
  document.getElementById(
    "templateText"
  );

const templateHtml =
  document.getElementById(
    "templateHtml"
  );

const previewSubject =
  document.getElementById(
    "previewSubject"
  );

const templatePreview =
  document.getElementById(
    "templatePreview"
  );

/* =========================================================
   PLANTILLAS INICIALES
========================================================= */

const DEFAULT_TEMPLATES = [
  {
    id:
      "postulacion_recibida",

    nombre:
      "Postulación recibida",

    tipo:
      "postulacion_recibida",

    canal:
      "email",

    idioma:
      "es",

    asunto:
      "Recibimos tu postulación | GA Hospitality",

    contenidoTexto:
`Hola {{nombre}},

Hemos recibido correctamente tu postulación.

Folio: {{folio}}
Vacante: {{vacante}}
Sucursal: {{sucursal}}

Puedes conservar este folio para consultar el avance de tu proceso.

Gracias por tu interés en formar parte de {{empresa}}.`,

    contenidoHtml:
`<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#243047;">
  <div style="background:#101a2c;padding:24px;border-radius:16px 16px 0 0;text-align:center;color:white;">
    <h2 style="margin:0;">GA Hospitality</h2>
    <p style="margin:6px 0 0;color:#b8c4d8;">Departamento de Reclutamiento</p>
  </div>

  <div style="padding:32px;background:#ffffff;border:1px solid #e4e9f0;">
    <h1 style="font-size:25px;margin-top:0;color:#17243a;">
      ¡Gracias por postularte, {{nombre}}!
    </h1>

    <p style="line-height:1.7;color:#566278;">
      Hemos recibido correctamente tu solicitud y nuestro equipo comenzará a revisar tu información.
    </p>

    <div style="margin:24px 0;padding:20px;background:#f5f8fc;border-radius:12px;">
      <p><strong>Folio:</strong> {{folio}}</p>
      <p><strong>Vacante:</strong> {{vacante}}</p>
      <p><strong>Sucursal:</strong> {{sucursal}}</p>
      <p><strong>Estado:</strong> Solicitud recibida</p>
    </div>

    <p style="line-height:1.7;color:#566278;">
      Conserva tu folio para consultar el avance de tu proceso.
    </p>
  </div>

  <div style="padding:18px;background:#f0f3f7;text-align:center;color:#758096;font-size:12px;border-radius:0 0 16px 16px;">
    {{empresa}} · Reclutamiento
  </div>
</div>`,

    activo: true
  },

  {
    id:
      "entrevista_programada",

    nombre:
      "Entrevista programada",

    tipo:
      "entrevista_programada",

    canal:
      "email",

    idioma:
      "es",

    asunto:
      "Tu entrevista ha sido programada | GA Hospitality",

    contenidoTexto:
`Hola {{nombre}},

Tu entrevista ha sido programada.

Vacante: {{vacante}}
Fecha: {{fecha}}
Hora: {{hora}}
Duración: {{duracion}}
Modalidad: {{modalidad}}
Sucursal: {{sucursal}}
Dirección: {{direccion}}
Reclutador: {{reclutador}}

Ubicación:
{{googleMaps}}

Por favor, llega 15 minutos antes.`,

    contenidoHtml:
`<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#243047;">
  <div style="background:linear-gradient(135deg,#111c30,#274c89);padding:28px;border-radius:16px 16px 0 0;text-align:center;color:white;">
    <h2 style="margin:0;">GA Hospitality</h2>
    <p style="margin:7px 0 0;color:#d6e2f6;">Tu entrevista está lista</p>
  </div>

  <div style="padding:32px;background:#ffffff;border:1px solid #e4e9f0;">
    <h1 style="font-size:25px;margin-top:0;color:#17243a;">
      Hola {{nombre}}
    </h1>

    <p style="line-height:1.7;color:#566278;">
      Nos complace informarte que tu entrevista para la vacante
      <strong>{{vacante}}</strong> ha sido programada.
    </p>

    <div style="margin:24px 0;padding:22px;background:#f5f8fc;border-radius:12px;">
      <p><strong>Fecha:</strong> {{fecha}}</p>
      <p><strong>Hora:</strong> {{hora}}</p>
      <p><strong>Duración:</strong> {{duracion}}</p>
      <p><strong>Modalidad:</strong> {{modalidad}}</p>
      <p><strong>Reclutador:</strong> {{reclutador}}</p>
    </div>

    <h3 style="color:#17243a;">Lugar de la entrevista</h3>

    <p style="line-height:1.7;color:#566278;">
      <strong>Sucursal:</strong> {{sucursal}}<br>
      <strong>Dirección:</strong> {{direccion}}
    </p>

    <p style="margin:28px 0;text-align:center;">
      <a
        href="{{googleMaps}}"
        style="display:inline-block;padding:13px 21px;background:#286bd6;color:#ffffff;text-decoration:none;border-radius:9px;font-weight:bold;"
      >
        Abrir ubicación
      </a>
    </p>

    <p style="line-height:1.7;color:#566278;">
      Te recomendamos llegar 15 minutos antes y presentarte en recepción.
    </p>
  </div>

  <div style="padding:18px;background:#f0f3f7;text-align:center;color:#758096;font-size:12px;border-radius:0 0 16px 16px;">
    {{empresa}} · Departamento de Reclutamiento
  </div>
</div>`,

    activo: true
  },

  {
    id:
      "entrevista_reagendada",

    nombre:
      "Entrevista reagendada",

    tipo:
      "entrevista_reagendada",

    canal:
      "email",

    idioma:
      "es",

    asunto:
      "Tu entrevista fue reprogramada | GA Hospitality",

    contenidoTexto:
`Hola {{nombre}},

Tu entrevista ha sido reprogramada.

Nueva fecha: {{fecha}}
Nueva hora: {{hora}}
Vacante: {{vacante}}
Sucursal: {{sucursal}}
Reclutador: {{reclutador}}

Ubicación:
{{googleMaps}}`,

    contenidoHtml:
`<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#243047;">
  <div style="background:#101a2c;padding:25px;text-align:center;color:white;border-radius:16px 16px 0 0;">
    <h2 style="margin:0;">Entrevista reprogramada</h2>
  </div>

  <div style="padding:32px;background:white;border:1px solid #e4e9f0;">
    <h2>Hola {{nombre}}</h2>

    <p>
      Tu entrevista para la vacante
      <strong>{{vacante}}</strong>
      fue reprogramada.
    </p>

    <div style="padding:20px;background:#f5f8fc;border-radius:12px;margin:22px 0;">
      <p><strong>Nueva fecha:</strong> {{fecha}}</p>
      <p><strong>Nueva hora:</strong> {{hora}}</p>
      <p><strong>Sucursal:</strong> {{sucursal}}</p>
      <p><strong>Reclutador:</strong> {{reclutador}}</p>
    </div>

    <p style="text-align:center;">
      <a href="{{googleMaps}}" style="display:inline-block;background:#286bd6;color:white;text-decoration:none;padding:12px 20px;border-radius:8px;">
        Consultar ubicación
      </a>
    </p>
  </div>
</div>`,

    activo: true
  }
];

/* =========================================================
   SEGURIDAD Y ENCABEZADOS
========================================================= */

function authHeaders(
  extraHeaders = {}
) {
  const headers = {
    ...extraHeaders
  };

  if (adminToken) {
    headers.Authorization =
      `Bearer ${adminToken}`;
  }

  return headers;
}

async function obtenerAdminToken() {
  if (!auth?.currentUser) {
    return "";
  }

  try {
    return await auth.currentUser
      .getIdToken(true);
  } catch (error) {
    console.error(
      "Error obteniendo token administrativo:",
      error
    );

    return "";
  }
}

/* =========================================================
   UTILIDADES
========================================================= */

function escapeHtml(
  value = ""
) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(
  value = ""
) {
  return String(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function formatDateTime(
  dateValue
) {
  if (!dateValue) {
    return "Sin fecha";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

function getTodayKey() {
  const now =
    new Date();

  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1
    ).padStart(2, "0"),
    String(
      now.getDate()
    ).padStart(2, "0")
  ].join("-");
}

function getCommunicationDateKey(
  item = {}
) {
  const value =
    item.fechaEnvio ||
    item.fechaCreacion ||
    item.fechaProgramada ||
    "";

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0")
  ].join("-");
}

function scrollToSection(
  element
) {
  element?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================================================
   VARIABLES DE VISTA PREVIA
========================================================= */

const PREVIEW_VARIABLES = {
  nombre:
    "Alejandro Ayala",

  apellido:
    "Ayala",

  folio:
    "1786031353628",

  vacante:
    "Auxiliar de Reclutamiento",

  marca:
    "GA Hospitality",

  sucursal:
    "Lombardo Toledano",

  direccion:
    "Av. Lombardo Toledano 1234, Chihuahua, México",

  fecha:
    "viernes, 7 de agosto de 2026",

  hora:
    "11:54 a. m.",

  duracion:
    "30 minutos",

  modalidad:
    "Presencial",

  reclutador:
    "Juan Carlos Martínez",

  telefono:
    "656 000 0000",

  correo:
    "reclutamiento@gahospitality.com",

  googleMaps:
    "https://maps.google.com",

  empresa:
    "Great American Hospitality"
};

function replaceTemplateVariables(
  content = ""
) {
  let result =
    String(content || "");

  Object.entries(
    PREVIEW_VARIABLES
  ).forEach(
    ([key, value]) => {
      const expression =
        new RegExp(
          `{{\\s*${key}\\s*}}`,
          "gi"
        );

      result =
        result.replace(
          expression,
          value
        );
    }
  );

  return result;
}

/* =========================================================
   MODAL
========================================================= */

function resetTemplateForm() {
  plantillaSeleccionada =
    null;

  templateForm?.reset();

  if (templateId) {
    templateId.value = "";
  }

  if (templateModalTitle) {
    templateModalTitle.textContent =
      "Nueva plantilla";
  }

  if (templateChannel) {
    templateChannel.value =
      "email";
  }

  if (templateLanguage) {
    templateLanguage.value =
      "es";
  }

  if (templateType) {
    templateType.value =
      "postulacion_recibida";
  }

  if (templateSubject) {
    templateSubject.value = "";
  }

  if (templateText) {
    templateText.value = "";
  }

  if (templateHtml) {
    templateHtml.value = "";
  }

  activeEditorField =
    templateHtml;

  updateTemplatePreview();
}

function openTemplateModal(
  template = null
) {
  resetTemplateForm();

  if (template) {
    plantillaSeleccionada =
      template;

    if (templateModalTitle) {
      templateModalTitle.textContent =
        "Editar plantilla";
    }

    if (templateId) {
      templateId.value =
        template.id || "";
    }

    if (templateName) {
      templateName.value =
        template.nombre || "";
    }

    if (templateType) {
      templateType.value =
        template.tipo ||
        template.id ||
        "postulacion_recibida";
    }

    if (templateChannel) {
      templateChannel.value =
        template.canal ||
        "email";
    }

    if (templateLanguage) {
      templateLanguage.value =
        template.idioma ||
        "es";
    }

    if (templateSubject) {
      templateSubject.value =
        template.asunto || "";
    }

    if (templateText) {
      templateText.value =
        template.contenidoTexto ||
        "";
    }

    if (templateHtml) {
      templateHtml.value =
        template.contenidoHtml ||
        "";
    }
  }

  updateTemplatePreview();

  templateModal?.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";

  setTimeout(() => {
    templateName?.focus();
  }, 100);
}

function closeTemplateModal() {
  templateModal?.classList.add(
    "hidden"
  );

  document.body.style.overflow =
    "";

  resetTemplateForm();
}

/* =========================================================
   VISTA PREVIA
========================================================= */

function updateTemplatePreview() {
  if (previewSubject) {
    previewSubject.textContent =
      replaceTemplateVariables(
        templateSubject?.value ||
        "Asunto del correo"
      );
  }

  if (!templatePreview) {
    return;
  }

  const html =
    templateHtml?.value.trim() ||
    "";

  const text =
    templateText?.value.trim() ||
    "";

  if (html) {
    templatePreview.innerHTML =
      replaceTemplateVariables(
        html
      );

    return;
  }

  if (text) {
    templatePreview.innerHTML = `
      <div class="email-preview__logo">
        GA Hospitality
      </div>

      <div style="white-space:pre-wrap;line-height:1.7;">
        ${escapeHtml(
          replaceTemplateVariables(
            text
          )
        )}
      </div>
    `;

    return;
  }

  templatePreview.innerHTML = `
    <div class="email-preview__logo">
      GA Hospitality
    </div>

    <h2>
      Hola Alejandro
    </h2>

    <p>
      Aquí podrás revisar el contenido de la plantilla antes de guardarla.
    </p>
  `;
}

/* =========================================================
   VARIABLES DINÁMICAS
========================================================= */

function insertVariableIntoField(
  field,
  variable
) {
  if (!field || !variable) {
    return;
  }

  const start =
    field.selectionStart ??
    field.value.length;

  const end =
    field.selectionEnd ??
    field.value.length;

  const currentValue =
    field.value;

  field.value =
    currentValue.slice(0, start) +
    variable +
    currentValue.slice(end);

  const nextPosition =
    start + variable.length;

  field.focus();

  field.setSelectionRange(
    nextPosition,
    nextPosition
  );

  updateTemplatePreview();
}

/* =========================================================
   CARGA DE PLANTILLAS
========================================================= */

async function cargarPlantillas() {
  try {
    const response =
      await fetch(
        `${API_URL}/api/plantillas-comunicacion`,
        {
          headers:
            authHeaders()
        }
      );

    if (!response.ok) {
      throw new Error(
        "Ruta de plantillas todavía no disponible."
      );
    }

    const data =
      await response.json();

    plantillas =
      Array.isArray(data)
        ? data
        : Array.isArray(
            data.plantillas
          )
          ? data.plantillas
          : [];

    if (!plantillas.length) {
      plantillas =
        [...DEFAULT_TEMPLATES];
    }
  } catch (error) {
    console.warn(
      "Se utilizarán plantillas iniciales:",
      error.message
    );

    plantillas =
      [...DEFAULT_TEMPLATES];
  }

  renderPlantillas();
}

function renderPlantillas() {
  if (!templatesGrid) {
    return;
  }

  const templatesToRender =
    plantillas.length
      ? plantillas
      : DEFAULT_TEMPLATES;

  templatesGrid.innerHTML =
    templatesToRender
      .map((template) => {
        const statusClass =
          template.activo === false
            ? "template-status--inactive"
            : "template-status--active";

        const statusText =
          template.activo === false
            ? "Inactiva"
            : "Activa";

        const icon =
          getTemplateIcon(
            template.tipo ||
            template.id
          );

        return `
          <article
            class="template-card"
            data-template="${escapeHtml(
              template.id
            )}"
          >
            <div class="template-card__top">
              <span class="template-card__icon">
                ${icon}
              </span>

              <span class="template-status ${statusClass}">
                ${statusText}
              </span>
            </div>

            <h3>
              ${escapeHtml(
                template.nombre ||
                "Plantilla"
              )}
            </h3>

            <p>
              ${escapeHtml(
                getTemplateDescription(
                  template.tipo ||
                  template.id
                )
              )}
            </p>

            <div class="template-card__meta">
              <span>
                ${escapeHtml(
                  getChannelLabel(
                    template.canal
                  )
                )}
              </span>

              <span>
                ${template.idioma === "en"
                  ? "Inglés"
                  : "Español"}
              </span>
            </div>

            <button
              class="btn btn--secondary template-edit-btn"
              type="button"
              data-template-id="${escapeHtml(
                template.id
              )}"
            >
              Editar plantilla
            </button>
          </article>
        `;
      })
      .join("");

  bindTemplateCardEvents();
}

function getTemplateIcon(
  type = ""
) {
  const icons = {
    postulacion_recibida:
      "📥",

    entrevista_programada:
      "📅",

    entrevista_reagendada:
      "🔄",

    recordatorio_entrevista:
      "⏰",

    candidato_aprobado:
      "✅",

    candidato_no_seleccionado:
      "💬"
  };

  return icons[type] || "📧";
}

function getTemplateDescription(
  type = ""
) {
  const descriptions = {
    postulacion_recibida:
      "Confirmación inmediata después de enviar una solicitud.",

    entrevista_programada:
      "Fecha, horario, ubicación, entrevistador e instrucciones de llegada.",

    entrevista_reagendada:
      "Notifica automáticamente la nueva fecha y el nuevo horario.",

    recordatorio_entrevista:
      "Recordatorio previo con mapa, horario e indicaciones importantes.",

    candidato_aprobado:
      "Comunicación para avanzar a contratación o a la siguiente etapa.",

    candidato_no_seleccionado:
      "Mensaje respetuoso y profesional para cerrar el proceso."
  };

  return (
    descriptions[type] ||
    "Plantilla reutilizable del Communication Center."
  );
}

function getChannelLabel(
  channel = ""
) {
  if (channel === "whatsapp") {
    return "WhatsApp";
  }

  if (channel === "ambos") {
    return "Email y WhatsApp";
  }

  return "Email";
}

function bindTemplateCardEvents() {
  document
    .querySelectorAll(
      ".template-edit-btn"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const id =
            button.dataset
              .templateId;

          const template =
            plantillas.find(
              (item) =>
                item.id === id
            ) ||
            DEFAULT_TEMPLATES.find(
              (item) =>
                item.id === id
            );

          openTemplateModal(
            template || null
          );
        }
      );
    });
}

/* =========================================================
   GUARDAR PLANTILLA
========================================================= */

function buildTemplatePayload() {
  const currentId =
    templateId?.value.trim();

  return {
    id:
      currentId ||
      `tpl-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

    nombre:
      templateName?.value.trim() ||
      "",

    tipo:
      templateType?.value ||
      "postulacion_recibida",

    canal:
      templateChannel?.value ||
      "email",

    idioma:
      templateLanguage?.value ||
      "es",

    asunto:
      templateSubject?.value.trim() ||
      "",

    contenidoTexto:
      templateText?.value ||
      "",

    contenidoHtml:
      templateHtml?.value ||
      "",

    activo:
      plantillaSeleccionada
        ?.activo !== false,

    fechaActualizacion:
      new Date().toISOString()
  };
}

function validateTemplatePayload(
  payload
) {
  if (!payload.nombre) {
    return "Ingresa el nombre de la plantilla.";
  }

  if (!payload.asunto) {
    return "Ingresa el asunto del correo.";
  }

  if (
    !payload.contenidoTexto.trim() &&
    !payload.contenidoHtml.trim()
  ) {
    return "Agrega contenido de texto o contenido HTML.";
  }

  return "";
}

async function guardarPlantilla() {
  const payload =
    buildTemplatePayload();

  const validationError =
    validateTemplatePayload(
      payload
    );

  if (validationError) {
    window.alert(
      validationError
    );

    return;
  }

  const isEdit =
    Boolean(
      plantillaSeleccionada?.id
    );

  if (saveTemplateBtn) {
    saveTemplateBtn.disabled =
      true;

    saveTemplateBtn.textContent =
      isEdit
        ? "Actualizando..."
        : "Guardando...";
  }

  try {
    const url =
      isEdit
        ? `${API_URL}/api/plantillas-comunicacion/${encodeURIComponent(
            payload.id
          )}`
        : `${API_URL}/api/plantillas-comunicacion`;

    const method =
      isEdit
        ? "PUT"
        : "POST";

    const response =
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

    if (!response.ok) {
      throw new Error(
        "El backend de plantillas todavía no está conectado."
      );
    }

    await response.json();

    await cargarPlantillas();

    closeTemplateModal();

    window.alert(
      isEdit
        ? "Plantilla actualizada correctamente."
        : "Plantilla creada correctamente."
    );
  } catch (error) {
    console.warn(
      "Guardado temporal en navegador:",
      error.message
    );

    const index =
      plantillas.findIndex(
        (item) =>
          item.id === payload.id
      );

    if (index >= 0) {
      plantillas[index] = {
        ...plantillas[index],
        ...payload
      };
    } else {
      plantillas.unshift(
        payload
      );
    }

    /*
     * Persistencia provisional mientras
     * se crean las rutas del backend.
     */
    localStorage.setItem(
      "communication_center_templates",
      JSON.stringify(
        plantillas
      )
    );

    renderPlantillas();
    closeTemplateModal();

    window.alert(
      "La plantilla quedó guardada temporalmente en este navegador. En el siguiente bloque conectaremos las rutas del servidor."
    );
  } finally {
    if (saveTemplateBtn) {
      saveTemplateBtn.disabled =
        false;

      saveTemplateBtn.textContent =
        "Guardar plantilla";
    }
  }
}

function cargarPlantillasLocales() {
  try {
    const saved =
      localStorage.getItem(
        "communication_center_templates"
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Error leyendo plantillas locales:",
      error
    );

    return [];
  }
}

/* =========================================================
   COMUNICACIONES
========================================================= */

async function cargarComunicaciones() {
  if (communicationsList) {
    communicationsList.innerHTML = `
      <div class="communications-loading">
        Cargando comunicaciones...
      </div>
    `;
  }

  try {
    const response =
      await fetch(
        `${API_URL}/api/comunicaciones`,
        {
          headers:
            authHeaders()
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "No fue posible cargar las comunicaciones."
      );
    }

    comunicaciones =
      Array.isArray(data)
        ? data
        : Array.isArray(
            data.comunicaciones
          )
          ? data.comunicaciones
          : [];
  } catch (error) {
    console.warn(
      "Communication Center sin historial conectado:",
      error.message
    );

    comunicaciones = [];
  }

  renderComunicaciones();
  actualizarEstadisticas();
}

function renderComunicaciones() {
  if (!communicationsList) {
    return;
  }

  if (!comunicaciones.length) {
    communicationsList.innerHTML = `
      <div class="communications-empty">
        Aún no hay comunicaciones registradas.
      </div>
    `;

    return;
  }

  communicationsList.innerHTML =
    comunicaciones
      .map((item) => {
        const state =
          normalizeText(
            item.estado ||
            "creado"
          )
            .replaceAll(
              " ",
              "_"
            );

        const channel =
          normalizeText(
            item.canal ||
            "email"
          );

        return `
          <article class="communication-row">
            <div class="communication-row__candidate">
              <strong>
                ${escapeHtml(
                  item.candidatoNombre ||
                  item.nombreCandidato ||
                  "Candidato"
                )}
              </strong>

              <small>
                ${escapeHtml(
                  item.destinatario ||
                  "Sin destinatario"
                )}
              </small>
            </div>

            <span class="communication-row__text">
              ${escapeHtml(
                item.tipo ||
                "Comunicación"
              )}
            </span>

            <span class="communication-channel ${
              channel === "whatsapp"
                ? "communication-channel--whatsapp"
                : ""
            }">
              ${escapeHtml(
                getChannelLabel(
                  channel
                )
              )}
            </span>

            <span class="communication-state communication-state--${escapeHtml(
              state
            )}">
              ${escapeHtml(
                String(
                  item.estado ||
                  "creado"
                ).replaceAll(
                  "_",
                  " "
                )
              )}
            </span>

            <span class="communication-row__text">
              ${escapeHtml(
                formatDateTime(
                  item.fechaEnvio ||
                  item.fechaCreacion ||
                  item.fechaProgramada
                )
              )}
            </span>

            <button
              class="btn btn--secondary communication-row__action"
              type="button"
              data-communication-id="${escapeHtml(
                item.id
              )}"
            >
              Ver
            </button>
          </article>
        `;
      })
      .join("");
}

/* =========================================================
   ESTADÍSTICAS
========================================================= */

function actualizarEstadisticas() {
  const today =
    getTodayKey();

  const sentStates = [
    "enviado",
    "entregado",
    "abierto"
  ];

  const deliveredStates = [
    "entregado",
    "abierto"
  ];

  const sentToday =
    comunicaciones.filter(
      (item) =>
        sentStates.includes(
          normalizeText(
            item.estado
          )
        ) &&
        getCommunicationDateKey(
          item
        ) === today
    ).length;

  const pending =
    comunicaciones.filter(
      (item) =>
        [
          "pendiente",
          "procesando"
        ].includes(
          normalizeText(
            item.estado
          )
        )
    ).length;

  const errors =
    comunicaciones.filter(
      (item) =>
        normalizeText(
          item.estado
        ) === "error"
    ).length;

  const sentTotal =
    comunicaciones.filter(
      (item) =>
        sentStates.includes(
          normalizeText(
            item.estado
          )
        )
    ).length;

  const deliveredTotal =
    comunicaciones.filter(
      (item) =>
        deliveredStates.includes(
          normalizeText(
            item.estado
          )
        )
    ).length;

  const deliveryRate =
    sentTotal
      ? Math.round(
          (
            deliveredTotal /
            sentTotal
          ) * 100
        )
      : 0;

  if (statSentToday) {
    statSentToday.textContent =
      String(sentToday);
  }

  if (statPending) {
    statPending.textContent =
      String(pending);
  }

  if (statErrors) {
    statErrors.textContent =
      String(errors);
  }

  if (statDeliveryRate) {
    statDeliveryRate.textContent =
      `${deliveryRate}%`;
  }
}

/* =========================================================
   ENVÍO DE PRUEBA — PREPARACIÓN
========================================================= */

function solicitarCorreoPrueba() {
  const email =
    window.prompt(
      "Ingresa el correo donde deseas recibir la prueba:"
    );

  if (!email) {
    return;
  }

  const cleanEmail =
    email.trim();

  const validEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(cleanEmail);

  if (!validEmail) {
    window.alert(
      "Ingresa un correo electrónico válido."
    );

    return;
  }

  window.alert(
    `Correo de prueba preparado para ${cleanEmail}. En el siguiente bloque conectaremos el proveedor real de correo.`
  );
}

/* =========================================================
   EVENTOS
========================================================= */

function bindEvents() {
  newTemplateBtn?.addEventListener(
    "click",
    () =>
      openTemplateModal()
  );

  quickNewTemplateBtn?.addEventListener(
    "click",
    () =>
      openTemplateModal()
  );

  sendTestEmailBtn?.addEventListener(
    "click",
    solicitarCorreoPrueba
  );

  quickSendTestBtn?.addEventListener(
    "click",
    solicitarCorreoPrueba
  );

  quickHistoryBtn?.addEventListener(
    "click",
    () =>
      scrollToSection(
        communicationsList
          ?.closest(
            ".communications-card"
          )
      )
  );

  quickAutomationBtn?.addEventListener(
    "click",
    () => {
      window.alert(
        "El módulo de automatizaciones se agregará después de conectar las plantillas y los correos."
      );
    }
  );

  viewAllTemplatesBtn?.addEventListener(
    "click",
    () =>
      scrollToSection(
        templatesGrid
      )
  );

  refreshCommunicationsBtn
    ?.addEventListener(
      "click",
      cargarComunicaciones
    );

  closeTemplateBackdrop
    ?.addEventListener(
      "click",
      closeTemplateModal
    );

  closeTemplateModalBtn
    ?.addEventListener(
      "click",
      closeTemplateModal
    );

  cancelTemplateBtn
    ?.addEventListener(
      "click",
      closeTemplateModal
    );

  saveTemplateBtn
    ?.addEventListener(
      "click",
      guardarPlantilla
    );

  refreshPreviewBtn
    ?.addEventListener(
      "click",
      updateTemplatePreview
    );

  [
    templateName,
    templateSubject,
    templateText,
    templateHtml
  ]
    .filter(Boolean)
    .forEach((field) => {
      field.addEventListener(
        "input",
        updateTemplatePreview
      );

      field.addEventListener(
        "focus",
        () => {
          if (
            field === templateText ||
            field === templateHtml ||
            field === templateSubject
          ) {
            activeEditorField =
              field;
          }
        }
      );
    });

  document
    .querySelectorAll(
      "[data-variable]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const variable =
            button.dataset.variable;

          insertVariableIntoField(
            activeEditorField ||
            templateHtml,
            variable
          );
        }
      );
    });

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !templateModal
          ?.classList
          .contains("hidden")
      ) {
        closeTemplateModal();
      }
    }
  );

  logoutBtn?.addEventListener(
    "click",
    async () => {
      try {
        if (auth) {
          await auth.signOut();
        }

        window.location.href =
          "login-admin.html";
      } catch (error) {
        console.error(
          "Error cerrando sesión:",
          error
        );
      }
    }
  );
}

/* =========================================================
   INICIALIZACIÓN
========================================================= */

async function iniciarCommunicationCenter() {
  bindEvents();

  const localTemplates =
    cargarPlantillasLocales();

  if (localTemplates.length) {
    plantillas =
      localTemplates;

    renderPlantillas();
  } else {
    plantillas =
      [...DEFAULT_TEMPLATES];

    renderPlantillas();
  }

  if (auth) {
    auth.onAuthStateChanged(
      async (user) => {
        if (!user) {
          window.location.href =
            "login-admin.html";

          return;
        }

        adminToken =
          await obtenerAdminToken();

        await Promise.all([
          cargarPlantillas(),
          cargarComunicaciones()
        ]);
      }
    );

    return;
  }

  /*
   * Modo de desarrollo mientras se
   * conecta la autenticación.
   */
  await Promise.all([
    cargarPlantillas(),
    cargarComunicaciones()
  ]);
}

document.addEventListener(
  "DOMContentLoaded",
  iniciarCommunicationCenter
);