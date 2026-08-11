"use strict";

const {
  renderizarComunicacion,
  validarVariablesPlantilla,
  obtenerVariablesPlantilla,
  obtenerVariablesEjemplo
} = require(
  "../utils/templateEngine.cjs"
);

/* =========================================================
   SERVICIO DE PLANTILLAS
========================================================= */

function limpiarTexto(
  value = ""
) {
  return String(
    value ?? ""
  ).trim();
}

function normalizarCanal(
  value = "email"
) {
  const canal =
    limpiarTexto(value)
      .toLowerCase();

  const permitidos = [
    "email",
    "whatsapp",
    "ambos"
  ];

  return permitidos.includes(
    canal
  )
    ? canal
    : "email";
}

function normalizarIdioma(
  value = "es"
) {
  const idioma =
    limpiarTexto(value)
      .toLowerCase();

  return [
    "es",
    "en"
  ].includes(idioma)
    ? idioma
    : "es";
}

function validarDatosPlantilla(
  datos = {},
  {
    requiereId = false
  } = {}
) {
  const errores = [];

  const id =
    limpiarTexto(
      datos.id
    );

  const nombre =
    limpiarTexto(
      datos.nombre
    );

  const tipo =
    limpiarTexto(
      datos.tipo
    );

  const asunto =
    limpiarTexto(
      datos.asunto
    );

  const contenidoTexto =
    String(
      datos.contenidoTexto ??
      ""
    );

  const contenidoHtml =
    String(
      datos.contenidoHtml ??
      ""
    );

  if (
    requiereId &&
    !id
  ) {
    errores.push(
      "El identificador de la plantilla es obligatorio."
    );
  }

  if (!nombre) {
    errores.push(
      "El nombre de la plantilla es obligatorio."
    );
  }

  if (!tipo) {
    errores.push(
      "El tipo de plantilla es obligatorio."
    );
  }

  if (!asunto) {
    errores.push(
      "El asunto de la plantilla es obligatorio."
    );
  }

  if (
    !contenidoTexto.trim() &&
    !contenidoHtml.trim()
  ) {
    errores.push(
      "La plantilla debe tener contenido de texto o contenido HTML."
    );
  }

  return {
    valido:
      errores.length === 0,

    errores
  };
}

function normalizarPlantilla(
  datos = {}
) {
  const contenidoTexto =
    String(
      datos.contenidoTexto ??
      ""
    );

  const contenidoHtml =
    String(
      datos.contenidoHtml ??
      ""
    );

  const asunto =
    limpiarTexto(
      datos.asunto
    );

  const variables = [
    ...new Set([
      ...obtenerVariablesPlantilla(
        asunto
      ),

      ...obtenerVariablesPlantilla(
        contenidoTexto
      ),

      ...obtenerVariablesPlantilla(
        contenidoHtml
      )
    ])
  ].sort();

  return {
    id:
      limpiarTexto(
        datos.id
      ),

    nombre:
      limpiarTexto(
        datos.nombre
      ),

    tipo:
      limpiarTexto(
        datos.tipo
      ),

    canal:
      normalizarCanal(
        datos.canal
      ),

    idioma:
      normalizarIdioma(
        datos.idioma
      ),

    asunto,

    contenidoTexto,
    contenidoHtml,

    descripcion:
      limpiarTexto(
        datos.descripcion
      ),

    activo:
      datos.activo !== false,

    variables,

    creadoPor:
      limpiarTexto(
        datos.creadoPor
      ),

    actualizadoPor:
      limpiarTexto(
        datos.actualizadoPor
      )
  };
}

/* =========================================================
   FACTORÍA DEL SERVICIO
========================================================= */

function crearTemplatesService({
  repository
} = {}) {
  if (
    !repository
  ) {
    throw new Error(
      "El repositorio de plantillas es obligatorio."
    );
  }

  /* =======================================================
     LISTAR
  ======================================================= */

  async function listarPlantillas(
    filtros = {}
  ) {
    return repository.listar(
      filtros
    );
  }

  /* =======================================================
     OBTENER
  ======================================================= */

  async function obtenerPlantilla(
    id
  ) {
    const plantilla =
      await repository.buscarPorId(
        id
      );

    if (!plantilla) {
      const error =
        new Error(
          "Plantilla no encontrada."
        );

      error.code =
        "PLANTILLA_NO_ENCONTRADA";

      throw error;
    }

    return plantilla;
  }

  /* =======================================================
     CREAR
  ======================================================= */

  async function crearPlantilla(
    datos = {},
    contexto = {}
  ) {
    const normalizada =
      normalizarPlantilla({
        ...datos,

        creadoPor:
          contexto.usuario ||
          datos.creadoPor ||
          "sistema",

        actualizadoPor:
          contexto.usuario ||
          datos.actualizadoPor ||
          "sistema"
      });

    const validacion =
      validarDatosPlantilla(
        normalizada
      );

    if (!validacion.valido) {
      const error =
        new Error(
          validacion.errores[0]
        );

      error.code =
        "PLANTILLA_INVALIDA";

      error.detalles =
        validacion.errores;

      throw error;
    }

    return repository.crear(
      normalizada
    );
  }

  /* =======================================================
     ACTUALIZAR
  ======================================================= */

  async function actualizarPlantilla(
    id,
    cambios = {},
    contexto = {}
  ) {
    const actual =
      await obtenerPlantilla(
        id
      );

    const normalizada =
      normalizarPlantilla({
        ...actual,
        ...cambios,

        id:
          actual.id,

        actualizadoPor:
          contexto.usuario ||
          cambios.actualizadoPor ||
          actual.actualizadoPor ||
          "sistema"
      });

    const validacion =
      validarDatosPlantilla(
        normalizada,
        {
          requiereId:
            true
        }
      );

    if (!validacion.valido) {
      const error =
        new Error(
          validacion.errores[0]
        );

      error.code =
        "PLANTILLA_INVALIDA";

      error.detalles =
        validacion.errores;

      throw error;
    }

    const actualizada =
      await repository.actualizar(
        id,
        normalizada
      );

    if (!actualizada) {
      const error =
        new Error(
          "Plantilla no encontrada."
        );

      error.code =
        "PLANTILLA_NO_ENCONTRADA";

      throw error;
    }

    return actualizada;
  }

  /* =======================================================
     CAMBIAR ESTADO
  ======================================================= */

  async function cambiarEstadoPlantilla(
    id,
    activo,
    contexto = {}
  ) {
    await obtenerPlantilla(
      id
    );

    const actualizada =
      await repository.actualizar(
        id,
        {
          activo:
            Boolean(activo),

          actualizadoPor:
            contexto.usuario ||
            "sistema"
        }
      );

    return actualizada;
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function eliminarPlantilla(
    id
  ) {
    const eliminada =
      await repository.eliminar(
        id
      );

    if (!eliminada) {
      const error =
        new Error(
          "Plantilla no encontrada."
        );

      error.code =
        "PLANTILLA_NO_ENCONTRADA";

      throw error;
    }

    return eliminada;
  }

  /* =======================================================
     VISTA PREVIA
  ======================================================= */

  async function generarVistaPrevia({
    plantillaId = "",
    plantilla = null,
    variables = {}
  } = {}) {
    let plantillaBase =
      plantilla;

    if (!plantillaBase) {
      plantillaBase =
        await obtenerPlantilla(
          plantillaId
        );
    }

    const variablesFinales = {
      ...obtenerVariablesEjemplo(),
      ...variables
    };

    const validacion =
      validarVariablesPlantilla({
        plantilla:
          plantillaBase,

        variables:
          variablesFinales
      });

    const renderizada =
      renderizarComunicacion({
        plantilla:
          plantillaBase,

        variables:
          variablesFinales,

        mantenerDesconocidas:
          false
      });

    return {
      plantilla:
        plantillaBase,

      variables:
        variablesFinales,

      validacion,

      renderizada
    };
  }

  /* =======================================================
     RENDER PARA ENVÍO
  ======================================================= */

  async function renderizarParaEnvio({
    plantillaId = "",
    tipo = "",
    idioma = "es",
    canal = "email",
    variables = {}
  } = {}) {
    let plantilla;

    if (plantillaId) {
      plantilla =
        await obtenerPlantilla(
          plantillaId
        );
    } else {
      plantilla =
        await repository
          .buscarActivaPorTipo({
            tipo,
            idioma:
              normalizarIdioma(
                idioma
              ),

            canal:
              normalizarCanal(
                canal
              )
          });
    }

    if (!plantilla) {
      const error =
        new Error(
          "No se encontró una plantilla activa para esta comunicación."
        );

      error.code =
        "PLANTILLA_NO_ENCONTRADA";

      throw error;
    }

    if (
      plantilla.activo ===
      false
    ) {
      const error =
        new Error(
          "La plantilla seleccionada está inactiva."
        );

      error.code =
        "PLANTILLA_INACTIVA";

      throw error;
    }

    const validacion =
      validarVariablesPlantilla({
        plantilla,
        variables
      });

    if (
      !validacion.valido
    ) {
      const error =
        new Error(
          `Faltan variables requeridas: ${validacion.faltantes.join(
            ", "
          )}`
        );

      error.code =
        "VARIABLES_INCOMPLETAS";

      error.detalles =
        validacion;

      throw error;
    }

    return {
      plantilla,

      validacion,

      renderizada:
        renderizarComunicacion({
          plantilla,
          variables,

          mantenerDesconocidas:
            false
        })
    };
  }

  return {
    listarPlantillas,
    obtenerPlantilla,
    crearPlantilla,
    actualizarPlantilla,
    cambiarEstadoPlantilla,
    eliminarPlantilla,
    generarVistaPrevia,
    renderizarParaEnvio
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  limpiarTexto,
  normalizarCanal,
  normalizarIdioma,
  validarDatosPlantilla,
  normalizarPlantilla,
  crearTemplatesService
};