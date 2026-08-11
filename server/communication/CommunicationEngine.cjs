"use strict";

/* =========================================================
   COMMUNICATION ENGINE
   Punto central para todas las comunicaciones del ATS.

   Responsabilidades:
   - Buscar y renderizar la plantilla.
   - Validar el destinatario.
   - Crear el registro de comunicación.
   - Enviar mediante el proveedor correspondiente.
   - Registrar éxito o error.
   - Permitir modo simulación.
========================================================= */

/* =========================================================
   ESTADOS
========================================================= */

const COMMUNICATION_STATUS = Object.freeze({
  CREADO:
    "creado",

  PENDIENTE:
    "pendiente",

  PROCESANDO:
    "procesando",

  ENVIADO:
    "enviado",

  ENTREGADO:
    "entregado",

  ABIERTO:
    "abierto",

  ERROR:
    "error",

  CANCELADO:
    "cancelado"
});

const COMMUNICATION_CHANNELS =
  Object.freeze({
    EMAIL:
      "email",

    WHATSAPP:
      "whatsapp",

    AMBOS:
      "ambos"
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

function generarIdComunicacion() {
  return (
    `com-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}

function normalizarCanal(
  canal = "email"
) {
  const valor =
    limpiarTexto(canal)
      .toLowerCase();

  const permitidos = [
    COMMUNICATION_CHANNELS.EMAIL,
    COMMUNICATION_CHANNELS.WHATSAPP,
    COMMUNICATION_CHANNELS.AMBOS
  ];

  return permitidos.includes(
    valor
  )
    ? valor
    : COMMUNICATION_CHANNELS.EMAIL;
}

function validarCorreo(
  correo = ""
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      limpiarTexto(correo)
    );
}

function validarTelefono(
  telefono = ""
) {
  const limpio =
    limpiarTexto(telefono)
      .replace(/[^\d+]/g, "");

  return /^\+?\d{10,15}$/.test(
    limpio
  );
}

function convertirError(
  error
) {
  return {
    nombre:
      error?.name ||
      "Error",

    codigo:
      error?.code ||
      "COMMUNICATION_ERROR",

    mensaje:
      error?.message ||
      "Ocurrió un error al procesar la comunicación.",

    stack:
      process.env.NODE_ENV ===
      "development"
        ? error?.stack || ""
        : ""
  };
}

function construirError(
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
   VALIDACIÓN DEL DESTINATARIO
========================================================= */

function validarDestinatario({
  canal,
  destinatario = {}
} = {}) {
  const correo =
    limpiarTexto(
      destinatario.correo
    );

  const telefono =
    limpiarTexto(
      destinatario.telefono
    );

  if (
    canal ===
      COMMUNICATION_CHANNELS.EMAIL &&
    !validarCorreo(correo)
  ) {
    throw construirError(
      "El candidato no tiene un correo electrónico válido.",
      "DESTINATARIO_EMAIL_INVALIDO"
    );
  }

  if (
    canal ===
      COMMUNICATION_CHANNELS.WHATSAPP &&
    !validarTelefono(telefono)
  ) {
    throw construirError(
      "El candidato no tiene un teléfono válido para WhatsApp.",
      "DESTINATARIO_TELEFONO_INVALIDO"
    );
  }

  if (
    canal ===
    COMMUNICATION_CHANNELS.AMBOS
  ) {
    if (
      !validarCorreo(correo) &&
      !validarTelefono(telefono)
    ) {
      throw construirError(
        "El candidato no tiene correo ni teléfono válidos.",
        "DESTINATARIO_INVALIDO"
      );
    }
  }

  return {
    nombre:
      limpiarTexto(
        destinatario.nombre
      ),

    correo,

    telefono
  };
}

/* =========================================================
   REGISTRO ESTÁNDAR
========================================================= */

function crearRegistroComunicacion({
  id = "",
  candidatoId = "",
  postulacionId = "",
  entrevistaId = "",

  tipo = "",
  plantillaId = "",
  plantillaVersion = 1,

  canal = "email",
  idioma = "es",

  destinatario = {},

  asunto = "",
  contenidoTexto = "",
  contenidoHtml = "",

  variables = {},

  estado =
    COMMUNICATION_STATUS.CREADO,

  proveedor = "",
  proveedorMensajeId = "",

  fechaProgramada = "",
  creadoPor = "sistema",

  metadata = {}
} = {}) {
  const fechaActual =
    new Date().toISOString();

  return {
    id:
      limpiarTexto(id) ||
      generarIdComunicacion(),

    candidatoId:
      limpiarTexto(
        candidatoId
      ),

    postulacionId:
      limpiarTexto(
        postulacionId
      ),

    entrevistaId:
      limpiarTexto(
        entrevistaId
      ),

    tipo:
      limpiarTexto(tipo),

    plantillaId:
      limpiarTexto(
        plantillaId
      ),

    plantillaVersion:
      Number(
        plantillaVersion || 1
      ),

    canal:
      normalizarCanal(
        canal
      ),

    idioma:
      limpiarTexto(
        idioma
      ) || "es",

    destinatarioNombre:
      limpiarTexto(
        destinatario.nombre
      ),

    destinatarioCorreo:
      limpiarTexto(
        destinatario.correo
      ),

    destinatarioTelefono:
      limpiarTexto(
        destinatario.telefono
      ),

    asunto:
      String(
        asunto ?? ""
      ),

    contenidoTexto:
      String(
        contenidoTexto ?? ""
      ),

    contenidoHtml:
      String(
        contenidoHtml ?? ""
      ),

    variables:
      variables &&
      typeof variables ===
        "object"
        ? variables
        : {},

    estado,

    proveedor:
      limpiarTexto(
        proveedor
      ),

    proveedorMensajeId:
      limpiarTexto(
        proveedorMensajeId
      ),

    intentos:
      0,

    ultimoError:
      null,

    fechaProgramada:
      limpiarTexto(
        fechaProgramada
      ),

    fechaProcesamiento:
      "",

    fechaEnvio:
      "",

    fechaEntrega:
      "",

    fechaApertura:
      "",

    fechaCancelacion:
      "",

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
   FACTORÍA DEL MOTOR
========================================================= */

function crearCommunicationEngine({
  templatesService,
  communicationsRepository,
  emailProvider = null,
  whatsappProvider = null,

  modoSimulacion = false,
  logger = console
} = {}) {
  if (!templatesService) {
    throw new Error(
      "templatesService es obligatorio para crear CommunicationEngine."
    );
  }

  if (!communicationsRepository) {
    throw new Error(
      "communicationsRepository es obligatorio para crear CommunicationEngine."
    );
  }

  /* =======================================================
     HELPERS DEL REPOSITORIO
  ======================================================= */

  async function guardarRegistro(
    registro
  ) {
    if (
      typeof communicationsRepository
        .crear !== "function"
    ) {
      throw new Error(
        "El repositorio de comunicaciones no implementa crear()."
      );
    }

    return communicationsRepository
      .crear(registro);
  }

  async function actualizarRegistro(
    id,
    cambios
  ) {
    if (
      typeof communicationsRepository
        .actualizar !== "function"
    ) {
      throw new Error(
        "El repositorio de comunicaciones no implementa actualizar()."
      );
    }

    return communicationsRepository
      .actualizar(
        id,
        {
          ...cambios,

          fechaActualizacion:
            new Date()
              .toISOString()
        }
      );
  }

  /* =======================================================
     SELECCIÓN DEL PROVEEDOR
  ======================================================= */

  function obtenerProveedor(
    canal
  ) {
    if (
      canal ===
      COMMUNICATION_CHANNELS.EMAIL
    ) {
      return emailProvider;
    }

    if (
      canal ===
      COMMUNICATION_CHANNELS.WHATSAPP
    ) {
      return whatsappProvider;
    }

    return null;
  }

  /* =======================================================
     ENVÍO POR UN CANAL
  ======================================================= */

  async function enviarPorCanal({
    canal,
    registro
  }) {
    const proveedor =
      obtenerProveedor(canal);

    if (modoSimulacion) {
      logger.info?.(
        `[CommunicationEngine] Simulación ${canal}: ${registro.id}`
      );

      return {
        ok: true,

        simulado: true,

        proveedor:
          "simulacion",

        mensajeId:
          `sim-${registro.id}`
      };
    }

    if (!proveedor) {
      throw construirError(
        `No existe un proveedor configurado para el canal ${canal}.`,
        "PROVEEDOR_NO_CONFIGURADO"
      );
    }

    if (
      typeof proveedor.enviar !==
      "function"
    ) {
      throw construirError(
        `El proveedor de ${canal} no implementa enviar().`,
        "PROVEEDOR_INVALIDO"
      );
    }

    if (
      canal ===
      COMMUNICATION_CHANNELS.EMAIL
    ) {
      return proveedor.enviar({
        para:
          registro
            .destinatarioCorreo,

        nombre:
          registro
            .destinatarioNombre,

        asunto:
          registro.asunto,

        texto:
          registro
            .contenidoTexto,

        html:
          registro
            .contenidoHtml,

        metadata: {
          comunicacionId:
            registro.id,

          candidatoId:
            registro.candidatoId,

          postulacionId:
            registro.postulacionId,

          entrevistaId:
            registro.entrevistaId
        }
      });
    }

    if (
      canal ===
      COMMUNICATION_CHANNELS.WHATSAPP
    ) {
      return proveedor.enviar({
        para:
          registro
            .destinatarioTelefono,

        nombre:
          registro
            .destinatarioNombre,

        mensaje:
          registro
            .contenidoTexto,

        metadata: {
          comunicacionId:
            registro.id,

          candidatoId:
            registro.candidatoId,

          postulacionId:
            registro.postulacionId,

          entrevistaId:
            registro.entrevistaId
        }
      });
    }

    throw construirError(
      `Canal no soportado: ${canal}.`,
      "CANAL_NO_SOPORTADO"
    );
  }

  /* =======================================================
     PREPARAR COMUNICACIÓN
  ======================================================= */

  async function preparar({
    plantillaId = "",
    tipo = "",
    canal = "email",
    idioma = "es",

    destinatario = {},
    variables = {},

    candidatoId = "",
    postulacionId = "",
    entrevistaId = "",

    fechaProgramada = "",
    creadoPor = "sistema",

    metadata = {}
  } = {}) {
    const canalNormalizado =
      normalizarCanal(
        canal
      );

    const destinatarioValidado =
      validarDestinatario({
        canal:
          canalNormalizado,

        destinatario
      });

    const resultadoPlantilla =
      await templatesService
        .renderizarParaEnvio({
          plantillaId,
          tipo,

          idioma,
          canal:
            canalNormalizado,

          variables
        });

    const plantilla =
      resultadoPlantilla
        .plantilla;

    const renderizada =
      resultadoPlantilla
        .renderizada;

    const estadoInicial =
      fechaProgramada
        ? COMMUNICATION_STATUS.PENDIENTE
        : COMMUNICATION_STATUS.CREADO;

    const registro =
      crearRegistroComunicacion({
        candidatoId,
        postulacionId,
        entrevistaId,

        tipo:
          plantilla.tipo ||
          tipo,

        plantillaId:
          plantilla.id,

        plantillaVersion:
          plantilla.version ||
          1,

        canal:
          canalNormalizado,

        idioma:
          plantilla.idioma ||
          idioma,

        destinatario:
          destinatarioValidado,

        asunto:
          renderizada.asunto,

        contenidoTexto:
          renderizada
            .contenidoTexto,

        contenidoHtml:
          renderizada
            .contenidoHtml,

        variables,

        estado:
          estadoInicial,

        fechaProgramada,
        creadoPor,
        metadata
      });

    const guardada =
      await guardarRegistro(
        registro
      );

    return {
      registro:
        guardada,

      plantilla,

      validacion:
        resultadoPlantilla
          .validacion
    };
  }

  /* =======================================================
     PROCESAR COMUNICACIÓN
  ======================================================= */

  async function procesar(
    comunicacion
  ) {
    if (!comunicacion?.id) {
      throw construirError(
        "La comunicación no tiene identificador.",
        "COMUNICACION_INVALIDA"
      );
    }

    const fechaProcesamiento =
      new Date().toISOString();

    let registroActualizado =
      await actualizarRegistro(
        comunicacion.id,
        {
          estado:
            COMMUNICATION_STATUS
              .PROCESANDO,

          fechaProcesamiento,

          intentos:
            Number(
              comunicacion.intentos ||
              0
            ) + 1,

          ultimoError:
            null
        }
      );

    /*
     * El repositorio puede devolver
     * true o el objeto actualizado.
     */
    if (
      !registroActualizado ||
      registroActualizado === true
    ) {
      registroActualizado = {
        ...comunicacion,

        estado:
          COMMUNICATION_STATUS
            .PROCESANDO,

        fechaProcesamiento,

        intentos:
          Number(
            comunicacion.intentos ||
            0
          ) + 1
      };
    }

    try {
      /*
       * Canal "ambos":
       * enviamos correo y WhatsApp
       * como operaciones separadas.
       */
      if (
        comunicacion.canal ===
        COMMUNICATION_CHANNELS.AMBOS
      ) {
        const resultados = [];

        if (
          validarCorreo(
            comunicacion
              .destinatarioCorreo
          )
        ) {
          resultados.push(
            await enviarPorCanal({
              canal:
                COMMUNICATION_CHANNELS
                  .EMAIL,

              registro:
                comunicacion
            })
          );
        }

        if (
          validarTelefono(
            comunicacion
              .destinatarioTelefono
          )
        ) {
          resultados.push(
            await enviarPorCanal({
              canal:
                COMMUNICATION_CHANNELS
                  .WHATSAPP,

              registro:
                comunicacion
            })
          );
        }

        const fechaEnvio =
          new Date().toISOString();

        const final =
          await actualizarRegistro(
            comunicacion.id,
            {
              estado:
                COMMUNICATION_STATUS
                  .ENVIADO,

              fechaEnvio,

              proveedor:
                "multiples",

              proveedorMensajeId:
                resultados
                  .map(
                    (resultado) =>
                      resultado
                        ?.mensajeId ||
                      ""
                  )
                  .filter(Boolean)
                  .join(","),

              resultadosCanales:
                resultados
            }
          );

        return {
          ok: true,
          comunicacion:
            final,
          resultados
        };
      }

      const resultado =
        await enviarPorCanal({
          canal:
            comunicacion.canal,

          registro:
            comunicacion
        });

      const fechaEnvio =
        new Date().toISOString();

      const final =
        await actualizarRegistro(
          comunicacion.id,
          {
            estado:
              COMMUNICATION_STATUS
                .ENVIADO,

            fechaEnvio,

            proveedor:
              resultado
                ?.proveedor ||
              comunicacion
                .proveedor ||
              "",

            proveedorMensajeId:
              resultado
                ?.mensajeId ||
              resultado
                ?.id ||
              "",

            ultimoError:
              null
          }
        );

      return {
        ok: true,

        comunicacion:
          final,

        resultado
      };
    } catch (error) {
      const errorNormalizado =
        convertirError(error);

      await actualizarRegistro(
        comunicacion.id,
        {
          estado:
            COMMUNICATION_STATUS
              .ERROR,

          ultimoError:
            errorNormalizado
        }
      );

      logger.error?.(
        "[CommunicationEngine] Error enviando comunicación:",
        error
      );

      error.communicationId =
        comunicacion.id;

      throw error;
    }
  }

  /* =======================================================
     PREPARAR Y ENVIAR
  ======================================================= */

  async function enviar(
    opciones = {}
  ) {
    const preparado =
      await preparar(
        opciones
      );

    /*
     * Si tiene fecha futura, solo se
     * registra como pendiente.
     */
    if (
      preparado.registro
        .fechaProgramada
    ) {
      return {
        ok: true,

        programada:
          true,

        comunicacion:
          preparado.registro
      };
    }

    return procesar(
      preparado.registro
    );
  }

  /* =======================================================
     REINTENTAR
  ======================================================= */

  async function reintentar(
    comunicacion
  ) {
    if (!comunicacion?.id) {
      throw construirError(
        "No se recibió una comunicación válida para reintentar.",
        "COMUNICACION_INVALIDA"
      );
    }

    if (
      comunicacion.estado !==
      COMMUNICATION_STATUS.ERROR
    ) {
      throw construirError(
        "Solo se pueden reintentar comunicaciones con estado de error.",
        "COMUNICACION_NO_REINTENTABLE"
      );
    }

    return procesar(
      comunicacion
    );
  }

  /* =======================================================
     CANCELAR
  ======================================================= */

  async function cancelar(
    comunicacion,
    motivo = ""
  ) {
    if (!comunicacion?.id) {
      throw construirError(
        "No se recibió una comunicación válida para cancelar.",
        "COMUNICACION_INVALIDA"
      );
    }

    if (
      [
        COMMUNICATION_STATUS.ENVIADO,
        COMMUNICATION_STATUS.ENTREGADO,
        COMMUNICATION_STATUS.ABIERTO
      ].includes(
        comunicacion.estado
      )
    ) {
      throw construirError(
        "Una comunicación enviada o entregada ya no puede cancelarse.",
        "COMUNICACION_NO_CANCELABLE"
      );
    }

    const fechaCancelacion =
      new Date().toISOString();

    const actualizada =
      await actualizarRegistro(
        comunicacion.id,
        {
          estado:
            COMMUNICATION_STATUS
              .CANCELADO,

          fechaCancelacion,

          motivoCancelacion:
            limpiarTexto(
              motivo
            )
        }
      );

    return {
      ok: true,

      comunicacion:
        actualizada
    };
  }

  return {
    preparar,
    procesar,
    enviar,
    reintentar,
    cancelar,

    crearRegistroComunicacion,

    estados:
      COMMUNICATION_STATUS,

    canales:
      COMMUNICATION_CHANNELS
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  COMMUNICATION_STATUS,
  COMMUNICATION_CHANNELS,

  limpiarTexto,
  generarIdComunicacion,
  normalizarCanal,
  validarCorreo,
  validarTelefono,
  validarDestinatario,
  convertirError,
  crearRegistroComunicacion,
  crearCommunicationEngine
};