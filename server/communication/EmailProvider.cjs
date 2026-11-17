"use strict";

const nodemailer =
  require("nodemailer");

/* =========================================================
   EMAIL PROVIDER

   Modos disponibles:
   - simulacion
   - smtp
========================================================= */

function limpiarTexto(
  valor = ""
) {
  return String(
    valor ?? ""
  ).trim();
}

function validarCorreo(
  correo = ""
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      limpiarTexto(correo)
    );
}

function generarMensajeId() {
  return (
    `email-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 9)
  );
}

function crearErrorProveedor(
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
   NORMALIZAR MENSAJE
========================================================= */

function normalizarMensajeEmail({
  para = "",
  nombre = "",
  asunto = "",
  texto = "",
  html = "",
  replyTo = "",
  metadata = {}
} = {}) {
  const correoDestino =
    limpiarTexto(para);

  if (
    !validarCorreo(
      correoDestino
    )
  ) {
    throw crearErrorProveedor(
      "El correo electrónico del destinatario no es válido.",
      "EMAIL_DESTINATARIO_INVALIDO"
    );
  }

  const asuntoLimpio =
    limpiarTexto(asunto);

  if (!asuntoLimpio) {
    throw crearErrorProveedor(
      "El asunto del correo es obligatorio.",
      "EMAIL_ASUNTO_REQUERIDO"
    );
  }

  const contenidoTexto =
    String(
      texto ?? ""
    );

  const contenidoHtml =
    String(
      html ?? ""
    );

  if (
    !contenidoTexto.trim() &&
    !contenidoHtml.trim()
  ) {
    throw crearErrorProveedor(
      "El correo debe tener contenido de texto o contenido HTML.",
      "EMAIL_CONTENIDO_REQUERIDO"
    );
  }

  return {
    para:
      correoDestino,

    nombre:
      limpiarTexto(nombre),

    asunto:
      asuntoLimpio,

    texto:
      contenidoTexto,

    html:
      contenidoHtml,

    replyTo:
      limpiarTexto(replyTo),

    metadata:
      metadata &&
      typeof metadata ===
        "object"
        ? metadata
        : {}
  };
}

/* =========================================================
   UTILIDADES SMTP
========================================================= */

function normalizarBooleano(
  valor,
  predeterminado = false
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return predeterminado;
  }

  if (
    typeof valor ===
    "boolean"
  ) {
    return valor;
  }

  return [
    "true",
    "1",
    "si",
    "sí",
    "yes"
  ].includes(
    limpiarTexto(valor)
      .toLowerCase()
  );
}

function normalizarPuerto(
  valor,
  predeterminado = 587
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return predeterminado;
  }

  return numero;
}

/* =========================================================
   FACTORÍA DEL PROVEEDOR
========================================================= */

function crearEmailProvider({
  modo = "simulacion",

  remitenteNombre =
    "GA Hospitality Reclutamiento",

  remitenteCorreo =
    "reclutamiento@gahospitality.com",

  replyTo = "",

  smtpHost = "",
  smtpPort = 587,
  smtpSecure = false,
  smtpUser = "",
  smtpPass = "",

  logger = console,

  guardarContenidoEnLog = false
} = {}) {
  const modoNormalizado =
    limpiarTexto(modo)
      .toLowerCase() ||
    "simulacion";

  const configuracion = {
    modo:
      modoNormalizado,

    remitenteNombre:
      limpiarTexto(
        remitenteNombre
      ),

    remitenteCorreo:
      limpiarTexto(
        remitenteCorreo
      ),

    replyTo:
      limpiarTexto(
        replyTo
      ),

    smtp: {
      host:
        limpiarTexto(
          smtpHost
        ),

      port:
        normalizarPuerto(
          smtpPort,
          587
        ),

      secure:
        normalizarBooleano(
          smtpSecure,
          false
        ),

      user:
        limpiarTexto(
          smtpUser
        ),

      pass:
        limpiarTexto(
          smtpPass
        )
    }
  };

  let transporter =
    null;

  /* =======================================================
     VALIDAR CONFIGURACIÓN
  ======================================================= */

  function validarConfiguracion() {
    if (
      modoNormalizado ===
      "simulacion"
    ) {
      return {
        valido: true,
        modo:
          modoNormalizado
      };
    }

    if (
      modoNormalizado !==
      "smtp"
    ) {
      return {
        valido: false,

        modo:
          modoNormalizado,

        error:
          `Modo de correo no soportado: ${modoNormalizado}`
      };
    }

    if (
      !validarCorreo(
        configuracion
          .remitenteCorreo
      )
    ) {
      return {
        valido: false,

        modo:
          modoNormalizado,

        error:
          "El correo del remitente no es válido."
      };
    }

    if (
      !configuracion
        .smtp.host
    ) {
      return {
        valido: false,

        modo:
          modoNormalizado,

        error:
          "SMTP_HOST es obligatorio."
      };
    }

    if (
      !configuracion
        .smtp.user
    ) {
      return {
        valido: false,

        modo:
          modoNormalizado,

        error:
          "SMTP_USER es obligatorio."
      };
    }

    if (
      !configuracion
        .smtp.pass
    ) {
      return {
        valido: false,

        modo:
          modoNormalizado,

        error:
          "SMTP_PASS es obligatorio."
      };
    }

    return {
      valido: true,
      modo:
        modoNormalizado
    };
  }

  /* =======================================================
     OBTENER TRANSPORTER SMTP
  ======================================================= */

  function obtenerTransporter() {
    if (transporter) {
      return transporter;
    }

    const validacion =
      validarConfiguracion();

    if (!validacion.valido) {
      throw crearErrorProveedor(
        validacion.error ||
          "La configuración SMTP no es válida.",
        "EMAIL_SMTP_CONFIG_INVALIDA"
      );
    }

    transporter =
      nodemailer
        .createTransport({
          host:
            configuracion
              .smtp.host,

          port:
            configuracion
              .smtp.port,

          secure:
            configuracion
              .smtp.secure,

          auth: {
            user:
              configuracion
                .smtp.user,

            pass:
              configuracion
                .smtp.pass
          }
        });

    return transporter;
  }

  /* =======================================================
     VERIFICAR CONEXIÓN SMTP
  ======================================================= */

  async function verificarConexion() {
    if (
      modoNormalizado ===
      "simulacion"
    ) {
      return {
        ok: true,
        simulado: true,
        modo:
          "simulacion"
      };
    }

    try {
      const smtp =
        obtenerTransporter();

      await smtp.verify();

      return {
        ok: true,
        simulado: false,
        modo:
          "smtp",
        host:
          configuracion
            .smtp.host,
        port:
          configuracion
            .smtp.port
      };
    } catch (error) {
      throw crearErrorProveedor(
        "No fue posible verificar la conexión SMTP.",
        "EMAIL_SMTP_VERIFICACION_ERROR",
        {
          mensaje:
            error?.message ||
            String(error),

          codigo:
            error?.code ||
            ""
        }
      );
    }
  }

  /* =======================================================
     ENVÍO SIMULADO
  ======================================================= */

  async function enviarSimulado(
    mensaje
  ) {
    const mensajeId =
      generarMensajeId();

    const fechaEnvio =
      new Date().toISOString();

    logger.info?.(
      "=========================================="
    );

    logger.info?.(
      "[EmailProvider] CORREO SIMULADO"
    );

    logger.info?.(
      `ID: ${mensajeId}`
    );

    logger.info?.(
      `Para: ${
        mensaje.nombre
          ? `${mensaje.nombre} <${mensaje.para}>`
          : mensaje.para
      }`
    );

    logger.info?.(
      `Asunto: ${mensaje.asunto}`
    );

    logger.info?.(
      `Fecha: ${fechaEnvio}`
    );

    if (
      mensaje.metadata
        ?.comunicacionId
    ) {
      logger.info?.(
        `Comunicación: ${mensaje.metadata.comunicacionId}`
      );
    }

    if (
      guardarContenidoEnLog
    ) {
      logger.info?.(
        "Texto:"
      );

      logger.info?.(
        mensaje.texto
      );

      logger.info?.(
        "HTML:"
      );

      logger.info?.(
        mensaje.html
      );
    }

    logger.info?.(
      "=========================================="
    );

    return {
      ok: true,

      simulado: true,

      proveedor:
        "email_simulacion",

      mensajeId,

      estado:
        "enviado",

      para:
        mensaje.para,

      asunto:
        mensaje.asunto,

      fechaEnvio,

      metadata:
        mensaje.metadata
    };
  }

  /* =======================================================
     ENVÍO SMTP REAL
  ======================================================= */

  async function enviarSmtp(
    mensaje
  ) {
    try {
      const smtp =
        obtenerTransporter();

      const from =
        configuracion
          .remitenteNombre
          ? `"${configuracion.remitenteNombre}" <${configuracion.remitenteCorreo}>`
          : configuracion
              .remitenteCorreo;

      const mailOptions = {
        from,

        to:
          mensaje.nombre
            ? `"${mensaje.nombre}" <${mensaje.para}>`
            : mensaje.para,

        subject:
          mensaje.asunto,

        text:
          mensaje.texto ||
          undefined,

        html:
          mensaje.html ||
          undefined
      };

      const replyToFinal =
        mensaje.replyTo ||
        configuracion.replyTo;

      if (
        replyToFinal &&
        validarCorreo(
          replyToFinal
        )
      ) {
        mailOptions.replyTo =
          replyToFinal;
      }

      const resultado =
        await smtp.sendMail(
          mailOptions
        );

      const fechaEnvio =
        new Date()
          .toISOString();

      logger.info?.(
        `[EmailProvider] Correo SMTP enviado a ${mensaje.para}`
      );

      logger.info?.(
        `[EmailProvider] Message-ID: ${resultado.messageId || "N/D"}`
      );

      return {
        ok: true,

        simulado: false,

        proveedor:
          "smtp",

        mensajeId:
          resultado.messageId ||
          generarMensajeId(),

        estado:
          "enviado",

        para:
          mensaje.para,

        asunto:
          mensaje.asunto,

        fechaEnvio,

        accepted:
          Array.isArray(
            resultado.accepted
          )
            ? resultado.accepted
            : [],

        rejected:
          Array.isArray(
            resultado.rejected
          )
            ? resultado.rejected
            : [],

        response:
          resultado.response ||
          "",

        metadata:
          mensaje.metadata
      };
    } catch (error) {
      logger.error?.(
        "[EmailProvider] Error SMTP:",
        error
      );

      throw crearErrorProveedor(
        "No fue posible enviar el correo mediante SMTP.",
        "EMAIL_SMTP_ENVIO_ERROR",
        {
          mensaje:
            error?.message ||
            String(error),

          codigo:
            error?.code ||
            "",

          command:
            error?.command ||
            "",

          response:
            error?.response ||
            ""
        }
      );
    }
  }

  /* =======================================================
     MÉTODO PÚBLICO
  ======================================================= */

  async function enviar(
    datos = {}
  ) {
    const mensaje =
      normalizarMensajeEmail({
        ...datos,

        replyTo:
          datos.replyTo ||
          configuracion.replyTo
      });

    if (
      modoNormalizado ===
      "simulacion"
    ) {
      return enviarSimulado(
        mensaje
      );
    }

    if (
      modoNormalizado ===
      "smtp"
    ) {
      return enviarSmtp(
        mensaje
      );
    }

    throw crearErrorProveedor(
      `El modo de correo "${modoNormalizado}" no está soportado.`,
      "EMAIL_MODO_NO_IMPLEMENTADO"
    );
  }

  return {
    enviar,
    verificarConexion,
    validarConfiguracion,

    obtenerConfiguracion() {
      return {
        modo:
          configuracion.modo,

        remitenteNombre:
          configuracion
            .remitenteNombre,

        remitenteCorreo:
          configuracion
            .remitenteCorreo,

        replyTo:
          configuracion
            .replyTo,

        smtp: {
          host:
            configuracion
              .smtp.host,

          port:
            configuracion
              .smtp.port,

          secure:
            configuracion
              .smtp.secure,

          user:
            configuracion
              .smtp.user,

          /*
           * Nunca devolvemos SMTP_PASS.
           */
          passwordConfigurado:
            Boolean(
              configuracion
                .smtp.pass
            )
        }
      };
    },

    modo:
      modoNormalizado,

    nombre:
      "EmailProvider"
  };
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  limpiarTexto,
  validarCorreo,
  generarMensajeId,
  crearErrorProveedor,
  normalizarMensajeEmail,
  normalizarBooleano,
  normalizarPuerto,
  crearEmailProvider
};