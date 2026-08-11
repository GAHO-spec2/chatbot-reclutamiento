"use strict";

/* =========================================================
   SERVICIO DE COLA DE COMUNICACIONES

   Responsabilidades:
   - Agregar comunicaciones a la cola.
   - Listar y consultar trabajos.
   - Consultar estadísticas.
   - Procesar trabajos manualmente.
   - Reintentar, cancelar y eliminar trabajos.
   - Consultar y controlar el worker.
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

function normalizarLimite(
  valor,
  predeterminado = 200,
  maximo = 1000
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    return predeterminado;
  }

  return Math.min(
    Math.floor(numero),
    maximo
  );
}

function normalizarPrioridad(
  valor,
  predeterminado = 5
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero)
  ) {
    return predeterminado;
  }

  return Math.max(
    1,
    Math.min(
      Math.floor(numero),
      10
    )
  );
}

function normalizarMaxIntentos(
  valor,
  predeterminado = 3
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero)
  ) {
    return predeterminado;
  }

  return Math.max(
    1,
    Math.min(
      Math.floor(numero),
      20
    )
  );
}

function crearErrorServicio(
  mensaje,
  codigo,
  detalles = null
) {
  const error =
    new Error(mensaje);

  error.code =
    codigo;

  if (detalles !== null) {
    error.detalles =
      detalles;
  }

  return error;
}

function validarFechaIso(
  valor
) {
  const texto =
    limpiarTexto(valor);

  if (!texto) {
    return true;
  }

  const fecha =
    new Date(texto);

  return !Number.isNaN(
    fecha.getTime()
  );
}

/* =========================================================
   FACTORÍA DEL SERVICIO
========================================================= */

function crearCommunicationQueueService({
  queue,
  repository,
  worker = null
} = {}) {
  if (!queue) {
    throw new Error(
      "CommunicationQueue es obligatoria."
    );
  }

  if (!repository) {
    throw new Error(
      "El repositorio de la cola es obligatorio."
    );
  }

  /* =======================================================
     AGREGAR TRABAJO
  ======================================================= */

  async function agregarTrabajo(
    datos = {},
    contexto = {}
  ) {
    const payload =
      datos.payload &&
      typeof datos.payload ===
        "object"
        ? datos.payload
        : {};

    if (
      !payload.tipo &&
      !payload.plantillaId
    ) {
      throw crearErrorServicio(
        "El trabajo debe indicar tipo o plantillaId dentro de payload.",
        "QUEUE_TEMPLATE_REQUERIDA"
      );
    }

    const fechaProgramada =
      limpiarTexto(
        datos.fechaProgramada
      );

    if (
      fechaProgramada &&
      !validarFechaIso(
        fechaProgramada
      )
    ) {
      throw crearErrorServicio(
        "La fecha programada no es válida.",
        "QUEUE_FECHA_INVALIDA"
      );
    }

    return queue.agregar({
      payload,

      prioridad:
        normalizarPrioridad(
          datos.prioridad,
          5
        ),

      fechaProgramada,

      maxIntentos:
        normalizarMaxIntentos(
          datos.maxIntentos,
          3
        ),

      creadoPor:
        limpiarTexto(
          contexto.usuario ||
          datos.creadoPor
        ) || "sistema",

      metadata:
        datos.metadata &&
        typeof datos.metadata ===
          "object"
          ? datos.metadata
          : {}
    });
  }

  /* =======================================================
     LISTAR
  ======================================================= */

  async function listarTrabajos(
    filtros = {}
  ) {
    return queue.listar({
      limite:
        normalizarLimite(
          filtros.limite,
          200,
          1000
        ),

      estado:
        limpiarTexto(
          filtros.estado
        ),

      tipo:
        limpiarTexto(
          filtros.tipo
        )
    });
  }

  /* =======================================================
     OBTENER
  ======================================================= */

  async function obtenerTrabajo(
    id
  ) {
    return queue.obtener(
      limpiarTexto(id)
    );
  }

  /* =======================================================
     PROCESAR SIGUIENTE
  ======================================================= */

  async function procesarSiguiente() {
    return queue
      .procesarSiguiente();
  }

  /* =======================================================
     PROCESAR LOTE
  ======================================================= */

  async function procesarLote({
    limite = 10
  } = {}) {
    return queue
      .procesarLote({
        limite:
          normalizarLimite(
            limite,
            10,
            100
          )
      });
  }

  /* =======================================================
     REINTENTAR
  ======================================================= */

  async function reintentarTrabajo(
    id,
    {
      procesarAhora = false
    } = {}
  ) {
    const resultado =
      await queue.reintentar(
        limpiarTexto(id)
      );

    if (
      procesarAhora === true
    ) {
      const procesamiento =
        await queue
          .procesarSiguiente();

      return {
        ...resultado,
        procesamiento
      };
    }

    return resultado;
  }

  /* =======================================================
     CANCELAR
  ======================================================= */

  async function cancelarTrabajo(
    id,
    motivo = ""
  ) {
    return queue.cancelar(
      limpiarTexto(id),
      limpiarTexto(motivo)
    );
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function eliminarTrabajo(
    id
  ) {
    const trabajo =
      await repository
        .eliminar(
          limpiarTexto(id)
        );

    if (!trabajo) {
      throw crearErrorServicio(
        "Trabajo de cola no encontrado.",
        "QUEUE_JOB_NO_ENCONTRADO"
      );
    }

    return trabajo;
  }

  /* =======================================================
     ESTADÍSTICAS DE LA COLA
  ======================================================= */

  async function obtenerEstadisticas() {
    const trabajos =
      await repository.listar({
        limite:
          10000
      });

    const estados = {};

    let pendientes = 0;
    let procesando = 0;
    let completados = 0;
    let errores = 0;
    let cancelados = 0;
    let agotados = 0;
    let programados = 0;
    let totalIntentos = 0;

    const ahora =
      new Date();

    for (
      const trabajo
      of trabajos
    ) {
      const estado =
        limpiarTexto(
          trabajo.estado
        ) || "desconocido";

      estados[estado] =
        (
          estados[estado] ||
          0
        ) + 1;

      totalIntentos +=
        Number(
          trabajo.intentos ||
          0
        );

      if (
        estado === "pendiente"
      ) {
        pendientes += 1;
      }

      if (
        estado === "procesando"
      ) {
        procesando += 1;
      }

      if (
        estado === "completado"
      ) {
        completados += 1;
      }

      if (
        estado === "error"
      ) {
        errores += 1;
      }

      if (
        estado === "cancelado"
      ) {
        cancelados += 1;
      }

      if (
        Number(
          trabajo.intentos || 0
        ) >=
          Number(
            trabajo.maxIntentos || 3
          ) &&
        estado === "error"
      ) {
        agotados += 1;
      }

      const fechaDisponible =
        new Date(
          trabajo.fechaDisponible ||
          trabajo.fechaProgramada ||
          ""
        );

      if (
        estado === "pendiente" &&
        !Number.isNaN(
          fechaDisponible
            .getTime()
        ) &&
        fechaDisponible >
          ahora
      ) {
        programados += 1;
      }
    }

    const tasaExito =
      trabajos.length > 0
        ? Math.round(
            (
              completados /
              trabajos.length
            ) * 100
          )
        : 0;

    const promedioIntentos =
      trabajos.length > 0
        ? Number(
            (
              totalIntentos /
              trabajos.length
            ).toFixed(2)
          )
        : 0;

    return {
      total:
        trabajos.length,

      pendientes,
      procesando,
      completados,
      errores,
      cancelados,
      agotados,
      programados,

      tasaExito,
      promedioIntentos,

      estados,

      worker:
        worker &&
        typeof worker
          .obtenerEstado ===
          "function"
          ? worker
              .obtenerEstado()
          : null
    };
  }

  /* =======================================================
     CONTROL DEL WORKER
  ======================================================= */

  function obtenerEstadoWorker() {
    if (
      !worker ||
      typeof worker
        .obtenerEstado !==
        "function"
    ) {
      return {
        disponible:
          false,

        activo:
          false,

        mensaje:
          "El worker todavía no está conectado."
      };
    }

    return {
      disponible:
        true,

      ...worker
        .obtenerEstado()
    };
  }

  async function ejecutarWorkerAhora() {
    if (
      !worker ||
      typeof worker
        .ejecutarAhora !==
        "function"
    ) {
      throw crearErrorServicio(
        "El worker de comunicaciones no está disponible.",
        "QUEUE_WORKER_NO_DISPONIBLE"
      );
    }

    return worker
      .ejecutarAhora();
  }

  async function iniciarWorker() {
    if (
      !worker ||
      typeof worker.iniciar !==
        "function"
    ) {
      throw crearErrorServicio(
        "El worker de comunicaciones no está disponible.",
        "QUEUE_WORKER_NO_DISPONIBLE"
      );
    }

    return worker.iniciar();
  }

  function detenerWorker() {
    if (
      !worker ||
      typeof worker.detener !==
        "function"
    ) {
      throw crearErrorServicio(
        "El worker de comunicaciones no está disponible.",
        "QUEUE_WORKER_NO_DISPONIBLE"
      );
    }

    return worker.detener();
  }

  return {
    agregarTrabajo,
    listarTrabajos,
    obtenerTrabajo,

    procesarSiguiente,
    procesarLote,

    reintentarTrabajo,
    cancelarTrabajo,
    eliminarTrabajo,

    obtenerEstadisticas,

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
  normalizarLimite,
  normalizarPrioridad,
  normalizarMaxIntentos,
  crearErrorServicio,
  validarFechaIso,
  crearCommunicationQueueService
};