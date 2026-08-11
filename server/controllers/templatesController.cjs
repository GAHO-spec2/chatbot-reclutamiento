"use strict";

/* =========================================================
   CONTROLLER DE PLANTILLAS DE COMUNICACIÓN
========================================================= */

function obtenerUsuarioAdministrativo(
  req
) {
  return (
    req.adminUser?.email ||
    req.user?.email ||
    req.usuario?.email ||
    "sistema"
  );
}

function obtenerMensajeError(
  error
) {
  return (
    error?.message ||
    "Ocurrió un error inesperado."
  );
}

function responderError(
  res,
  error
) {
  console.error(
    "Error en plantillas:",
    error
  );

  if (
    error.code ===
    "PLANTILLA_INVALIDA"
  ) {
    return res.status(400).json({
      error:
        obtenerMensajeError(
          error
        ),

      detalles:
        error.detalles || []
    });
  }

  if (
    error.code ===
    "PLANTILLA_DUPLICADA"
  ) {
    return res.status(409).json({
      error:
        obtenerMensajeError(
          error
        )
    });
  }

  if (
    error.code ===
    "PLANTILLA_NO_ENCONTRADA"
  ) {
    return res.status(404).json({
      error:
        obtenerMensajeError(
          error
        )
    });
  }

  if (
    error.code ===
    "PLANTILLA_INACTIVA"
  ) {
    return res.status(409).json({
      error:
        obtenerMensajeError(
          error
        )
    });
  }

  if (
    error.code ===
    "VARIABLES_INCOMPLETAS"
  ) {
    return res.status(400).json({
      error:
        obtenerMensajeError(
          error
        ),

      detalles:
        error.detalles || {}
    });
  }

  return res.status(500).json({
    error:
      "No fue posible completar la operación de plantillas."
  });
}

/* =========================================================
   FACTORÍA DEL CONTROLLER
========================================================= */

function crearTemplatesController({
  service
} = {}) {
  if (!service) {
    throw new Error(
      "El servicio de plantillas es obligatorio."
    );
  }

  /* =======================================================
     LISTAR
  ======================================================= */

  async function listarPlantillas(
    req,
    res
  ) {
    try {
      const incluirInactivas =
        String(
          req.query
            .incluirInactivas ??
          "true"
        ).toLowerCase() !==
        "false";

      const filtros = {
        incluirInactivas,

        idioma:
          String(
            req.query.idioma ||
            ""
          ).trim(),

        canal:
          String(
            req.query.canal ||
            ""
          ).trim(),

        tipo:
          String(
            req.query.tipo ||
            ""
          ).trim()
      };

      const plantillas =
        await service
          .listarPlantillas(
            filtros
          );

      return res.json({
        ok: true,

        total:
          plantillas.length,

        plantillas
      });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
  }

  /* =======================================================
     OBTENER UNA PLANTILLA
  ======================================================= */

  async function obtenerPlantilla(
    req,
    res
  ) {
    try {
      const plantilla =
        await service
          .obtenerPlantilla(
            req.params.id
          );

      return res.json({
        ok: true,
        plantilla
      });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
  }

  /* =======================================================
     CREAR
  ======================================================= */

  async function crearPlantilla(
    req,
    res
  ) {
    try {
      const usuario =
        obtenerUsuarioAdministrativo(
          req
        );

      const plantilla =
        await service
          .crearPlantilla(
            req.body || {},
            {
              usuario
            }
          );

      return res
        .status(201)
        .json({
          ok: true,

          message:
            "Plantilla creada correctamente.",

          plantilla
        });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
  }

  /* =======================================================
     ACTUALIZAR
  ======================================================= */

  async function actualizarPlantilla(
    req,
    res
  ) {
    try {
      const usuario =
        obtenerUsuarioAdministrativo(
          req
        );

      const plantilla =
        await service
          .actualizarPlantilla(
            req.params.id,
            req.body || {},
            {
              usuario
            }
          );

      return res.json({
        ok: true,

        message:
          "Plantilla actualizada correctamente.",

        plantilla
      });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
  }

  /* =======================================================
     CAMBIAR ESTADO
  ======================================================= */

  async function cambiarEstadoPlantilla(
    req,
    res
  ) {
    try {
      if (
        typeof req.body?.activo !==
        "boolean"
      ) {
        return res.status(400).json({
          error:
            "Debes indicar el campo activo con valor true o false."
        });
      }

      const usuario =
        obtenerUsuarioAdministrativo(
          req
        );

      const plantilla =
        await service
          .cambiarEstadoPlantilla(
            req.params.id,
            req.body.activo,
            {
              usuario
            }
          );

      return res.json({
        ok: true,

        message:
          plantilla.activo
            ? "Plantilla activada correctamente."
            : "Plantilla desactivada correctamente.",

        plantilla
      });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function eliminarPlantilla(
    req,
    res
  ) {
    try {
      const plantilla =
        await service
          .eliminarPlantilla(
            req.params.id
          );

      return res.json({
        ok: true,

        message:
          "Plantilla eliminada correctamente.",

        plantillaEliminada:
          plantilla
      });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
  }

  /* =======================================================
     GENERAR VISTA PREVIA
  ======================================================= */

  async function generarVistaPrevia(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .generarVistaPrevia({
            plantillaId:
              req.body
                ?.plantillaId ||
              req.params.id ||
              "",

            plantilla:
              req.body
                ?.plantilla ||
              null,

            variables:
              req.body
                ?.variables ||
              {}
          });

      return res.json({
        ok: true,
        ...resultado
      });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
  }

  /* =======================================================
     RENDERIZAR PARA ENVÍO
  ======================================================= */

  async function renderizarParaEnvio(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .renderizarParaEnvio({
            plantillaId:
              req.body
                ?.plantillaId ||
              "",

            tipo:
              req.body
                ?.tipo ||
              "",

            idioma:
              req.body
                ?.idioma ||
              "es",

            canal:
              req.body
                ?.canal ||
              "email",

            variables:
              req.body
                ?.variables ||
              {}
          });

      return res.json({
        ok: true,
        ...resultado
      });
    } catch (error) {
      return responderError(
        res,
        error
      );
    }
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
  obtenerUsuarioAdministrativo,
  obtenerMensajeError,
  responderError,
  crearTemplatesController
};