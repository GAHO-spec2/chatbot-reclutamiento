"use strict";

const fs = require("fs");
const path = require("path");

/* =========================================================
   REPOSITORIO DE PLANTILLAS DE COMUNICACIÓN

   Soporta:
   - Archivo JSON local
   - Firestore mediante inyección de db
========================================================= */

function generarIdPlantilla() {
  return (
    `tpl-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 8)
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

    const resultado =
      JSON.parse(
        contenido || "[]"
      );

    return Array.isArray(
      resultado
    )
      ? resultado
      : [];
  } catch (error) {
    console.error(
      "Error leyendo plantillas JSON:",
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

/* =========================================================
   FACTORÍA DEL REPOSITORIO
========================================================= */

function crearTemplatesRepository({
  db = null,

  archivoJson = path.join(
    process.cwd(),
    "data",
    "plantillas-comunicacion.json"
  ),

  collectionName =
    "plantillas_comunicacion"
} = {}) {
  /* =======================================================
     LISTAR
  ======================================================= */

  async function listar({
    incluirInactivas = true,
    idioma = "",
    canal = "",
    tipo = ""
  } = {}) {
    let plantillas;

    if (!db) {
      plantillas =
        leerJsonSeguro(
          archivoJson
        );
    } else {
      const snapshot =
        await db
          .collection(
            collectionName
          )
          .get();

      plantillas =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data()
          })
        );
    }

    let resultado =
      Array.isArray(plantillas)
        ? [...plantillas]
        : [];

    if (!incluirInactivas) {
      resultado =
        resultado.filter(
          (plantilla) =>
            plantilla.activo !== false
        );
    }

    if (idioma) {
      resultado =
        resultado.filter(
          (plantilla) =>
            String(
              plantilla.idioma || ""
            ) === String(idioma)
        );
    }

    if (canal) {
      resultado =
        resultado.filter(
          (plantilla) =>
            String(
              plantilla.canal || ""
            ) === String(canal)
        );
    }

    if (tipo) {
      resultado =
        resultado.filter(
          (plantilla) =>
            String(
              plantilla.tipo || ""
            ) === String(tipo)
        );
    }

    return resultado.sort(
      (a, b) =>
        String(
          a.nombre || ""
        ).localeCompare(
          String(
            b.nombre || ""
          ),
          "es",
          {
            sensitivity:
              "base"
          }
        )
    );
  }

  /* =======================================================
     BUSCAR POR ID
  ======================================================= */

  async function buscarPorId(
    id
  ) {
    const plantillaId =
      String(id || "").trim();

    if (!plantillaId) {
      return null;
    }

    if (!db) {
      const plantillas =
        leerJsonSeguro(
          archivoJson
        );

      return (
        plantillas.find(
          (plantilla) =>
            plantilla.id ===
            plantillaId
        ) || null
      );
    }

    const doc =
      await db
        .collection(
          collectionName
        )
        .doc(plantillaId)
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
     BUSCAR POR TIPO E IDIOMA
  ======================================================= */

  async function buscarActivaPorTipo({
    tipo,
    idioma = "es",
    canal = "email"
  } = {}) {
    const plantillas =
      await listar({
        incluirInactivas:
          false,

        tipo,
        idioma
      });

    return (
      plantillas.find(
        (plantilla) =>
          plantilla.canal ===
            canal ||
          plantilla.canal ===
            "ambos"
      ) || null
    );
  }

  /* =======================================================
     CREAR
  ======================================================= */

  async function crear(
    datos = {}
  ) {
    const fechaActual =
      new Date().toISOString();

    const plantilla = {
      ...datos,

      id:
        String(
          datos.id || ""
        ).trim() ||
        generarIdPlantilla(),

      activo:
        datos.activo !== false,

      version:
        Number(
          datos.version || 1
        ),

      fechaCreacion:
        datos.fechaCreacion ||
        fechaActual,

      fechaActualizacion:
        fechaActual
    };

    const existente =
      await buscarPorId(
        plantilla.id
      );

    if (existente) {
      const error =
        new Error(
          "Ya existe una plantilla con ese identificador."
        );

      error.code =
        "PLANTILLA_DUPLICADA";

      throw error;
    }

    if (!db) {
      const plantillas =
        leerJsonSeguro(
          archivoJson
        );

      plantillas.push(
        plantilla
      );

      guardarJsonSeguro(
        archivoJson,
        plantillas
      );

      return plantilla;
    }

    await db
      .collection(
        collectionName
      )
      .doc(plantilla.id)
      .set(
        plantilla,
        {
          merge: false
        }
      );

    return plantilla;
  }

  /* =======================================================
     ACTUALIZAR
  ======================================================= */

  async function actualizar(
    id,
    cambios = {}
  ) {
    const plantillaActual =
      await buscarPorId(id);

    if (!plantillaActual) {
      return null;
    }

    const fechaActual =
      new Date().toISOString();

    const plantillaActualizada = {
      ...plantillaActual,
      ...cambios,

      id:
        plantillaActual.id,

      version:
        Number(
          plantillaActual.version ||
          1
        ) + 1,

      fechaCreacion:
        plantillaActual
          .fechaCreacion ||
        fechaActual,

      fechaActualizacion:
        fechaActual
    };

    if (!db) {
      const plantillas =
        leerJsonSeguro(
          archivoJson
        );

      const index =
        plantillas.findIndex(
          (plantilla) =>
            plantilla.id === id
        );

      if (index === -1) {
        return null;
      }

      plantillas[index] =
        plantillaActualizada;

      guardarJsonSeguro(
        archivoJson,
        plantillas
      );

      return plantillaActualizada;
    }

    await db
      .collection(
        collectionName
      )
      .doc(id)
      .set(
        plantillaActualizada,
        {
          merge: false
        }
      );

    return plantillaActualizada;
  }

  /* =======================================================
     CAMBIAR ESTADO
  ======================================================= */

  async function cambiarEstado(
    id,
    activo
  ) {
    return actualizar(
      id,
      {
        activo:
          Boolean(activo)
      }
    );
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function eliminar(
    id
  ) {
    const existente =
      await buscarPorId(id);

    if (!existente) {
      return null;
    }

    if (!db) {
      const plantillas =
        leerJsonSeguro(
          archivoJson
        );

      const restantes =
        plantillas.filter(
          (plantilla) =>
            plantilla.id !== id
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

  return {
    listar,
    buscarPorId,
    buscarActivaPorTipo,
    crear,
    actualizar,
    cambiarEstado,
    eliminar
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  generarIdPlantilla,
  leerJsonSeguro,
  guardarJsonSeguro,
  crearTemplatesRepository
};