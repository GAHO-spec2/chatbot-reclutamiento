"use strict";

/* =========================================================
   SERVICIO DE COMUNICACIONES

   Responsabilidades:
   - Listar el historial.
   - Consultar una comunicación.
   - Obtener estadísticas.
   - Reintentar envíos con error.
   - Cancelar comunicaciones pendientes.
   - Preparar y enviar comunicaciones.
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

/* =========================================================
   FACTORÍA DEL SERVICIO
========================================================= */

function crearCommunicationsService({
  repository,
  engine
} = {}) {
  if (!repository) {
    throw new Error(
      "El repositorio de comunicaciones es obligatorio."
    );
  }

  if (!engine) {
    throw new Error(
      "CommunicationEngine es obligatorio."
    );
  }

  /* =======================================================
     LISTAR
  ======================================================= */

  async function listarComunicaciones(
    filtros = {}
  ) {
    return repository.listar({
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

      canal:
        limpiarTexto(
          filtros.canal
        ),

      tipo:
        limpiarTexto(
          filtros.tipo
        ),

      candidatoId:
        limpiarTexto(
          filtros.candidatoId
        ),

      postulacionId:
        limpiarTexto(
          filtros.postulacionId
        ),

      entrevistaId:
        limpiarTexto(
          filtros.entrevistaId
        )
    });
  }

  /* =======================================================
     OBTENER UNA COMUNICACIÓN
  ======================================================= */

  async function obtenerComunicacion(
    id
  ) {
    const comunicacion =
      await repository.buscarPorId(
        limpiarTexto(id)
      );

    if (!comunicacion) {
      throw crearErrorServicio(
        "Comunicación no encontrada.",
        "COMUNICACION_NO_ENCONTRADA"
      );
    }

    return comunicacion;
  }

  /* =======================================================
     ENVIAR
  ======================================================= */

  async function enviarComunicacion(
    datos = {},
    contexto = {}
  ) {
    const destinatario =
      datos.destinatario &&
      typeof datos.destinatario ===
        "object"
        ? datos.destinatario
        : {
            nombre:
              datos.nombre ||
              datos.destinatarioNombre ||
              "",

            correo:
              datos.correo ||
              datos.destinatarioCorreo ||
              "",

            telefono:
              datos.telefono ||
              datos.destinatarioTelefono ||
              ""
          };

    return engine.enviar({
      plantillaId:
        limpiarTexto(
          datos.plantillaId
        ),

      tipo:
        limpiarTexto(
          datos.tipo
        ),

      canal:
        limpiarTexto(
          datos.canal
        ) || "email",

      idioma:
        limpiarTexto(
          datos.idioma
        ) || "es",

      destinatario,

      variables:
        datos.variables &&
        typeof datos.variables ===
          "object"
          ? datos.variables
          : {},

      candidatoId:
        limpiarTexto(
          datos.candidatoId
        ),

      postulacionId:
        limpiarTexto(
          datos.postulacionId
        ),

      entrevistaId:
        limpiarTexto(
          datos.entrevistaId
        ),

      fechaProgramada:
        limpiarTexto(
          datos.fechaProgramada
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
     REINTENTAR
  ======================================================= */

  async function reintentarComunicacion(
    id
  ) {
    const comunicacion =
      await obtenerComunicacion(
        id
      );

    if (
      comunicacion.estado !==
      "error"
    ) {
      throw crearErrorServicio(
        "Solo se pueden reintentar comunicaciones con estado de error.",
        "COMUNICACION_NO_REINTENTABLE"
      );
    }

    return engine.reintentar(
      comunicacion
    );
  }

  /* =======================================================
     CANCELAR
  ======================================================= */

  async function cancelarComunicacion(
    id,
    motivo = ""
  ) {
    const comunicacion =
      await obtenerComunicacion(
        id
      );

    return engine.cancelar(
      comunicacion,
      limpiarTexto(motivo)
    );
  }

  /* =======================================================
     ELIMINAR
  ======================================================= */

  async function eliminarComunicacion(
    id
  ) {
    const comunicacion =
      await repository.eliminar(
        limpiarTexto(id)
      );

    if (!comunicacion) {
      throw crearErrorServicio(
        "Comunicación no encontrada.",
        "COMUNICACION_NO_ENCONTRADA"
      );
    }

    return comunicacion;
  }

  /* =======================================================
     PENDIENTES
  ======================================================= */

  async function listarPendientes({
    limite = 100,
    hasta = ""
  } = {}) {
    return repository
      .listarPendientes({
        limite:
          normalizarLimite(
            limite,
            100,
            1000
          ),

        hasta:
          limpiarTexto(hasta) ||
          new Date()
            .toISOString()
      });
  }

  /* =======================================================
     ESTADÍSTICAS
  ======================================================= */

  async function obtenerEstadisticas() {
    const comunicaciones =
      await repository.listar({
        limite:
          10000
      });

    const hoy =
      new Date();

    const hoyClave = [
      hoy.getFullYear(),
      String(
        hoy.getMonth() + 1
      ).padStart(2, "0"),
      String(
        hoy.getDate()
      ).padStart(2, "0")
    ].join("-");

    const estados = {};

    let enviadasHoy = 0;
    let entregadas = 0;
    let abiertas = 0;
    let errores = 0;
    let pendientes = 0;

    for (
      const comunicacion
      of comunicaciones
    ) {
      const estado =
        limpiarTexto(
          comunicacion.estado
        ) || "desconocido";

      estados[estado] =
        (
          estados[estado] ||
          0
        ) + 1;

      if (
        estado === "error"
      ) {
        errores += 1;
      }

      if (
        estado === "pendiente" ||
        estado === "procesando"
      ) {
        pendientes += 1;
      }

      if (
        estado === "entregado" ||
        estado === "abierto"
      ) {
        entregadas += 1;
      }

      if (
        estado === "abierto"
      ) {
        abiertas += 1;
      }

      if (
        [
          "enviado",
          "entregado",
          "abierto"
        ].includes(estado)
      ) {
        const fecha =
          comunicacion.fechaEnvio ||
          comunicacion.fechaCreacion ||
          "";

        const fechaObjeto =
          new Date(fecha);

        if (
          !Number.isNaN(
            fechaObjeto.getTime()
          )
        ) {
          const clave = [
            fechaObjeto.getFullYear(),
            String(
              fechaObjeto
                .getMonth() + 1
            ).padStart(2, "0"),
            String(
              fechaObjeto.getDate()
            ).padStart(2, "0")
          ].join("-");

          if (
            clave === hoyClave
          ) {
            enviadasHoy += 1;
          }
        }
      }
    }

    const enviadasTotales =
      comunicaciones.filter(
        (item) =>
          [
            "enviado",
            "entregado",
            "abierto"
          ].includes(
            limpiarTexto(
              item.estado
            )
          )
      ).length;

    const tasaEntrega =
      enviadasTotales > 0
        ? Math.round(
            (
              entregadas /
              enviadasTotales
            ) * 100
          )
        : 0;

    const tasaApertura =
      entregadas > 0
        ? Math.round(
            (
              abiertas /
              entregadas
            ) * 100
          )
        : 0;

    return {
      total:
        comunicaciones.length,

      enviadasHoy,
      pendientes,
      errores,
      entregadas,
      abiertas,

      tasaEntrega,
      tasaApertura,

      estados
    };
  }

  return {
    listarComunicaciones,
    obtenerComunicacion,
    enviarComunicacion,
    reintentarComunicacion,
    cancelarComunicacion,
    eliminarComunicacion,
    listarPendientes,
    obtenerEstadisticas
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  limpiarTexto,
  normalizarLimite,
  crearErrorServicio,
  crearCommunicationsService
};