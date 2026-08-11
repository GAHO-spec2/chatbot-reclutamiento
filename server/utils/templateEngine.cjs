"use strict";

/* =========================================================
   MOTOR DE PLANTILLAS
   Reemplaza variables como {{nombre}}, {{folio}}, etc.
========================================================= */

/**
 * Convierte un valor en texto seguro.
 */
function convertirATexto(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  if (valor instanceof Date) {
    return valor.toISOString();
  }

  if (typeof valor === "object") {
    try {
      return JSON.stringify(valor);
    } catch {
      return "";
    }
  }

  return String(valor);
}

/**
 * Escapa caracteres que podrían romper el HTML.
 */
function escaparHtml(valor = "") {
  return convertirATexto(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Normaliza las claves disponibles.
 *
 * Permite recibir:
 *
 * {
 *   nombre: "Alejandro",
 *   candidato: {
 *     correo: "correo@ejemplo.com"
 *   }
 * }
 */
function obtenerValorPorRuta(
  datos = {},
  ruta = ""
) {
  const partes = String(ruta)
    .trim()
    .split(".")
    .filter(Boolean);

  let valorActual = datos;

  for (const parte of partes) {
    if (
      valorActual === null ||
      valorActual === undefined ||
      typeof valorActual !== "object"
    ) {
      return undefined;
    }

    valorActual =
      valorActual[parte];
  }

  return valorActual;
}

/**
 * Obtiene todas las variables encontradas en una plantilla.
 *
 * Ejemplo:
 *
 * "Hola {{nombre}}, tu folio es {{folio}}"
 *
 * Resultado:
 *
 * ["nombre", "folio"]
 */
function obtenerVariablesPlantilla(
  contenido = ""
) {
  const variables =
    new Set();

  const expresion =
    /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;

  let coincidencia;

  while (
    (
      coincidencia =
        expresion.exec(
          String(contenido || "")
        )
    ) !== null
  ) {
    variables.add(
      coincidencia[1]
    );
  }

  return [
    ...variables
  ];
}

/**
 * Reemplaza las variables de una plantilla.
 *
 * escapeHtml:
 * - true: protege valores insertados dentro de HTML.
 * - false: inserta el texto sin escapar.
 *
 * mantenerDesconocidas:
 * - true: conserva {{variable}} si no existe.
 * - false: reemplaza la variable desconocida con vacío.
 */
function renderizarPlantilla(
  contenido = "",
  datos = {},
  opciones = {}
) {
  const {
    escapeHtml = false,
    mantenerDesconocidas = true
  } = opciones;

  return String(
    contenido || ""
  ).replace(
    /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g,
    (
      coincidencia,
      nombreVariable
    ) => {
      const valor =
        obtenerValorPorRuta(
          datos,
          nombreVariable
        );

      if (
        valor === undefined ||
        valor === null
      ) {
        return mantenerDesconocidas
          ? coincidencia
          : "";
      }

      const texto =
        convertirATexto(
          valor
        );

      return escapeHtml
        ? escaparHtml(texto)
        : texto;
    }
  );
}

/**
 * Renderiza asunto, texto y HTML de una plantilla.
 */
function renderizarComunicacion({
  plantilla = {},
  variables = {},
  mantenerDesconocidas = false
} = {}) {
  return {
    id:
      plantilla.id || "",

    nombre:
      plantilla.nombre || "",

    tipo:
      plantilla.tipo || "",

    canal:
      plantilla.canal ||
      "email",

    idioma:
      plantilla.idioma ||
      "es",

    asunto:
      renderizarPlantilla(
        plantilla.asunto || "",
        variables,
        {
          escapeHtml: false,
          mantenerDesconocidas
        }
      ),

    contenidoTexto:
      renderizarPlantilla(
        plantilla.contenidoTexto ||
          "",
        variables,
        {
          escapeHtml: false,
          mantenerDesconocidas
        }
      ),

    contenidoHtml:
      renderizarPlantilla(
        plantilla.contenidoHtml ||
          "",
        variables,
        {
          /*
           * Los datos dinámicos se protegen
           * antes de insertarse en el HTML.
           */
          escapeHtml: true,
          mantenerDesconocidas
        }
      )
  };
}

/**
 * Verifica cuáles variables requiere una plantilla
 * y cuáles no fueron proporcionadas.
 */
function validarVariablesPlantilla({
  plantilla = {},
  variables = {}
} = {}) {
  const contenidoCompleto = [
    plantilla.asunto || "",
    plantilla.contenidoTexto || "",
    plantilla.contenidoHtml || ""
  ].join("\n");

  const requeridas =
    obtenerVariablesPlantilla(
      contenidoCompleto
    );

  const faltantes =
    requeridas.filter(
      (nombreVariable) => {
        const valor =
          obtenerValorPorRuta(
            variables,
            nombreVariable
          );

        return (
          valor === undefined ||
          valor === null ||
          convertirATexto(
            valor
          ).trim() === ""
        );
      }
    );

  return {
    valido:
      faltantes.length === 0,

    requeridas,
    faltantes
  };
}

/**
 * Datos de ejemplo utilizados en vistas previas
 * y correos de prueba.
 */
function obtenerVariablesEjemplo() {
  return {
    nombre:
      "Alejandro Ayala",

    apellido:
      "Ayala",

    folio:
      "1786031353628",

    vacante:
      "Auxiliar de Reclutamiento",

    puesto:
      "Auxiliar de Reclutamiento",

    marca:
      "GA Hospitality",

    sucursal:
      "Lombardo Toledano",

    region:
      "Chihuahua",

    ciudad:
      "Chihuahua",

    direccion:
      "Av. Lombardo Toledano 1234, Chihuahua, México",

    googleMaps:
      "https://maps.google.com",

    appleMaps:
      "https://maps.apple.com",

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

    reclutadorCargo:
      "Especialista de Reclutamiento",

    reclutadorCorreo:
      "reclutamiento@gahospitality.com",

    reclutadorTelefono:
      "656 000 0000",

    correo:
      "alejandro@ejemplo.com",

    telefono:
      "656 123 4567",

    empresa:
      "Great American Hospitality",

    confirmarUrl:
      "https://ejemplo.com/confirmar",

    reagendarUrl:
      "https://ejemplo.com/reagendar",

    estatusUrl:
      "https://ejemplo.com/estatus"
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  convertirATexto,
  escaparHtml,
  obtenerValorPorRuta,
  obtenerVariablesPlantilla,
  renderizarPlantilla,
  renderizarComunicacion,
  validarVariablesPlantilla,
  obtenerVariablesEjemplo
};