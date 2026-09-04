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
  verifyAdmin = null,
  requirePermission = null,
  requireRole = null
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
  if (
  typeof requirePermission !==
  "function"
) {
  throw new Error(
    "El middleware requirePermission es obligatorio."
  );
}


if (
  typeof requireRole !==
  "function"
) {
  throw new Error(
    "El middleware requireRole es obligatorio."
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
  /*
   * SEGURIDAD:
   * Las rutas administrativas del
   * Communication Center deben trabajar
   * siempre en modo fail-closed.
   *
   * Si verifyAdmin no fue inyectado,
   * NO se permite continuar.
   */
  if (
    typeof verifyAdmin !==
    "function"
  ) {
    console.error(
      "Bloqueo de seguridad: verifyAdmin no está disponible para una ruta protegida del Communication Center.",
      {
        method:
          req.method,

        path:
          req.originalUrl ||
          req.path ||
          ""
      }
    );

    return res.status(503).json({
      error:
        "El servicio de autenticación administrativa no está disponible.",
      code:
        "ADMIN_AUTH_UNAVAILABLE"
    });
  }

  return verifyAdmin(
    req,
    res,
    next
  );
}

  /* =======================================================
   PROTECCIÓN EXCLUSIVA DEL COMMUNICATION CENTER

   IMPORTANTE:
   Este router está montado sobre /api.

   Por lo tanto NO debemos ejecutar verifyAdmin
   sobre rutas públicas ajenas como:

   /api/vacantes
   /api/sucursales
   /api/postulacion

   Solamente protegemos las rutas pertenecientes
   al Communication Center.
======================================================= */

router.use(
  (req, res, next) => {
    const rutasProtegidas = [
      "/plantillas-comunicacion",
      "/comunicaciones",
      "/cola-comunicaciones"
    ];

    const rutaActual =
      req.path || "";

    const perteneceCommunicationCenter =
      rutasProtegidas.some(
        (prefijo) =>
          rutaActual === prefijo ||
          rutaActual.startsWith(
            `${prefijo}/`
          )
      );

    if (
      !perteneceCommunicationCenter
    ) {
      return next();
    }

    return protegerRuta(
      req,
      res,
      next
    );
  }
);
    /* =======================================================
     PLANTILLAS DE COMUNICACIÓN
  ======================================================= */

  router.get(
    "/plantillas-comunicacion",
    requirePermission(
      "comunicaciones.ver"
    ),
    templatesController
      .listarPlantillas
  );


  /*
   * Las rutas fijas deben colocarse antes
   * de las rutas dinámicas con :id.
   */

  router.post(
    "/plantillas-comunicacion/vista-previa",
    requirePermission(
      "comunicaciones.ver"
    ),
    templatesController
      .generarVistaPrevia
  );


  router.post(
    "/plantillas-comunicacion/renderizar",
    requirePermission(
      "comunicaciones.enviar"
    ),
    templatesController
      .renderizarParaEnvio
  );


  router.get(
    "/plantillas-comunicacion/:id",
    requirePermission(
      "comunicaciones.ver"
    ),
    templatesController
      .obtenerPlantilla
  );


  router.post(
    "/plantillas-comunicacion",
    requireRole(
      "admin"
    ),
    templatesController
      .crearPlantilla
  );


  router.put(
    "/plantillas-comunicacion/:id",
    requireRole(
      "admin"
    ),
    templatesController
      .actualizarPlantilla
  );


  router.patch(
    "/plantillas-comunicacion/:id/estado",
    requireRole(
      "admin"
    ),
    templatesController
      .cambiarEstadoPlantilla
  );


  router.post(
    "/plantillas-comunicacion/:id/vista-previa",
    requirePermission(
      "comunicaciones.ver"
    ),
    templatesController
      .generarVistaPrevia
  );


  router.delete(
    "/plantillas-comunicacion/:id",
    requireRole(
      "admin"
    ),
    templatesController
      .eliminarPlantilla
  );

    /* =======================================================
     HISTORIAL DE COMUNICACIONES
  ======================================================= */

  router.get(
    "/comunicaciones",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationsController
      .listarComunicaciones
  );


  /* =======================================================
     ESTADÍSTICAS
  ======================================================= */

  router.get(
    "/comunicaciones/estadisticas",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationsController
      .obtenerEstadisticas
  );


  router.get(
    "/comunicaciones/stats",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationsController
      .obtenerEstadisticas
  );


  /* =======================================================
     COMUNICACIONES PENDIENTES
  ======================================================= */

  router.get(
    "/comunicaciones/pendientes",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationsController
      .listarPendientes
  );


  router.get(
    "/comunicaciones/pending",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationsController
      .listarPendientes
  );


  /* =======================================================
     ENVÍO MANUAL
  ======================================================= */

  router.post(
    "/comunicaciones/enviar",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .enviarComunicacion
  );


  router.post(
    "/comunicaciones/send",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .enviarComunicacion
  );


  /* =======================================================
     ENVÍO DE PRUEBA
  ======================================================= */

  router.post(
    "/comunicaciones/enviar-prueba",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .enviarPrueba
  );


  router.post(
    "/comunicaciones/test",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .enviarPrueba
  );


  /* =======================================================
     CONSULTAR UNA COMUNICACIÓN
  ======================================================= */

  router.get(
    "/comunicaciones/:id",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationsController
      .obtenerComunicacion
  );


  /* =======================================================
     REINTENTAR COMUNICACIÓN
  ======================================================= */

  router.post(
    "/comunicaciones/:id/reintentar",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .reintentarComunicacion
  );


  router.post(
    "/comunicaciones/:id/retry",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .reintentarComunicacion
  );


  /* =======================================================
     CANCELAR COMUNICACIÓN
  ======================================================= */

  router.post(
    "/comunicaciones/:id/cancelar",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .cancelarComunicacion
  );


  router.post(
    "/comunicaciones/:id/cancel",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationsController
      .cancelarComunicacion
  );


  /* =======================================================
     ELIMINAR DEL HISTORIAL
  ======================================================= */

  router.delete(
    "/comunicaciones/:id",
    requireRole(
      "admin"
    ),
    communicationsController
      .eliminarComunicacion
  );

 

   /* =======================================================
     COLA DE COMUNICACIONES
  ======================================================= */

  router.get(
    "/cola-comunicaciones",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationQueueController
      .listarTrabajos
  );


  /* =======================================================
     ESTADÍSTICAS DE LA COLA
  ======================================================= */

  router.get(
    "/cola-comunicaciones/estadisticas",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationQueueController
      .obtenerEstadisticas
  );


  router.get(
    "/cola-comunicaciones/stats",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationQueueController
      .obtenerEstadisticas
  );


  /* =======================================================
     ESTADO Y CONTROL DEL WORKER
  ======================================================= */

  router.get(
    "/cola-comunicaciones/worker",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationQueueController
      .obtenerEstadoWorker
  );


  router.post(
    "/cola-comunicaciones/worker/ejecutar",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .ejecutarWorkerAhora
  );


  router.post(
    "/cola-comunicaciones/worker/run",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .ejecutarWorkerAhora
  );


  router.post(
    "/cola-comunicaciones/worker/iniciar",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .iniciarWorker
  );


  router.post(
    "/cola-comunicaciones/worker/start",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .iniciarWorker
  );


  router.post(
    "/cola-comunicaciones/worker/detener",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .detenerWorker
  );


  router.post(
    "/cola-comunicaciones/worker/stop",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .detenerWorker
  );


  /* =======================================================
     AGREGAR TRABAJO
  ======================================================= */

  router.post(
    "/cola-comunicaciones",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationQueueController
      .agregarTrabajo
  );


  /* =======================================================
     PROCESAR MANUALMENTE
  ======================================================= */

  router.post(
    "/cola-comunicaciones/procesar-siguiente",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .procesarSiguiente
  );


  router.post(
    "/cola-comunicaciones/process-next",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .procesarSiguiente
  );


  router.post(
    "/cola-comunicaciones/procesar-lote",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .procesarLote
  );


  router.post(
    "/cola-comunicaciones/process-batch",
    requireRole(
      "admin"
    ),
    communicationQueueController
      .procesarLote
  );


  /* =======================================================
     CONSULTAR UN TRABAJO
  ======================================================= */

  router.get(
    "/cola-comunicaciones/:id",
    requirePermission(
      "comunicaciones.ver"
    ),
    communicationQueueController
      .obtenerTrabajo
  );


  /* =======================================================
     REINTENTAR TRABAJO
  ======================================================= */

  router.post(
    "/cola-comunicaciones/:id/reintentar",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationQueueController
      .reintentarTrabajo
  );


  router.post(
    "/cola-comunicaciones/:id/retry",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationQueueController
      .reintentarTrabajo
  );


  /* =======================================================
     CANCELAR TRABAJO
  ======================================================= */

  router.post(
    "/cola-comunicaciones/:id/cancelar",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationQueueController
      .cancelarTrabajo
  );


  router.post(
    "/cola-comunicaciones/:id/cancel",
    requirePermission(
      "comunicaciones.enviar"
    ),
    communicationQueueController
      .cancelarTrabajo
  );


  /* =======================================================
     ELIMINAR TRABAJO
  ======================================================= */

  router.delete(
    "/cola-comunicaciones/:id",
    requireRole(
      "admin"
    ),
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