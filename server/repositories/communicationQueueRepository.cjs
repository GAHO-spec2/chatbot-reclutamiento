"use strict";

const fs = require("fs");
const path = require("path");

/* =========================================================
   REPOSITORIO DE COLA DE COMUNICACIONES

   Estados:
   - pendiente
   - procesando
   - completado
   - error
   - cancelado

   Soporta:
   - JSON local
   - Firestore
========================================================= */

const QUEUE_STATUS = Object.freeze({
  PENDIENTE:
    "pendiente",

  PROCESANDO:
    "procesando",

  COMPLETADO:
    "completado",

  ERROR:
    "error",

  CANCELADO:
    "cancelado"
});

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

function generarIdTrabajo() {
  return (
    `job-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}

function asegurarDirectorio(
  archivoJson
) {
  const directorio =
    path.dirname(archivoJson);

  if (
    !fs.existsSync(
      directorio
    )
  ) {
    fs.mkdirSync(
      directorio,
      {
        recursive: true
      }
    );
  }
}

function asegurarArchivoJson(
  archivoJson
) {
  asegurarDirectorio(
    archivoJson
  );

  if (
    !fs.existsSync(
      archivoJson
    )
  ) {
    fs.writeFileSync(
      archivoJson,
      "[]",
      "utf8"
    );
  }
}

function leerJsonSeguro(
  archivoJson
) {
  asegurarArchivoJson(
    archivoJson
  );

  try {
    const contenido =
      fs.readFileSync(
        archivoJson,
        "utf8"
      );

    const datos =
      JSON.parse(
        contenido || "[]"
      );

    return Array.isArray(datos)
      ? datos
      : [];
  } catch (error) {
    console.error(
      "Error leyendo la cola de comunicaciones:",
      error
    );

    return [];
  }
}

function guardarJsonSeguro(
  archivoJson,
  datos
) {
  asegurarArchivoJson(
    archivoJson
  );

  const temporal =
    `${archivoJson}.tmp`;

  fs.writeFileSync(
    temporal,
    JSON.stringify(
      datos,
      null,
      2
    ),
    "utf8"
  );

  fs.renameSync(
    temporal,
    archivoJson
  );
}

/* =========================================================
   CREAR TRABAJO
========================================================= */

function crearTrabajoCola({
  id = "",
  tipo = "comunicacion",
  payload = {},
  prioridad = 5,
  fechaProgramada = "",
  maxIntentos = 3,
  creadoPor = "sistema",
  metadata = {}
} = {}) {
  const fechaActual =
    new Date().toISOString();

  return {
    id:
      limpiarTexto(id) ||
      generarIdTrabajo(),

    tipo:
      limpiarTexto(tipo) ||
      "comunicacion",

    payload:
      payload &&
      typeof payload ===
        "object"
        ? payload
        : {},

    prioridad:
      Number.isFinite(
        Number(prioridad)
      )
        ? Number(prioridad)
        : 5,

    estado:
      QUEUE_STATUS.PENDIENTE,

    intentos:
      0,

    maxIntentos:
      Math.max(
        1,
        Number(maxIntentos) || 3
      ),

    bloqueadoPor:
      "",

    fechaProgramada:
      limpiarTexto(
        fechaProgramada
      ),

    fechaDisponible:
      limpiarTexto(
        fechaProgramada
      ) ||
      fechaActual,

    fechaInicio:
      "",

    fechaFinalizacion:
      "",

    fechaUltimoIntento:
      "",

    ultimoError:
      null,

    resultado:
      null,

    creadoPor:
      limpiarTexto(
        creadoPor
      ) || "sistema",

    metadata:
      metadata &&
      typeof metadata ===
        "object"
        ? metadata
        : {},

    fechaCreacion:
      fechaActual,

    fechaActualizacion:
      fechaActual
  };
}

/* =========================================================
   FACTORÍA DEL REPOSITORIO
========================================================= */

function crearCommunicationQueueRepository({
  db = null,

  archivoJson = path.join(
    process.cwd(),
    "server",
    "data",
    "communication-queue.json"
  ),

  collectionName =
    "communication_queue"
} = {}) {
  /* =======================================================
     CREAR
  ======================================================= */

  async function crear(
    datos = {}
  ) {
    const trabajo =
      datos.estado
        ? {
            ...datos
          }
        : crearTrabajoCola(
            datos
          );

    if (!trabajo.id) {
      throw new Error(
        "El trabajo de cola necesita un identificador."
      );
    }

    if (!db) {
      const trabajos =
        leerJsonSeguro(
          archivoJson
        );

      const existe =
        trabajos.some(
          (item) =>
            item.id ===
            trabajo.id
        );

      if (existe) {
        const error =
          new Error(
            "Ya existe un trabajo con ese identificador."
          );

        error.code =
          "QUEUE_JOB_DUPLICADO";

        throw error;
      }

      trabajos.push(
        trabajo
      );

      guardarJsonSeguro(
        archivoJson,
        trabajos
      );

      return trabajo;
    }

    const ref =
      db
        .collection(
          collectionName
        )
        .doc(
          trabajo.id
        );

    const doc =
      await ref.get();

    if (doc.exists) {
      const error =
        new Error(
          "Ya existe un trabajo con ese identificador."
        );

      error.code =
        "QUEUE_JOB_DUPLICADO";

      throw error;
    }

    await ref.set(
      trabajo,
      {
        merge: false
      }
    );

    return trabajo;
  }

  /* =======================================================
     BUSCAR POR ID
  ======================================================= */

  async function buscarPorId(
    id
  ) {
    const trabajoId =
      limpiarTexto(id);

    if (!trabajoId) {
      return null;
    }

    if (!db) {
      const trabajos =
        leerJsonSeguro(
          archivoJson
        );

      return (
        trabajos.find(
          (item) =>
            item.id ===
            trabajoId
        ) || null
      );
    }

    const doc =
      await db
        .collection(
          collectionName
        )
        .doc(
          trabajoId
        )
        .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  }

  /* =======================================================
     LISTAR
  ======================================================= */

  async function listar({
    limite = 200,
    estado = "",
    tipo = ""
  } = {}) {
    let trabajos;

    if (!db) {
      trabajos =
        leerJsonSeguro(
          archivoJson
        );
    } else {
      const snapshot =
        await db
          .collection(
            collectionName
          )
          .orderBy(
            "fechaCreacion",
            "desc"
          )
          .limit(
            Math.max(
              1,
              Number(limite) || 200
            )
          )
          .get();

      trabajos =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data()
          })
        );
    }

    let resultado =
      Array.isArray(trabajos)
        ? [...trabajos]
        : [];

    if (estado) {
      resultado =
        resultado.filter(
          (item) =>
            item.estado ===
            estado
        );
    }

    if (tipo) {
      resultado =
        resultado.filter(
          (item) =>
            item.tipo ===
            tipo
        );
    }

    return resultado
      .sort(
        (a, b) => {
          const prioridadA =
            Number(
              a.prioridad || 5
            );

          const prioridadB =
            Number(
              b.prioridad || 5
            );

          if (
            prioridadA !==
            prioridadB
          ) {
            return (
              prioridadA -
              prioridadB
            );
          }

          return (
            new Date(
              a.fechaCreacion || 0
            ) -
            new Date(
              b.fechaCreacion || 0
            )
          );
        }
      )
      .slice(
        0,
        Math.max(
          1,
          Number(limite) || 200
        )
      );
  }

  /* =======================================================
     ACTUALIZAR
  ======================================================= */

  async function actualizar(
    id,
    cambios = {}
  ) {
    const actual =
      await buscarPorId(id);

    if (!actual) {
      return null;
    }

    const actualizada = {
      ...actual,
      ...cambios,

      id:
        actual.id,

      fechaCreacion:
        actual.fechaCreacion,

      fechaActualizacion:
        new Date()
          .toISOString()
    };

    if (!db) {
      const trabajos =
        leerJsonSeguro(
          archivoJson
        );

      const index =
        trabajos.findIndex(
          (item) =>
            item.id === id
        );

      if (index === -1) {
        return null;
      }

      trabajos[index] =
        actualizada;

      guardarJsonSeguro(
        archivoJson,
        trabajos
      );

      return actualizada;
    }

    await db
      .collection(
        collectionName
      )
      .doc(id)
      .set(
        actualizada,
        {
          merge: false
        }
      );

    return actualizada;
  }

  /* =======================================================
     OBTENER SIGUIENTE TRABAJO DISPONIBLE
  ======================================================= */

  async function obtenerSiguiente({
    ahora = new Date()
      .toISOString()
  } = {}) {
    const pendientes =
      await listar({
        limite:
          1000,

        estado:
          QUEUE_STATUS.PENDIENTE
      });

    const fechaActual =
      new Date(ahora);

    return (
      pendientes.find(
        (trabajo) => {
          const fechaDisponible =
            new Date(
              trabajo.fechaDisponible ||
              trabajo.fechaProgramada ||
              trabajo.fechaCreacion
            );

          return (
            !Number.isNaN(
              fechaDisponible
                .getTime()
            ) &&
            fechaDisponible <=
              fechaActual
          );
        }
      ) || null
    );
  }

  /* =======================================================
     BLOQUEAR TRABAJO
  ======================================================= */

  async function bloquear(
    id,
    workerId
  ) {
    const trabajo =
      await buscarPorId(id);

    if (!trabajo) {
      return null;
    }

    if (
      trabajo.estado !==
      QUEUE_STATUS.PENDIENTE
    ) {
      return null;
    }

    return actualizar(
      id,
      {
        estado:
          QUEUE_STATUS.PROCESANDO,

        bloqueadoPor:
          limpiarTexto(
            workerId
          ),

        fechaInicio:
          new Date()
            .toISOString(),

        fechaUltimoIntento:
          new Date()
            .toISOString(),

        intentos:
          Number(
            trabajo.intentos ||
            0
          ) + 1,

        ultimoError:
          null
      }
    );
  }

  /* =======================================================
     COMPLETAR
  ======================================================= */

  async function completar(
    id,
    resultado = null
  ) {
    return actualizar(
      id,
      {
        estado:
          QUEUE_STATUS.COMPLETADO,

        resultado,

        bloqueadoPor:
          "",

        fechaFinalizacion:
          new Date()
            .toISOString(),

        ultimoError:
          null
      }
    );
  }

  /* =======================================================
     REGISTRAR ERROR
  ======================================================= */

  async function registrarError(
    id,
    errorNormalizado,
    {
      reprogramarPara = ""
    } = {}
  ) {
    const trabajo =
      await buscarPorId(id);

    if (!trabajo) {
      return null;
    }

    const agotado =
      Number(
        trabajo.intentos || 0
      ) >=
      Number(
        trabajo.maxIntentos || 3
      );

    return actualizar(
      id,
      {
        estado:
          agotado
            ? QUEUE_STATUS.ERROR
            : QUEUE_STATUS.PENDIENTE,

        ultimoError:
          errorNormalizado,

        bloqueadoPor:
          "",

        fechaDisponible:
          agotado
            ? trabajo
                .fechaDisponible
            : limpiarTexto(
                reprogramarPara
              ) ||
              new Date(
                Date.now() +
                60 * 1000
              ).toISOString()
      }
    );
  }

  /* =======================================================
     CANCELAR
  ======================================================= */

  async function cancelar(
    id,
    motivo = ""
  ) {
    const trabajo =
      await buscarPorId(id);

    if (!trabajo) {
      return null;
    }

    if (
      [
        QUEUE_STATUS.COMPLETADO,
        QUEUE_STATUS.CANCELADO
      ].includes(
        trabajo.estado
      )
    ) {
      return trabajo;
    }

    return actualizar(
      id,
      {
        estado:
          QUEUE_STATUS.CANCELADO,

        motivoCancelacion:
          limpiarTexto(
            motivo
          ),

        bloqueadoPor:
          "",

        fechaFinalizacion:
          new Date()
            .toISOString()
      }
    );
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function eliminar(
    id
  ) {
    const trabajo =
      await buscarPorId(id);

    if (!trabajo) {
      return null;
    }

    if (!db) {
      const trabajos =
        leerJsonSeguro(
          archivoJson
        );

      const restantes =
        trabajos.filter(
          (item) =>
            item.id !== id
        );

      guardarJsonSeguro(
        archivoJson,
        restantes
      );

      return trabajo;
    }

    await db
      .collection(
        collectionName
      )
      .doc(id)
      .delete();

    return trabajo;
  }

  return {
    crear,
    buscarPorId,
    listar,
    actualizar,
    obtenerSiguiente,
    bloquear,
    completar,
    registrarError,
    cancelar,
    eliminar
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  QUEUE_STATUS,
  limpiarTexto,
  generarIdTrabajo,
  asegurarDirectorio,
  asegurarArchivoJson,
  leerJsonSeguro,
  guardarJsonSeguro,
  crearTrabajoCola,
  crearCommunicationQueueRepository
};