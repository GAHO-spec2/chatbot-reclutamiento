"use strict";

const fs = require("fs");
const path = require("path");

/* =========================================================
   REPOSITORIO DE COMUNICACIONES

   Soporta:
   - JSON local
   - Firestore
========================================================= */

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
      "Error leyendo comunicaciones JSON:",
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

  const archivoTemporal =
    `${archivoJson}.tmp`;

  fs.writeFileSync(
    archivoTemporal,
    JSON.stringify(
      datos,
      null,
      2
    ),
    "utf8"
  );

  fs.renameSync(
    archivoTemporal,
    archivoJson
  );
}

function crearCommunicationsRepository({
  db = null,

  archivoJson = path.join(
    process.cwd(),
    "data",
    "comunicaciones.json"
  ),

  collectionName =
    "comunicaciones"
} = {}) {
  async function crear(
    comunicacion = {}
  ) {
    if (!comunicacion.id) {
      throw new Error(
        "La comunicación debe tener un identificador."
      );
    }

    if (!db) {
      const comunicaciones =
        leerJsonSeguro(
          archivoJson
        );

      const existe =
        comunicaciones.some(
          (item) =>
            item.id ===
            comunicacion.id
        );

      if (existe) {
        const error =
          new Error(
            "Ya existe una comunicación con ese identificador."
          );

        error.code =
          "COMUNICACION_DUPLICADA";

        throw error;
      }

      comunicaciones.push(
        comunicacion
      );

      guardarJsonSeguro(
        archivoJson,
        comunicaciones
      );

      return comunicacion;
    }

    const ref =
      db
        .collection(
          collectionName
        )
        .doc(
          comunicacion.id
        );

    const doc =
      await ref.get();

    if (doc.exists) {
      const error =
        new Error(
          "Ya existe una comunicación con ese identificador."
        );

      error.code =
        "COMUNICACION_DUPLICADA";

      throw error;
    }

    await ref.set(
      comunicacion,
      {
        merge: false
      }
    );

    return comunicacion;
  }

  async function buscarPorId(
    id
  ) {
    const comunicacionId =
      String(id || "")
        .trim();

    if (!comunicacionId) {
      return null;
    }

    if (!db) {
      const comunicaciones =
        leerJsonSeguro(
          archivoJson
        );

      return (
        comunicaciones.find(
          (item) =>
            item.id ===
            comunicacionId
        ) || null
      );
    }

    const doc =
      await db
        .collection(
          collectionName
        )
        .doc(
          comunicacionId
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

  async function listar({
    limite = 200,
    estado = "",
    canal = "",
    tipo = "",
    candidatoId = "",
    postulacionId = "",
    entrevistaId = ""
  } = {}) {
    let comunicaciones;

    if (!db) {
      comunicaciones =
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

      comunicaciones =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data()
          })
        );
    }

    let resultado =
      Array.isArray(
        comunicaciones
      )
        ? [...comunicaciones]
        : [];

    const filtros = {
      estado,
      canal,
      tipo,
      candidatoId,
      postulacionId,
      entrevistaId
    };

    Object.entries(
      filtros
    ).forEach(
      ([campo, valor]) => {
        const limpio =
          String(
            valor || ""
          ).trim();

        if (!limpio) {
          return;
        }

        resultado =
          resultado.filter(
            (item) =>
              String(
                item[campo] || ""
              ) === limpio
          );
      }
    );

    return resultado
      .sort(
        (a, b) =>
          new Date(
            b.fechaCreacion || 0
          ) -
          new Date(
            a.fechaCreacion || 0
          )
      )
      .slice(
        0,
        Math.max(
          1,
          Number(limite) || 200
        )
      );
  }

  async function actualizar(
    id,
    cambios = {}
  ) {
    const actual =
      await buscarPorId(id);

    if (!actual) {
      return null;
    }

    const fechaActual =
      new Date().toISOString();

    const actualizada = {
      ...actual,
      ...cambios,

      id:
        actual.id,

      fechaCreacion:
        actual.fechaCreacion ||
        fechaActual,

      fechaActualizacion:
        cambios.fechaActualizacion ||
        fechaActual
    };

    if (!db) {
      const comunicaciones =
        leerJsonSeguro(
          archivoJson
        );

      const index =
        comunicaciones.findIndex(
          (item) =>
            item.id === id
        );

      if (index === -1) {
        return null;
      }

      comunicaciones[index] =
        actualizada;

      guardarJsonSeguro(
        archivoJson,
        comunicaciones
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

  async function eliminar(
    id
  ) {
    const existente =
      await buscarPorId(id);

    if (!existente) {
      return null;
    }

    if (!db) {
      const comunicaciones =
        leerJsonSeguro(
          archivoJson
        );

      const restantes =
        comunicaciones.filter(
          (item) =>
            item.id !== id
        );

      guardarJsonSeguro(
        archivoJson,
        restantes
      );

      return existente;
    }

    await db
      .collection(
        collectionName
      )
      .doc(id)
      .delete();

    return existente;
  }

  async function listarPendientes({
    limite = 100,
    hasta = new Date()
      .toISOString()
  } = {}) {
    const comunicaciones =
      await listar({
        limite:
          Math.max(
            Number(limite) || 100,
            100
          ),

        estado:
          "pendiente"
      });

    return comunicaciones.filter(
      (item) => {
        if (
          !item.fechaProgramada
        ) {
          return true;
        }

        const fechaProgramada =
          new Date(
            item.fechaProgramada
          );

        const fechaLimite =
          new Date(hasta);

        if (
          Number.isNaN(
            fechaProgramada
              .getTime()
          )
        ) {
          return false;
        }

        return (
          fechaProgramada <=
          fechaLimite
        );
      }
    );
  }

  async function contarPorEstado() {
    const comunicaciones =
      await listar({
        limite:
          10000
      });

    return comunicaciones.reduce(
      (resultado, item) => {
        const estado =
          String(
            item.estado ||
            "desconocido"
          );

        resultado[estado] =
          (
            resultado[estado] ||
            0
          ) + 1;

        return resultado;
      },
      {}
    );
  }

  return {
    crear,
    buscarPorId,
    listar,
    actualizar,
    eliminar,
    listarPendientes,
    contarPorEstado
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  asegurarDirectorio,
  asegurarArchivoJson,
  leerJsonSeguro,
  guardarJsonSeguro,
  crearCommunicationsRepository
};