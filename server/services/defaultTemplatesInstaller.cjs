"use strict";

const {
  obtenerPlantillasIniciales
} = require(
  "../templates/defaultTemplates.cjs"
);

/* =========================================================
   INSTALADOR DE PLANTILLAS INICIALES

   Comportamiento:
   - Conserva las plantillas existentes.
   - Instala únicamente las que falten.
   - No sobrescribe personalizaciones existentes.
========================================================= */

async function instalarPlantillasIniciales({
  service,
  usuario = "sistema"
} = {}) {
  if (!service) {
    throw new Error(
      "El servicio de plantillas es obligatorio."
    );
  }

  const existentes =
    await service.listarPlantillas({
      incluirInactivas: true
    });

  const plantillasIniciales =
    obtenerPlantillasIniciales();

  const idsExistentes =
    new Set(
      (Array.isArray(existentes)
        ? existentes
        : []
      )
        .map((plantilla) =>
          String(
            plantilla?.id || ""
          ).trim()
        )
        .filter(Boolean)
    );

  const faltantes =
    plantillasIniciales.filter(
      (plantilla) =>
        !idsExistentes.has(
          String(
            plantilla?.id || ""
          ).trim()
        )
    );

  const creadas = [];

  for (const plantilla of faltantes) {
    try {
      const creada =
        await service.crearPlantilla(
          plantilla,
          {
            usuario
          }
        );

      creadas.push(creada);
    } catch (error) {
      /*
       * Si otra ejecución creó la plantilla
       * mientras se procesaba la instalación,
       * simplemente continuamos.
       */
      if (
        error.code ===
        "PLANTILLA_DUPLICADA"
      ) {
        console.warn(
          `Plantilla inicial omitida porque ya existe: ${plantilla.id}`
        );

        continue;
      }

      throw error;
    }
  }

  return {
    instalado:
      creadas.length > 0,

    motivo:
      faltantes.length > 0
        ? "plantillas_faltantes_instaladas"
        : "plantillas_actualizadas",

    totalExistentes:
      Array.isArray(existentes)
        ? existentes.length
        : 0,

    totalIniciales:
      plantillasIniciales.length,

    totalFaltantes:
      faltantes.length,

    totalCreadas:
      creadas.length,

    creadas
  };
}

module.exports = {
  instalarPlantillasIniciales
};