"use strict";

/* =========================================================
   CONTROLLER DE COLA DE COMUNICACIONES

   Responsabilidades:
   - Recibir peticiones HTTP.
   - Leer params, query y body.
   - Llamar a CommunicationQueueService.
   - Traducir errores a respuestas HTTP.
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

function obtenerCodigoHttp(
  error
) {
  const codigos = {
    QUEUE_PAYLOAD_INVALIDO:
      400,

    QUEUE_TEMPLATE_REQUERIDA:
      400,

    QUEUE_FECHA_INVALIDA:
      400,

    QUEUE_JOB_INVALIDO:
      400,

    QUEUE_JOB_DUPLICADO:
      409,

    QUEUE_JOB_NO_ENCONTRADO:
      404,

    QUEUE_JOB_NO_REINTENTABLE:
      409,

    QUEUE_WORKER_NO_DISPONIBLE:
      503,

    PLANTILLA_NO_ENCONTRADA:
      404,

    PLANTILLA_INACTIVA:
      409,

    VARIABLES_INCOMPLETAS:
      400,

    DESTINATARIO_EMAIL_INVALIDO:
      400,

    DESTINATARIO_TELEFONO_INVALIDO:
      400,

    DESTINATARIO_INVALIDO:
      400,

    PROVEEDOR_NO_CONFIGURADO:
      503
  };

  return (
    codigos[
      limpiarTexto(
        error?.code
      )
    ] ||
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
      ? `[CommunicationQueueController] ${contexto}:`
      : "[CommunicationQueueController] Error:",
    error
  );

  const status =
    obtenerCodigoHttp(
      error
    );

  const respuesta = {
    ok: false,

    error:
      error?.message ||
      "No fue posible completar la operación de la cola.",

    codigo:
      error?.code ||
      "QUEUE_ERROR"
  };

  if (
    error?.detalles !==
    undefined
  ) {
    respuesta.detalles =
      error.detalles;
  }

  if (status === 500) {
    respuesta.error =
      "No fue posible completar la operación de la cola.";
  }

  return res
    .status(status)
    .json(respuesta);
}

/* =========================================================
   FACTORÍA DEL CONTROLLER
========================================================= */

function crearCommunicationQueueController({
  service
} = {}) {
  if (!service) {
    throw new Error(
      "CommunicationQueueService es obligatorio."
    );
  }

  /* =======================================================
     AGREGAR TRABAJO
  ======================================================= */

  async function agregarTrabajo(
    req,
    res
  ) {
    try {
      const usuario =
        obtenerUsuarioAdministrativo(
          req
        );

      const trabajo =
        await service
          .agregarTrabajo(
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
            "Trabajo agregado a la cola correctamente.",

          trabajo
        });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error agregando trabajo"
      );
    }
  }

  /* =======================================================
     LISTAR
  ======================================================= */

  async function listarTrabajos(
    req,
    res
  ) {
    try {
      const trabajos =
        await service
          .listarTrabajos({
            limite:
              req.query?.limite,

            estado:
              req.query?.estado,

            tipo:
              req.query?.tipo
          });

      return res.json({
        ok: true,

        total:
          trabajos.length,

        trabajos
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error listando trabajos"
      );
    }
  }

  /* =======================================================
     OBTENER
  ======================================================= */

  async function obtenerTrabajo(
    req,
    res
  ) {
    try {
      const trabajo =
        await service
          .obtenerTrabajo(
            req.params.id
          );

      return res.json({
        ok: true,
        trabajo
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error consultando trabajo"
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
     PROCESAR SIGUIENTE
  ======================================================= */

  async function procesarSiguiente(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .procesarSiguiente();

      return res.json({
        ok: true,

        message:
          resultado?.vacio
            ? "No hay trabajos disponibles."
            : "Trabajo procesado correctamente.",

        resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error procesando siguiente trabajo"
      );
    }
  }

  /* =======================================================
     PROCESAR LOTE
  ======================================================= */

  async function procesarLote(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .procesarLote({
            limite:
              req.body?.limite ||
              req.query?.limite ||
              10
          });

      return res.json({
        ok: true,

        message:
          "Lote procesado correctamente.",

        ...resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error procesando lote"
      );
    }
  }

  /* =======================================================
     REINTENTAR
  ======================================================= */

  async function reintentarTrabajo(
    req,
    res
  ) {
    try {
      const procesarAhora =
        req.body
          ?.procesarAhora ===
        true;

      const resultado =
        await service
          .reintentarTrabajo(
            req.params.id,
            {
              procesarAhora
            }
          );

      return res.json({
        ok: true,

        message:
          procesarAhora
            ? "Trabajo reactivado y enviado a procesamiento."
            : "Trabajo reactivado correctamente.",

        ...resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error reintentando trabajo"
      );
    }
  }

  /* =======================================================
     CANCELAR
  ======================================================= */

  async function cancelarTrabajo(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .cancelarTrabajo(
            req.params.id,
            limpiarTexto(
              req.body?.motivo
            )
          );

      return res.json({
        ok: true,

        message:
          "Trabajo cancelado correctamente.",

        ...resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error cancelando trabajo"
      );
    }
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function eliminarTrabajo(
    req,
    res
  ) {
    try {
      const trabajo =
        await service
          .eliminarTrabajo(
            req.params.id
          );

      return res.json({
        ok: true,

        message:
          "Trabajo eliminado correctamente.",

        trabajoEliminado:
          trabajo
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error eliminando trabajo"
      );
    }
  }

  /* =======================================================
     ESTADO DEL WORKER
  ======================================================= */

  async function obtenerEstadoWorker(
    req,
    res
  ) {
    try {
      const worker =
        service
          .obtenerEstadoWorker();

      return res.json({
        ok: true,
        worker
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error consultando worker"
      );
    }
  }

  /* =======================================================
     EJECUTAR WORKER AHORA
  ======================================================= */

  async function ejecutarWorkerAhora(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .ejecutarWorkerAhora();

      return res.json({
        ok: true,

        message:
          "Worker ejecutado correctamente.",

        resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error ejecutando worker"
      );
    }
  }

  /* =======================================================
     INICIAR WORKER
  ======================================================= */

  async function iniciarWorker(
    req,
    res
  ) {
    try {
      const resultado =
        await service
          .iniciarWorker();

      return res.json({
        ok: true,

        message:
          resultado
            ?.yaEstabaActivo
            ? "El worker ya estaba activo."
            : "Worker iniciado correctamente.",

        resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error iniciando worker"
      );
    }
  }

  /* =======================================================
     DETENER WORKER
  ======================================================= */

  async function detenerWorker(
    req,
    res
  ) {
    try {
      const resultado =
        service
          .detenerWorker();

      return res.json({
        ok: true,

        message:
          "Worker detenido correctamente.",

        resultado
      });
    } catch (error) {
      return responderError(
        res,
        error,
        "Error deteniendo worker"
      );
    }
  }

  return {
    agregarTrabajo,
    listarTrabajos,
    obtenerTrabajo,
    obtenerEstadisticas,

    procesarSiguiente,
    procesarLote,

    reintentarTrabajo,
    cancelarTrabajo,
    eliminarTrabajo,

    obtenerEstadoWorker,
    ejecutarWorkerAhora,
    iniciarWorker,
    detenerWorker
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  limpiarTexto,
  obtenerUsuarioAdministrativo,
  obtenerCodigoHttp,
  responderError,
  crearCommunicationQueueController
};