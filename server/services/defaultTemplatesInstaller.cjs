"use strict";

const {
  obtenerPlantillasIniciales
} = require(
  "../templates/defaultTemplates.cjs"
);

/* =========================================================
   INSTALADOR DE PLANTILLAS INICIALES
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

  /*
   * Consultamos todas las plantillas,
   * incluyendo activas e inactivas.
   */
  const existentes =
    await service.listarPlantillas({
      incluirInactivas:
        true
    });

  /*
   * Si ya existe al menos una plantilla,
   * no instalamos nada.
   */
  if (
    Array.isArray(existentes) &&
    existentes.length > 0
  ) {
    return {
      instalado:
        false,

      motivo:
        "plantillas_existentes",

      totalExistentes:
        existentes.length,

      creadas: []
    };
  }

  const plantillasIniciales =
    obtenerPlantillasIniciales();

  const creadas = [];

  for (
    const plantilla
    of plantillasIniciales
  ) {
    try {
      const creada =
        await service.crearPlantilla(
          plantilla,
          {
            usuario
          }
        );

      creadas.push(
        creada
      );
    } catch (error) {
      /*
       * Si una plantilla apareció entre
       * la consulta y la creación, no
       * detenemos toda la instalación.
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
      true,

    motivo:
      "base_vacia",

    totalExistentes:
      0,

    totalCreadas:
      creadas.length,

    creadas
  };
}

module.exports = {
  instalarPlantillasIniciales
};