"use strict";

/* =========================================================
   COMMUNICATION QUEUE

   Responsabilidades:
   - Agregar trabajos a la cola.
   - Procesar el siguiente trabajo disponible.
   - Coordinar el CommunicationEngine.
   - Calcular reintentos.
   - Liberar trabajos bloqueados.
========================================================= */

function limpiarTexto(
  valor = ""
) {
  return String(
    valor ?? ""
  ).trim();
}

function crearErrorCola(
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

function normalizarError(
  error
) {
  return {
    nombre:
      error?.name ||
      "Error",

    codigo:
      error?.code ||
      "QUEUE_PROCESSING_ERROR",

    mensaje:
      error?.message ||
      "Ocurrió un error procesando el trabajo.",

    stack:
      process.env.NODE_ENV ===
      "development"
        ? error?.stack || ""
        : ""
  };
}

function calcularDemoraReintento({
  intento = 1,
  demoraBaseMs = 60000,
  demoraMaximaMs = 3600000
} = {}) {
  const numeroIntento =
    Math.max(
      1,
      Number(intento) || 1
    );

  const base =
    Math.max(
      1000,
      Number(demoraBaseMs) ||
      60000
    );

  const maxima =
    Math.max(
      base,
      Number(demoraMaximaMs) ||
      3600000
    );

  const demora =
    base *
    Math.pow(
      2,
      numeroIntento - 1
    );

  return Math.min(
    demora,
    maxima
  );
}

function generarWorkerId() {
  return (
    `worker-${process.pid}-` +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

/* =========================================================
   FACTORÍA DE LA COLA
========================================================= */

function crearCommunicationQueue({
  repository,
  communicationEngine,

  workerId =
    generarWorkerId(),

  demoraBaseMs =
    60000,

  demoraMaximaMs =
    3600000,

  logger =
    console
} = {}) {
  if (!repository) {
    throw new Error(
      "El repositorio de la cola es obligatorio."
    );
  }

  if (!communicationEngine) {
    throw new Error(
      "CommunicationEngine es obligatorio."
    );
  }

  let procesando =
    false;

  /* =======================================================
     AGREGAR TRABAJO
  ======================================================= */

  async function agregar({
    payload = {},
    prioridad = 5,
    fechaProgramada = "",
    maxIntentos = 3,
    creadoPor = "sistema",
    metadata = {}
  } = {}) {
    if (
      !payload ||
      typeof payload !==
        "object"
    ) {
      throw crearErrorCola(
        "El payload del trabajo es obligatorio.",
        "QUEUE_PAYLOAD_INVALIDO"
      );
    }

    if (
      !payload.tipo &&
      !payload.plantillaId
    ) {
      throw crearErrorCola(
        "El trabajo necesita tipo o plantillaId.",
        "QUEUE_TEMPLATE_REQUERIDA"
      );
    }

    return repository.crear({
      tipo:
        "comunicacion",

      payload,

      prioridad:
        Number(prioridad) || 5,

      fechaProgramada:
        limpiarTexto(
          fechaProgramada
        ),

      maxIntentos:
        Math.max(
          1,
          Number(
            maxIntentos
          ) || 3
        ),

      creadoPor:
        limpiarTexto(
          creadoPor
        ) || "sistema",

      metadata:
        metadata &&
        typeof metadata ===
          "object"
          ? metadata
          : {}
    });
  }

  /* =======================================================
     PROCESAR UN TRABAJO
  ======================================================= */

  async function procesarTrabajo(
    trabajo
  ) {
    if (!trabajo?.id) {
      throw crearErrorCola(
        "El trabajo no tiene identificador.",
        "QUEUE_JOB_INVALIDO"
      );
    }

    const bloqueado =
      await repository
        .bloquear(
          trabajo.id,
          workerId
        );

    if (!bloqueado) {
      return {
        ok: false,

        omitido:
          true,

        motivo:
          "trabajo_no_disponible"
      };
    }

    logger.info?.(
      `[CommunicationQueue] Procesando ${bloqueado.id}`
    );

    try {
      const resultado =
        await communicationEngine
          .enviar(
            bloqueado.payload
          );

      const completado =
        await repository
          .completar(
            bloqueado.id,
            resultado
          );

      logger.info?.(
        `[CommunicationQueue] Trabajo completado ${bloqueado.id}`
      );

      return {
        ok: true,

        trabajo:
          completado,

        resultado
      };
    } catch (error) {
      const normalizado =
        normalizarError(
          error
        );

      const demora =
        calcularDemoraReintento({
          intento:
            bloqueado.intentos,

          demoraBaseMs,

          demoraMaximaMs
        });

      const reprogramarPara =
        new Date(
          Date.now() +
          demora
        ).toISOString();

      const actualizado =
        await repository
          .registrarError(
            bloqueado.id,
            normalizado,
            {
              reprogramarPara
            }
          );

      logger.error?.(
        `[CommunicationQueue] Error procesando ${bloqueado.id}:`,
        error
      );

      return {
        ok: false,

        trabajo:
          actualizado,

        error:
          normalizado,

        reprogramarPara:
          actualizado?.estado ===
          "pendiente"
            ? reprogramarPara
            : ""
      };
    }
  }

  /* =======================================================
     PROCESAR SIGUIENTE
  ======================================================= */

  async function procesarSiguiente() {
    if (procesando) {
      return {
        ok: false,

        omitido:
          true,

        motivo:
          "worker_ocupado"
      };
    }

    procesando =
      true;

    try {
      const siguiente =
        await repository
          .obtenerSiguiente();

      if (!siguiente) {
        return {
          ok: true,

          vacio:
            true
        };
      }

      return procesarTrabajo(
        siguiente
      );
    } finally {
      procesando =
        false;
    }
  }

  /* =======================================================
     PROCESAR VARIOS
  ======================================================= */

  async function procesarLote({
    limite = 10
  } = {}) {
    const maximo =
      Math.max(
        1,
        Math.min(
          Number(limite) || 10,
          100
        )
      );

    const resultados = [];

    for (
      let i = 0;
      i < maximo;
      i += 1
    ) {
      const resultado =
        await procesarSiguiente();

      resultados.push(
        resultado
      );

      if (
        resultado?.vacio ||
        resultado?.motivo ===
          "worker_ocupado"
      ) {
        break;
      }
    }

    return {
      ok: true,

      procesados:
        resultados.filter(
          (item) =>
            item?.trabajo
        ).length,

      resultados
    };
  }

  /* =======================================================
     REINTENTAR MANUALMENTE
  ======================================================= */

  async function reintentar(
    id
  ) {
    const trabajo =
      await repository
        .buscarPorId(
          id
        );

    if (!trabajo) {
      throw crearErrorCola(
        "Trabajo de cola no encontrado.",
        "QUEUE_JOB_NO_ENCONTRADO"
      );
    }

    if (
      trabajo.estado !==
      "error"
    ) {
      throw crearErrorCola(
        "Solo se pueden reintentar trabajos con estado de error.",
        "QUEUE_JOB_NO_REINTENTABLE"
      );
    }

    const actualizado =
      await repository
        .actualizar(
          id,
          {
            estado:
              "pendiente",

            fechaDisponible:
              new Date()
                .toISOString(),

            bloqueadoPor:
              "",

            fechaInicio:
              "",

            fechaFinalizacion:
              "",

            ultimoError:
              null
          }
        );

    return {
      ok: true,

      trabajo:
        actualizado
    };
  }

  /* =======================================================
     CANCELAR
  ======================================================= */

  async function cancelar(
    id,
    motivo = ""
  ) {
    const trabajo =
      await repository
        .cancelar(
          id,
          motivo
        );

    if (!trabajo) {
      throw crearErrorCola(
        "Trabajo de cola no encontrado.",
        "QUEUE_JOB_NO_ENCONTRADO"
      );
    }

    return {
      ok: true,

      trabajo
    };
  }

  /* =======================================================
     CONSULTAR
  ======================================================= */

  async function obtener(
    id
  ) {
    const trabajo =
      await repository
        .buscarPorId(
          id
        );

    if (!trabajo) {
      throw crearErrorCola(
        "Trabajo de cola no encontrado.",
        "QUEUE_JOB_NO_ENCONTRADO"
      );
    }

    return trabajo;
  }

  async function listar(
    filtros = {}
  ) {
    return repository.listar({
      limite:
        filtros.limite,

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

  return {
    agregar,
    procesarTrabajo,
    procesarSiguiente,
    procesarLote,
    reintentar,
    cancelar,
    obtener,
    listar,

    obtenerWorkerId() {
      return workerId;
    },

    estaProcesando() {
      return procesando;
    }
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  limpiarTexto,
  crearErrorCola,
  normalizarError,
  calcularDemoraReintento,
  generarWorkerId,
  crearCommunicationQueue
};