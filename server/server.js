import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import fs from "fs";
import multer from "multer";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import { createRequire } from "module";

dotenv.config({
  path: new URL(
    "../.env",
    import.meta.url
  )
});

const require =
  createRequire(import.meta.url);

const {
  crearCommunicationQueueRepository
} = require(
  "./repositories/communicationQueueRepository.cjs"
);

const {
  crearCommunicationQueue
} = require(
  "./communication/CommunicationQueue.cjs"
);

const {
  crearCommunicationWorker
} = require(
  "./communication/CommunicationWorker.cjs"
);

const {
  crearCommunicationQueueService
} = require(
  "./services/communicationQueue.cjs"
);

const {
  crearCommunicationQueueController
} = require(
  "./controllers/communicationQueueController.cjs"
);


const {
  crearCommunicationsRepository
} = require(
  "./repositories/communicationsRepository.cjs"
);

const {
  crearEmailProvider
} = require(
  "./communication/EmailProvider.cjs"
);

const {
  crearCommunicationEngine
} = require(
  "./communication/CommunicationEngine.cjs"
);

const {
  crearCommunicationsService
} = require(
  "./services/communications.cjs"
);

const {
  crearCommunicationsController
} = require(
  "./controllers/communicationsController.cjs"
);
const pdfParse =
  require("pdf-parse");

const app =
  express();

const PORT =
  process.env.PORT || 3000;

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);
  
const projectRoot =
  path.resolve(
    __dirname,
    ".."
  );

const uploadsDir =
  path.join(
    __dirname,
    "uploads"
  );

const dataDir =
  path.join(
    __dirname,
    "data"
  );

const plantillasComunicacionFile =
  path.join(
    dataDir,
    "plantillas-comunicacion.json"
  );

const comunicacionesFile =
  path.join(
    dataDir,
    "comunicaciones.json"
  );

const communicationQueueFile =
  path.join(
    dataDir,
    "communication-queue.json"
  );



/* =========================
   OPENAI
========================= */

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY
});

/* =========================
   FIREBASE ADMIN
========================= */

if (!admin.apps.length) {
  try {
    const serviceAccount =
      JSON.parse(
        process.env
          .FIREBASE_SERVICE_ACCOUNT_JSON
      );

    admin.initializeApp({
      credential:
        admin.credential.cert(
          serviceAccount
        ),

      projectId:
        serviceAccount.project_id
    });

    console.log(
      "Firebase Admin inicializado correctamente."
    );
  } catch (error) {
    console.error(
      "Firebase Admin no inicializado:",
      error.message
    );
  }
}

const db =
  admin.apps.length
    ? admin.firestore()
    : null;

if (db) {
  db.settings({
    ignoreUndefinedProperties:
      true
  });
}

const VACANTES_COLLECTION = "vacantes";
const POSTULACIONES_COLLECTION = "postulaciones";
const ENTREVISTAS_COLLECTION = "entrevistas";

const DISPONIBILIDADES_ENTREVISTA_COLLECTION =
  "disponibilidades_entrevista";

const BLOQUEOS_ENTREVISTA_COLLECTION =
  "bloqueos_entrevista";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function verifyAdmin(req, res, next) {
  try {
    if (!admin.apps.length) {
      return res.status(500).json({ error: "Firebase Admin no esta inicializado." });
    }

    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no enviado." });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(token);
    const email = decoded.email?.toLowerCase();

    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: "No tienes permisos administrativos." });
    }

    req.adminUser = decoded;
    next();
  } catch (error) {
    console.error("Error verificando admin:", error);
    return res.status(401).json({ error: "Sesion invalida o expirada." });
  }
}



if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const postulacionesFile =
  path.join(dataDir, "postulaciones.json");

const vacantesFile =
  path.join(dataDir, "vacantes.json");

const sucursalesFile =
  path.join(dataDir, "sucursales.json");

const entrevistasFile =
  path.join(dataDir, "entrevistas.json");

const disponibilidadesEntrevistaFile =
  path.join(
    dataDir,
    "disponibilidades-entrevista.json"
  );

const COMUNICACIONES_COLLECTION =
  "comunicaciones";

const PLANTILLAS_COMUNICACION_COLLECTION =
  "plantillas_comunicacion";
const COMMUNICATION_QUEUE_COLLECTION =
  "communication_queue";

const RECORDATORIOS_COLLECTION =
  "recordatorios_comunicacion";



  if (
  !fs.existsSync(
    comunicacionesFile
  )
) {
  fs.writeFileSync(
    comunicacionesFile,
    "[]",
    "utf8"
  );
}


const recordatoriosComunicacionFile =
  path.join(
    dataDir,
    "recordatorios-comunicacion.json"
  );

const sucursalesIniciales = [
  {
    id: "wendys-las-misiones-ciudad-juarez",
    nombre: "Wendy's Las Misiones",
    marca: "Wendy's",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Ciudad Juarez",
    sucursal: "Las Misiones",
    direccion: "Av. Paseo de la Victoria, Ciudad Juarez, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Wendy's%20Las%20Misiones%20Ciudad%20Juarez",
    appleMapsUrl: "https://maps.apple.com/?q=Wendy's%20Las%20Misiones%20Ciudad%20Juarez",
    lat: null,
    lng: null
  },
  {
    id: "wendys-ejercito-nacional-ciudad-juarez",
    nombre: "Wendy's Ejercito Nacional",
    marca: "Wendy's",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Ciudad Juarez",
    sucursal: "Ejercito Nacional",
    direccion: "Av. Ejercito Nacional, Ciudad Juarez, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Wendy's%20Ejercito%20Nacional%20Ciudad%20Juarez",
    appleMapsUrl: "https://maps.apple.com/?q=Wendy's%20Ejercito%20Nacional%20Ciudad%20Juarez",
    lat: null,
    lng: null
  },
  {
    id: "applebees-tecnologico-ciudad-juarez",
    nombre: "Applebee's Tecnologico",
    marca: "Applebee's",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Ciudad Juarez",
    sucursal: "Tecnologico",
    direccion: "Av. Tecnologico, Ciudad Juarez, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Applebee's%20Tecnologico%20Ciudad%20Juarez",
    appleMapsUrl: "https://maps.apple.com/?q=Applebee's%20Tecnologico%20Ciudad%20Juarez",
    lat: null,
    lng: null
  },
  {
    id: "little-caesars-chihuahua",
    nombre: "Little Caesars Chihuahua",
    marca: "Little Caesars",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    direccion: "Chihuahua, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Little%20Caesars%20Chihuahua",
    appleMapsUrl: "https://maps.apple.com/?q=Little%20Caesars%20Chihuahua",
    lat: null,
    lng: null
  },
  {
    id: "corporativo-chihuahua",
    nombre: "Corporativo Chihuahua",
    marca: "GA Hospitality",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Corporativo",
    direccion: "Chihuahua, Chihuahua",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=GA%20Hospitality%20Chihuahua",
    appleMapsUrl: "https://maps.apple.com/?q=GA%20Hospitality%20Chihuahua",
    lat: null,
    lng: null
  },
  {
    id: "little-caesars-guadalajara",
    nombre: "Little Caesars Guadalajara",
    marca: "Little Caesars",
    pais: "Mexico",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Sucursal Guadalajara",
    direccion: "Guadalajara, Jalisco",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Little%20Caesars%20Guadalajara",
    appleMapsUrl: "https://maps.apple.com/?q=Little%20Caesars%20Guadalajara",
    lat: null,
    lng: null
  }
];

const vacantesIniciales = [
  {
    id: "vac-001",
    sucursalId: "wendys-las-misiones-ciudad-juarez",
    branchId: "wendys-las-misiones-ciudad-juarez",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Cajero",
    area: "Operaciones",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Ciudad Juarez",
    sucursal: "Las Misiones",
    requisitos: ["Atencion al cliente", "Manejo basico de caja", "Disponibilidad de horario"]
  },
  {
    id: "vac-002",
    sucursalId: "wendys-ejercito-nacional-ciudad-juarez",
    branchId: "wendys-ejercito-nacional-ciudad-juarez",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Despachador",
    area: "Servicio",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Ciudad Juarez",
    sucursal: "Ejercito Nacional",
    requisitos: ["Rapidez", "Orden", "Trabajo en equipo"]
  },
  {
    id: "vac-003",
    sucursalId: "applebees-tecnologico-ciudad-juarez",
    branchId: "applebees-tecnologico-ciudad-juarez",
    tipoVacante: "operativa",
    grupo: "Applebee's",
    titulo: "Hostess",
    area: "Recepcion",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Ciudad Juarez",
    sucursal: "Tecnologico",
    requisitos: ["Excelente trato al cliente", "Presentacion", "Comunicacion"]
  },
  {
    id: "vac-008",
    sucursalId: "little-caesars-chihuahua",
    branchId: "little-caesars-chihuahua",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Auxiliar de Cocina",
    area: "Cocina",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    requisitos: ["Preparacion de alimentos", "Limpieza", "Trabajo bajo presion"]
  },
  {
    id: "vac-101",
    sucursalId: "corporativo-chihuahua",
    branchId: "corporativo-chihuahua",
    tipoVacante: "administrativa",
    grupo: "RH",
    titulo: "Auxiliar de Reclutamiento",
    area: "RH",
    pais: "Mexico",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Corporativo",
    requisitos: ["Entrevistas", "Seguimiento", "Organizacion"]
  },
  {
    id: "vac-010",
    sucursalId: "little-caesars-guadalajara",
    branchId: "little-caesars-guadalajara",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Cajero",
    area: "Mostrador",
    pais: "Mexico",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Sucursal Guadalajara",
    requisitos: ["Atencion al cliente", "Caja", "Disponibilidad"]
  }
];

const {
  crearTemplatesRepository
} = require(
  "./repositories/templatesRepository.cjs"
);

const {
  crearTemplatesService
} = require(
  "./services/templates.cjs"
);

const {
  crearTemplatesController
} = require(
  "./controllers/templatesController.cjs"
);

const {
  crearComunicacionesRouter
} = require(
  "./routes/comunicaciones.cjs"
);
const {
  instalarPlantillasIniciales
} = require(
  "./services/defaultTemplatesInstaller.cjs"
);

dotenv.config();


if (!fs.existsSync(postulacionesFile)) {
  fs.writeFileSync(postulacionesFile, "[]", "utf-8");
}

if (!fs.existsSync(sucursalesFile)) {
  fs.writeFileSync(sucursalesFile, JSON.stringify(sucursalesIniciales, null, 2), "utf-8");
}

if (!fs.existsSync(vacantesFile)) {
  fs.writeFileSync(vacantesFile, JSON.stringify(vacantesIniciales, null, 2), "utf-8");
}

if (!fs.existsSync(entrevistasFile)) {
  fs.writeFileSync(entrevistasFile, "[]", "utf-8");
}
if (
  !fs.existsSync(
    disponibilidadesEntrevistaFile
  )
) {
  fs.writeFileSync(
    disponibilidadesEntrevistaFile,
    "[]",
    "utf-8"
  );
}
if (
  !fs.existsSync(
    comunicacionesFile
  )
) {
  fs.writeFileSync(
    comunicacionesFile,
    "[]",
    "utf-8"
  );
}

if (
  !fs.existsSync(
    plantillasComunicacionFile
  )
) {
  fs.writeFileSync(
    plantillasComunicacionFile,
    "[]",
    "utf-8"
  );
}

if (
  !fs.existsSync(
    recordatoriosComunicacionFile
  )
) {
  fs.writeFileSync(
    recordatoriosComunicacionFile,
    "[]",
    "utf-8"
  );
}




async function guardarComunicacion(
  comunicacion
) {
  if (!db) {
    const comunicaciones =
      leerJson(
        comunicacionesFile,
        []
      );

    comunicaciones.push(
      comunicacion
    );

    guardarJson(
      comunicacionesFile,
      comunicaciones
    );

    return comunicacion;
  }

  await db
    .collection(
      COMUNICACIONES_COLLECTION
    )
    .doc(comunicacion.id)
    .set(comunicacion);

  return comunicacion;
}

async function leerComunicaciones(
  limit = 200
) {
  if (!db) {
    return leerJson(
      comunicacionesFile,
      []
    )
      .sort(
        (a, b) =>
          new Date(
            b.fechaCreacion || 0
          ) -
          new Date(
            a.fechaCreacion || 0
          )
      )
      .slice(0, limit);
  }

  const snapshot =
    await db
      .collection(
        COMUNICACIONES_COLLECTION
      )
      .orderBy(
        "fechaCreacion",
        "desc"
      )
      .limit(limit)
      .get();

  return snapshot.docs.map(
    (doc) => ({
      id: doc.id,
      ...doc.data()
    })
  );
}

async function actualizarComunicacion(
  id,
  cambios
) {
  if (!db) {
    const comunicaciones =
      leerJson(
        comunicacionesFile,
        []
      );

    const index =
      comunicaciones.findIndex(
        (item) =>
          item.id === id
      );

    if (index === -1) {
      return false;
    }

    comunicaciones[index] = {
      ...comunicaciones[index],
      ...cambios,
      id
    };

    guardarJson(
      comunicacionesFile,
      comunicaciones
    );

    return true;
  }

  const ref =
    db
      .collection(
        COMUNICACIONES_COLLECTION
      )
      .doc(id);

  const doc =
    await ref.get();

  if (!doc.exists) {
    return false;
  }

  await ref.set(
    cambios,
    {
      merge: true
    }
  );

  return true;
}
function crearRegistroComunicacion({
  candidatoId = "",
  postulacionId = "",
  entrevistaId = "",

  tipo = "",
  canal = "email",

  destinatario = "",
  asunto = "",

  contenidoTexto = "",
  contenidoHtml = "",

  fechaProgramada = "",
  creadoPor = "sistema"
} = {}) {

  const fechaActual =
    new Date().toISOString();

  return {

    id:
      `com-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2,8)}`,

    candidatoId,
    postulacionId,
    entrevistaId,

    tipo,
    canal,

    destinatario,

    asunto,

    contenidoTexto,
    contenidoHtml,

    estado:
      fechaProgramada
        ? "pendiente"
        : "creado",

    error: "",

    fechaProgramada,

    fechaEnvio: "",

    fechaEntrega: "",

    fechaApertura: "",

    creadoPor,

    fechaCreacion:
      fechaActual,

    fechaActualizacion:
      fechaActual

  };

}

function leerJson(filePath, fallback = []) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error);
    return fallback;
  }
}

function guardarJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}


async function guardarPostulacion(postulacion) {
  if (!db) {
    const postulaciones =
      leerJson(
        postulacionesFile,
        []
      );

    postulaciones.push(
      postulacion
    );

    guardarJson(
      postulacionesFile,
      postulaciones
    );

    return;
  }

  await db
    .collection(
      POSTULACIONES_COLLECTION
    )
    .doc(postulacion.id)
    .set(postulacion);
}

async function actualizarPostulacion(
  id,
  data
) {
  if (!db) {
    const postulaciones =
      leerJson(
        postulacionesFile,
        []
      );

    const index =
      postulaciones.findIndex(
        (p) => p.id === id
      );

    if (index !== -1) {
      postulaciones[index] = {
        ...postulaciones[index],
        ...data
      };

      guardarJson(
        postulacionesFile,
        postulaciones
      );
    }

    return;
  }

  await db
    .collection(
      POSTULACIONES_COLLECTION
    )
    .doc(id)
    .update(data);
}

async function eliminarPostulacion(id) {
  if (!id) {
    return false;
  }

  if (!db) {
    const postulaciones =
      leerJson(
        postulacionesFile,
        []
      );

    const nuevasPostulaciones =
      postulaciones.filter(
        (postulacion) =>
          postulacion.id !== id
      );

    if (
      nuevasPostulaciones.length ===
      postulaciones.length
    ) {
      return false;
    }

    guardarJson(
      postulacionesFile,
      nuevasPostulaciones
    );

    return true;
  }

  const referencia =
    db
      .collection(
        POSTULACIONES_COLLECTION
      )
      .doc(id);

  const documento =
    await referencia.get();

  if (!documento.exists) {
    return false;
  }

  await referencia.delete();

  return true;
}

async function leerPostulaciones(limit = 50) {
  if (!db) {
    return leerJson(postulacionesFile, [])
      .sort((a, b) => {
        return new Date(b.fechaRegistro || 0) -
          new Date(a.fechaRegistro || 0);
      })
      .slice(0, limit);
  }

  const snapshot = await db
    .collection(POSTULACIONES_COLLECTION)
    .orderBy("fechaRegistro", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}



async function leerEntrevistas(limit = 100) {
  if (!db) {
    return leerJson(entrevistasFile, [])
      .sort((a, b) => {
        return new Date(
          `${a.fecha || ""}T${a.hora || "00:00"}`
        ) -
        new Date(
          `${b.fecha || ""}T${b.hora || "00:00"}`
        );
      })
      .slice(0, limit);
  }

  const snapshot = await db
    .collection(ENTREVISTAS_COLLECTION)
    .orderBy("fecha", "asc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function guardarEntrevista(entrevista) {
  if (!db) {
    const entrevistas = leerJson(entrevistasFile, []);
    entrevistas.push(entrevista);
    guardarJson(entrevistasFile, entrevistas);
    return;
  }

  await db.collection(ENTREVISTAS_COLLECTION).doc(entrevista.id).set(entrevista);
}

async function actualizarEntrevista(id, data) {
  if (!db) {
    const entrevistas = leerJson(entrevistasFile, []);
    const index = entrevistas.findIndex((e) => e.id === id);

    if (index !== -1) {
      entrevistas[index] = {
        ...entrevistas[index],
        ...data,
        id
      };

      guardarJson(entrevistasFile, entrevistas);
    }

    return;
  }

  await db.collection(ENTREVISTAS_COLLECTION).doc(id).set(data, { merge: true });
}

async function eliminarEntrevista(id) {
  if (!db) {
    const entrevistas = leerJson(entrevistasFile, []);

    const existe = entrevistas.some(
      (entrevista) => entrevista.id === id
    );

    if (!existe) {
      return false;
    }

    const entrevistasActualizadas = entrevistas.filter(
      (entrevista) => entrevista.id !== id
    );

    guardarJson(
      entrevistasFile,
      entrevistasActualizadas
    );

    return true;
  }

  const entrevistaRef = db
    .collection(ENTREVISTAS_COLLECTION)
    .doc(id);

  const entrevistaDoc = await entrevistaRef.get();

  if (!entrevistaDoc.exists) {
    return false;
  }

  await entrevistaRef.delete();

  return true;
}
/* =========================
   GENERACIÓN DE HORARIOS
========================= */

function sumarMinutosAHora(
  hora = "",
  minutosAgregar = 0
) {
  const minutosBase =
    convertirHoraAMinutos(hora);

  if (minutosBase === null) {
    return null;
  }

  const total =
    minutosBase + Number(minutosAgregar || 0);

  const horas =
    Math.floor(total / 60);

  const minutos =
    total % 60;

  if (horas < 0 || horas > 23) {
    return null;
  }

  return `${String(horas).padStart(
    2,
    "0"
  )}:${String(minutos).padStart(2, "0")}`;
}

function obtenerFechaLocal(
  fecha = ""
) {
  const date =
    new Date(`${fecha}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function obtenerDiaSemanaFecha(
  fecha = ""
) {
  const date =
    obtenerFechaLocal(fecha);

  return date
    ? date.getDay()
    : null;
}

function fechaDentroDePeriodo(
  fecha,
  fechaInicio,
  fechaFin
) {
  if (
    !fecha ||
    !fechaInicio ||
    !fechaFin
  ) {
    return false;
  }

  return (
    fecha >= fechaInicio &&
    fecha <= fechaFin
  );
}

function generarEspaciosDisponibilidad({
  disponibilidad,
  fecha
} = {}) {
  if (
    !disponibilidad ||
    disponibilidad.activo === false
  ) {
    return [];
  }

  if (
    !fechaDentroDePeriodo(
      fecha,
      disponibilidad.fechaInicio,
      disponibilidad.fechaFin
    )
  ) {
    return [];
  }

  const diaSemana =
    obtenerDiaSemanaFecha(fecha);

  const dias =
    Array.isArray(
      disponibilidad.diasSemana
    )
      ? disponibilidad.diasSemana.map(Number)
      : [];

  if (!dias.includes(diaSemana)) {
    return [];
  }

  const inicio =
    convertirHoraAMinutos(
      disponibilidad.horaInicio
    );

  const fin =
    convertirHoraAMinutos(
      disponibilidad.horaFin
    );

  const duracion =
    Number(
      disponibilidad.duracionMinutos || 30
    );

  const descanso =
    Number(
      disponibilidad.descansoMinutos || 0
    );

  if (
    inicio === null ||
    fin === null ||
    !duracion ||
    fin <= inicio
  ) {
    return [];
  }

  const espacios = [];
  let cursor = inicio;

  while (
    cursor + duracion <= fin
  ) {
    const horaInicio =
      `${String(
        Math.floor(cursor / 60)
      ).padStart(2, "0")}:${String(
        cursor % 60
      ).padStart(2, "0")}`;

    const horaFin =
      sumarMinutosAHora(
        horaInicio,
        duracion
      );

    if (!horaFin) {
      break;
    }

    espacios.push({
      disponibilidadId:
        disponibilidad.id,

      reclutador:
        disponibilidad.reclutador,

      reclutadorId:
        disponibilidad.reclutadorId || "",

      fecha,

      hora:
        horaInicio,

      horaFin,

      duracionMinutos:
        duracion,

      descansoMinutos:
        descanso,

      tipo:
        disponibilidad.tipo,

      sucursal:
        disponibilidad.sucursal || "",

      sucursalId:
        disponibilidad.sucursalId || "",

      vacanteId:
        disponibilidad.vacanteId || "",

      vacanteTitulo:
        disponibilidad.vacanteTitulo || ""
    });

    cursor +=
      duracion + descanso;
  }

  return espacios;
}

function horarioCoincideConEntrevista(
  horario,
  entrevista
) {
  if (
    !horario ||
    !entrevista
  ) {
    return false;
  }

  const estadosQueLiberanHorario = [
  "cancelada",
  "eliminada"
];

if (
  estadosQueLiberanHorario.includes(
    entrevista.estado
  ) ||
  entrevista.bloqueoLiberado === true
) {
  return false;
}

  return (
    horario.fecha === entrevista.fecha &&
    horario.hora === entrevista.hora &&
    (
      !horario.reclutador ||
      !entrevista.reclutador ||
      normalizarTexto(
        horario.reclutador
      ) ===
        normalizarTexto(
          entrevista.reclutador
        )
    )
  );
}

function filtrarHorariosOcupados(
  horarios = [],
  entrevistas = []
) {
  return horarios.filter(
    (horario) =>
      !entrevistas.some(
        (entrevista) =>
          horarioCoincideConEntrevista(
            horario,
            entrevista
          )
      )
  );
}
/* =========================
   DISPONIBILIDAD DE
   RECLUTADORES
========================= */

async function leerDisponibilidadesEntrevista(
  limit = 200
) {
  if (!db) {
    return leerJson(
      disponibilidadesEntrevistaFile,
      []
    )
      .sort((a, b) => {
        return (
          new Date(
            b.fechaCreacion || 0
          ) -
          new Date(
            a.fechaCreacion || 0
          )
        );
      })
      .slice(0, limit);
  }

  const snapshot = await db
    .collection(
      DISPONIBILIDADES_ENTREVISTA_COLLECTION
    )
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    .sort((a, b) => {
      return (
        new Date(
          b.fechaCreacion || 0
        ) -
        new Date(
          a.fechaCreacion || 0
        )
      );
    });
}

async function obtenerDisponibilidadEntrevista(
  id
) {
  if (!id) {
    return null;
  }

  if (!db) {
    const disponibilidades =
      leerJson(
        disponibilidadesEntrevistaFile,
        []
      );

    return (
      disponibilidades.find(
        (item) => item.id === id
      ) || null
    );
  }

  const doc = await db
    .collection(
      DISPONIBILIDADES_ENTREVISTA_COLLECTION
    )
    .doc(id)
    .get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  };
}

async function guardarDisponibilidadEntrevista(
  disponibilidad
) {
  if (!db) {
    const disponibilidades =
      leerJson(
        disponibilidadesEntrevistaFile,
        []
      );

    disponibilidades.push(
      disponibilidad
    );

    guardarJson(
      disponibilidadesEntrevistaFile,
      disponibilidades
    );

    return;
  }

  await db
    .collection(
      DISPONIBILIDADES_ENTREVISTA_COLLECTION
    )
    .doc(disponibilidad.id)
    .set(disponibilidad);
}

async function actualizarDisponibilidadEntrevista(
  id,
  data
) {
  if (!db) {
    const disponibilidades =
      leerJson(
        disponibilidadesEntrevistaFile,
        []
      );

    const index =
      disponibilidades.findIndex(
        (item) => item.id === id
      );

    if (index === -1) {
      return false;
    }

    disponibilidades[index] = {
      ...disponibilidades[index],
      ...data,
      id
    };

    guardarJson(
      disponibilidadesEntrevistaFile,
      disponibilidades
    );

    return true;
  }

  const ref = db
    .collection(
      DISPONIBILIDADES_ENTREVISTA_COLLECTION
    )
    .doc(id);

  const doc = await ref.get();

  if (!doc.exists) {
    return false;
  }

  await ref.set(
    {
      ...data,
      id
    },
    {
      merge: true
    }
  );

  return true;
}

async function eliminarDisponibilidadEntrevista(
  id
) {
  if (!db) {
    const disponibilidades =
      leerJson(
        disponibilidadesEntrevistaFile,
        []
      );

    const existe =
      disponibilidades.some(
        (item) => item.id === id
      );

    if (!existe) {
      return false;
    }

    const actualizadas =
      disponibilidades.filter(
        (item) => item.id !== id
      );

    guardarJson(
      disponibilidadesEntrevistaFile,
      actualizadas
    );

    return true;
  }

  const ref = db
    .collection(
      DISPONIBILIDADES_ENTREVISTA_COLLECTION
    )
    .doc(id);

  const doc = await ref.get();

  if (!doc.exists) {
    return false;
  }

  await ref.delete();

  return true;
}

async function leerVacantes() {
  if (!db) return leerJson(vacantesFile, vacantesIniciales);

  const snapshot = await db.collection(VACANTES_COLLECTION).get();

  if (snapshot.empty) {
    const batch = db.batch();

    vacantesIniciales.forEach((vacante) => {
      const ref = db.collection(VACANTES_COLLECTION).doc(vacante.id);
      batch.set(ref, vacante);
    });

    await batch.commit();

    return vacantesIniciales;
  }

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function guardarVacante(vacante) {
  if (!db) {
    const vacantes = leerJson(vacantesFile, []);
    vacantes.push(vacante);
    guardarJson(vacantesFile, vacantes);
    return;
  }

  await db.collection(VACANTES_COLLECTION).doc(vacante.id).set(vacante);
}

async function actualizarVacante(id, data) {
  if (!db) {
    const vacantes = leerJson(vacantesFile, []);
    const index = vacantes.findIndex((v) => v.id === id);

    if (index !== -1) {
      vacantes[index] = {
        ...vacantes[index],
        ...data,
        id
      };

      guardarJson(vacantesFile, vacantes);
    }

    return;
  }

  await db.collection(VACANTES_COLLECTION).doc(id).set(data, { merge: true });
}

async function eliminarVacanteFirestore(id) {
  if (!db) {
    const vacantes = leerJson(vacantesFile, []);
    const filtradas = vacantes.filter((v) => v.id !== id);
    guardarJson(vacantesFile, filtradas);
    return;
  }

  await db.collection(VACANTES_COLLECTION).doc(id).delete();
}

function leerSucursales() {
  return leerJson(sucursalesFile, sucursalesIniciales);
}
/* =========================================================
   MOTOR DE ASIGNACIÓN DE AGENDA
========================================================= */

function obtenerRegionDisponibilidad(
  disponibilidad = {}
) {
  return String(
    disponibilidad.region ||
    disponibilidad.zona ||
    disponibilidad.ciudad ||
    ""
  ).trim();
}

function obtenerRegionVacante(
  vacante = {}
) {
  return String(
    vacante.region ||
    vacante.zona ||
    vacante.ciudad ||
    ""
  ).trim();
}

function valoresIguales(
  valorA = "",
  valorB = ""
) {
  return (
    normalizarTexto(valorA) ===
    normalizarTexto(valorB)
  );
}

function disponibilidadCoincideConRegion(
  disponibilidad,
  region
) {
  if (!region) {
    return false;
  }

  const regionDisponibilidad =
    obtenerRegionDisponibilidad(
      disponibilidad
    );

  if (!regionDisponibilidad) {
    return false;
  }

  return valoresIguales(
    regionDisponibilidad,
    region
  );
}

function disponibilidadCoincideConSucursal({
  disponibilidad,
  sucursalId = "",
  sucursal = ""
} = {}) {
  if (!disponibilidad) {
    return false;
  }

  if (
    sucursalId &&
    disponibilidad.sucursalId
  ) {
    return valoresIguales(
      disponibilidad.sucursalId,
      sucursalId
    );
  }

  if (
    sucursal &&
    disponibilidad.sucursal
  ) {
    return valoresIguales(
      disponibilidad.sucursal,
      sucursal
    );
  }

  return false;
}

function disponibilidadEsGeneralSucursal(
  disponibilidad = {}
) {
  return (
    !String(
      disponibilidad.sucursalId || ""
    ).trim() &&
    !String(
      disponibilidad.sucursal || ""
    ).trim()
  );
}

function disponibilidadEsGeneralVacante(
  disponibilidad = {}
) {
  return !String(
    disponibilidad.vacanteId || ""
  ).trim();
}

function disponibilidadCoincideConVacante(
  disponibilidad,
  vacanteId = ""
) {
  if (
    !disponibilidad ||
    !vacanteId
  ) {
    return false;
  }

  return valoresIguales(
    disponibilidad.vacanteId,
    vacanteId
  );
}
function seleccionarDisponibilidadesIdeales({
  disponibilidades = [],
  region = "",
  sucursalId = "",
  sucursal = "",
  vacanteId = "",
  tipo = ""
} = {}) {
  const activas =
    disponibilidades.filter(
      (item) => {
        if (!item) return false;

        if (item.activo === false) {
          return false;
        }

        if (
          tipo &&
          item.tipo &&
          !valoresIguales(
            item.tipo,
            tipo
          )
        ) {
          return false;
        }

        return disponibilidadCoincideConRegion(
          item,
          region
        );
      }
    );

  /*
   * PRIORIDAD 1
   * Región + sucursal + vacante.
   */
  const prioridad1 =
    activas.filter(
      (item) =>
        disponibilidadCoincideConSucursal({
          disponibilidad: item,
          sucursalId,
          sucursal
        }) &&
        disponibilidadCoincideConVacante(
          item,
          vacanteId
        )
    );

  if (prioridad1.length) {
    return {
      nivel: 1,
      criterio:
        "region_sucursal_vacante",
      disponibilidades:
        prioridad1
    };
  }

  /*
   * PRIORIDAD 2
   * Región + sucursal +
   * todas las vacantes.
   */
  const prioridad2 =
    activas.filter(
      (item) =>
        disponibilidadCoincideConSucursal({
          disponibilidad: item,
          sucursalId,
          sucursal
        }) &&
        disponibilidadEsGeneralVacante(
          item
        )
    );

  if (prioridad2.length) {
    return {
      nivel: 2,
      criterio:
        "region_sucursal_general",
      disponibilidades:
        prioridad2
    };
  }

  /*
   * PRIORIDAD 3
   * Región completa:
   * todas las sucursales y
   * todas las vacantes.
   */
  const prioridad3 =
    activas.filter(
      (item) =>
        disponibilidadEsGeneralSucursal(
          item
        ) &&
        disponibilidadEsGeneralVacante(
          item
        )
    );

  if (prioridad3.length) {
    return {
      nivel: 3,
      criterio:
        "region_general",
      disponibilidades:
        prioridad3
    };
  }

  return {
    nivel: 0,
    criterio:
      "sin_disponibilidad",
    disponibilidades: []
  };
}

async function resolverContextoAgenda({
  vacanteId = "",
  region = "",
  ciudad = "",
  sucursalId = "",
  sucursal = ""
} = {}) {
  let vacante = null;

  if (vacanteId) {
    const vacantes =
      await leerVacantes();

    vacante =
      vacantes.find(
        (item) =>
          item.id === vacanteId
      ) || null;
  }

  return {
    vacante,

    region:
      String(
        region ||
        ciudad ||
        obtenerRegionVacante(
          vacante || {}
        ) ||
        ""
      ).trim(),

    sucursalId:
      String(
        sucursalId ||
        vacante?.sucursalId ||
        vacante?.branchId ||
        ""
      ).trim(),

    sucursal:
      String(
        sucursal ||
        vacante?.sucursal ||
        ""
      ).trim(),

    vacanteId:
      String(
        vacanteId ||
        vacante?.id ||
        ""
      ).trim()
  };
}
function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function reagendarEntrevistaAtomica({
  entrevistaActual,
  nuevaFecha,
  nuevaHora,
  cambiosAdicionales = {},
  actualizadoPor = ""
} = {}) {
  if (
    !entrevistaActual?.id ||
    !nuevaFecha ||
    !nuevaHora
  ) {
    throw new Error(
      "Faltan datos para reprogramar la entrevista."
    );
  }

  const disponibilidadId =
    entrevistaActual.disponibilidadId ||
    "";

  if (!disponibilidadId) {
    const error = new Error(
      "La entrevista no tiene una disponibilidad asociada."
    );

    error.code =
      "SIN_DISPONIBILIDAD";

    throw error;
  }

  const disponibilidad =
    await obtenerDisponibilidadEntrevista(
      disponibilidadId
    );

  if (
    !disponibilidad ||
    disponibilidad.activo === false
  ) {
    const error = new Error(
      "La disponibilidad del reclutador ya no está activa."
    );

    error.code =
      "DISPONIBILIDAD_INACTIVA";

    throw error;
  }

  const horariosPermitidos =
    generarEspaciosDisponibilidad({
      disponibilidad,
      fecha: nuevaFecha
    });

  const nuevoHorario =
    horariosPermitidos.find(
      (item) =>
        item.hora === nuevaHora
    );

  if (!nuevoHorario) {
    const error = new Error(
      "El nuevo horario no pertenece a la disponibilidad configurada."
    );

    error.code =
      "HORARIO_INVALIDO";

    throw error;
  }

  const bloqueoAnteriorId =
    entrevistaActual
      .bloqueoHorarioId ||
    crearIdBloqueoEntrevista({
      disponibilidadId,

      fecha:
        entrevistaActual.fecha,

      hora:
        entrevistaActual.hora
    });

  const bloqueoNuevoId =
    crearIdBloqueoEntrevista({
      disponibilidadId,

      fecha:
        nuevaFecha,

      hora:
        nuevaHora
    });

  if (!bloqueoNuevoId) {
    throw new Error(
      "No fue posible generar el bloqueo del nuevo horario."
    );
  }

  const fechaActual =
    new Date().toISOString();

  const entrevistaActualizada = {
    ...entrevistaActual,
    ...cambiosAdicionales,

    fecha:
      nuevaFecha,

    hora:
      nuevaHora,

    horaFin:
      nuevoHorario.horaFin,

    duracionMinutos:
      nuevoHorario
        .duracionMinutos,

    reclutador:
      disponibilidad.reclutador ||
      entrevistaActual.reclutador ||
      "",

    reclutadorId:
      disponibilidad.reclutadorId ||
      entrevistaActual.reclutadorId ||
      "",

    tipo:
      disponibilidad.tipo ||
      entrevistaActual.tipo ||
      "presencial",

    estado:
      "reagendada",

    bloqueoHorarioId:
      bloqueoNuevoId,

    bloqueoLiberado:
      false,

    fechaReagendado:
      fechaActual,

    fechaActualizacion:
      fechaActual,

    actualizadoPor
  };

  /*
   * MODO LOCAL
   */
  if (!db) {
    const entrevistas =
      leerJson(
        entrevistasFile,
        []
      );

    const ocupado =
      entrevistas.some(
        (item) => {
          if (
            item.id ===
            entrevistaActual.id
          ) {
            return false;
          }

          return horarioCoincideConEntrevista(
            nuevoHorario,
            item
          );
        }
      );

    if (ocupado) {
      const error = new Error(
        "El nuevo horario acaba de ser reservado."
      );

      error.code =
        "HORARIO_OCUPADO";

      throw error;
    }

    const index =
      entrevistas.findIndex(
        (item) =>
          item.id ===
          entrevistaActual.id
      );

    if (index === -1) {
      const error = new Error(
        "Entrevista no encontrada."
      );

      error.code =
        "ENTREVISTA_NO_ENCONTRADA";

      throw error;
    }

    entrevistas[index] =
      entrevistaActualizada;

    guardarJson(
      entrevistasFile,
      entrevistas
    );

    return entrevistaActualizada;
  }

  /*
   * FIRESTORE:
   * todo se ejecuta dentro de
   * una sola transacción.
   */
  const entrevistaRef =
    db.collection(
      ENTREVISTAS_COLLECTION
    ).doc(
      entrevistaActual.id
    );

  const bloqueoNuevoRef =
    db.collection(
      BLOQUEOS_ENTREVISTA_COLLECTION
    ).doc(
      bloqueoNuevoId
    );

  const bloqueoAnteriorRef =
    bloqueoAnteriorId
      ? db.collection(
          BLOQUEOS_ENTREVISTA_COLLECTION
        ).doc(
          bloqueoAnteriorId
        )
      : null;

  await db.runTransaction(
    async (transaction) => {
      const [
        entrevistaDoc,
        bloqueoNuevoDoc
      ] = await Promise.all([
        transaction.get(
          entrevistaRef
        ),

        transaction.get(
          bloqueoNuevoRef
        )
      ]);

      if (!entrevistaDoc.exists) {
        const error = new Error(
          "Entrevista no encontrada."
        );

        error.code =
          "ENTREVISTA_NO_ENCONTRADA";

        throw error;
      }

      /*
       * Si no estamos seleccionando
       * exactamente el mismo espacio,
       * verificamos que el bloqueo nuevo
       * esté disponible.
       */
      if (
        bloqueoNuevoId !==
        bloqueoAnteriorId &&
        bloqueoNuevoDoc.exists
      ) {
        const bloqueoNuevo =
          bloqueoNuevoDoc.data() ||
          {};

        if (
          bloqueoNuevo.activo !== false
        ) {
          const error = new Error(
            "El nuevo horario acaba de ser reservado."
          );

          error.code =
            "HORARIO_OCUPADO";

          throw error;
        }
      }

      /*
       * Crear o reactivar el nuevo bloqueo.
       */
      transaction.set(
        bloqueoNuevoRef,
        {
          id:
            bloqueoNuevoId,

          activo:
            true,

          disponibilidadId,

          entrevistaId:
            entrevistaActual.id,

          candidatoId:
            entrevistaActual
              .candidatoId ||
            "",

          candidatoNombre:
            entrevistaActual
              .candidatoNombre ||
            "",

          fecha:
            nuevaFecha,

          hora:
            nuevaHora,

          horaFin:
            nuevoHorario.horaFin ||
            "",

          reclutador:
            disponibilidad.reclutador ||
            "",

          reclutadorId:
            disponibilidad.reclutadorId ||
            "",

          fechaCreacion:
            fechaActual,

          fechaActualizacion:
            fechaActual,

          motivo:
            "entrevista_reagendada"
        },
        {
          merge: false
        }
      );

      /*
       * Liberar el bloqueo anterior
       * solamente cuando es distinto.
       */
      if (
        bloqueoAnteriorRef &&
        bloqueoAnteriorId !==
          bloqueoNuevoId
      ) {
        transaction.set(
          bloqueoAnteriorRef,
          {
            activo:
              false,

            motivoLiberacion:
              "entrevista_reagendada",

            reemplazadoPor:
              bloqueoNuevoId,

            fechaLiberacion:
              fechaActual,

            fechaActualizacion:
              fechaActual
          },
          {
            merge: true
          }
        );
      }

      transaction.set(
        entrevistaRef,
        entrevistaActualizada,
        {
          merge: true
        }
      );
    }
  );

  return entrevistaActualizada;
}

/* =========================================================
   BLOQUEO ATÓMICO DE HORARIOS
========================================================= */

function crearIdBloqueoEntrevista({
  disponibilidadId = "",
  fecha = "",
  hora = ""
} = {}) {
  const partes = [
    disponibilidadId,
    fecha,
    hora
  ]
    .map((valor) =>
      slugify(String(valor || ""))
    )
    .filter(Boolean);

  return partes.join("__");
}

async function guardarReservaEntrevistaAtomica({
  entrevista,
  horarioSeleccionado
} = {}) {
  if (
    !entrevista?.id ||
    !entrevista.disponibilidadId ||
    !entrevista.fecha ||
    !entrevista.hora
  ) {
    throw new Error(
      "Datos incompletos para bloquear el horario."
    );
  }

  const bloqueoId =
    crearIdBloqueoEntrevista({
      disponibilidadId:
        entrevista.disponibilidadId,

      fecha:
        entrevista.fecha,

      hora:
        entrevista.hora
    });

  if (!bloqueoId) {
    throw new Error(
      "No fue posible generar el identificador del horario."
    );
  }

  /*
   * Modo local sin Firestore.
   * Node procesa esta sección de forma síncrona
   * entre lectura y escritura del archivo.
   */
  if (!db) {
    const entrevistas =
      leerJson(
        entrevistasFile,
        []
      );

    const ocupado =
      entrevistas.some(
        (item) =>
          horarioCoincideConEntrevista(
            horarioSeleccionado,
            item
          )
      );

    if (ocupado) {
      const error =
        new Error(
          "Ese horario acaba de ser reservado. Selecciona otro horario."
        );

      error.code =
        "HORARIO_OCUPADO";

      throw error;
    }

    entrevistas.push(
      entrevista
    );

    guardarJson(
      entrevistasFile,
      entrevistas
    );

    return {
      bloqueoId,
      entrevista
    };
  }

  const bloqueoRef =
    db.collection(
      BLOQUEOS_ENTREVISTA_COLLECTION
    ).doc(bloqueoId);

  const entrevistaRef =
    db.collection(
      ENTREVISTAS_COLLECTION
    ).doc(entrevista.id);

  await db.runTransaction(
    async (transaction) => {
      const bloqueoDoc =
        await transaction.get(
          bloqueoRef
        );

      if (bloqueoDoc.exists) {
        const bloqueo =
          bloqueoDoc.data() || {};

        /*
         * Solo dejamos reutilizar el espacio
         * si el bloqueo fue liberado.
         */
        if (bloqueo.activo !== false) {
          const error =
            new Error(
              "Ese horario acaba de ser reservado. Selecciona otro horario."
            );

          error.code =
            "HORARIO_OCUPADO";

          throw error;
        }
      }

      const fechaActual =
        new Date().toISOString();

      transaction.set(
        bloqueoRef,
        {
          id:
            bloqueoId,

          activo:
            true,

          disponibilidadId:
            entrevista
              .disponibilidadId,

          entrevistaId:
            entrevista.id,

          candidatoId:
            entrevista.candidatoId,

          candidatoNombre:
            entrevista
              .candidatoNombre,

          fecha:
            entrevista.fecha,

          hora:
            entrevista.hora,

          horaFin:
            entrevista.horaFin ||
            horarioSeleccionado
              ?.horaFin ||
            "",

          reclutador:
            entrevista.reclutador ||
            "",

          reclutadorId:
            entrevista.reclutadorId ||
            "",

          fechaCreacion:
            fechaActual,

          fechaActualizacion:
            fechaActual
        },
        {
          merge: false
        }
      );

      transaction.set(
        entrevistaRef,
        {
          ...entrevista,
          bloqueoHorarioId:
            bloqueoId
        },
        {
          merge: false
        }
      );
    }
  );

  return {
    bloqueoId,
    entrevista: {
      ...entrevista,
      bloqueoHorarioId:
        bloqueoId
    }
  };
}

async function liberarBloqueoEntrevista({
  entrevista,
  motivo = "liberado"
} = {}) {
  if (!entrevista) {
    return false;
  }

  const bloqueoId =
    entrevista.bloqueoHorarioId ||
    crearIdBloqueoEntrevista({
      disponibilidadId:
        entrevista.disponibilidadId ||
        "",

      fecha:
        entrevista.fecha ||
        "",

      hora:
        entrevista.hora ||
        ""
    });

  if (!bloqueoId) {
    /*
     * Entrevistas antiguas o creadas
     * manualmente pueden no tener
     * disponibilidad asociada.
     */
    return false;
  }

  /*
   * En modo local no existe una
   * colección independiente de bloqueos.
   * El horario se considera libre al
   * cancelar o eliminar la entrevista.
   */
  if (!db) {
    return true;
  }

  const bloqueoRef =
    db
      .collection(
        BLOQUEOS_ENTREVISTA_COLLECTION
      )
      .doc(bloqueoId);

  const bloqueoDoc =
    await bloqueoRef.get();

  if (!bloqueoDoc.exists) {
    return false;
  }

  const fechaActual =
    new Date().toISOString();

  await bloqueoRef.set(
    {
      activo: false,

      motivoLiberacion:
        motivo,

      fechaLiberacion:
        fechaActual,

      fechaActualizacion:
        fechaActual
    },
    {
      merge: true
    }
  );

  return true;
}



function slugify(texto = "") {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function crearMapsUrl(query = "") {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function crearAppleMapsUrl(query = "") {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function resolverPais(valor = "") {
  const t = normalizarTexto(valor);
  if (["mexico", "mx"].includes(t)) return "Mexico";
  if (["estados unidos", "usa", "us", "eeuu", "eua", "united states"].includes(t)) return "Estados Unidos";
  return valor;
}

function resolverEstado(valor = "") {
  const t = normalizarTexto(valor);
  if (["chihuahua", "chih"].includes(t)) return "Chihuahua";
  if (["baja california", "baja", "bc"].includes(t)) return "Baja California";
  if (["jalisco", "gdl", "guadalajara"].includes(t)) return "Jalisco";
  if (["texas", "tx"].includes(t)) return "Texas";
  return valor;
}

function resolverCiudad(valor = "") {
  const t = normalizarTexto(valor);
  if (["juarez", "ciudad juarez", "cd juarez", "cd. juarez", "jrz"].includes(t)) return "Ciudad Juarez";
  if (["chihuahua", "ciudad chihuahua", "cd chihuahua"].includes(t)) return "Chihuahua";
  if (["guadalajara", "gdl"].includes(t)) return "Guadalajara";
  if (["mexicali"].includes(t)) return "Mexicali";
  if (["el paso", "elpaso"].includes(t)) return "El Paso";
  return valor;
}

function resolverGrupo(valor = "") {
  const t = normalizarTexto(valor);
  if (["wendys", "wendy"].includes(t)) return "Wendy's";
  if (["applebees", "applebee"].includes(t)) return "Applebee's";
  if (t.includes("great")) return "Great American";
  if (t.includes("little")) return "Little Caesars";
  if (t.includes("ardeo")) return "Ardeo";
  if (t.includes("yoko")) return "Yoko";
  return valor;
}

function resolverSucursalId(vacante = {}) {
  if (vacante.sucursalId) return vacante.sucursalId;

  return slugify(
    [vacante.grupo, vacante.sucursal, vacante.ciudad, vacante.estado, vacante.pais]
      .filter(Boolean)
      .join("-")
  );
}

function limpiarNumero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

function construirConsultaDireccion(data = {}) {
  return [
    data.direccion,
    data.sucursal,
    data.ciudad,
    data.estado,
    data.pais
  ]
    .filter(Boolean)
    .join(", ");
}

async function geocodificarDireccion(query = "") {
  if (!query.trim()) return { lat: null, lng: null };

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "GA-Hospitality-Reclutamiento/1.0"
      }
    });

    const data = await response.json();

    if (!Array.isArray(data) || !data.length) {
      return { lat: null, lng: null };
    }

    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon)
    };
  } catch (error) {
    console.error("Error geocodificando direccion:", error);
    return { lat: null, lng: null };
  }
}

async function resolverCoordenadas(data = {}) {
  let lat = limpiarNumero(data.lat);
  let lng = limpiarNumero(data.lng);

  if (lat !== null && lng !== null) {
    return { lat, lng };
  }

  const query = construirConsultaDireccion(data);
  const coords = await geocodificarDireccion(query);

  lat = limpiarNumero(coords.lat);
  lng = limpiarNumero(coords.lng);

  return { lat, lng };
}

function normalizarDiasDisponibles(
  dias = []
) {
  if (!Array.isArray(dias)) {
    return [];
  }

  return [
    ...new Set(
      dias
        .map((dia) => Number(dia))
        .filter(
          (dia) =>
            Number.isInteger(dia) &&
            dia >= 0 &&
            dia <= 6
        )
    )
  ].sort((a, b) => a - b);
}

function validarFormatoHora(
  hora = ""
) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(
    String(hora || "").trim()
  );
}

function convertirHoraAMinutos(
  hora = ""
) {
  if (!validarFormatoHora(hora)) {
    return null;
  }

  const [horas, minutos] =
    hora.split(":").map(Number);

  return horas * 60 + minutos;
}

function validarDisponibilidadEntrevista(
  data = {}
) {
  const reclutador =
    String(
      data.reclutador || ""
    ).trim();
    const region =
  String(
    data.region ||
    data.zona ||
    data.ciudad ||
    ""
  ).trim();

const sucursal =
  String(
    data.sucursal || ""
  ).trim();

const sucursalId =
  String(
    data.sucursalId || ""
  ).trim();

const vacanteId =
  String(
    data.vacanteId || ""
  ).trim();

const vacanteTitulo =
  String(
    data.vacanteTitulo || ""
  ).trim();

  const fechaInicio =
    String(
      data.fechaInicio || ""
    ).trim();

  const fechaFin =
    String(
      data.fechaFin || ""
    ).trim();

  const horaInicio =
    String(
      data.horaInicio || ""
    ).trim();

  const horaFin =
    String(
      data.horaFin || ""
    ).trim();

  const duracionMinutos =
    Number(data.duracionMinutos);

  const descansoMinutos =
    Number(data.descansoMinutos || 0);

  const diasSemana =
    normalizarDiasDisponibles(
      data.diasSemana
    );

  const tiposValidos = [
    "presencial",
    "videollamada",
    "telefonica"
  ];

  if (!reclutador) {
    return {
      ok: false,
      error:
        "El nombre del reclutador es obligatorio."
    };
  }

  if (!region) {
  return {
    ok: false,
    error:
      "Selecciona la región de reclutamiento."
  };
}

  if (
    !fechaInicio ||
    !fechaFin
  ) {
    return {
      ok: false,
      error:
        "Debes indicar el periodo de vigencia."
    };
  }

  const inicio =
    new Date(
      `${fechaInicio}T00:00:00`
    );

  const fin =
    new Date(
      `${fechaFin}T00:00:00`
    );

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fin.getTime())
  ) {
    return {
      ok: false,
      error:
        "Las fechas de vigencia no son válidas."
    };
  }

  if (fin < inicio) {
    return {
      ok: false,
      error:
        "La fecha final no puede ser anterior a la fecha inicial."
    };
  }

  if (
    !validarFormatoHora(horaInicio) ||
    !validarFormatoHora(horaFin)
  ) {
    return {
      ok: false,
      error:
        "El horario debe tener un formato válido."
    };
  }

  const minutosInicio =
    convertirHoraAMinutos(horaInicio);

  const minutosFin =
    convertirHoraAMinutos(horaFin);

  if (minutosFin <= minutosInicio) {
    return {
      ok: false,
      error:
        "La hora final debe ser posterior a la hora inicial."
    };
  }

  if (
    ![15, 30, 45, 60].includes(
      duracionMinutos
    )
  ) {
    return {
      ok: false,
      error:
        "La duración de la entrevista no es válida."
    };
  }

  if (
    ![0, 10, 15, 30].includes(
      descansoMinutos
    )
  ) {
    return {
      ok: false,
      error:
        "El espacio entre entrevistas no es válido."
    };
  }

  if (!diasSemana.length) {
    return {
      ok: false,
      error:
        "Selecciona al menos un día disponible."
    };
  }

  if (
    !tiposValidos.includes(
      data.tipo
    )
  ) {
    return {
      ok: false,
      error:
        "La modalidad de entrevista no es válida."
    };
  }

  if (
    minutosInicio +
      duracionMinutos >
    minutosFin
  ) {
    return {
      ok: false,
      error:
        "El rango horario no permite completar al menos una entrevista."
    };
  }

  return {
    ok: true,

    data: {
  reclutador,

  reclutadorId:
    String(
      data.reclutadorId || ""
    ).trim(),

  /*
   * Guardamos los tres nombres
   * temporalmente para mantener
   * compatibilidad con registros
   * anteriores.
   */
  region,
  zona: region,
  ciudad: region,

  sucursal,
  sucursalId,

  vacanteId,
  vacanteTitulo,
    

      fechaInicio,
      fechaFin,
      horaInicio,
      horaFin,
      diasSemana,
      duracionMinutos,
      descansoMinutos,

      tipo: data.tipo,

      activo:
        data.activo !== false
    }
  };
}

/* =========================
   UBICACIÓN DEL CANDIDATO
   Y CÁLCULO DE DISTANCIA
========================= */

function validarCodigoPostal(codigoPostal = "") {
  return /^\d{5}$/.test(
    String(codigoPostal || "").trim()
  );
}

async function geocodificarCodigoPostal({
  codigoPostal,
  ciudad = "",
  estado = "",
  pais = "Mexico"
} = {}) {
  const cp = String(codigoPostal || "").trim();

  if (!validarCodigoPostal(cp)) {
    return {
      lat: null,
      lng: null,
      encontrado: false
    };
  }

  const consultas = [
    `${cp}, ${ciudad}, ${estado}, ${pais}`,
    `${cp}, ${estado}, ${pais}`,
    `${cp}, ${pais}`
  ].filter(Boolean);

  for (const consulta of consultas) {
    const coordenadas =
      await geocodificarDireccion(consulta);

    const lat =
      limpiarNumero(coordenadas.lat);

    const lng =
      limpiarNumero(coordenadas.lng);

    if (lat !== null && lng !== null) {
      return {
        lat,
        lng,
        encontrado: true,
        consultaUtilizada: consulta
      };
    }
  }

  return {
    lat: null,
    lng: null,
    encontrado: false
  };
}

async function iniciarServidor() {
  await inicializarCommunicationCenter();

  const workerHabilitado =
    String(
      process.env
        .COMMUNICATION_WORKER_ENABLED ??
      "true"
    ).toLowerCase() !==
    "false";

  if (workerHabilitado) {
    await communicationWorker
      .iniciar();
  }

  app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Servidor escuchando en puerto ${PORT}`
    );
  }
);
}

function gradosARadianes(grados) {
  return grados * (Math.PI / 180);
}

function calcularDistanciaKm(
  latOrigen,
  lngOrigen,
  latDestino,
  lngDestino
) {
  const lat1 = limpiarNumero(latOrigen);
  const lng1 = limpiarNumero(lngOrigen);
  const lat2 = limpiarNumero(latDestino);
  const lng2 = limpiarNumero(lngDestino);

  if (
    lat1 === null ||
    lng1 === null ||
    lat2 === null ||
    lng2 === null
  ) {
    return null;
  }

  const RADIO_TIERRA_KM = 6371;

  const diferenciaLatitud =
    gradosARadianes(lat2 - lat1);

  const diferenciaLongitud =
    gradosARadianes(lng2 - lng1);

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(gradosARadianes(lat1)) *
      Math.cos(gradosARadianes(lat2)) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return Number(
    (RADIO_TIERRA_KM * c).toFixed(2)
  );
}

function clasificarDistancia(
  distanciaKm
) {
  const distancia =
    limpiarNumero(distanciaKm);

  if (distancia === null) {
    return "no_disponible";
  }

  if (distancia <= 10) {
    return "cercana";
  }

  if (distancia <= 20) {
    return "moderada";
  }

  if (distancia <= 35) {
    return "considerable";
  }

  return "lejana";
}

function obtenerEtiquetaDistancia(
  clasificacion = ""
) {
  const etiquetas = {
    cercana:
      "Muy cerca de la sucursal",

    moderada:
      "Distancia moderada",

    considerable:
      "Distancia considerable",

    lejana:
      "Distancia alta",

    no_disponible:
      "Distancia no disponible"
  };

  return (
    etiquetas[clasificacion] ||
    etiquetas.no_disponible
  );
}

function estimarTiempoTraslado({
  distanciaKm,
  medioTransporte
} = {}) {
  const distancia =
    limpiarNumero(distanciaKm);

  if (distancia === null) {
    return null;
  }

  const transporte =
    normalizarTexto(
      medioTransporte || ""
    );

  let velocidadPromedio = 25;

  if (
    transporte.includes("automovil") ||
    transporte.includes("vehiculo") ||
    transporte.includes("motocicleta")
  ) {
    velocidadPromedio = 35;
  } else if (
    transporte.includes("transporte publico") ||
    transporte.includes("servicio de transporte")
  ) {
    velocidadPromedio = 20;
  } else if (
    transporte.includes("bicicleta")
  ) {
    velocidadPromedio = 15;
  } else if (
    transporte.includes("caminando")
  ) {
    velocidadPromedio = 5;
  }

  const minutos =
    (distancia / velocidadPromedio) * 60;

  /*
   * Se agrega un margen aproximado por
   * tráfico, espera o acceso a la sucursal.
   */
  const margen =
    transporte.includes("transporte publico")
      ? 15
      : 5;

  return Math.max(
    1,
    Math.round(minutos + margen)
  );
}

function obtenerMinutosMaximosTraslado(
  tiempoMaximoTraslado = ""
) {
  const valor = normalizarTexto(
    tiempoMaximoTraslado
  );

  if (valor.includes("15")) {
    return 15;
  }

  if (valor.includes("30")) {
    return 30;
  }

  if (valor.includes("45")) {
    return 45;
  }

  if (valor.includes("60") &&
      !valor.includes("mas")) {
    return 60;
  }

  if (
    valor.includes("mas de 60") ||
    valor.includes("más de 60")
  ) {
    return 90;
  }

  return null;
}



function evaluarCompatibilidadTraslado({
  tiempoEstimadoMin,
  tiempoMaximoTraslado
} = {}) {
  const estimado =
    limpiarNumero(tiempoEstimadoMin);

  const maximo =
    obtenerMinutosMaximosTraslado(
      tiempoMaximoTraslado
    );

  if (
    estimado === null ||
    maximo === null
  ) {
    return {
      estado: "no_disponible",
      etiqueta:
        "Compatibilidad no disponible",
      diferenciaMinutos: null,
      compatible: null
    };
  }

  const diferencia =
    Math.round(estimado - maximo);

  if (diferencia <= 0) {
    return {
      estado: "compatible",
      etiqueta:
        "Traslado compatible",
      diferenciaMinutos:
        Math.abs(diferencia),
      compatible: true
    };
  }

  if (diferencia <= 15) {
    return {
      estado: "al_limite",
      etiqueta:
        "Traslado al límite",
      diferenciaMinutos:
        diferencia,
      compatible: true
    };
  }

  return {
    estado: "no_recomendado",
    etiqueta:
      "Traslado no recomendado",
    diferenciaMinutos:
      diferencia,
    compatible: false
  };
}

/* =========================
   MOTOR DE COMPATIBILIDAD
   DEL CANDIDATO
========================= */

function limitarPuntuacion(valor, minimo = 0, maximo = 100) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return minimo;
  }

  return Math.min(
    maximo,
    Math.max(minimo, numero)
  );
}

function convertirEnPalabras(texto = "") {
  const palabrasIgnoradas = new Set([
    "para",
    "con",
    "sin",
    "una",
    "uno",
    "unos",
    "unas",
    "del",
    "las",
    "los",
    "que",
    "por",
    "como",
    "muy",
    "de",
    "la",
    "el",
    "en",
    "y",
    "o",
    "a"
  ]);

  return normalizarTexto(texto)
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .map((palabra) => palabra.trim())
    .filter(
      (palabra) =>
        palabra.length >= 3 &&
        !palabrasIgnoradas.has(palabra)
    );
}

function calcularCoincidenciaTexto(
  textoCandidato = "",
  textosVacante = []
) {
  const palabrasCandidato = new Set(
    convertirEnPalabras(textoCandidato)
  );

  const palabrasVacante = [
    ...new Set(
      convertirEnPalabras(
        Array.isArray(textosVacante)
          ? textosVacante.join(" ")
          : String(textosVacante || "")
      )
    )
  ];

  if (
    !palabrasCandidato.size ||
    !palabrasVacante.length
  ) {
    return {
      porcentaje: 0,
      coincidencias: [],
      totalPalabrasVacante:
        palabrasVacante.length
    };
  }

  const coincidencias =
    palabrasVacante.filter((palabra) =>
      palabrasCandidato.has(palabra)
    );

  const porcentaje =
    (coincidencias.length /
      palabrasVacante.length) *
    100;

  return {
    porcentaje:
      limitarPuntuacion(porcentaje),

    coincidencias,

    totalPalabrasVacante:
      palabrasVacante.length
  };
}

function evaluarComponenteCv({
  analisisIA = {},
  vacante = {},
  cvDisponible = false
} = {}) {
  if (!cvDisponible) {
    return {
      disponible: false,
      puntos: 0,
      maximo: 35,
      porcentaje: null,
      motivos: [],
      alertas: []
    };
  }

  const textoPerfil = [
    analisisIA.resumen,
    analisisIA.perfilRecomendado,
    analisisIA.tipoPerfil,
    analisisIA.nivelExperiencia,
    ...(analisisIA.habilidadesDetectadas || []),
    ...(analisisIA.puestosSugeridos || []),
    ...(analisisIA.palabrasClave || []),
    ...(analisisIA.areasCompatibles || [])
  ]
    .filter(Boolean)
    .join(" ");

  const textosVacante = [
    vacante.titulo,
    vacante.area,
    vacante.tipoVacante,
    ...(vacante.requisitos || [])
  ];

  const coincidencia =
    calcularCoincidenciaTexto(
      textoPerfil,
      textosVacante
    );

  let porcentaje =
    coincidencia.porcentaje;

  const puestoCoincidente =
    (analisisIA.puestosSugeridos || [])
      .some((puesto) => {
        const sugerido =
          normalizarTexto(puesto);

        const titulo =
          normalizarTexto(
            vacante.titulo || ""
          );

        return (
          sugerido.includes(titulo) ||
          titulo.includes(sugerido)
        );
      });

  const areaCoincidente =
    (analisisIA.areasCompatibles || [])
      .some((area) => {
        const areaPerfil =
          normalizarTexto(area);

        const areaVacante =
          normalizarTexto(
            vacante.area || ""
          );

        return (
          areaPerfil.includes(areaVacante) ||
          areaVacante.includes(areaPerfil)
        );
      });

  if (puestoCoincidente) {
    porcentaje += 20;
  }

  if (areaCoincidente) {
    porcentaje += 15;
  }

  porcentaje =
    limitarPuntuacion(porcentaje);

  const puntos =
    Number(
      ((porcentaje / 100) * 35)
        .toFixed(1)
    );

  const motivos = [];

  if (puestoCoincidente) {
    motivos.push(
      "El puesto aparece entre las recomendaciones obtenidas del CV."
    );
  }

  if (areaCoincidente) {
    motivos.push(
      "El área de la vacante coincide con áreas detectadas en el perfil."
    );
  }

  if (coincidencia.coincidencias.length) {
    motivos.push(
      `Coincidencias detectadas: ${coincidencia.coincidencias
        .slice(0, 6)
        .join(", ")}.`
    );
  }

  const alertas = [];

  if (porcentaje < 35) {
    alertas.push(
      "Se detectaron pocas coincidencias textuales entre el CV y la vacante."
    );
  }

  return {
    disponible: true,
    puntos,
    maximo: 35,
    porcentaje:
      Math.round(porcentaje),

    motivos,
    alertas
  };
}

function evaluarComponenteExperiencia({
  experiencia = "",
  habilidades = "",
  analisisIA = {},
  vacante = {},
  requerida = false
} = {}) {
  if (!requerida) {
    return {
      disponible: false,
      puntos: 0,
      maximo: 20,
      porcentaje: null,
      motivos: [],
      alertas: []
    };
  }

  const textoExperiencia = [
    experiencia,
    habilidades,
    analisisIA.resumen,
    ...(analisisIA.habilidadesDetectadas || []),
    analisisIA.nivelExperiencia
  ]
    .filter(Boolean)
    .join(" ");

  if (!textoExperiencia.trim()) {
    return {
      disponible: true,
      puntos: 0,
      maximo: 20,
      porcentaje: 0,
      motivos: [],
      alertas: [
        "No se proporcionó experiencia suficiente para evaluarla."
      ]
    };
  }

  const coincidencia =
    calcularCoincidenciaTexto(
      textoExperiencia,
      vacante.requisitos || []
    );

  /*
   * Se reconoce que el candidato respondió,
   * pero la mayor parte depende de coincidencias
   * con los requisitos publicados.
   */
  const porcentaje =
    limitarPuntuacion(
      25 +
      coincidencia.porcentaje * 0.75
    );

  const puntos =
    Number(
      ((porcentaje / 100) * 20)
        .toFixed(1)
    );

  const motivos = [
    "El candidato proporcionó información sobre su experiencia."
  ];

  if (coincidencia.coincidencias.length) {
    motivos.push(
      `Experiencia relacionada con: ${coincidencia.coincidencias
        .slice(0, 5)
        .join(", ")}.`
    );
  }

  return {
    disponible: true,
    puntos,
    maximo: 20,
    porcentaje:
      Math.round(porcentaje),

    motivos,
    alertas:
      porcentaje < 40
        ? [
            "La experiencia registrada tiene pocas coincidencias con los requisitos."
          ]
        : []
  };
}

function evaluarComponenteDisponibilidad({
  disponibilidad = "",
  requerida = false
} = {}) {
  if (!requerida) {
    return {
      disponible: false,
      puntos: 0,
      maximo: 15,
      porcentaje: null,
      motivos: [],
      alertas: []
    };
  }

  const valor =
    String(disponibilidad || "").trim();

  if (!valor) {
    return {
      disponible: true,
      puntos: 0,
      maximo: 15,
      porcentaje: 0,
      motivos: [],
      alertas: [
        "No se registró disponibilidad."
      ]
    };
  }

  /*
   * Por ahora se evalúa que la información
   * esté completa. La compatibilidad real
   * requerirá turnos configurados por RH.
   */
  return {
    disponible: true,
    puntos: 15,
    maximo: 15,
    porcentaje: 100,
    motivos: [
      "El candidato proporcionó su disponibilidad."
    ],
    alertas: []
  };
}

function evaluarComponenteGeografico({
  compatibilidadTraslado = {},
  solicitado = false
} = {}) {
  if (!solicitado) {
    return {
      disponible: false,
      puntos: 0,
      maximo: 15,
      porcentaje: null,
      motivos: [],
      alertas: []
    };
  }

  const estado =
    compatibilidadTraslado.estado ||
    "no_disponible";

  const valores = {
    compatible: {
      porcentaje: 100,
      motivo:
        "El tiempo estimado está dentro del máximo aceptado."
    },

    al_limite: {
      porcentaje: 65,
      motivo:
        "El traslado está ligeramente por encima del tiempo aceptado."
    },

    no_recomendado: {
      porcentaje: 20,
      motivo:
        "El traslado supera considerablemente el tiempo aceptado."
    },

    no_disponible: {
      porcentaje: 0,
      motivo:
        "No fue posible calcular la compatibilidad geográfica."
    }
  };

  const resultado =
    valores[estado] ||
    valores.no_disponible;

  return {
    disponible: true,

    puntos:
      Number(
        ((resultado.porcentaje / 100) * 15)
          .toFixed(1)
      ),

    maximo: 15,
    porcentaje:
      resultado.porcentaje,

    motivos:
      estado !== "no_disponible"
        ? [resultado.motivo]
        : [],

    alertas:
      estado === "no_recomendado" ||
      estado === "no_disponible"
        ? [resultado.motivo]
        : []
  };
}

function obtenerValorRespuestaPersonalizada(
  respuestas = {},
  preguntaId = ""
) {
  const respuesta =
    respuestas?.[preguntaId];

  if (
    respuesta &&
    typeof respuesta === "object"
  ) {
    return String(
      respuesta.respuesta || ""
    ).trim();
  }

  return String(
    respuesta || ""
  ).trim();
}

function evaluarComponentePreguntas({
  preguntas = [],
  respuestas = {}
} = {}) {
  if (
    !Array.isArray(preguntas) ||
    !preguntas.length
  ) {
    return {
      disponible: false,
      puntos: 0,
      maximo: 15,
      porcentaje: null,
      motivos: [],
      alertas: []
    };
  }

  const obligatorias =
    preguntas.filter(
      (pregunta) =>
        pregunta.obligatoria !== false
    );

  const baseEvaluacion =
    obligatorias.length
      ? obligatorias
      : preguntas;

  const respondidas =
    baseEvaluacion.filter(
      (pregunta) =>
        obtenerValorRespuestaPersonalizada(
          respuestas,
          pregunta.id
        )
    );

  const porcentaje =
    baseEvaluacion.length
      ? (respondidas.length /
          baseEvaluacion.length) *
        100
      : 100;

  const puntos =
    Number(
      ((porcentaje / 100) * 15)
        .toFixed(1)
    );

  return {
    disponible: true,
    puntos,
    maximo: 15,
    porcentaje:
      Math.round(porcentaje),

    motivos:
      respondidas.length
        ? [
            `${respondidas.length} de ${baseEvaluacion.length} preguntas consideradas fueron respondidas.`
          ]
        : [],

    alertas:
      respondidas.length <
      baseEvaluacion.length
        ? [
            "Existen preguntas de la vacante sin respuesta."
          ]
        : []
  };
}

function obtenerNivelCompatibilidad(
  puntuacion = 0
) {
  const valor =
    limitarPuntuacion(puntuacion);

  if (valor >= 85) {
    return {
      nivel: "muy_recomendado",
      etiqueta: "Muy recomendado"
    };
  }

  if (valor >= 70) {
    return {
      nivel: "recomendado",
      etiqueta: "Recomendado"
    };
  }

  if (valor >= 55) {
    return {
      nivel: "revisar",
      etiqueta: "Revisar"
    };
  }

  return {
    nivel: "baja_compatibilidad",
    etiqueta: "Baja compatibilidad"
  };
}

function calcularCompatibilidadCandidato({
  vacante = {},
  configuracion = {},
  analisisIA = {},
  cvDisponible = false,
  experiencia = "",
  habilidades = "",
  disponibilidad = "",
  respuestasPersonalizadas = {},
  compatibilidadTraslado = {}
} = {}) {
  const componentes = {
    cv: evaluarComponenteCv({
      analisisIA,
      vacante,
      cvDisponible
    }),

    experiencia:
      evaluarComponenteExperiencia({
        experiencia,
        habilidades,
        analisisIA,
        vacante,
        requerida:
          configuracion
            .solicitarExperiencia
      }),

    disponibilidad:
      evaluarComponenteDisponibilidad({
        disponibilidad,
        requerida:
          configuracion
            .solicitarDisponibilidad
      }),

    geografia:
      evaluarComponenteGeografico({
        compatibilidadTraslado,
        solicitado:
          configuracion
            .solicitarCodigoPostal
      }),

    preguntas:
      evaluarComponentePreguntas({
        preguntas:
          vacante
            .preguntasPersonalizadas ||
          [],

        respuestas:
          respuestasPersonalizadas
      })
  };

  const disponibles =
    Object.values(componentes)
      .filter(
        (componente) =>
          componente.disponible
      );

  const puntosObtenidos =
    disponibles.reduce(
      (total, componente) =>
        total + componente.puntos,
      0
    );

  const puntosDisponibles =
    disponibles.reduce(
      (total, componente) =>
        total + componente.maximo,
      0
    );

  /*
   * La puntuación se normaliza para no
   * castigar una vacante que no solicita CV,
   * geolocalización o preguntas adicionales.
   */
  const puntuacion =
    puntosDisponibles > 0
      ? Math.round(
          (puntosObtenidos /
            puntosDisponibles) *
          100
        )
      : 0;

  const nivel =
    obtenerNivelCompatibilidad(
      puntuacion
    );

  const motivos =
    disponibles.flatMap(
      (componente) =>
        componente.motivos || []
    );

  const alertas =
    disponibles.flatMap(
      (componente) =>
        componente.alertas || []
    );

  return {
    puntuacion:
      limitarPuntuacion(puntuacion),

    nivel:
      nivel.nivel,

    etiqueta:
      nivel.etiqueta,

    desglose: {
      cv:
        componentes.cv.puntos,

      experiencia:
        componentes.experiencia.puntos,

      disponibilidad:
        componentes.disponibilidad.puntos,

      geografia:
        componentes.geografia.puntos,

      preguntas:
        componentes.preguntas.puntos
    },

    detalleComponentes:
      componentes,

    puntosObtenidos:
      Number(
        puntosObtenidos.toFixed(1)
      ),

    puntosDisponibles,

    motivos:
      [...new Set(motivos)].slice(0, 8),

    alertas:
      [...new Set(alertas)].slice(0, 8),

    versionMotor: "1.0"
  };
}

function enriquecerVacanteConSucursal(vacante = {}) {
  const sucursales = leerSucursales();
  const sucursalId = resolverSucursalId(vacante);
  const sucursal = sucursales.find((item) => item.id === sucursalId);

  const query = construirConsultaDireccion({
    direccion: vacante.direccion || sucursal?.direccion || "",
    sucursal: vacante.sucursal || sucursal?.sucursal || "",
    ciudad: vacante.ciudad || sucursal?.ciudad || "",
    estado: vacante.estado || sucursal?.estado || "",
    pais: vacante.pais || sucursal?.pais || ""
  });

  return {
    ...vacante,
    branchId: sucursalId,
    sucursalId,
    numeroTienda: vacante.numeroTienda || sucursal?.numeroTienda || "",
    direccion: vacante.direccion || sucursal?.direccion || "",
    googleMapsUrl: vacante.googleMapsUrl || sucursal?.googleMapsUrl || crearMapsUrl(query),
    appleMapsUrl: vacante.appleMapsUrl || sucursal?.appleMapsUrl || crearAppleMapsUrl(query),
    lat: limpiarNumero(vacante.lat ?? sucursal?.lat ?? null),
    lng: limpiarNumero(vacante.lng ?? sucursal?.lng ?? null)
  };
}

const ubicaciones = {
  Mexico: {
    Chihuahua: [
      "Ciudad Juarez",
      "Chihuahua"
    ],
    "Baja California": [
      "Mexicali"
    ],
    Jalisco: [
      "Guadalajara"
    ]
  },
  "Estados Unidos": {
    Texas: [
      "El Paso"
    ]
  }
};

const coordenadasBaseCiudad = {
  "ciudad juarez": { lat: 31.6904, lng: -106.4245 },
  "juarez": { lat: 31.6904, lng: -106.4245 },
  "chihuahua": { lat: 28.6320, lng: -106.0691 },
  "mexicali": { lat: 32.6245, lng: -115.4523 },
  "guadalajara": { lat: 20.6597, lng: -103.3496 },
  "el paso": { lat: 31.7619, lng: -106.4850 }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const name = file.originalname.toLowerCase();
  const isPdf = file.mimetype === "application/pdf" || name.endsWith(".pdf");
  const isImage = file.mimetype.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
  const isCvField = file.fieldname === "cvFile";
  const isOptionalDocField = ["ineFile", "curpFile", "domicilioFile"].includes(file.fieldname);

  if (isCvField && !isPdf) return cb(new Error("El CV debe ser un archivo PDF."));
  if (isOptionalDocField && !(isPdf || isImage)) return cb(new Error("Los documentos opcionales deben ser PDF o imagen."));
  if (!isCvField && !isOptionalDocField) return cb(new Error("Tipo de archivo no permitido."));

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
/* =========================================================
   COMMUNICATION CENTER
========================================================= */

/* =========================
   PLANTILLAS
========================= */

const templatesRepository =
  crearTemplatesRepository({
    db,

    archivoJson:
      plantillasComunicacionFile,

    collectionName:
      PLANTILLAS_COMUNICACION_COLLECTION
  });

const templatesService =
  crearTemplatesService({
    repository:
      templatesRepository
  });

const templatesController =
  crearTemplatesController({
    service:
      templatesService
  });

/* =========================
   HISTORIAL
========================= */

const communicationsRepository =
  crearCommunicationsRepository({
    db,

    archivoJson:
      comunicacionesFile,

    collectionName:
      COMUNICACIONES_COLLECTION
  });

/* =========================
   PROVEEDOR DE CORREO
========================= */

const emailProvider =
  crearEmailProvider({
    modo:
      process.env.EMAIL_MODE ||
      "simulacion",

    remitenteNombre:
      process.env.EMAIL_FROM_NAME ||
      "GA Hospitality Reclutamiento",

    remitenteCorreo:
      process.env.EMAIL_FROM_ADDRESS ||
      "reclutamiento@gahospitality.com",

    replyTo:
      process.env.EMAIL_REPLY_TO ||
      "",

    smtpHost:
      process.env.SMTP_HOST ||
      "",

    smtpPort:
      Number(
        process.env.SMTP_PORT ||
        587
      ),

    smtpSecure:
      String(
        process.env.SMTP_SECURE ||
        "false"
      ).toLowerCase() ===
      "true",

    smtpUser:
      process.env.SMTP_USER ||
      "",

    smtpPass:
      process.env.SMTP_PASS ||
      "",

    guardarContenidoEnLog:
      process.env.NODE_ENV ===
      "development"
  });

/* =========================
   MOTOR CENTRAL
========================= */

const communicationEngine =
  crearCommunicationEngine({
    templatesService,

    communicationsRepository,

    emailProvider,

    /*
     * El EmailProvider ya controla si
     * trabaja en simulación o en envío real.
     */
    modoSimulacion:
      false,

    logger:
      console
  });

  /* =========================
   COLA DE COMUNICACIONES
========================= */

const communicationQueueRepository =
  crearCommunicationQueueRepository({
    db,

    archivoJson:
      communicationQueueFile,

    collectionName:
      COMMUNICATION_QUEUE_COLLECTION
  });

const communicationQueue =
  crearCommunicationQueue({
    repository:
      communicationQueueRepository,

    communicationEngine,

    demoraBaseMs:
      Number(
        process.env
          .COMMUNICATION_QUEUE_RETRY_BASE_MS ||
        60000
      ),

    demoraMaximaMs:
      Number(
        process.env
          .COMMUNICATION_QUEUE_RETRY_MAX_MS ||
        3600000
      ),

    logger:
      console
  });

const communicationWorker =
  crearCommunicationWorker({
    queue:
      communicationQueue,

    intervaloMs:
      Number(
        process.env
          .COMMUNICATION_WORKER_INTERVAL_MS ||
        5000
      ),

    tamanoLote:
      Number(
        process.env
          .COMMUNICATION_WORKER_BATCH_SIZE ||
        10
      ),

    procesarAlIniciar:
      String(
        process.env
          .COMMUNICATION_WORKER_PROCESS_ON_START ??
        "true"
      ).toLowerCase() !==
      "false",

    logger:
      console
  });

const communicationQueueService =
  crearCommunicationQueueService({
    queue:
      communicationQueue,

    repository:
      communicationQueueRepository,

    worker:
      communicationWorker
  });

const communicationQueueController =
  crearCommunicationQueueController({
    service:
      communicationQueueService
  });

/* =========================
   SERVICIO Y CONTROLLER
========================= */

const communicationsService =
  crearCommunicationsService({
    repository:
      communicationsRepository,

    engine:
      communicationEngine
  });

const communicationsController =
  crearCommunicationsController({
    service:
      communicationsService
  });

/* =========================
   ROUTER ÚNICO
========================= */

const comunicacionesRouter =
  crearComunicacionesRouter({
    templatesController,

    communicationsController,

    communicationQueueController,

    verifyAdmin:
      db
        ? verifyAdmin
        : null
  });

app.use(
  "/api",
  comunicacionesRouter
);

/* =========================================================
   INICIALIZACIÓN DEL COMMUNICATION CENTER
========================================================= */

async function inicializarCommunicationCenter() {
  try {
    const resultado =
      await instalarPlantillasIniciales({
        service:
          templatesService,

        usuario:
          "sistema"
      });

    if (
      resultado.instalado
    ) {
      console.log(
        `Communication Center: ${resultado.totalCreadas || 0} plantilla(s) inicial(es) creada(s).`
      );
    } else {
      console.log(
        `Communication Center: plantillas existentes (${resultado.totalExistentes || 0}).`
      );
    }

    return resultado;
  } catch (error) {
    console.error(
      "Error inicializando Communication Center:",
      error
    );

    throw error;
  }
}
app.use(
  express.static(projectRoot)
);
app.use("/uploads", express.static(uploadsDir));

async function extraerTextoPdf(filePath) {
  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(pdfBuffer);
    return parsed?.text || "";
  } catch (error) {
    console.error("Error extrayendo texto del PDF:", error);
    return "";
  }
}
function limpiarJsonRespuesta(texto = "") {
  return String(texto).replace(/```json/gi, "").replace(/```/g, "").trim();
}

async function sugerirVacantesBasicas(texto = "", tipoVacante = "") {
  const lower = normalizarTexto(texto);
  const vacantes = await leerVacantes();

  const gruposPerfil = {
    sistemas: [
      "sistemas",
      "soporte",
      "tecnico",
      "tecnologias de la informacion",
      "ti",
      "it",
      "redes",
      "cisco",
      "python",
      "react",
      "angular",
      "mysql",
      "mongodb",
      "docker",
      "git",
      "software",
      "programacion",
      "desarrollo",
      "cybersecurity",
      "seguridad informatica"
    ],
    monitoreo: [
      "monitoreo",
      "monitorista",
      "camaras",
      "cctv",
      "reportes",
      "atencion al detalle",
      "seguridad",
      "vigilancia"
    ],
    rh: [
      "rh",
      "recursos humanos",
      "reclutamiento",
      "entrevistas",
      "seleccion",
      "capital humano",
      "seguimiento",
      "personal"
    ],
    contabilidad: [
      "contabilidad",
      "contable",
      "facturacion",
      "excel",
      "administracion",
      "cuentas",
      "pagos",
      "bancos"
    ],
    servicio: [
      "cliente",
      "servicio",
      "ventas",
      "atencion al cliente",
      "hostess",
      "mesero",
      "mostrador",
      "caja",
      "cajero"
    ],
    cocina: [
      "cocina",
      "alimentos",
      "preparacion",
      "chef",
      "linea",
      "parrilla",
      "sushi",
      "sushero",
      "limpieza",
      "restaurante"
    ],
    proyectos: [
      "proyectos",
      "construccion",
      "planeacion",
      "seguimiento",
      "coordinacion",
      "obra"
    ],
    logistica: [
      "logistica",
      "importacion",
      "exportacion",
      "aduana",
      "pedimentos",
      "almacen",
      "inventario",
      "transporte",
      "documental"
    ]
  };

  function scoreVacante(vacante) {
    let score = 0;
    const motivos = [];

    const fullVacante = normalizarTexto(`
      ${vacante.titulo || ""}
      ${vacante.area || ""}
      ${vacante.grupo || ""}
      ${(vacante.requisitos || []).join(" ")}
      ${vacante.sucursal || ""}
      ${vacante.tipoVacante || ""}
    `);

    if (tipoVacante && vacante.tipoVacante === tipoVacante) {
      score += 15;
      motivos.push("Coincide con el tipo de vacante recomendado.");
    }

    if (lower.includes(normalizarTexto(vacante.titulo || ""))) {
      score += 35;
      motivos.push(`Coincide con el puesto ${vacante.titulo}.`);
    }

    if (lower.includes(normalizarTexto(vacante.area || ""))) {
      score += 25;
      motivos.push(`Coincide con el área ${vacante.area}.`);
    }

    Object.entries(gruposPerfil).forEach(([perfil, keywords]) => {
      let hits = 0;

      keywords.forEach((keyword) => {
        const k = normalizarTexto(keyword);

        if (lower.includes(k) && fullVacante.includes(k)) {
          hits += 1;
        }
      });

      if (hits > 0) {
        score += hits * 18;
        motivos.push(`Coincidencia con perfil de ${perfil}.`);
      }
    });

    if (
      lower.includes("sistemas") ||
      lower.includes("soporte") ||
      lower.includes("software") ||
      lower.includes("programacion") ||
      lower.includes("redes") ||
      lower.includes("cisco")
    ) {
      if (
        fullVacante.includes("sistemas") ||
        fullVacante.includes("soporte") ||
        fullVacante.includes("monitoreo")
      ) {
        score += 45;
        motivos.push("Tu perfil técnico puede adaptarse a Sistemas o Monitoreo.");
      }
    }

    if (
      lower.includes("sin experiencia") ||
      lower.includes("primer empleo") ||
      lower.includes("estudiante")
    ) {
      if (
        fullVacante.includes("cajero") ||
        fullVacante.includes("servicio") ||
        fullVacante.includes("auxiliar") ||
        fullVacante.includes("mostrador")
      ) {
        score += 20;
        motivos.push("Puede ser una opción accesible para iniciar experiencia laboral.");
      }
    }

    return {
      ...vacante,
      score,
      motivoCoincidencia: [...new Set(motivos)].slice(0, 3)
    };
  }

  return vacantes
    .map(enriquecerVacanteConSucursal)
    .filter((v) => !tipoVacante || v.tipoVacante === tipoVacante || tipoVacante === "mixta")
    .map(scoreVacante)
    .filter((v) => v.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

async function analizarCvConIA(cvTexto = "") {
  const textoLimpio = String(cvTexto || "").trim();

  console.log("=== DIAGNÓSTICO ANÁLISIS CV ===");
  console.log("Caracteres extraídos:", textoLimpio.length);
  console.log(
    "OpenAI configurado:",
    Boolean(process.env.OPENAI_API_KEY)
  );

  if (!textoLimpio) {
    throw new Error(
      "No fue posible extraer texto del PDF. El documento podría ser una imagen escaneada."
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "La variable OPENAI_API_KEY no está configurada en el servidor."
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `
Eres un especialista senior en reclutamiento y selección para GA Hospitality.

Analiza el CV recibido y responde únicamente JSON válido, sin markdown.

No inventes estudios, experiencia ni habilidades que no aparezcan en el CV.
`
        },
        {
          role: "user",
          content: `
Analiza el siguiente CV y devuelve exactamente esta estructura:

{
  "resumen": "Resumen profesional detallado de entre 80 y 160 palabras",
  "habilidadesDetectadas": ["habilidad 1", "habilidad 2"],
  "perfilRecomendado": "operativa, administrativa o mixta",
  "tipoPerfil": "sistemas, soporte, cocina, servicio, ventas, RH, contabilidad, monitoreo, proyectos, administrativo, operativo u otro",
  "nivelExperiencia": "sin experiencia, junior, intermedio, senior o no determinado",
  "puestosSugeridos": ["puesto 1", "puesto 2"],
  "palabrasClave": ["palabra 1", "palabra 2"],
  "areasCompatibles": ["área 1", "área 2"]
}

CV:
${textoLimpio.slice(0, 12000)}
`
        }
      ]
    });

    const content =
      completion.choices?.[0]?.message?.content || "{}";

    const parsed = JSON.parse(
      limpiarJsonRespuesta(content)
    );

    return {
      resumen:
        parsed.resumen ||
        "No fue posible generar el resumen del CV.",

      habilidadesDetectadas:
        Array.isArray(parsed.habilidadesDetectadas)
          ? parsed.habilidadesDetectadas
          : [],

      perfilRecomendado:
        parsed.perfilRecomendado || "",

      tipoPerfil:
        parsed.tipoPerfil || "",

      nivelExperiencia:
        parsed.nivelExperiencia || "",

      puestosSugeridos:
        Array.isArray(parsed.puestosSugeridos)
          ? parsed.puestosSugeridos
          : [],

      palabrasClave:
        Array.isArray(parsed.palabrasClave)
          ? parsed.palabrasClave
          : [],

      areasCompatibles:
        Array.isArray(parsed.areasCompatibles)
          ? parsed.areasCompatibles
          : []
    };
  } catch (error) {
    console.error("Error IA CV:", error);

    throw new Error(
      error.message ||
      "El servicio de inteligencia artificial no pudo analizar el CV."
    );
  }
}
app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        projectRoot,
        "index.html"
      )
    );
  }
);

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/vacantes.html", (req, res) => {
  res.sendFile(path.join(__dirname, "vacantes.html"));
});

app.get("/login-admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "login-admin.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.get("/vacantes-admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "vacantes-admin.html"));
});
/* =========================
   API DISPONIBILIDADES
   DE ENTREVISTA
========================= */

app.get(
  "/api/disponibilidades-entrevista",
  verifyAdmin,
  async (req, res) => {
    try {
      const disponibilidades =
        await leerDisponibilidadesEntrevista();

      res.json(disponibilidades);
    } catch (error) {
      console.error(
        "Error cargando disponibilidades:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible cargar las disponibilidades."
      });
    }
  }
);

app.get(
  "/api/disponibilidades-entrevista/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const disponibilidad =
        await obtenerDisponibilidadEntrevista(
          req.params.id
        );

      if (!disponibilidad) {
        return res.status(404).json({
          error:
            "Disponibilidad no encontrada."
        });
      }

      res.json(disponibilidad);
    } catch (error) {
      console.error(
        "Error consultando disponibilidad:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible consultar la disponibilidad."
      });
    }
  }
);

app.post(
  "/api/disponibilidades-entrevista",
  verifyAdmin,
  async (req, res) => {
    try {
      const validacion =
        validarDisponibilidadEntrevista(
          req.body
        );

      if (!validacion.ok) {
        return res.status(400).json({
          error: validacion.error
        });
      }

      const fechaActual =
        new Date().toISOString();

      const disponibilidad = {
        id:
          `disp-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        ...validacion.data,

        creadoPor:
          req.adminUser?.email || "",

        fechaCreacion:
          fechaActual,

        fechaActualizacion:
          fechaActual
      };

      await guardarDisponibilidadEntrevista(
        disponibilidad
      );

      res.status(201).json({
        ok: true,

        message:
          "Disponibilidad creada correctamente.",

        disponibilidad
      });
    } catch (error) {
      console.error(
        "Error creando disponibilidad:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible crear la disponibilidad."
      });
    }
  }
);

app.put(
  "/api/disponibilidades-entrevista/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const existente =
        await obtenerDisponibilidadEntrevista(
          id
        );

      if (!existente) {
        return res.status(404).json({
          error:
            "Disponibilidad no encontrada."
        });
      }

      const validacion =
        validarDisponibilidadEntrevista({
          ...existente,
          ...req.body
        });

      if (!validacion.ok) {
        return res.status(400).json({
          error: validacion.error
        });
      }

      const cambios = {
        ...validacion.data,

        fechaActualizacion:
          new Date().toISOString(),

        actualizadoPor:
          req.adminUser?.email || ""
      };

      const actualizado =
        await actualizarDisponibilidadEntrevista(
          id,
          cambios
        );

      if (!actualizado) {
        return res.status(404).json({
          error:
            "Disponibilidad no encontrada."
        });
      }

      res.json({
        ok: true,

        message:
          "Disponibilidad actualizada correctamente.",

        disponibilidad: {
          ...existente,
          ...cambios,
          id
        }
      });
    } catch (error) {
      console.error(
        "Error actualizando disponibilidad:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible actualizar la disponibilidad."
      });
    }
  }
);

app.patch(
  "/api/disponibilidades-entrevista/:id/estado",
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        typeof req.body.activo !==
        "boolean"
      ) {
        return res.status(400).json({
          error:
            "El estado activo debe ser verdadero o falso."
        });
      }

      const actualizado =
        await actualizarDisponibilidadEntrevista(
          id,
          {
            activo: req.body.activo,

            fechaActualizacion:
              new Date().toISOString(),

            actualizadoPor:
              req.adminUser?.email || ""
          }
        );

      if (!actualizado) {
        return res.status(404).json({
          error:
            "Disponibilidad no encontrada."
        });
      }

      res.json({
        ok: true,

        message:
          req.body.activo
            ? "Disponibilidad activada correctamente."
            : "Disponibilidad desactivada correctamente."
      });
    } catch (error) {
      console.error(
        "Error cambiando estado de disponibilidad:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible cambiar el estado."
      });
    }
  }
);

app.delete(
  "/api/disponibilidades-entrevista/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const eliminado =
        await eliminarDisponibilidadEntrevista(
          req.params.id
        );

      if (!eliminado) {
        return res.status(404).json({
          error:
            "Disponibilidad no encontrada."
        });
      }

      res.json({
        ok: true,

        message:
          "Disponibilidad eliminada correctamente."
      });
    } catch (error) {
      console.error(
        "Error eliminando disponibilidad:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible eliminar la disponibilidad."
      });
    }
  }
);

app.get("/entrevistas.html", (req, res) => {
  res.sendFile(path.join(__dirname, "entrevistas.html"));
});

app.get("/health", async (req, res) => {
  try {
    let firestoreTest = false;

    if (db) {
      await db.collection("_health").limit(1).get();
      firestoreTest = true;
    }

    res.json({
      ok: true,
      firestore: Boolean(db),
      firestoreTest,
      projectId: admin.apps.length ? admin.app().options.projectId : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      firestore: Boolean(db),
      projectId: admin.apps.length ? admin.app().options.projectId : null,
      code: error.code,
      error: error.message
    });
  }
});


app.get("/api/ubicaciones", (req, res) => {
  res.json(ubicaciones);
});

app.get("/api/sucursales", async (req, res) => {
  try {
    const vacantes = (await leerVacantes()).map(enriquecerVacanteConSucursal);
    const bySucursal = new Map();

    vacantes.forEach((vacante) => {
      const id = vacante.sucursalId || vacante.branchId || resolverSucursalId(vacante);

      if (!id) return;

      if (!bySucursal.has(id)) {
        bySucursal.set(id, {
          id,
          nombre: vacante.sucursal || `${vacante.grupo || "Sucursal"} ${vacante.ciudad || ""}`.trim(),
          marca: vacante.grupo || "GA Hospitality",
          pais: vacante.pais || "",
          estado: vacante.estado || "",
          ciudad: vacante.ciudad || "",
          sucursal: vacante.sucursal || "",
          numeroTienda: vacante.numeroTienda || "",
          direccion: vacante.direccion || "",
          googleMapsUrl: vacante.googleMapsUrl || "",
          appleMapsUrl: vacante.appleMapsUrl || "",
          lat: vacante.lat ?? null,
          lng: vacante.lng ?? null,
          vacantesActivas: 0
        });
      }

      const sucursal = bySucursal.get(id);
      sucursal.vacantesActivas += 1;

      if (!sucursal.numeroTienda && vacante.numeroTienda) sucursal.numeroTienda = vacante.numeroTienda;
      if (!sucursal.direccion && vacante.direccion) sucursal.direccion = vacante.direccion;
      if (!sucursal.googleMapsUrl && vacante.googleMapsUrl) sucursal.googleMapsUrl = vacante.googleMapsUrl;
      if (!sucursal.appleMapsUrl && vacante.appleMapsUrl) sucursal.appleMapsUrl = vacante.appleMapsUrl;

      if ((sucursal.lat === null || sucursal.lat === undefined) && vacante.lat !== null && vacante.lat !== undefined) {
        sucursal.lat = vacante.lat;
      }

      if ((sucursal.lng === null || sucursal.lng === undefined) && vacante.lng !== null && vacante.lng !== undefined) {
        sucursal.lng = vacante.lng;
      }
    });

    res.json(Array.from(bySucursal.values()));
  } catch (error) {
    console.error("Error cargando sucursales:", error);
    res.status(500).json({ error: "No fue posible cargar sucursales." });
  }
});

app.get("/api/vacantes", async (req, res) => {
  try {
    const tipoVacante = req.query.tipoVacante ? normalizarTexto(req.query.tipoVacante) : "";
    const pais = req.query.pais ? normalizarTexto(resolverPais(req.query.pais)) : "";
    const estado = req.query.estado ? normalizarTexto(resolverEstado(req.query.estado)) : "";
    const ciudad = req.query.ciudad ? normalizarTexto(resolverCiudad(req.query.ciudad)) : "";
    const grupo = req.query.grupo ? normalizarTexto(resolverGrupo(req.query.grupo)) : "";

    const vacantes = await leerVacantes();

    const resultado = vacantes.filter((v) => {
      const vTipo = normalizarTexto(v.tipoVacante);
      const vPais = normalizarTexto(v.pais);
      const vEstado = normalizarTexto(v.estado);
      const vCiudad = normalizarTexto(v.ciudad);
      const vGrupo = normalizarTexto(v.grupo);

      return (
        (!tipoVacante || vTipo === tipoVacante) &&
        (!pais || vPais.includes(pais) || pais.includes(vPais)) &&
        (!estado || vEstado.includes(estado) || estado.includes(vEstado)) &&
        (!ciudad || vCiudad.includes(ciudad) || ciudad.includes(vCiudad)) &&
        (!grupo || vGrupo.includes(grupo) || grupo.includes(vGrupo))
      );
    });

    res.json(resultado.map(enriquecerVacanteConSucursal));
  } catch (error) {
    console.error("Error cargando vacantes:", error);
    res.status(500).json({ error: "No fue posible cargar vacantes." });
  }
});

app.get("/api/vacantes/qr/:slug", async (req, res) => {
  try {
    const slug =
      String(req.params.slug || "")
        .trim()
        .toLowerCase();

    if (!slug) {
      return res.status(400).json({
        error: "Slug QR no enviado."
      });
    }

    const vacantes = (
      await leerVacantes()
    ).map(
      enriquecerVacanteConSucursal
    );

    const vacante =
      vacantes.find((item) => {
        const itemSlug =
          String(
            item?.qr?.slug || ""
          )
            .trim()
            .toLowerCase();

        return itemSlug === slug;
      });

    if (!vacante) {
      return res.status(404).json({
        error:
          "La vacante asociada a este QR no existe."
      });
    }

    if (
      vacante.activa === false ||
      vacante?.qr?.activo === false
    ) {
      return res.status(410).json({
        error:
          "Esta vacante ya no está disponible.",
        vacante: {
          id: vacante.id,
          titulo: vacante.titulo,
          grupo: vacante.grupo,
          sucursal: vacante.sucursal,
          ciudad: vacante.ciudad
        }
      });
    }

    res.json({
      ok: true,
      vacante
    });
  } catch (error) {
    console.error(
      "Error cargando vacante por QR:",
      error
    );

    res.status(500).json({
      error:
        "No fue posible consultar la vacante del QR."
    });
  }
});

app.get("/api/postulacion/:id", async (req, res) => {
  try {
    const postulaciones = await leerPostulaciones();
    const item = postulaciones.find((p) => p.id === req.params.id);

    if (!item) {
      return res.status(404).json({ error: "Postulacion no encontrada." });
    }

    res.json(item);
  } catch (error) {
    console.error("Error consultando postulacion:", error);
    res.status(500).json({ error: "No fue posible consultar la postulacion." });
  }
});

app.post(
  "/api/analizar-cv",
  upload.fields([
    { name: "cvFile", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const cvFile = req.files?.cvFile?.[0];

      if (!cvFile) {
        return res.status(400).json({
          error: "Debes adjuntar tu CV en PDF."
        });
      }

      const cvTexto = await extraerTextoPdf(
        cvFile.path
      );

      console.log(
        "Archivo recibido:",
        cvFile.originalname
      );

      console.log(
        "Tamaño del archivo:",
        cvFile.size
      );

      console.log(
        "Caracteres extraídos:",
        cvTexto.length
      );

      if (!cvTexto.trim()) {
        return res.status(422).json({
          error:
            "No se pudo leer el contenido del PDF. El documento puede estar escaneado como imagen."
        });
      }

      const analisisIA =
        await analizarCvConIA(cvTexto);

      // Continúa aquí el resto de tu ruta actual.

    let tipoSugerido = "";

const perfilNormalizado = normalizarTexto(analisisIA.perfilRecomendado);
const tipoPerfilNormalizado = normalizarTexto(analisisIA.tipoPerfil);

if (perfilNormalizado.includes("administr")) {
  tipoSugerido = "administrativa";
}

if (perfilNormalizado.includes("operativ")) {
  tipoSugerido = "operativa";
}

if (
  tipoPerfilNormalizado.includes("sistemas") ||
  tipoPerfilNormalizado.includes("soporte") ||
  tipoPerfilNormalizado.includes("monitoreo") ||
  tipoPerfilNormalizado.includes("contabilidad") ||
  tipoPerfilNormalizado.includes("rh") ||
  tipoPerfilNormalizado.includes("proyectos")
) {
  tipoSugerido = "administrativa";
}


  const sugerenciasIA = await sugerirVacantesBasicas(
  `
  ${cvTexto}
  ${analisisIA.resumen}
  ${analisisIA.habilidadesDetectadas.join(" ")}
  ${analisisIA.palabrasClave.join(" ")}
  ${analisisIA.areasCompatibles.join(" ")}
  ${analisisIA.puestosSugeridos.join(" ")}
  ${analisisIA.tipoPerfil}
  ${analisisIA.nivelExperiencia}
  `,
  tipoSugerido
);     

    res.json({
      ok: true,
      message: "CV analizado correctamente.",
      analisis: {
        cvNombre: cvFile.originalname,
        cvRuta: `/uploads/${cvFile.filename}`,
        resumenIA: analisisIA.resumen,
        habilidadesDetectadas: analisisIA.habilidadesDetectadas,
        perfilRecomendado: analisisIA.perfilRecomendado,
        tipoPerfil: analisisIA.tipoPerfil,
        nivelExperiencia: analisisIA.nivelExperiencia,
        puestosSugeridos: analisisIA.puestosSugeridos,
        palabrasClave: analisisIA.palabrasClave,
        areasCompatibles: analisisIA.areasCompatibles,
        sugerenciasIA
      }
    });
  } catch (error) {
    console.error("Error analizando CV:", error);
    res.status(500).json({ error: "No fue posible analizar el CV." });
  }
});

app.post(
  "/api/postulacion",
  upload.fields([
    { name: "cvFile", maxCount: 1 },
    { name: "ineFile", maxCount: 1 },
    { name: "curpFile", maxCount: 1 },
    { name: "domicilioFile", maxCount: 1 }
  ]),
  async (req, res) => {
    
    try {
      const vacantes = (await leerVacantes()).map(
        enriquecerVacanteConSucursal
      );

      const {
        nombre,
        correo,
        telefono,
        edad,
        disponibilidad,
        vacanteSeleccionada,
        escolaridad,
        experiencia,
        habilidades,

        codigoPostal,
        medioTransporte,
        vehiculoPropio,
        tiempoMaximoTraslado,

        politicaCv,
        configuracionPostulacion,
        respuestasPersonalizadas
      } = req.body;

      if (!nombre || !vacanteSeleccionada) {
        return res.status(400).json({
          error:
            "Faltan el nombre o la vacante seleccionada."
        });
      }

      const vacante = vacantes.find(
        (item) =>
          item.id === vacanteSeleccionada
      );

      if (!vacante) {
        return res.status(400).json({
          error:
            "La vacante seleccionada no existe."
        });
      }

      const configuracion =
        normalizarConfiguracionPostulacion(
          vacante.configuracionPostulacion || {}
        );

      if (
        configuracion.solicitarCorreo &&
        !String(correo || "").trim()
      ) {
        return res.status(400).json({
          error:
            "El correo electrónico es obligatorio para esta vacante."
        });
      }

      if (
        configuracion.solicitarTelefono &&
        !String(telefono || "").trim()
      ) {
        return res.status(400).json({
          error:
            "El teléfono es obligatorio para esta vacante."
        });
      }

      if (
        configuracion.solicitarCodigoPostal &&
        !String(codigoPostal || "").trim()
      ) {
        return res.status(400).json({
          error:
            "El código postal es obligatorio para esta vacante."
        });
      }

      if (
        configuracion.solicitarCodigoPostal &&
        !validarCodigoPostal(codigoPostal)
      ) {
        return res.status(400).json({
          error:
            "El código postal debe contener exactamente 5 números."
        });
      }

      if (
        configuracion.solicitarTransporte &&
        !String(medioTransporte || "").trim()
      ) {
        return res.status(400).json({
          error:
            "El medio de transporte es obligatorio para esta vacante."
        });
      }

      if (
        configuracion.solicitarVehiculoPropio &&
        !String(vehiculoPropio || "").trim()
      ) {
        return res.status(400).json({
          error:
            "Indica si cuentas con vehículo propio."
        });
      }

      if (
        configuracion.solicitarTiempoTraslado &&
        !String(
          tiempoMaximoTraslado || ""
        ).trim()
      ) {
        return res.status(400).json({
          error:
            "El tiempo máximo de traslado es obligatorio para esta vacante."
        });
      }
      if (
        configuracion.solicitarExperiencia &&
        !String(experiencia || "").trim()
      ) {
        return res.status(400).json({
          error:
            "La experiencia es obligatoria para esta vacante."
        });
      }

      if (
        configuracion.solicitarEscolaridad &&
        !String(escolaridad || "").trim()
      ) {
        return res.status(400).json({
          error:
            "La escolaridad es obligatoria para esta vacante."
        });
      }

      if (
        configuracion.solicitarDisponibilidad &&
        !String(disponibilidad || "").trim()
      ) {
        return res.status(400).json({
          error:
            "La disponibilidad es obligatoria para esta vacante."
        });
      }

      const cvFile =
        req.files?.cvFile?.[0] || null;

      if (
        configuracion.cv === "obligatorio" &&
        !cvFile
      ) {
        return res.status(400).json({
          error:
            "Debes adjuntar tu CV para esta vacante."
        });
      }

      let respuestasPersonalizadasParseadas = {};

      try {
        respuestasPersonalizadasParseadas =
          respuestasPersonalizadas
            ? JSON.parse(
                respuestasPersonalizadas
              )
            : {};
      } catch (error) {
        return res.status(400).json({
          error:
            "Las respuestas personalizadas no tienen un formato válido."
        });
      }

      const preguntasConfiguradas =
        Array.isArray(
          vacante.preguntasPersonalizadas
        )
          ? vacante.preguntasPersonalizadas
          : [];

      for (const pregunta of preguntasConfiguradas) {
        if (pregunta.obligatoria === false) {
          continue;
        }

        const respuesta =
          respuestasPersonalizadasParseadas[
            pregunta.id
          ];

        const valorRespuesta =
          typeof respuesta === "object"
            ? respuesta?.respuesta
            : respuesta;

        if (
          !String(
            valorRespuesta || ""
          ).trim()
        ) {
          return res.status(400).json({
            error:
              `Falta responder la pregunta obligatoria: ${pregunta.texto}`
          });
        }
      }

      let analisisIA = {
        resumen: "",
        habilidadesDetectadas: [],
        perfilRecomendado: ""
      };

      let cvNombre = "";
      let cvRuta = "";

      if (cvFile) {
        cvNombre = cvFile.originalname;
        cvRuta =
          `/uploads/${cvFile.filename}`;

        const cvTexto =
          await extraerTextoPdf(
            cvFile.path
          );

        if (cvTexto.trim()) {
          analisisIA =
            await analizarCvConIA(
              cvTexto
            );
        }
      }

      /* =========================
   CÁLCULO DE UBICACIÓN
========================= */

  let ubicacionCandidato = {
    lat: null,
    lng: null,
    aproximada: true,
    encontrada: false
  };

  let distanciaSucursalKm = null;
  let clasificacionDistancia =
    "no_disponible";

  let etiquetaDistancia =
    "Distancia no disponible";

  let tiempoTrasladoEstimadoMin = null;

  let compatibilidadTraslado = {
  estado: "no_disponible",
  etiqueta: "Compatibilidad no disponible",
  diferenciaMinutos: null,
  compatible: null
};

  if (
    configuracion.solicitarCodigoPostal &&
    validarCodigoPostal(codigoPostal)
  ) {
    const ubicacion =
      await geocodificarCodigoPostal({
        codigoPostal,
        ciudad: vacante.ciudad,
        estado: vacante.estado,
        pais: vacante.pais
      });

    ubicacionCandidato = {
      lat: ubicacion.lat,
      lng: ubicacion.lng,
      aproximada: true,
      encontrada:
        Boolean(ubicacion.encontrado)
    };

    let sucursalLat =
      limpiarNumero(vacante.lat);

    let sucursalLng =
      limpiarNumero(vacante.lng);

    /*
    * Si la vacante no tiene coordenadas,
    * se intenta geocodificar su dirección.
    */
    if (
      sucursalLat === null ||
      sucursalLng === null
    ) {
      const coordenadasSucursal =
        await resolverCoordenadas({
          direccion:
            vacante.direccion,

          sucursal:
            vacante.sucursal,

          ciudad:
            vacante.ciudad,

          estado:
            vacante.estado,

          pais:
            vacante.pais,

          lat:
            vacante.lat,

          lng:
            vacante.lng
        });

      sucursalLat =
        limpiarNumero(
          coordenadasSucursal.lat
        );

      sucursalLng =
        limpiarNumero(
          coordenadasSucursal.lng
        );
    }

    distanciaSucursalKm =
      calcularDistanciaKm(
        ubicacionCandidato.lat,
        ubicacionCandidato.lng,
        sucursalLat,
        sucursalLng
      );

    clasificacionDistancia =
      clasificarDistancia(
        distanciaSucursalKm
      );

    etiquetaDistancia =
      obtenerEtiquetaDistancia(
        clasificacionDistancia
      );

    tiempoTrasladoEstimadoMin =
      estimarTiempoTraslado({
        distanciaKm:
          distanciaSucursalKm,

        medioTransporte
      });
    compatibilidadTraslado =
      evaluarCompatibilidadTraslado({
        tiempoEstimadoMin:
          tiempoTrasladoEstimadoMin,

        tiempoMaximoTraslado
      });
      }

      const resultadoCompatibilidad =
  calcularCompatibilidadCandidato({
    vacante,
    configuracion,
    analisisIA,

    cvDisponible:
      Boolean(cvFile),

    experiencia:
      String(
        experiencia || ""
      ).trim(),

    habilidades:
      String(
        habilidades || ""
      ).trim(),

    disponibilidad:
      String(
        disponibilidad || ""
      ).trim(),

    respuestasPersonalizadas:
      respuestasPersonalizadasParseadas,

    compatibilidadTraslado
  });

      const postulacion = {
        id: Date.now().toString(),

        nombre:
          String(nombre).trim(),

        correo:
          String(correo || "").trim(),

        telefono:
          String(telefono || "").trim(),

        edad:
          String(edad || "").trim(),

        
        codigoPostal:
          String(
            codigoPostal || ""
          ).trim(),

        medioTransporte:
          String(
            medioTransporte || ""
          ).trim(),

        vehiculoPropio:
          String(
            vehiculoPropio || ""
          ).trim(),

        tiempoMaximoTraslado:
          String(
            tiempoMaximoTraslado || ""
          ).trim(),

        ubicacionCandidato,

        ubicacionSucursal: {
          lat:
            limpiarNumero(
              vacante.lat
            ),

          lng:
            limpiarNumero(
              vacante.lng
            )
        },

        distanciaSucursalKm,

        clasificacionDistancia,

        etiquetaDistancia,

        tiempoTrasladoEstimadoMin,
        compatibilidadTraslado,

        compatibilidadGeografica:
          compatibilidadTraslado.estado,

        etiquetaCompatibilidadGeografica:
          compatibilidadTraslado.etiqueta,

        puntuacionCompatibilidad:
          resultadoCompatibilidad.puntuacion,

        nivelCompatibilidad:
          resultadoCompatibilidad.nivel,

        etiquetaNivelCompatibilidad:
          resultadoCompatibilidad.etiqueta,

        desgloseCompatibilidad:
          resultadoCompatibilidad.desglose,

        detalleCompatibilidad:
          resultadoCompatibilidad.detalleComponentes,

        motivosCompatibilidad:
          resultadoCompatibilidad.motivos,

        alertasCompatibilidad:
          resultadoCompatibilidad.alertas,

        versionMotorCompatibilidad:
          resultadoCompatibilidad.versionMotor,

        pais:
          vacante.pais,

        estado:
          vacante.estado,

        ciudad:
          vacante.ciudad,

        sucursal:
          vacante.sucursal,

        sucursalId:
          vacante.sucursalId,

        direccion:
          vacante.direccion,

        googleMapsUrl:
          vacante.googleMapsUrl,

        appleMapsUrl:
          vacante.appleMapsUrl,

        disponibilidad:
          String(
            disponibilidad || ""
          ).trim(),

        tipoVacante:
          vacante.tipoVacante,

        grupoSeleccionado:
          vacante.grupo,

        vacanteId:
          vacante.id,

        vacanteTitulo:
          vacante.titulo,

        puestoInteres:
          vacante.titulo,

        escolaridad:
          String(
            escolaridad || ""
          ).trim(),

        experiencia:
          String(
            experiencia || ""
          ).trim(),

        habilidades:
          String(
            habilidades || ""
          ).trim(),

        politicaCv:
          configuracion.cv,

        configuracionPostulacion:
          configuracion,

        respuestasPersonalizadas:
          respuestasPersonalizadasParseadas,

        cvNombre,
        cvRuta,

        resumenIA:
          analisisIA.resumen || "",

        habilidadesDetectadas:
          Array.isArray(
            analisisIA.habilidadesDetectadas
          )
            ? analisisIA.habilidadesDetectadas
            : [],

        perfilRecomendado:
          analisisIA.perfilRecomendado ||
          "",

        estadoSolicitud:
          "pendiente",

        fechaRegistro:
          new Date().toISOString()
      };

    await guardarPostulacion(
  postulacion
);

/* =========================================================
   ENCOLAR COMUNICACIÓN: POSTULACIÓN RECIBIDA
========================================================= */

try {
  if (
    postulacion.correo
  ) {
    await communicationQueue.agregar({
      payload: {
        tipo:
          "postulacion_recibida",

        canal:
          "email",

        destinatario: {
          nombre:
            postulacion.nombre,

          correo:
            postulacion.correo,

          telefono:
            postulacion.telefono
        },

        candidatoId:
          postulacion.id,

        postulacionId:
          postulacion.id,

        variables: {
          nombre:
            postulacion.nombre,

          empresa:
            "Great American Hospitality",

          folio:
            postulacion.id,

          vacante:
            postulacion.vacanteTitulo,

          sucursal:
            postulacion.sucursal,

          fecha:
            new Date(
              postulacion.fechaRegistro
            ).toLocaleDateString(
              "es-MX",
              {
                day:
                  "numeric",

                month:
                  "long",

                year:
                  "numeric"
              }
            ),

          estatusUrl:
            `${
              process.env.PUBLIC_BASE_URL ||
              "http://localhost:3000"
            }/?folio=${
              encodeURIComponent(
                postulacion.id
              )
            }`
        }
      },

      prioridad:
        1,

      maxIntentos:
        3,

      creadoPor:
        "sistema_postulacion",

      metadata: {
        evento:
          "postulacion_recibida",

        vacanteId:
          postulacion.vacanteId,

        sucursalId:
          postulacion.sucursalId
      }
    });

    console.log(
      `[CommunicationQueue] Postulación ${postulacion.id} agregada a la cola.`
    );
  } else {
    console.warn(
      `[CommunicationQueue] Postulación ${postulacion.id} sin correo; no se encoló email de confirmación.`
    );
  }
} catch (
  communicationError
) {
  console.error(
    `[CommunicationQueue] No fue posible encolar la confirmación de la postulación ${postulacion.id}:`,
    communicationError
  );
}

/* =========================================================
   RESPUESTA AL CANDIDATO
========================================================= */

res.status(201).json({
  ok: true,

  message:
    "Postulación recibida correctamente.",

  postulacion
});

      
    } catch (error) {
      console.error(
        "Error guardando postulación:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "No fue posible guardar la postulación."
      });
    }
  }
);

app.post("/chat", async (req, res) => {
  try {
    const { messages, candidateProfile } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "El campo messages debe ser un arreglo." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        reply: {
          role: "assistant",
          content: "Puedo ayudarte con vacantes y postulaciones. El chat IA aun no tiene API key configurada."
        }
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `Eres un asistente profesional de reclutamiento de GA Hospitality. Responde en espanol, claro y breve.\nPerfil candidato:\n${JSON.stringify(candidateProfile || {}, null, 2)}`
        },
        ...messages.slice(-10)
      ]
    });

    res.json({
      reply: completion.choices?.[0]?.message || {
        role: "assistant",
        content: "No pude generar respuesta."
      }
    });
  } catch (error) {
    console.error("Error chat:", error);
    res.status(500).json({ error: "Error generando respuesta." });
  }
});

app.get("/api/admin/me", verifyAdmin, (req, res) => {
  res.json({
    ok: true,
    email: req.adminUser.email
  });
});

app.get(
  "/api/postulaciones",
  verifyAdmin,
  async (req, res) => {
    try {
      const requestedLimit = Number(req.query.limit);
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 100)
        : 50;

      const postulaciones =
        await leerPostulaciones(limit);

      res.json(postulaciones);
    } catch (error) {
      console.error(
        "Error cargando postulaciones:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "No fue posible cargar postulaciones."
      });
    }
  }
);

app.patch("/api/postulaciones/:id/estado", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ["pendiente", "aprobado", "rechazado", "entrevista_agendada"];


    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no valido." });
    }

    const postulaciones = await leerPostulaciones();
    const postulacion = postulaciones.find((p) => p.id === id);

    if (!postulacion) {
      return res.status(404).json({ error: "Postulacion no encontrada." });
    }

    const data = {
      estadoSolicitud: estado,
      fechaActualizacion: new Date().toISOString()
    };

    await actualizarPostulacion(id, data);

    res.json({
      ok: true,
      message: "Estado actualizado correctamente.",
      postulacion: {
        ...postulacion,
        ...data
      }
    });
  } catch (error) {
    console.error("Error actualizando postulacion:", error);
    res.status(500).json({ error: "No fue posible actualizar la postulacion." });
  }
});

/* =========================================================
   ELIMINAR POSTULACIÓN
========================================================= */

app.delete(
  "/api/postulaciones/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (!id) {
        return res.status(400).json({
          error:
            "El identificador de la postulación es obligatorio."
        });
      }

      const eliminada =
        await eliminarPostulacion(
          id
        );

      if (!eliminada) {
        return res.status(404).json({
          error:
            "Postulación no encontrada."
        });
      }

      res.json({
        ok: true,
        message:
          "Postulación eliminada correctamente.",
        id
      });
    } catch (error) {
      console.error(
        "Error eliminando postulación:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "No fue posible eliminar la postulación."
      });
    }
  }
);
app.get(
  "/api/entrevistas/horarios-disponibles",
  async (req, res) => {
    try {
      const {
        fecha,
        vacanteId = "",
        region = "",
        ciudad = "",
        sucursal = "",
        sucursalId = "",
        tipo = ""
      } = req.query;

      if (!fecha) {
        return res.status(400).json({
          error:
            "Debes indicar una fecha."
        });
      }

      const date =
        obtenerFechaLocal(fecha);

      if (!date) {
        return res.status(400).json({
          error:
            "La fecha indicada no es válida."
        });
      }

      const contexto =
        await resolverContextoAgenda({
          vacanteId,
          region,
          ciudad,
          sucursal,
          sucursalId
        });

      if (!contexto.region) {
        return res.status(400).json({
          error:
            "No fue posible identificar la región de la vacante."
        });
      }

      const [
        disponibilidades,
        entrevistas
      ] = await Promise.all([
        leerDisponibilidadesEntrevista(),
        leerEntrevistas(500)
      ]);

      const seleccion =
        seleccionarDisponibilidadesIdeales({
          disponibilidades,

          region:
            contexto.region,

          sucursalId:
            contexto.sucursalId,

          sucursal:
            contexto.sucursal,

          vacanteId:
            contexto.vacanteId,

          tipo
        });

      if (
        !seleccion
          .disponibilidades
          .length
      ) {
        return res.json({
          ok: true,
          fecha,

          contexto: {
            region:
              contexto.region,

            sucursalId:
              contexto.sucursalId,

            sucursal:
              contexto.sucursal,

            vacanteId:
              contexto.vacanteId
          },

          asignacion: {
            nivel: 0,
            criterio:
              "sin_disponibilidad"
          },

          total: 0,
          horarios: []
        });
      }

      const horariosGenerados =
        seleccion
          .disponibilidades
          .flatMap(
            (disponibilidad) =>
              generarEspaciosDisponibilidad({
                disponibilidad,
                fecha
              })
          );

      const horariosLibres =
        filtrarHorariosOcupados(
          horariosGenerados,
          entrevistas
        ).sort((a, b) =>
          a.hora.localeCompare(
            b.hora
          )
        );

      res.json({
        ok: true,
        fecha,

        contexto: {
          region:
            contexto.region,

          sucursalId:
            contexto.sucursalId,

          sucursal:
            contexto.sucursal,

          vacanteId:
            contexto.vacanteId
        },

        asignacion: {
          nivel:
            seleccion.nivel,

          criterio:
            seleccion.criterio,

          configuracionesEncontradas:
            seleccion
              .disponibilidades
              .length,

          disponibilidadesIds:
            seleccion
              .disponibilidades
              .map(
                (item) => item.id
              )
        },

        total:
          horariosLibres.length,

        horarios:
          horariosLibres
      });
    } catch (error) {
      console.error(
        "Error consultando horarios disponibles:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible consultar los horarios disponibles."
      });
    }
  }
);

app.post(
  "/api/entrevistas/reservar",
  async (req, res) => {
    try {
      const {
        disponibilidadId,
        candidatoId,
        candidatoNombre,
        correo = "",
        telefono = "",
        puesto = "",
        marca = "",
        vacanteId = "",
        sucursal = "",
        sucursalId = "",
        ciudad = "",
        fecha,
        hora,
        comentarios = ""
      } = req.body;

      if (
        !disponibilidadId ||
        !candidatoId ||
        !candidatoNombre ||
        !fecha ||
        !hora
      ) {
        return res.status(400).json({
          error:
            "Faltan datos obligatorios para reservar la entrevista."
        });
      }

      const disponibilidad =
        await obtenerDisponibilidadEntrevista(
          disponibilidadId
        );

      if (
        !disponibilidad ||
        disponibilidad.activo === false
      ) {
        return res.status(400).json({
          error:
            "La disponibilidad seleccionada ya no está activa."
        });
      }

      const horariosPermitidos =
        generarEspaciosDisponibilidad({
          disponibilidad,
          fecha
        });

      const horarioSeleccionado =
        horariosPermitidos.find(
          (item) =>
            item.hora === hora
        );

      if (!horarioSeleccionado) {
        return res.status(400).json({
          error:
            "El horario seleccionado no pertenece a la disponibilidad configurada."
        });
      }

      const entrevistas =
        await leerEntrevistas(500);

      const ocupado =
        entrevistas.some(
          (entrevista) =>
            horarioCoincideConEntrevista(
              horarioSeleccionado,
              entrevista
            )
        );

      if (ocupado) {
        return res.status(409).json({
          error:
            "Ese horario acaba de ser reservado. Selecciona otro horario."
        });
      }

      const fechaActual =
        new Date().toISOString();

      const entrevista = {
        id:
          `ent-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        disponibilidadId,

        candidatoId,
        candidatoNombre,
        correo,
        telefono,
        puesto,
        marca,

        vacanteId:
          vacanteId ||
          disponibilidad.vacanteId ||
          "",

        sucursal:
          sucursal ||
          disponibilidad.sucursal ||
          "",

        sucursalId:
          sucursalId ||
          disponibilidad.sucursalId ||
          "",

        ciudad,

        fecha,
        hora,

        horaFin:
          horarioSeleccionado.horaFin,

        duracionMinutos:
          horarioSeleccionado
            .duracionMinutos,

        reclutador:
          disponibilidad.reclutador,

        reclutadorId:
          disponibilidad.reclutadorId ||
          "",

        tipo:
          disponibilidad.tipo,

        comentarios,

        estado:
          "pendiente_confirmacion",

        origen:
          "chatbot",

        fechaCreacion:
          fechaActual,

        fechaActualizacion:
          fechaActual
      };

      const resultadoReserva =
      await guardarReservaEntrevistaAtomica({
        entrevista,
        horarioSeleccionado
      });

    const entrevistaGuardada =
      resultadoReserva.entrevista;

      await actualizarPostulacion(
        candidatoId,
        {
          estadoSolicitud:
            "entrevista_agendada",

          entrevistaId:
            entrevistaGuardada.id,

          fechaEntrevista:
            fecha,

          horaEntrevista:
            hora,

          reclutadorEntrevista:
            entrevistaGuardada.reclutador,

          tipoEntrevista:
            entrevistaGuardada.tipo,

          fechaActualizacion:
            fechaActual
        }
      );

      res.status(201).json({
        ok: true,

        message:
          "Entrevista reservada correctamente.",

        entrevista:
          entrevistaGuardada
      });
      } catch (error) {
  console.error(
    "Error reservando entrevista:",
    error
  );

  if (
    error.code ===
    "HORARIO_OCUPADO"
  ) {
    return res.status(409).json({
      error:
        "Ese horario acaba de ser reservado. Selecciona otro horario."
    });
  }

  res.status(500).json({
    error:
      "No fue posible reservar la entrevista."
  });
}
   
  }
);

app.get("/api/entrevistas", verifyAdmin, async (req, res) => {
  try {
    const entrevistas = await leerEntrevistas();
    res.json(entrevistas);
  } catch (error) {
    console.error("Error cargando entrevistas:", error);
    res.status(500).json({ error: "No fue posible cargar entrevistas." });
  }
});

app.post("/api/entrevistas", verifyAdmin, async (req, res) => {
  try {
    const {
  candidatoId,
  candidatoNombre,
  correo,
  telefono,
  puesto,
  marca,
  sucursal,
  ciudad,
  fecha,
  hora,
  reclutador,
  tipo,
  comentarios
} = req.body;

    if (!candidatoId || !candidatoNombre || !fecha || !hora) {
      return res.status(400).json({ error: "Faltan datos obligatorios para agendar la entrevista." });
    }

    const entrevista = {
  id: `ent-${Date.now()}`,
  candidatoId,
  candidatoNombre,
  correo: correo || "",
  telefono: telefono || "",
  puesto: puesto || "",
  marca: marca || "GA Hospitality",
  sucursal: sucursal || "",
  ciudad: ciudad || "",
  fecha,
  hora,
  reclutador: reclutador || "",
  tipo: tipo || "presencial",
  comentarios: comentarios || "",
  estado: "agendada",
  creadaPor: req.adminUser.email,
  creadaEn: new Date().toISOString(),
  fechaActualizacion: new Date().toISOString()
};

    await guardarEntrevista(entrevista);

    await actualizarPostulacion(candidatoId, {
      estadoSolicitud: "entrevista_agendada",
      entrevistaId: entrevista.id,
      fechaEntrevista: fecha,
      horaEntrevista: hora,
      fechaActualizacion: new Date().toISOString()
    });

    res.json({
      ok: true,
      message: "Entrevista agendada correctamente.",
      entrevista
    });
  } catch (error) {
    console.error("Error creando entrevista:", error);
    res.status(500).json({ error: "No fue posible agendar la entrevista." });
  }
});

app.patch(
  "/api/entrevistas/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const entrevistas =
        await leerEntrevistas(500);

      const entrevistaActual =
        entrevistas.find(
          (item) =>
            item.id === id
        );

      if (!entrevistaActual) {
        return res.status(404).json({
          error:
            "Entrevista no encontrada."
        });
      }

      const nuevaFecha =
        String(
          req.body.fecha ||
          entrevistaActual.fecha ||
          ""
        ).trim();

      const nuevaHora =
        String(
          req.body.hora ||
          entrevistaActual.hora ||
          ""
        ).trim();

      const cambioDeHorario =
        nuevaFecha !==
          entrevistaActual.fecha ||
        nuevaHora !==
          entrevistaActual.hora;

      let entrevistaActualizada;

      if (cambioDeHorario) {
        entrevistaActualizada =
          await reagendarEntrevistaAtomica({
            entrevistaActual,

            nuevaFecha,
            nuevaHora,

            cambiosAdicionales: {
              ...req.body,

              estado:
                "reagendada"
            },

            actualizadoPor:
              req.adminUser?.email ||
              ""
          });
      } else {
        const data = {
          ...req.body,

          fechaActualizacion:
            new Date().toISOString(),

          actualizadoPor:
            req.adminUser?.email ||
            ""
        };

        await actualizarEntrevista(
          id,
          data
        );

        entrevistaActualizada = {
          ...entrevistaActual,
          ...data,
          id
        };
      }

      if (
        entrevistaActual.candidatoId
      ) {
        await actualizarPostulacion(
          entrevistaActual.candidatoId,
          {
            estadoSolicitud:
              "entrevista_agendada",

            estadoEntrevista:
              entrevistaActualizada
                .estado,

            entrevistaId:
              entrevistaActualizada.id,

            fechaEntrevista:
              entrevistaActualizada
                .fecha,

            horaEntrevista:
              entrevistaActualizada
                .hora,

            reclutadorEntrevista:
              entrevistaActualizada
                .reclutador ||
              "",

            tipoEntrevista:
              entrevistaActualizada
                .tipo ||
              "",

            fechaActualizacion:
              new Date().toISOString()
          }
        );
      }

      res.json({
        ok: true,

        message:
          cambioDeHorario
            ? "Entrevista reprogramada correctamente."
            : "Entrevista actualizada correctamente.",

        entrevista:
          entrevistaActualizada
      });
    } catch (error) {
      console.error(
        "Error actualizando entrevista:",
        error
      );

      if (
        error.code ===
        "HORARIO_OCUPADO"
      ) {
        return res.status(409).json({
          error:
            "Ese horario ya fue reservado. Selecciona otro horario."
        });
      }

      if (
        error.code ===
        "HORARIO_INVALIDO"
      ) {
        return res.status(400).json({
          error:
            "El horario seleccionado no pertenece a la disponibilidad del reclutador."
        });
      }

      if (
        error.code ===
        "SIN_DISPONIBILIDAD" ||
        error.code ===
        "DISPONIBILIDAD_INACTIVA"
      ) {
        return res.status(400).json({
          error:
            error.message
        });
      }

      if (
        error.code ===
        "ENTREVISTA_NO_ENCONTRADA"
      ) {
        return res.status(404).json({
          error:
            "Entrevista no encontrada."
        });
      }

      res.status(500).json({
        error:
          "No fue posible actualizar la entrevista."
      });
    }
  }
);
app.patch(
  "/api/entrevistas/:id/estado",
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;


      const estadosValidos = [
      // Estados nuevos
      "agendada",
      "confirmada",
      "reagendada",
      "realizada",
      "cancelada",

      // Compatibilidad con versiones anteriores
      "pendiente",
      "aprobado",
      "rechazado",
      "entrevista_agendada",
      "entrevista_realizada"
    ];


      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          error: "Estado de entrevista no válido."
        });
      }

      const entrevistas = await leerEntrevistas();
      const entrevista = entrevistas.find(
        (item) => item.id === id
      );

      if (!entrevista) {
        return res.status(404).json({
          error: "Entrevista no encontrada."
        });
      }

     const fechaActual =
  new Date().toISOString();

      const data = {
        estado,

        fechaActualizacion:
          fechaActual
      };

      if (
          estado === "cancelada" &&
          entrevista.estado !== "cancelada"
        ) {
          await liberarBloqueoEntrevista({
            entrevista,

            motivo:
              "entrevista_cancelada"
          });

          data.bloqueoLiberado = true;

          data.fechaLiberacionHorario =
            fechaActual;
        }

      await actualizarEntrevista(
        id,
        data
);

      if (entrevista.candidatoId) {
        let estadoSolicitud = "entrevista_agendada";

        if (estado === "realizada") {
          estadoSolicitud = "entrevista_realizada";
        }

        if (estado === "cancelada") {
          estadoSolicitud = "aprobado";
        }

        await actualizarPostulacion(
          entrevista.candidatoId,
          {
            estadoSolicitud,
            estadoEntrevista: estado,
            fechaActualizacion: new Date().toISOString()
          }
        );
      }

      res.json({
        ok: true,
        message:
          "Estado de entrevista actualizado correctamente.",
        entrevista: {
          ...entrevista,
          ...data,
          id
        }
      });
    } catch (error) {
      console.error(
        "Error actualizando estado de entrevista:",
        error
      );

      res.status(500).json({
        error:
          "No fue posible actualizar el estado de la entrevista."
      });
    }
  }
);

app.delete(
  "/api/entrevistas/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: "El ID de la entrevista es obligatorio."
        });
      }

      const entrevistas = await leerEntrevistas();

      const entrevista = entrevistas.find(
        (item) => item.id === id
      );

      if (!entrevista) {
        return res.status(404).json({
          error: "Entrevista no encontrada."
        });
      }

      await liberarBloqueoEntrevista({
        entrevista,

        motivo:
          "entrevista_eliminada"
      });
      const eliminada = await eliminarEntrevista(id);

      if (!eliminada) {
        return res.status(404).json({
          error: "Entrevista no encontrada."
        });
      }

      if (entrevista.candidatoId) {
        await actualizarPostulacion(
          entrevista.candidatoId,
          {
            estadoSolicitud:
              "aprobado",

            estadoEntrevista:
              "eliminada",

            entrevistaId:
              "",

            fechaEntrevista:
              "",

            horaEntrevista:
              "",

            reclutadorEntrevista:
              "",

            tipoEntrevista:
              "",

            fechaActualizacion:
              new Date().toISOString()
          }
        );
      }

      res.json({
        ok: true,
        message: "Entrevista eliminada correctamente.",
        entrevistaEliminada: {
          id,
          candidatoNombre:
            entrevista.candidatoNombre || ""
        }
      });
    } catch (error) {
      console.error(
        "Error eliminando entrevista:",
        error
      );

      res.status(500).json({
        error: "No fue posible eliminar la entrevista."
      });
    }
  }
);

async function buscarDatosSucursalExistente(data = {}) {
  const vacantes = await leerVacantes();

  const sucursalId = data.sucursalId || data.branchId || resolverSucursalId(data);

  let existente = vacantes.find((v) => {
    return (
      v.sucursalId === sucursalId ||
      v.branchId === sucursalId
    );
  });

  if (!existente) {
    existente = vacantes.find((v) => {
      return (
        normalizarTexto(v.grupo) === normalizarTexto(data.grupo) &&
        normalizarTexto(v.sucursal) === normalizarTexto(data.sucursal) &&
        normalizarTexto(v.ciudad) === normalizarTexto(data.ciudad)
      );
    });
  }

  if (!existente) return null;

  return {
    sucursalId: existente.sucursalId || existente.branchId || sucursalId,
    branchId: existente.branchId || existente.sucursalId || sucursalId,
    numeroTienda: existente.numeroTienda || "",
    direccion: existente.direccion || "",
    googleMapsUrl: existente.googleMapsUrl || "",
    appleMapsUrl: existente.appleMapsUrl || "",
    lat: existente.lat ?? null,
    lng: existente.lng ?? null
  };
}

/* =========================
   CONFIGURACIÓN DINÁMICA
   DE POSTULACIÓN
========================= */

const POLITICAS_CV_VALIDAS = [
  "obligatorio",
  "opcional",
  "no_solicitar"
];

const TIPOS_PREGUNTA_VALIDOS = [
  "texto_corto",
  "texto_largo",
  "numero",
  "si_no",
  "seleccion"
];

function normalizarConfiguracionPostulacion(configuracion = {}) {
  const cv = POLITICAS_CV_VALIDAS.includes(configuracion.cv)
    ? configuracion.cv
    : "opcional";

  return {
    cv,

    solicitarTelefono:
      configuracion.solicitarTelefono !== false,

    solicitarCorreo:
      configuracion.solicitarCorreo !== false,

    solicitarExperiencia:
      configuracion.solicitarExperiencia !== false,

    solicitarEscolaridad:
      Boolean(configuracion.solicitarEscolaridad),

    solicitarDisponibilidad:
      configuracion.solicitarDisponibilidad !== false,

    solicitarCodigoPostal:
      configuracion.solicitarCodigoPostal !== false,
    solicitarTransporte:
  configuracion.solicitarTransporte !== false,

    solicitarVehiculoPropio:
      Boolean(
        configuracion.solicitarVehiculoPropio
      ),

    solicitarTiempoTraslado:
      configuracion.solicitarTiempoTraslado !== false,
  };
}

function normalizarPreguntasPersonalizadas(preguntas = []) {
  if (!Array.isArray(preguntas)) {
    return [];
  }

  return preguntas.map((pregunta, index) => {
    const tipo = TIPOS_PREGUNTA_VALIDOS.includes(
      pregunta?.tipo
    )
      ? pregunta.tipo
      : "texto_corto";

    let opciones = [];

    if (tipo === "si_no") {
      opciones = ["Sí", "No"];
    }

    if (tipo === "seleccion") {
      opciones = Array.isArray(pregunta?.opciones)
        ? pregunta.opciones
            .map((opcion) =>
              String(opcion || "").trim()
            )
            .filter(Boolean)
        : [];
    }

    return {
      id:
        String(
          pregunta?.id ||
          `pregunta-${Date.now()}-${index + 1}`
        ).trim(),

      texto:
        String(pregunta?.texto || "").trim(),

      tipo,

      obligatoria:
        pregunta?.obligatoria !== false,

      opciones,

      orden: index + 1
    };
  });
}

function validarPreguntasServidor(preguntas = []) {
  for (const pregunta of preguntas) {
    if (!pregunta.texto) {
      return {
        ok: false,
        error:
          `La pregunta ${pregunta.orden} no tiene texto.`
      };
    }

    if (
      pregunta.tipo === "seleccion" &&
      pregunta.opciones.length < 2
    ) {
      return {
        ok: false,
        error:
          `La pregunta ${pregunta.orden} debe tener al menos dos opciones.`
      };
    }
  }

  return { ok: true };
}

app.post(
  "/api/vacantes",
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        tipoVacante,
        grupo,
        titulo,
        area,
        pais,
        estado,
        ciudad,
        sucursal,
        sucursalId,
        numeroTienda,
        direccion,
        googleMapsUrl,
        appleMapsUrl,
        lat,
        lng,
        requisitos,
        configuracionPostulacion,
        preguntasPersonalizadas
      } = req.body || {};

      if (
        !tipoVacante ||
        !grupo ||
        !titulo ||
        !area ||
        !pais ||
        !estado ||
        !ciudad ||
        !sucursal
      ) {
        return res.status(400).json({
          error:
            "Faltan campos obligatorios de la vacante."
        });
      }

      const requisitosNormalizados =
        Array.isArray(requisitos)
          ? requisitos
              .map((item) =>
                String(item || "").trim()
              )
              .filter(Boolean)
          : String(requisitos || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

      if (!requisitosNormalizados.length) {
        return res.status(400).json({
          error:
            "La vacante debe incluir al menos un requisito."
        });
      }

      const configuracionNormalizada =
        normalizarConfiguracionPostulacion(
          configuracionPostulacion
        );

      const preguntasNormalizadas =
        normalizarPreguntasPersonalizadas(
          preguntasPersonalizadas
        );

      const validacionPreguntas =
        validarPreguntasServidor(
          preguntasNormalizadas
        );

      if (!validacionPreguntas.ok) {
        return res.status(400).json({
          error: validacionPreguntas.error
        });
      }

      const finalSucursalId =
        sucursalId ||
        slugify(
          `${grupo} ${sucursal} ${ciudad} ${estado} ${pais}`
        );

      const datosSucursalExistente =
        await buscarDatosSucursalExistente({
          sucursalId: finalSucursalId,
          branchId: finalSucursalId,
          grupo,
          sucursal,
          ciudad,
          estado,
          pais
        });

      const direccionFinal =
        direccion ||
        datosSucursalExistente?.direccion ||
        "";

      const numeroTiendaFinal =
        numeroTienda ||
        datosSucursalExistente?.numeroTienda ||
        "";

      const googleMapsUrlFinal =
        googleMapsUrl ||
        datosSucursalExistente?.googleMapsUrl ||
        "";

      const appleMapsUrlFinal =
        appleMapsUrl ||
        datosSucursalExistente?.appleMapsUrl ||
        "";

      const latEntrada =
        lat ??
        datosSucursalExistente?.lat ??
        null;

      const lngEntrada =
        lng ??
        datosSucursalExistente?.lng ??
        null;

      const query =
        construirConsultaDireccion({
          direccion: direccionFinal,
          sucursal,
          ciudad,
          estado,
          pais
        });

      const coords =
        await resolverCoordenadas({
          direccion: direccionFinal,
          sucursal,
          ciudad,
          estado,
          pais,
          lat: latEntrada,
          lng: lngEntrada
        });

      const fechaActual = new Date().toISOString();

      const vacanteId = `vac-${Date.now()}`;

      const qrSlugBase = slugify(
        `${titulo}-${sucursal}-${ciudad}`
      );

      const qrSlug =
        `${qrSlugBase}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const nuevaVacante = {
        id: vacanteId,

        sucursalId: finalSucursalId,
        branchId: finalSucursalId,

        tipoVacante:
          String(tipoVacante).trim(),

        grupo:
          String(grupo).trim(),

        titulo:
          String(titulo).trim(),

        area:
          String(area).trim(),

        pais:
          String(pais).trim(),

        estado:
          String(estado).trim(),

        ciudad:
          String(ciudad).trim(),

        sucursal:
          String(sucursal).trim(),

        numeroTienda:
          String(numeroTiendaFinal || "").trim(),

        direccion:
          String(direccionFinal || "").trim(),

        googleMapsUrl:
          googleMapsUrlFinal ||
          crearMapsUrl(query),

        appleMapsUrl:
          appleMapsUrlFinal ||
          crearAppleMapsUrl(query),

        lat: coords.lat,
        lng: coords.lng,

        requisitos:
          requisitosNormalizados,

        configuracionPostulacion:
          configuracionNormalizada,

        preguntasPersonalizadas:
          preguntasNormalizadas,

        
        qr: {
          slug: qrSlug,

          activo: true,

          creadoEn:
            fechaActual,

          visitas: 0,

          postulaciones: 0
        },

        activa: true,

        fechaCreacion:
          fechaActual,

        fechaActualizacion:
          fechaActual,

        creadaPor:
          req.adminUser?.email || ""
      };

      await guardarVacante(nuevaVacante);

      res.status(201).json({
        ok: true,
        message:
          "Vacante creada correctamente.",
        vacante: nuevaVacante
      });
    } catch (error) {
      console.error(
        "Error creando vacante:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "No fue posible crear la vacante."
      });
    }
  }
);

app.put(
  "/api/vacantes/:id",
  verifyAdmin,
  async (req, res) => {
    try {
      const vacantes =
        await leerVacantes();

      const { id } = req.params;

      const actual = vacantes.find(
        (vacante) => vacante.id === id
      );

      if (!actual) {
        return res.status(404).json({
          error: "Vacante no encontrada."
        });
      }

      const body = req.body || {};

      const merged = {
        ...actual,
        ...body,
        id
      };

      if (
        !merged.tipoVacante ||
        !merged.grupo ||
        !merged.titulo ||
        !merged.area ||
        !merged.pais ||
        !merged.estado ||
        !merged.ciudad ||
        !merged.sucursal
      ) {
        return res.status(400).json({
          error:
            "Faltan campos obligatorios de la vacante."
        });
      }

      const requisitosNormalizados =
        Array.isArray(merged.requisitos)
          ? merged.requisitos
              .map((item) =>
                String(item || "").trim()
              )
              .filter(Boolean)
          : String(merged.requisitos || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);

      if (!requisitosNormalizados.length) {
        return res.status(400).json({
          error:
            "La vacante debe incluir al menos un requisito."
        });
      }

      const configuracionNormalizada =
        normalizarConfiguracionPostulacion(
          body.configuracionPostulacion ??
          actual.configuracionPostulacion ??
          {}
        );

      const preguntasNormalizadas =
        normalizarPreguntasPersonalizadas(
          body.preguntasPersonalizadas ??
          actual.preguntasPersonalizadas ??
          []
        );

      const validacionPreguntas =
        validarPreguntasServidor(
          preguntasNormalizadas
        );

      if (!validacionPreguntas.ok) {
        return res.status(400).json({
          error: validacionPreguntas.error
        });
      }

      const finalSucursalId =
        body.sucursalId ||
        body.branchId ||
        actual.sucursalId ||
        actual.branchId ||
        resolverSucursalId(merged);

      const query =
        construirConsultaDireccion({
          direccion: merged.direccion,
          sucursal: merged.sucursal,
          ciudad: merged.ciudad,
          estado: merged.estado,
          pais: merged.pais
        });

      const coords =
        await resolverCoordenadas({
          direccion: merged.direccion,
          sucursal: merged.sucursal,
          ciudad: merged.ciudad,
          estado: merged.estado,
          pais: merged.pais,
          lat: merged.lat,
          lng: merged.lng
        });

      const vacanteActualizada = {
        ...merged,

        sucursalId:
          finalSucursalId,

        branchId:
          finalSucursalId,

        tipoVacante:
          String(merged.tipoVacante).trim(),

        grupo:
          String(merged.grupo).trim(),

        titulo:
          String(merged.titulo).trim(),

        area:
          String(merged.area).trim(),

        pais:
          String(merged.pais).trim(),

        estado:
          String(merged.estado).trim(),

        ciudad:
          String(merged.ciudad).trim(),

        sucursal:
          String(merged.sucursal).trim(),

        numeroTienda:
          String(
            merged.numeroTienda || ""
          ).trim(),

        direccion:
          String(
            merged.direccion || ""
          ).trim(),

        googleMapsUrl:
          merged.googleMapsUrl ||
          crearMapsUrl(query),

        appleMapsUrl:
          merged.appleMapsUrl ||
          crearAppleMapsUrl(query),

        lat: coords.lat,
        lng: coords.lng,

        requisitos:
          requisitosNormalizados,

        configuracionPostulacion:
          configuracionNormalizada,

        preguntasPersonalizadas:
          preguntasNormalizadas,

        activa:
          merged.activa !== false,

        fechaActualizacion:
          new Date().toISOString(),

        actualizadaPor:
          req.adminUser?.email || ""
      };

      await actualizarVacante(
        id,
        vacanteActualizada
      );

      res.json({
        ok: true,
        message:
          "Vacante actualizada correctamente.",
        vacante:
          vacanteActualizada
      });
    } catch (error) {
      console.error(
        "Error actualizando vacante:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "No fue posible actualizar la vacante."
      });
    }
  }
);

app.post(
  "/api/vacantes/migrar-qr",
  verifyAdmin,
  async (req, res) => {
    try {
      const vacantes =
        await leerVacantes();

      const actualizadas = [];
      const omitidas = [];

      for (const vacante of vacantes) {
        const slugExistente =
          String(
            vacante?.qr?.slug || ""
          ).trim();

        if (slugExistente) {
          omitidas.push({
            id: vacante.id,
            titulo: vacante.titulo,
            motivo: "ya_tiene_qr"
          });

          continue;
        }

        const fechaActual =
          new Date().toISOString();

        const qrSlugBase =
          slugify(
            `${vacante.titulo || "vacante"}-${vacante.sucursal || "sucursal"}-${vacante.ciudad || "ciudad"}`
          ) || "vacante";

        const qrSlug =
          `${qrSlugBase}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        const qr = {
          slug: qrSlug,
          activo: true,
          creadoEn: fechaActual,
          visitas: 0,
          postulaciones: 0
        };

        await actualizarVacante(
          vacante.id,
          {
            qr,
            fechaActualizacion:
              fechaActual
          }
        );

        actualizadas.push({
          id: vacante.id,
          titulo: vacante.titulo,
          qr
        });
      }

      res.json({
        ok: true,

        message:
          "Migración QR completada correctamente.",

        totalVacantes:
          vacantes.length,

        actualizadas:
          actualizadas.length,

        omitidas:
          omitidas.length,

        vacantesActualizadas:
          actualizadas,

        vacantesOmitidas:
          omitidas
      });
    } catch (error) {
      console.error(
        "Error migrando QR de vacantes:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "No fue posible migrar los QR de las vacantes."
      });
    }
  }
);

app.delete("/api/vacantes/:id", verifyAdmin, async (req, res) => {
  try {
    const vacantes = await leerVacantes();
    const { id } = req.params;
    const eliminada = vacantes.find((v) => v.id === id);

    if (!eliminada) {
      return res.status(404).json({ error: "Vacante no encontrada." });
    }

    await eliminarVacanteFirestore(id);

    res.json({
      ok: true,
      message: "Vacante eliminada correctamente.",
      vacante: eliminada
    });
  } catch (error) {
    console.error("Error eliminando vacante:", error);
    res.status(500).json({ error: "No fue posible eliminar la vacante." });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(400).json({
      error: err.message || "Error procesando la solicitud."
    });
  }

  next();
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

iniciarServidor()
  .catch((error) => {
    console.error(
      "Error iniciando servidor:",
      error
    );

    process.exit(1);
  });