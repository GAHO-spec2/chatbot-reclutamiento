"use strict";

/* =========================================================
   CONTROLLER DE COMUNICACIONES

   Responsabilidades:
   - Recibir solicitudes HTTP.
   - Leer parámetros, query y body.
   - Llamar a CommunicationsService.
   - Devolver respuestas JSON.
   - Traducir errores del servicio a códigos HTTP.
========================================================= */

/* =========================================================
   UTILIDADES
========================================================= */

function limpiarTexto(
  valor = ""
) {
  return String(
    valor ?? ""
  ).trim();
}

function obtenerUsuarioAdministrativo(
  req
) {
  return (
    req.adminUser?.email ||
    req.adminUser?.uid ||
    req.user?.email ||
    req.user?.uid ||
    req.usuario?.email ||
    req.usuario?.uid ||
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

function obtenerCodigoHttp(
  error
) {
  const codigo =
    limpiarTexto(
      error?.code
    );

  const codigos = {
    COMUNICACION_NO_ENCONTRADA:
      404,

    COMUNICACION_DUPLICADA:
      409,

    COMUNICACION_INVALIDA:
      400,

    COMUNICACION_NO_REINTENTABLE:
      409,

    COMUNICACION_NO_CANCELABLE:
      409,

    DESTINATARIO_EMAIL_INVALIDO:
      400,

    DESTINATARIO_TELEFONO_INVALIDO:
      400,

    DESTINATARIO_INVALIDO:
      400,

    EMAIL_DESTINATARIO_INVALIDO:
      400,

    EMAIL_ASUNTO_REQUERIDO:
      400,

    EMAIL_CONTENIDO_REQUERIDO:
      400,

    PLANTILLA_NO_ENCONTRADA:
      404,

    PLANTILLA_INACTIVA:
      409,

    VARIABLES_INCOMPLETAS:
      400,

    PROVEEDOR_NO_CONFIGURADO:
      503,

    PROVEEDOR_INVALIDO:
      500,

    EMAIL_MODO_NO_IMPLEMENTADO:
      501,

    CANAL_NO_SOPORTADO:
      400
  };

  return (
    codigos[codigo] ||
    500
  );
}

function responderError(
  res,
  error,
  contexto = ""
) {
  console.error(
    contexto
      ? `[CommunicationsController] ${contexto}:`
      : "[CommunicationsController] Error:",
    error
  );

  const status =
    obtenerCodigoHttp(
      error
    );

  const respuesta = {
    ok: false,

    error:
      obtenerMensajeError(
        error
      ),

    codigo:
      error?.code ||
      "COMMUNICATION_ERROR"
  };

  if (
    error?.detalles !==
    undefined
  ) {
    respuesta.detalles =
      error.detalles;
  }

  if (
    error?.communicationId
  ) {
    respuesta.communicationId =
      error.communicationId;
  }

  if (status === 500) {
    respuesta.error =
      "No fue posible completar la operación de comunicación.";
  }

  return res
    .status(status)
    .json(respuesta);
}

/* =========================================================
   FACTORÍA DEL CONTROLLER
========================================================= */

function crearCommunicationsController({
  service
} = {}) {
  if (!service) {
    throw new Error(
      "El servicio de comunicaciones es obligatorio."
    );
  }

  /* =======================================================
     LISTAR HISTORIAL
  ======================================================= */

  async function listarComunicaciones(
    req,
    res
  ) {
    try {
      const comunicaciones =
        await service
          .listarComunicaciones({
            limite:
              req.query?.limite,

            estado:
              req.query?.estado,

            canal:
              req.query?.canal,

            tipo:
              req.query?.tipo,

            candidatoId:
              req.query
                ?.candidatoId,

            postulacionId:
              req.query
                ?.postulacionId,

            entrevistaId:
              req.query
                ?.entrevistaId
          });

      return res.json({
        ok: true,

        total:
          comunicaciones.length,

        comunicaciones
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error listando comunicaciones"
      );
    }
  }

  /* =======================================================
     OBTENER UNA COMUNICACIÓN
  ======================================================= */

  async function obtenerComunicacion(
    req,
    res
  ) {
    try {
      const comunicacion =
        await service
          .obtenerComunicacion(
            req.params.id
          );

      return res.json({
        ok: true,
        comunicacion
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error consultando comunicación"
      );
    }
  }

  /* =======================================================
     ESTADÍSTICAS
  ======================================================= */

  async function obtenerEstadisticas(
    req,
    res
  ) {
    try {
      const estadisticas =
        await service
          .obtenerEstadisticas();

      return res.json({
        ok: true,
        estadisticas
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error obteniendo estadísticas"
      );
    }
  }

  /* =======================================================
     LISTAR PENDIENTES
  ======================================================= */

  async function listarPendientes(
    req,
    res
  ) {
    try {
      const pendientes =
        await service
          .listarPendientes({
            limite:
              req.query?.limite,

            hasta:
              req.query?.hasta
          });

      return res.json({
        ok: true,

        total:
          pendientes.length,

        comunicaciones:
          pendientes
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error listando comunicaciones pendientes"
      );
    }
  }

  /* =======================================================
     ENVIAR COMUNICACIÓN
  ======================================================= */

  async function enviarComunicacion(
    req,
    res
  ) {
    try {
      const usuario =
        obtenerUsuarioAdministrativo(
          req
        );

      const resultado =
        await service
          .enviarComunicacion(
            req.body || {},
            {
              usuario
            }
          );

      const programada =
        resultado
          ?.programada === true;

      return res
        .status(
          programada
            ? 202
            : 201
        )
        .json({
          ok: true,

          message:
            programada
              ? "Comunicación programada correctamente."
              : "Comunicación procesada correctamente.",

          ...resultado
        });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error enviando comunicación"
      );
    }
  }

  /* =======================================================
     ENVÍO DE PRUEBA
  ======================================================= */

  async function enviarPrueba(
    req,
    res
  ) {
    try {
      const correo =
        limpiarTexto(
          req.body?.correo
        );

      const plantillaId =
        limpiarTexto(
          req.body
            ?.plantillaId
        );

      const tipo =
        limpiarTexto(
          req.body?.tipo
        );

      if (!correo) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "Debes indicar el correo que recibirá la prueba.",

            codigo:
              "CORREO_PRUEBA_REQUERIDO"
          });
      }

      if (
        !plantillaId &&
        !tipo
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              "Debes indicar plantillaId o tipo para enviar la prueba.",

            codigo:
              "PLANTILLA_PRUEBA_REQUERIDA"
          });
      }

      const usuario =
        obtenerUsuarioAdministrativo(
          req
        );

      const resultado =
        await service
          .enviarComunicacion(
            {
              plantillaId,
              tipo,

              canal:
                "email",

              idioma:
                req.body
                  ?.idioma ||
                "es",

              destinatario: {
                nombre:
                  limpiarTexto(
                    req.body
                      ?.nombre
                  ) ||
                  "Usuario de prueba",

                correo
              },

              variables:
                req.body
                  ?.variables &&
                typeof req.body
                  .variables ===
                  "object"
                  ? req.body
                      .variables
                  : {},

              metadata: {
                esPrueba:
                  true,

                solicitadoDesde:
                  "communication_center",

                ...(
                  req.body
                    ?.metadata &&
                  typeof req.body
                    .metadata ===
                    "object"
                    ? req.body
                        .metadata
                    : {}
                )
              }
            },
            {
              usuario
            }
          );

      return res
        .status(201)
        .json({
          ok: true,

          message:
            "Correo de prueba procesado correctamente.",

          ...resultado
        });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error enviando correo de prueba"
      );
    }
  }

  /* =======================================================
     REINTENTAR COMUNICACIÓN
  ======================================================= */

  async function reintentarComunicacion(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .reintentarComunicacion(
            req.params.id
          );

      return res.json({
        ok: true,

        message:
          "Comunicación reintentada correctamente.",

        ...resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error reintentando comunicación"
      );
    }
  }

  /* =======================================================
     CANCELAR COMUNICACIÓN
  ======================================================= */

  async function cancelarComunicacion(
    req,
    res
  ) {
    try {
      const motivo =
        limpiarTexto(
          req.body?.motivo
        );

      const resultado =
        await service
          .cancelarComunicacion(
            req.params.id,
            motivo
          );

      return res.json({
        ok: true,

        message:
          "Comunicación cancelada correctamente.",

        ...resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error cancelando comunicación"
      );
    }
  }

  /* =======================================================
     ELIMINAR COMUNICACIÓN
  ======================================================= */

  async function eliminarComunicacion(
    req,
    res
  ) {
    try {
      const comunicacion =
        await service
          .eliminarComunicacion(
            req.params.id
          );

      return res.json({
        ok: true,

        message:
          "Comunicación eliminada correctamente.",

        comunicacionEliminada:
          comunicacion
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error eliminando comunicación"
      );
    }
  }

  return {
    listarComunicaciones,
    obtenerComunicacion,
    obtenerEstadisticas,
    listarPendientes,
    enviarComunicacion,
    enviarPrueba,
    reintentarComunicacion,
    cancelarComunicacion,
    eliminarComunicacion
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  limpiarTexto,
  obtenerUsuarioAdministrativo,
  obtenerMensajeError,
  obtenerCodigoHttp,
  responderError,
  crearCommunicationsController
};