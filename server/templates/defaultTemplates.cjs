"use strict";

/* =========================================================
   PLANTILLAS INICIALES
   COMMUNICATION CENTER
========================================================= */

const DEFAULT_TEMPLATES = [
  {
    id:
      "postulacion_recibida",

    nombre:
      "Postulación recibida",

    tipo:
      "postulacion_recibida",

    canal:
      "email",

    idioma:
      "es",

    descripcion:
      "Confirmación inmediata después de que el candidato envía su postulación.",

    asunto:
      "Recibimos tu postulación | GA Hospitality",

    contenidoTexto:
`Hola {{nombre}},

Gracias por postularte para formar parte de {{empresa}}.

Hemos recibido correctamente tu solicitud.

Folio: {{folio}}
Vacante: {{vacante}}
Sucursal: {{sucursal}}
Fecha de registro: {{fecha}}

Nuestro equipo de reclutamiento revisará tu información.

Puedes consultar el avance de tu proceso en:
{{estatusUrl}}

Conserva tu folio para futuras consultas.

Atentamente,
Departamento de Reclutamiento
{{empresa}}`,

    contenidoHtml:
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Postulación recibida
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f2f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#25324a;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      background:#f2f5f9;
      padding:30px 12px;
    "
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="650"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:650px;
            background:#ffffff;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 14px 40px rgba(31,44,68,0.12);
          "
        >
          <tr>
            <td
              style="
                padding:30px;
                background:linear-gradient(
                  135deg,
                  #111b2e,
                  #244d88
                );
                text-align:center;
              "
            >
              <h1
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:25px;
                "
              >
                GA Hospitality
              </h1>

              <p
                style="
                  margin:8px 0 0;
                  color:#d9e4f4;
                  font-size:14px;
                "
              >
                Departamento de Reclutamiento
              </p>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:34px 34px 26px;
              "
            >
              <p
                style="
                  margin:0 0 8px;
                  color:#718096;
                  font-size:13px;
                  font-weight:bold;
                  text-transform:uppercase;
                  letter-spacing:0.06em;
                "
              >
                Solicitud recibida
              </p>

              <h2
                style="
                  margin:0 0 18px;
                  color:#162238;
                  font-size:26px;
                  line-height:1.25;
                "
              >
                ¡Gracias por postularte,
                {{nombre}}!
              </h2>

              <p
                style="
                  margin:0 0 20px;
                  color:#55637a;
                  font-size:15px;
                  line-height:1.75;
                "
              >
                Hemos recibido correctamente tu solicitud.
                Nuestro equipo comenzará a revisar tu
                información y experiencia.
              </p>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  margin:24px 0;
                  padding:22px;
                  background:#f6f8fc;
                  border:1px solid #e6ebf2;
                  border-radius:13px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:7px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Folio
                  </td>

                  <td
                    align="right"
                    style="
                      padding:7px 0;
                      color:#17243a;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    {{folio}}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:7px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Vacante
                  </td>

                  <td
                    align="right"
                    style="
                      padding:7px 0;
                      color:#17243a;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    {{vacante}}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:7px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Sucursal
                  </td>

                  <td
                    align="right"
                    style="
                      padding:7px 0;
                      color:#17243a;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    {{sucursal}}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:7px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Estado
                  </td>

                  <td
                    align="right"
                    style="
                      padding:7px 0;
                      color:#1b8b58;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    Solicitud recibida
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:0 0 24px;
                  color:#55637a;
                  font-size:14px;
                  line-height:1.7;
                "
              >
                Conserva tu folio. Lo necesitarás para
                consultar el avance de tu proceso.
              </p>

              <div
                style="
                  text-align:center;
                "
              >
                <a
                  href="{{estatusUrl}}"
                  style="
                    display:inline-block;
                    padding:14px 24px;
                    background:#286bd6;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:9px;
                    font-size:14px;
                    font-weight:bold;
                  "
                >
                  Consultar mi estatus
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:20px 30px;
                background:#edf1f6;
                color:#7b8799;
                text-align:center;
                font-size:12px;
                line-height:1.6;
              "
            >
              {{empresa}} · Departamento de Reclutamiento
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`,

    activo:
      true,

    version:
      1
  },

  {
    id:
      "entrevista_programada",

    nombre:
      "Entrevista programada",

    tipo:
      "entrevista_programada",

    canal:
      "email",

    idioma:
      "es",

    descripcion:
      "Correo con fecha, hora, ubicación, entrevistador e instrucciones de llegada.",

    asunto:
      "Tu entrevista ha sido programada | GA Hospitality",

    contenidoTexto:
`Hola {{nombre}},

Nos complace informarte que tu entrevista ha sido programada.

Vacante: {{vacante}}
Fecha: {{fecha}}
Hora: {{hora}}
Duración: {{duracion}}
Modalidad: {{modalidad}}

Sucursal: {{sucursal}}
Dirección: {{direccion}}
Lugar específico: {{lugarEntrevista}}

Entrevistador: {{reclutador}}
Cargo: {{reclutadorCargo}}
Correo: {{reclutadorCorreo}}
Teléfono: {{reclutadorTelefono}}

Ubicación:
{{googleMaps}}

Indicaciones:
{{indicaciones}}

Documentos requeridos:
{{documentosRequeridos}}

Confirma tu asistencia:
{{confirmarUrl}}

Solicita un cambio:
{{reagendarUrl}}

Te recomendamos llegar 15 minutos antes.

Atentamente,
Departamento de Reclutamiento
{{empresa}}`,

    contenidoHtml:
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Entrevista programada
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f2f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#25324a;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      background:#f2f5f9;
      padding:30px 12px;
    "
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="650"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:650px;
            background:#ffffff;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 14px 40px rgba(31,44,68,0.12);
          "
        >
          <tr>
            <td
              style="
                padding:32px;
                background:linear-gradient(
                  135deg,
                  #111b2e,
                  #235da8
                );
                text-align:center;
              "
            >
              <div
                style="
                  margin:0 auto 13px;
                  width:54px;
                  height:54px;
                  line-height:54px;
                  border-radius:50%;
                  background:rgba(255,255,255,0.14);
                  font-size:25px;
                "
              >
                📅
              </div>

              <h1
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:26px;
                "
              >
                Tu entrevista está lista
              </h1>

              <p
                style="
                  margin:9px 0 0;
                  color:#dbe8fa;
                  font-size:14px;
                "
              >
                GA Hospitality
              </p>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:34px;
              "
            >
              <h2
                style="
                  margin:0 0 17px;
                  color:#17243a;
                  font-size:24px;
                "
              >
                Hola {{nombre}}
              </h2>

              <p
                style="
                  margin:0 0 22px;
                  color:#55637a;
                  font-size:15px;
                  line-height:1.75;
                "
              >
                Nos complace informarte que tu entrevista
                para la vacante
                <strong>{{vacante}}</strong>
                ha sido programada.
              </p>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  margin:0 0 25px;
                  background:#f6f8fc;
                  border:1px solid #e5eaf1;
                  border-radius:13px;
                  padding:20px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Fecha
                  </td>

                  <td
                    align="right"
                    style="
                      padding:8px 0;
                      color:#17243a;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    {{fecha}}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Hora
                  </td>

                  <td
                    align="right"
                    style="
                      padding:8px 0;
                      color:#17243a;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    {{hora}}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Duración
                  </td>

                  <td
                    align="right"
                    style="
                      padding:8px 0;
                      color:#17243a;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    {{duracion}}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:8px 0;
                      color:#6a768b;
                      font-size:13px;
                    "
                  >
                    Modalidad
                  </td>

                  <td
                    align="right"
                    style="
                      padding:8px 0;
                      color:#17243a;
                      font-size:13px;
                      font-weight:bold;
                    "
                  >
                    {{modalidad}}
                  </td>
                </tr>
              </table>

              <h3
                style="
                  margin:0 0 12px;
                  color:#17243a;
                  font-size:17px;
                "
              >
                📍 Lugar de la entrevista
              </h3>

              <div
                style="
                  margin-bottom:25px;
                  padding:19px;
                  border-left:4px solid #286bd6;
                  background:#f8fafe;
                  border-radius:8px;
                  color:#55637a;
                  font-size:14px;
                  line-height:1.7;
                "
              >
                <strong>
                  {{sucursal}}
                </strong>
                <br>

                {{direccion}}
                <br>

                {{lugarEntrevista}}
              </div>

              <div
                style="
                  margin-bottom:25px;
                  text-align:center;
                "
              >
                <a
                  href="{{googleMaps}}"
                  style="
                    display:inline-block;
                    padding:13px 22px;
                    background:#286bd6;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:9px;
                    font-size:14px;
                    font-weight:bold;
                  "
                >
                  Abrir ubicación
                </a>
              </div>

              <h3
                style="
                  margin:0 0 12px;
                  color:#17243a;
                  font-size:17px;
                "
              >
                👤 Entrevistador
              </h3>

              <div
                style="
                  margin-bottom:25px;
                  padding:19px;
                  background:#f6f8fc;
                  border-radius:11px;
                  color:#55637a;
                  font-size:14px;
                  line-height:1.7;
                "
              >
                <strong>
                  {{reclutador}}
                </strong>
                <br>

                {{reclutadorCargo}}
                <br>

                {{reclutadorCorreo}}
                <br>

                {{reclutadorTelefono}}
              </div>

              <h3
                style="
                  margin:0 0 12px;
                  color:#17243a;
                  font-size:17px;
                "
              >
                Indicaciones
              </h3>

              <p
                style="
                  margin:0 0 19px;
                  color:#55637a;
                  font-size:14px;
                  line-height:1.7;
                  white-space:pre-line;
                "
              >
                {{indicaciones}}
              </p>

              <h3
                style="
                  margin:0 0 12px;
                  color:#17243a;
                  font-size:17px;
                "
              >
                Documentos requeridos
              </h3>

              <p
                style="
                  margin:0 0 28px;
                  color:#55637a;
                  font-size:14px;
                  line-height:1.7;
                  white-space:pre-line;
                "
              >
                {{documentosRequeridos}}
              </p>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding:4px;
                    "
                  >
                    <a
                      href="{{confirmarUrl}}"
                      style="
                        display:inline-block;
                        padding:14px 20px;
                        background:#1f9a62;
                        color:#ffffff;
                        text-decoration:none;
                        border-radius:9px;
                        font-size:14px;
                        font-weight:bold;
                      "
                    >
                      Confirmar asistencia
                    </a>
                  </td>

                  <td
                    align="center"
                    style="
                      padding:4px;
                    "
                  >
                    <a
                      href="{{reagendarUrl}}"
                      style="
                        display:inline-block;
                        padding:14px 20px;
                        background:#eef2f7;
                        color:#34425a;
                        text-decoration:none;
                        border-radius:9px;
                        font-size:14px;
                        font-weight:bold;
                      "
                    >
                      Solicitar cambio
                    </a>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin:27px 0 0;
                  color:#7c8798;
                  font-size:12px;
                  line-height:1.7;
                  text-align:center;
                "
              >
                Te recomendamos llegar 15 minutos antes
                y presentarte en recepción.
              </p>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:20px 30px;
                background:#edf1f6;
                color:#7b8799;
                text-align:center;
                font-size:12px;
                line-height:1.6;
              "
            >
              {{empresa}} · Departamento de Reclutamiento
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`,

    activo:
      true,

    version:
      1
  },

  {
    id:
      "entrevista_reagendada",

    nombre:
      "Entrevista reagendada",

    tipo:
      "entrevista_reagendada",

    canal:
      "email",

    idioma:
      "es",

    descripcion:
      "Notificación con la nueva fecha, hora y detalles de una entrevista reprogramada.",

    asunto:
      "Tu entrevista fue reprogramada | GA Hospitality",

    contenidoTexto:
`Hola {{nombre}},

Tu entrevista ha sido reprogramada.

Vacante: {{vacante}}
Nueva fecha: {{fecha}}
Nueva hora: {{hora}}
Duración: {{duracion}}
Modalidad: {{modalidad}}

Sucursal: {{sucursal}}
Dirección: {{direccion}}
Lugar específico: {{lugarEntrevista}}

Entrevistador: {{reclutador}}

Ubicación:
{{googleMaps}}

Confirma nuevamente tu asistencia:
{{confirmarUrl}}

Atentamente,
Departamento de Reclutamiento
{{empresa}}`,

    contenidoHtml:
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Entrevista reprogramada
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f2f5f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#25324a;
  "
>
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      background:#f2f5f9;
      padding:30px 12px;
    "
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="650"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:650px;
            background:#ffffff;
            border-radius:18px;
            overflow:hidden;
            box-shadow:0 14px 40px rgba(31,44,68,0.12);
          "
        >
          <tr>
            <td
              style="
                padding:31px;
                background:linear-gradient(
                  135deg,
                  #171c2c,
                  #7254b7
                );
                text-align:center;
              "
            >
              <div
                style="
                  margin:0 auto 13px;
                  width:54px;
                  height:54px;
                  line-height:54px;
                  border-radius:50%;
                  background:rgba(255,255,255,0.14);
                  font-size:25px;
                "
              >
                🔄
              </div>

              <h1
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:25px;
                "
              >
                Entrevista reprogramada
              </h1>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:34px;
              "
            >
              <h2
                style="
                  margin:0 0 17px;
                  color:#17243a;
                  font-size:24px;
                "
              >
                Hola {{nombre}}
              </h2>

              <p
                style="
                  margin:0 0 22px;
                  color:#55637a;
                  font-size:15px;
                  line-height:1.75;
                "
              >
                Tu entrevista para la vacante
                <strong>{{vacante}}</strong>
                ha sido reprogramada.
              </p>

              <div
                style="
                  margin:24px 0;
                  padding:22px;
                  background:#f6f3fc;
                  border:1px solid #e8e0f6;
                  border-radius:13px;
                "
              >
                <p
                  style="
                    margin:0 0 12px;
                    color:#6e5c91;
                    font-size:12px;
                    font-weight:bold;
                    text-transform:uppercase;
                  "
                >
                  Nueva información
                </p>

                <p
                  style="
                    margin:7px 0;
                    color:#29354a;
                    font-size:14px;
                  "
                >
                  <strong>
                    Fecha:
                  </strong>

                  {{fecha}}
                </p>

                <p
                  style="
                    margin:7px 0;
                    color:#29354a;
                    font-size:14px;
                  "
                >
                  <strong>
                    Hora:
                  </strong>

                  {{hora}}
                </p>

                <p
                  style="
                    margin:7px 0;
                    color:#29354a;
                    font-size:14px;
                  "
                >
                  <strong>
                    Duración:
                  </strong>

                  {{duracion}}
                </p>

                <p
                  style="
                    margin:7px 0;
                    color:#29354a;
                    font-size:14px;
                  "
                >
                  <strong>
                    Modalidad:
                  </strong>

                  {{modalidad}}
                </p>
              </div>

              <h3
                style="
                  margin:0 0 10px;
                  color:#17243a;
                  font-size:17px;
                "
              >
                Lugar
              </h3>

              <p
                style="
                  margin:0 0 23px;
                  color:#55637a;
                  font-size:14px;
                  line-height:1.7;
                "
              >
                <strong>
                  {{sucursal}}
                </strong>
                <br>

                {{direccion}}
                <br>

                {{lugarEntrevista}}
              </p>

              <div
                style="
                  margin:0 0 25px;
                  text-align:center;
                "
              >
                <a
                  href="{{googleMaps}}"
                  style="
                    display:inline-block;
                    padding:13px 21px;
                    background:#7254b7;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:9px;
                    font-size:14px;
                    font-weight:bold;
                  "
                >
                  Consultar ubicación
                </a>
              </div>

              <div
                style="
                  margin-top:25px;
                  text-align:center;
                "
              >
                <a
                  href="{{confirmarUrl}}"
                  style="
                    display:inline-block;
                    padding:14px 23px;
                    background:#1f9a62;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:9px;
                    font-size:14px;
                    font-weight:bold;
                  "
                >
                  Confirmar nueva fecha
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding:20px 30px;
                background:#edf1f6;
                color:#7b8799;
                text-align:center;
                font-size:12px;
              "
            >
              {{empresa}} · Departamento de Reclutamiento
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`,

    activo:
      true,

    version:
      1
  }
];

/* =========================================================
   OBTENER COPIA SEGURA
========================================================= */

function obtenerPlantillasIniciales() {
  return DEFAULT_TEMPLATES.map(
    (plantilla) => ({
      ...plantilla
    })
  );
}

/* =========================================================
   EXPORTACIONES
========================================================= */

module.exports = {
  DEFAULT_TEMPLATES,
  obtenerPlantillasIniciales
};