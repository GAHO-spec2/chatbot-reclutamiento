"use strict";

/* =========================================================
   COMMUNICATION WORKER

   Responsabilidades:
   - Ejecutar CommunicationQueue periódicamente.
   - Evitar ejecuciones simultáneas.
   - Procesar trabajos por lotes.
   - Registrar estadísticas básicas.
   - Iniciar y detener el worker de forma segura.
========================================================= */

function limpiarNumero(
  valor,
  predeterminado,
  {
    minimo = 1,
    maximo =
      Number.MAX_SAFE_INTEGER
  } = {}
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero)
  ) {
    return predeterminado;
  }

  return Math.max(
    minimo,
    Math.min(
      Math.floor(numero),
      maximo
    )
  );
}

function crearWorkerId() {
  return (
    `communication-worker-` +
    `${process.pid}-` +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
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
      "WORKER_ERROR",

    mensaje:
      error?.message ||
      "Ocurrió un error en el worker.",

    stack:
      process.env.NODE_ENV ===
      "development"
        ? error?.stack || ""
        : ""
  };
}

/* =========================================================
   FACTORÍA DEL WORKER
========================================================= */

function crearCommunicationWorker({
  queue,

  intervaloMs = 5000,
  tamanoLote = 10,

  procesarAlIniciar = true,

  workerId =
    crearWorkerId(),

  logger = console
} = {}) {
  if (!queue) {
    throw new Error(
      "CommunicationQueue es obligatoria."
    );
  }

  if (
    typeof queue.procesarLote !==
    "function"
  ) {
    throw new Error(
      "CommunicationQueue debe implementar procesarLote()."
    );
  }

  const intervalo =
    limpiarNumero(
      intervaloMs,
      5000,
      {
        minimo: 1000,
        maximo:
          60 * 60 * 1000
      }
    );

  const lote =
    limpiarNumero(
      tamanoLote,
      10,
      {
        minimo: 1,
        maximo: 100
      }
    );

  let timer =
    null;

  let activo =
    false;

  let ejecutando =
    false;

  let ultimaEjecucion =
    "";

  let ultimoResultado =
    null;

  let ultimoError =
    null;

  let totalCiclos =
    0;

  let totalProcesados =
    0;

  let totalErrores =
    0;

  /* =======================================================
     EJECUTAR CICLO
  ======================================================= */

  async function ejecutarCiclo() {
    if (!activo) {
      return {
        ok: false,
        omitido: true,
        motivo:
          "worker_inactivo"
      };
    }

    if (ejecutando) {
      return {
        ok: false,
        omitido: true,
        motivo:
          "ciclo_en_ejecucion"
      };
    }

    ejecutando =
      true;

    ultimaEjecucion =
      new Date()
        .toISOString();

    totalCiclos += 1;

    try {
      const resultado =
        await queue
          .procesarLote({
            limite:
              lote
          });

      ultimoResultado =
        resultado;

      ultimoError =
        null;

      const procesados =
        Number(
          resultado
            ?.procesados ||
          0
        );

      totalProcesados +=
        procesados;

      if (
        procesados > 0
      ) {
        logger.info?.(
          `[CommunicationWorker] ${procesados} trabajo(s) procesado(s).`
        );
      }

      return {
        ok: true,
        ...resultado
      };
    } catch (error) {
      const errorNormalizado =
        normalizarError(
          error
        );

      ultimoError =
        errorNormalizado;

      totalErrores += 1;

      logger.error?.(
        "[CommunicationWorker] Error procesando la cola:",
        error
      );

      return {
        ok: false,
        error:
          errorNormalizado
      };
    } finally {
      ejecutando =
        false;
    }
  }

  /* =======================================================
     PROGRAMAR SIGUIENTE CICLO
  ======================================================= */

  function programarSiguiente() {
    if (!activo) {
      return;
    }

    timer =
      setTimeout(
        async () => {
          await ejecutarCiclo();

          programarSiguiente();
        },
        intervalo
      );

    /*
     * Permite que Node cierre normalmente
     * cuando no queden otros procesos activos.
     */
    if (
      typeof timer.unref ===
      "function"
    ) {
      timer.unref();
    }
  }

  /* =======================================================
     INICIAR
  ======================================================= */

  async function iniciar() {
    if (activo) {
      return {
        ok: true,
        yaEstabaActivo: true,
        workerId
      };
    }

    activo =
      true;

    logger.info?.(
      `[CommunicationWorker] Iniciado: ${workerId}`
    );

    logger.info?.(
      `[CommunicationWorker] Intervalo: ${intervalo} ms | Lote: ${lote}`
    );

    let resultadoInicial =
      null;

    if (
      procesarAlIniciar
    ) {
      resultadoInicial =
        await ejecutarCiclo();
    }

    programarSiguiente();

    return {
      ok: true,
      workerId,
      intervaloMs:
        intervalo,
      tamanoLote:
        lote,
      resultadoInicial
    };
  }

  /* =======================================================
     DETENER
  ======================================================= */

  function detener() {
    activo =
      false;

    if (timer) {
      clearTimeout(
        timer
      );

      timer =
        null;
    }

    logger.info?.(
      `[CommunicationWorker] Detenido: ${workerId}`
    );

    return {
      ok: true,
      workerId
    };
  }

  /* =======================================================
     EJECUCIÓN MANUAL
  ======================================================= */

  async function ejecutarAhora() {
    const estabaActivo =
      activo;

    /*
     * Permite una ejecución manual aunque
     * el worker no haya sido iniciado.
     */
    if (!activo) {
      activo =
        true;
    }

    try {
      return await ejecutarCiclo();
    } finally {
      if (!estabaActivo) {
        activo =
          false;
      }
    }
  }

  /* =======================================================
     ESTADO DEL WORKER
  ======================================================= */

  function obtenerEstado() {
    return {
      workerId,

      activo,
      ejecutando,

      intervaloMs:
        intervalo,

      tamanoLote:
        lote,

      procesarAlIniciar:
        Boolean(
          procesarAlIniciar
        ),

      ultimaEjecucion,

      ultimoResultado,

      ultimoError,

      metricas: {
        totalCiclos,
        totalProcesados,
        totalErrores
      }
    };
  }

  return {
    iniciar,
    detener,
    ejecutarCiclo,
    ejecutarAhora,
    obtenerEstado,

    estaActivo() {
      return activo;
    },

    estaEjecutando() {
      return ejecutando;
    },

    obtenerWorkerId() {
      return workerId;
    }
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  limpiarNumero,
  crearWorkerId,
  normalizarError,
  crearCommunicationWorker
};