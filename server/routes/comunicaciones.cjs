"use strict";

const express =
  require("express");

/* =========================================================
   RUTAS DEL COMMUNICATION CENTER

   Incluye:
   - Administración de plantillas.
   - Historial de comunicaciones.
   - Estadísticas.
   - Envíos manuales y de prueba.
   - Reintentos.
   - Cancelaciones.
   - Cola de comunicaciones.
   - Control del worker.
========================================================= */

function crearComunicacionesRouter({
  templatesController,
  communicationsController,
  communicationQueueController,
  verifyAdmin = null
} = {}) {
  if (!templatesController) {
    throw new Error(
      "El controller de plantillas es obligatorio."
    );
  }

  if (!communicationsController) {
    throw new Error(
      "El controller de comunicaciones es obligatorio."
    );
  }

  if (!communicationQueueController) {
    throw new Error(
      "El controller de la cola de comunicaciones es obligatorio."
    );
  }

  const router =
    express.Router();

  /* =======================================================
     PROTECCIÓN ADMINISTRATIVA
  ======================================================= */

  function protegerRuta(
    req,
    res,
    next
  ) {
    if (
      typeof verifyAdmin ===
      "function"
    ) {
      return verifyAdmin(
        req,
        res,
        next
      );
    }

    /*
     * Modo local:
     * permite trabajar con JSON cuando
     * Firebase Admin no está disponible.
     */
    return next();
  }

  /*
   * Todas las rutas registradas después
   * de este middleware quedan protegidas.
   */
  router.use(
    protegerRuta
  );

  /* =======================================================
     PLANTILLAS DE COMUNICACIÓN
  ======================================================= */

  router.get(
    "/plantillas-comunicacion",
    templatesController
      .listarPlantillas
  );

  /*
   * Las rutas fijas deben colocarse antes
   * de las rutas dinámicas con :id.
   */

  router.post(
    "/plantillas-comunicacion/vista-previa",
    templatesController
      .generarVistaPrevia
  );

  router.post(
    "/plantillas-comunicacion/renderizar",
    templatesController
      .renderizarParaEnvio
  );

  router.get(
    "/plantillas-comunicacion/:id",
    templatesController
      .obtenerPlantilla
  );

  router.post(
    "/plantillas-comunicacion",
    templatesController
      .crearPlantilla
  );

  router.put(
    "/plantillas-comunicacion/:id",
    templatesController
      .actualizarPlantilla
  );

  router.patch(
    "/plantillas-comunicacion/:id/estado",
    templatesController
      .cambiarEstadoPlantilla
  );

  router.post(
    "/plantillas-comunicacion/:id/vista-previa",
    templatesController
      .generarVistaPrevia
  );

  router.delete(
    "/plantillas-comunicacion/:id",
    templatesController
      .eliminarPlantilla
  );

  /* =======================================================
     HISTORIAL DE COMUNICACIONES
  ======================================================= */

  router.get(
    "/comunicaciones",
    communicationsController
      .listarComunicaciones
  );

  /* =======================================================
     ESTADÍSTICAS
  ======================================================= */

  router.get(
    "/comunicaciones/estadisticas",
    communicationsController
      .obtenerEstadisticas
  );

  router.get(
    "/comunicaciones/stats",
    communicationsController
      .obtenerEstadisticas
  );

  /* =======================================================
     COMUNICACIONES PENDIENTES
  ======================================================= */

  router.get(
    "/comunicaciones/pendientes",
    communicationsController
      .listarPendientes
  );

  router.get(
    "/comunicaciones/pending",
    communicationsController
      .listarPendientes
  );

  /* =======================================================
     ENVÍO MANUAL
  ======================================================= */

  router.post(
    "/comunicaciones/enviar",
    communicationsController
      .enviarComunicacion
  );

  router.post(
    "/comunicaciones/send",
    communicationsController
      .enviarComunicacion
  );

  /* =======================================================
     ENVÍO DE PRUEBA
  ======================================================= */

  router.post(
    "/comunicaciones/enviar-prueba",
    communicationsController
      .enviarPrueba
  );

  router.post(
    "/comunicaciones/test",
    communicationsController
      .enviarPrueba
  );

  /* =======================================================
     CONSULTAR UNA COMUNICACIÓN
  ======================================================= */

  router.get(
    "/comunicaciones/:id",
    communicationsController
      .obtenerComunicacion
  );

  /* =======================================================
     REINTENTAR COMUNICACIÓN
  ======================================================= */

  router.post(
    "/comunicaciones/:id/reintentar",
    communicationsController
      .reintentarComunicacion
  );

  router.post(
    "/comunicaciones/:id/retry",
    communicationsController
      .reintentarComunicacion
  );

  /* =======================================================
     CANCELAR COMUNICACIÓN
  ======================================================= */

  router.post(
    "/comunicaciones/:id/cancelar",
    communicationsController
      .cancelarComunicacion
  );

  router.post(
    "/comunicaciones/:id/cancel",
    communicationsController
      .cancelarComunicacion
  );

  /* =======================================================
     ELIMINAR DEL HISTORIAL
  ======================================================= */

  router.delete(
    "/comunicaciones/:id",
    communicationsController
      .eliminarComunicacion
  );

  /* =======================================================
     COLA DE COMUNICACIONES
  ======================================================= */

  /*
   * GET /api/cola-comunicaciones
   *
   * Filtros:
   * - limite
   * - estado
   * - tipo
   */
  router.get(
    "/cola-comunicaciones",
    communicationQueueController
      .listarTrabajos
  );

  /*
   * Las rutas fijas deben ir antes de:
   *
   * /cola-comunicaciones/:id
   */

  /* =======================================================
     ESTADÍSTICAS DE LA COLA
  ======================================================= */

  router.get(
    "/cola-comunicaciones/estadisticas",
    communicationQueueController
      .obtenerEstadisticas
  );

  router.get(
    "/cola-comunicaciones/stats",
    communicationQueueController
      .obtenerEstadisticas
  );

  /* =======================================================
     ESTADO Y CONTROL DEL WORKER
  ======================================================= */

  router.get(
    "/cola-comunicaciones/worker",
    communicationQueueController
      .obtenerEstadoWorker
  );

  router.post(
    "/cola-comunicaciones/worker/ejecutar",
    communicationQueueController
      .ejecutarWorkerAhora
  );

  router.post(
    "/cola-comunicaciones/worker/run",
    communicationQueueController
      .ejecutarWorkerAhora
  );

  router.post(
    "/cola-comunicaciones/worker/iniciar",
    communicationQueueController
      .iniciarWorker
  );

  router.post(
    "/cola-comunicaciones/worker/start",
    communicationQueueController
      .iniciarWorker
  );

  router.post(
    "/cola-comunicaciones/worker/detener",
    communicationQueueController
      .detenerWorker
  );

  router.post(
    "/cola-comunicaciones/worker/stop",
    communicationQueueController
      .detenerWorker
  );

  /* =======================================================
     AGREGAR TRABAJO
  ======================================================= */

  router.post(
    "/cola-comunicaciones",
    communicationQueueController
      .agregarTrabajo
  );

  /* =======================================================
     PROCESAR MANUALMENTE
  ======================================================= */

  router.post(
    "/cola-comunicaciones/procesar-siguiente",
    communicationQueueController
      .procesarSiguiente
  );

  router.post(
    "/cola-comunicaciones/process-next",
    communicationQueueController
      .procesarSiguiente
  );

  router.post(
    "/cola-comunicaciones/procesar-lote",
    communicationQueueController
      .procesarLote
  );

  router.post(
    "/cola-comunicaciones/process-batch",
    communicationQueueController
      .procesarLote
  );

  /* =======================================================
     CONSULTAR UN TRABAJO
  ======================================================= */

  router.get(
    "/cola-comunicaciones/:id",
    communicationQueueController
      .obtenerTrabajo
  );

  /* =======================================================
     REINTENTAR TRABAJO
  ======================================================= */

  router.post(
    "/cola-comunicaciones/:id/reintentar",
    communicationQueueController
      .reintentarTrabajo
  );

  router.post(
    "/cola-comunicaciones/:id/retry",
    communicationQueueController
      .reintentarTrabajo
  );

  /* =======================================================
     CANCELAR TRABAJO
  ======================================================= */

  router.post(
    "/cola-comunicaciones/:id/cancelar",
    communicationQueueController
      .cancelarTrabajo
  );

  router.post(
    "/cola-comunicaciones/:id/cancel",
    communicationQueueController
      .cancelarTrabajo
  );

  /* =======================================================
     ELIMINAR TRABAJO
  ======================================================= */

  router.delete(
    "/cola-comunicaciones/:id",
    communicationQueueController
      .eliminarTrabajo
  );

  return router;
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  crearComunicacionesRouter
};