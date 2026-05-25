import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   FIREBASE ADMIN
========================= */
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn("⚠️ Firebase Admin no inicializado. Revisa FIREBASE_SERVICE_ACCOUNT_PATH en Render.");
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function verifyAdmin(req, res, next) {
  try {
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
    console.error("❌ Error verificando admin:", error);
    return res.status(401).json({ error: "Sesión inválida o expirada." });
  }
}

/* =========================
   CARPETAS Y ARCHIVOS
========================= */
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const postulacionesFile = path.join(dataDir, "postulaciones.json");
const vacantesFile = path.join(dataDir, "vacantes.json");

if (!fs.existsSync(postulacionesFile)) {
  fs.writeFileSync(postulacionesFile, "[]", "utf-8");
}

/* =========================
   VACANTES INICIALES
========================= */
const vacantesIniciales = [
  {
    id: "vac-001",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Cajero",
    area: "Operaciones",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Las Misiones",
    requisitos: ["Atención al cliente", "Manejo básico de caja", "Disponibilidad de horario"]
  },
  {
    id: "vac-002",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Despachador",
    area: "Servicio",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Ejército Nacional",
    requisitos: ["Rapidez", "Orden", "Trabajo en equipo"]
  },
  {
    id: "vac-003",
    tipoVacante: "operativa",
    grupo: "Applebee's",
    titulo: "Hostess",
    area: "Recepción",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Tecnológico",
    requisitos: ["Excelente trato al cliente", "Presentación", "Comunicación"]
  },
  {
    id: "vac-004",
    tipoVacante: "operativa",
    grupo: "Great American",
    titulo: "Parrillero",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Central",
    requisitos: ["Manejo de parrilla", "Cocción de carnes", "Trabajo bajo presión"]
  },
  {
    id: "vac-005",
    tipoVacante: "operativa",
    grupo: "Ardeo",
    titulo: "Chef de Línea",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Ardeo Central",
    requisitos: ["Cocina gourmet", "Organización", "Trabajo en equipo"]
  },
  {
    id: "vac-006",
    tipoVacante: "operativa",
    grupo: "Yoko",
    titulo: "Sushero",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Yoko Norte",
    requisitos: ["Preparación de sushi", "Limpieza", "Orden"]
  },
  {
    id: "vac-007",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Cajero",
    area: "Operaciones",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    requisitos: ["Atención al cliente", "Caja", "Disponibilidad"]
  },
  {
    id: "vac-008",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Auxiliar de Cocina",
    area: "Cocina",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    requisitos: ["Preparación de alimentos", "Limpieza", "Trabajo bajo presión"]
  },
  {
    id: "vac-009",
    tipoVacante: "operativa",
    grupo: "Great American",
    titulo: "Mesero",
    area: "Piso",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Sucursal Chihuahua",
    requisitos: ["Servicio al cliente", "Presentación", "Trabajo en equipo"]
  },
  {
    id: "vac-010",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Cajero",
    area: "Mostrador",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Sucursal Guadalajara",
    requisitos: ["Atención al cliente", "Caja", "Disponibilidad"]
  },
  {
    id: "vac-011",
    tipoVacante: "operativa",
    grupo: "Applebee's",
    titulo: "Mesero",
    area: "Piso",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Sucursal Guadalajara",
    requisitos: ["Servicio al cliente", "Trabajo en equipo", "Disponibilidad"]
  },
  {
    id: "vac-012",
    tipoVacante: "operativa",
    grupo: "Wendy's",
    titulo: "Próximamente",
    area: "Operaciones",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Próxima apertura",
    requisitos: ["Vacante próxima a apertura"]
  },
  {
    id: "vac-013",
    tipoVacante: "operativa",
    grupo: "Little Caesars",
    titulo: "Auxiliar de Cocina",
    area: "Cocina",
    pais: "México",
    estado: "Baja California",
    ciudad: "Mexicali",
    sucursal: "Sucursal Mexicali",
    requisitos: ["Preparación de alimentos", "Limpieza", "Trabajo bajo presión"]
  },
  {
    id: "vac-101",
    tipoVacante: "administrativa",
    grupo: "RH",
    titulo: "Auxiliar de Reclutamiento",
    area: "RH",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["Entrevistas", "Seguimiento", "Organización"]
  },
  {
    id: "vac-102",
    tipoVacante: "administrativa",
    grupo: "Contabilidad",
    titulo: "Auxiliar Contable",
    area: "Contabilidad",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Chihuahua",
    sucursal: "Corporativo",
    requisitos: ["Contabilidad básica", "Excel", "Organización"]
  },
  {
    id: "vac-103",
    tipoVacante: "administrativa",
    grupo: "Mercadotecnia",
    titulo: "Diseñador Jr",
    area: "Mercadotecnia",
    pais: "México",
    estado: "Jalisco",
    ciudad: "Guadalajara",
    sucursal: "Corporativo",
    requisitos: ["Diseño", "Creatividad", "Redes sociales"]
  },
  {
    id: "vac-104",
    tipoVacante: "administrativa",
    grupo: "Sistemas",
    titulo: "Auxiliar de Soporte Técnico",
    area: "Sistemas",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["Soporte técnico", "Redes básicas", "Atención al usuario"]
  },
  {
    id: "vac-105",
    tipoVacante: "administrativa",
    grupo: "Monitoreo",
    titulo: "Analista de Monitoreo",
    area: "Monitoreo",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["Monitoreo", "Atención al detalle", "Reportes"]
  },
  {
    id: "vac-106",
    tipoVacante: "administrativa",
    grupo: "Proyectos y Construcción",
    titulo: "Coordinador de Proyectos",
    area: "Proyectos y Construcción",
    pais: "Estados Unidos",
    estado: "Texas",
    ciudad: "El Paso",
    sucursal: "Corporativo",
    requisitos: ["Planeación", "Seguimiento", "Construcción"]
  },
  {
    id: "vac-107",
    tipoVacante: "administrativa",
    grupo: "Capital Humano",
    titulo: "Generalista de Capital Humano",
    area: "Capital Humano",
    pais: "México",
    estado: "Chihuahua",
    ciudad: "Ciudad Juárez",
    sucursal: "Corporativo",
    requisitos: ["RH", "Administración de personal", "Comunicación"]
  }
];

if (!fs.existsSync(vacantesFile)) {
  fs.writeFileSync(vacantesFile, JSON.stringify(vacantesIniciales, null, 2), "utf-8");
}

/* =========================
   HELPERS JSON
========================= */
function leerJson(filePath, fallback = []) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error);
    return fallback;
  }
}

function guardarJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`❌ Error guardando ${filePath}:`, error);
  }
}

function leerPostulaciones() {
  return leerJson(postulacionesFile, []);
}

function guardarPostulaciones(data) {
  guardarJson(postulacionesFile, data);
}

function leerVacantes() {
  return leerJson(vacantesFile, vacantesIniciales);
}

function guardarVacantes(data) {
  guardarJson(vacantesFile, data);
}

/* =========================
   MULTER
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const name = file.originalname.toLowerCase();
  const isPdf = file.mimetype === "application/pdf" || name.endsWith(".pdf");
  const isImage =
    file.mimetype.startsWith("image/") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png");

  const isCvField = file.fieldname === "cvFile";
  const isOptionalDocField = ["ineFile", "curpFile", "domicilioFile"].includes(file.fieldname);

  if (isCvField && !isPdf) {
    return cb(new Error("El CV debe ser un archivo PDF."));
  }

  if (isOptionalDocField && !(isPdf || isImage)) {
    return cb(new Error("Los documentos opcionales deben ser PDF o imagen."));
  }

  if (!isCvField && !isOptionalDocField) {
    return cb(new Error("Tipo de archivo no permitido."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

/* =========================
   MIDDLEWARES
========================= */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

let postulaciones = leerPostulaciones();
let vacantes = leerVacantes();

/* =========================
   UBICACIONES
========================= */
const ubicaciones = {
  México: {
    Chihuahua: ["Ciudad Juárez", "Chihuahua"],
    "Baja California": ["Mexicali"],
    Jalisco: ["Guadalajara"]
  },
  "Estados Unidos": {
    Texas: ["El Paso"]
  }
};

/* =========================
   TEXTO HELPERS
========================= */
function normalizarTexto(texto = "") {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b(cd|cd\.|ciudad)\b/g, "ciudad")
    .replace(/\s+/g, " ")
    .trim();
}

function limpiarJsonRespuesta(texto = "") {
  return String(texto)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function resolverPais(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    México: ["mexico", "méxico", "mx"],
    "Estados Unidos": ["estados unidos", "usa", "us", "eeuu", "eua", "united states"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

function resolverEstado(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    Chihuahua: ["chihuahua", "chih"],
    "Baja California": ["baja california", "baja", "bc"],
    Jalisco: ["jalisco", "gdl", "guadalajara"],
    Texas: ["texas", "tx"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

function resolverCiudad(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    "Ciudad Juárez": ["juarez", "ciudad juarez", "cd juarez", "cd. juarez", "jrz"],
    Chihuahua: ["chihuahua", "ciudad chihuahua", "cd chihuahua"],
    Guadalajara: ["guadalajara", "gdl"],
    Mexicali: ["mexicali"],
    "El Paso": ["el paso", "elpaso", "paso"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

function resolverGrupo(valor = "") {
  const t = normalizarTexto(valor);

  const aliases = {
    "Wendy's": ["wendys", "wendy", "wendy's"],
    "Applebee's": ["applebees", "applebee", "applebee's"],
    "Great American": ["great american", "great american steakhouse", "great"],
    Ardeo: ["ardeo"],
    Yoko: ["yoko"],
    "Little Caesars": ["little caesars", "little", "caesars", "little caesar"],
    RH: ["rh", "recursos humanos", "reclutamiento"],
    Contabilidad: ["contabilidad", "contable"],
    Mercadotecnia: ["mercadotecnia", "marketing", "mkt"],
    Sistemas: ["sistemas", "soporte", "soporte tecnico", "it"],
    Monitoreo: ["monitoreo", "monitorista"],
    "Proyectos y Construcción": ["proyectos y construccion", "proyectos", "construccion"],
    "Capital Humano": ["capital humano", "capital", "talento humano"]
  };

  for (const [oficial, lista] of Object.entries(aliases)) {
    if (lista.some((alias) => t === normalizarTexto(alias) || t.includes(normalizarTexto(alias)))) {
      return oficial;
    }
  }

  return valor;
}

/* =========================
   PDF + IA
========================= */
async function extraerTextoPdf(filePath) {
  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(pdfBuffer);
    return parsed?.text || "";
  } catch (error) {
    console.error("❌ Error extrayendo texto del PDF:", error);
    return "";
  }
}

function sugerirVacantesBasicas(texto = "", tipoVacante = "") {
  const lower = normalizarTexto(texto);
  const lista = leerVacantes();

  return lista
    .filter((v) => !tipoVacante || v.tipoVacante === tipoVacante)
    .map((v) => {
      let score = 0;

      const full = normalizarTexto(
        `${v.titulo} ${v.area} ${v.grupo} ${v.requisitos.join(" ")} ${v.sucursal}`
      );

      const keywords = [
        "cliente",
        "servicio",
        "ventas",
        "caja",
        "cajero",
        "cocina",
        "alimentos",
        "restaurante",
        "sushi",
        "parrilla",
        "logistica",
        "importacion",
        "exportacion",
        "documental",
        "facturacion",
        "almacen",
        "inventario",
        "administracion",
        "administrativo",
        "excel",
        "contabilidad",
        "reclutamiento",
        "recursos humanos",
        "rh",
        "soporte",
        "sistemas",
        "tecnico",
        "marketing",
        "mercadotecnia",
        "monitoreo",
        "proyectos"
      ];

      keywords.forEach((k) => {
        if (lower.includes(k) && full.includes(k)) score += 25;
      });

      if (lower.includes(normalizarTexto(v.titulo))) score += 35;
      if (lower.includes(normalizarTexto(v.area))) score += 30;
      if (lower.includes(normalizarTexto(v.grupo))) score += 20;

      return { ...v, score };
    })
    .filter((v) => v.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

async function analizarCvConIA(cvTexto = "") {
  if (!cvTexto.trim()) {
    return {
      resumen: "No fue posible analizar el CV.",
      habilidadesDetectadas: [],
      perfilRecomendado: "",
      palabrasClave: []
    };
  }

  try {
    const prompt = `
Analiza este CV para reclutamiento.

Devuelve SOLO JSON válido con esta estructura:
{
  "resumen": "resumen profesional breve",
  "habilidadesDetectadas": ["..."],
  "perfilRecomendado": "operativa o administrativa",
  "palabrasClave": ["..."],
  "areasCompatibles": ["..."]
}

CV:
${cvTexto.slice(0, 12000)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "Responde únicamente JSON válido, sin markdown." },
        { role: "user", content: prompt }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(limpiarJsonRespuesta(content));

    return {
      resumen: parsed.resumen || "CV recibido correctamente.",
      habilidadesDetectadas: Array.isArray(parsed.habilidadesDetectadas)
        ? parsed.habilidadesDetectadas
        : [],
      perfilRecomendado: parsed.perfilRecomendado || "",
      palabrasClave: Array.isArray(parsed.palabrasClave)
        ? parsed.palabrasClave
        : [],
      areasCompatibles: Array.isArray(parsed.areasCompatibles)
        ? parsed.areasCompatibles
        : []
    };
  } catch (error) {
    console.error("❌ Error IA CV:", error);

    return {
      resumen: "CV recibido correctamente. El análisis automático no estuvo disponible en este momento.",
      habilidadesDetectadas: [],
      perfilRecomendado: "",
      palabrasClave: [],
      areasCompatibles: []
    };
  }
}

/* =========================
   RUTAS HTML
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

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
   RUTAS PUBLICAS
========================= */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "chatbot-reclutamiento",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/ubicaciones", (req, res) => {
  res.json(ubicaciones);
});

app.get("/api/vacantes", (req, res) => {
  vacantes = leerVacantes();

  const tipoVacante = req.query.tipoVacante ? normalizarTexto(req.query.tipoVacante) : "";
  const pais = req.query.pais ? normalizarTexto(resolverPais(req.query.pais)) : "";
  const estado = req.query.estado ? normalizarTexto(resolverEstado(req.query.estado)) : "";
  const ciudad = req.query.ciudad ? normalizarTexto(resolverCiudad(req.query.ciudad)) : "";
  const grupo = req.query.grupo ? normalizarTexto(resolverGrupo(req.query.grupo)) : "";

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

  res.json(resultado);
});

app.get("/api/postulacion/:id", (req, res) => {
  postulaciones = leerPostulaciones();

  const item = postulaciones.find((p) => p.id === req.params.id);

  if (!item) {
    return res.status(404).json({ error: "Postulación no encontrada." });
  }

  res.json({
    id: item.id,
    estadoSolicitud: item.estadoSolicitud,
    vacanteTitulo: item.vacanteTitulo,
    ciudad: item.ciudad,
    fechaRegistro: item.fechaRegistro
  });
});

/* =========================
   ANALIZAR CV PUBLICO
========================= */
app.post(
  "/api/analizar-cv",
  upload.fields([{ name: "cvFile", maxCount: 1 }]),
  async (req, res) => {
    try {
      const cvFile = req.files?.cvFile?.[0];

      if (!cvFile) {
        return res.status(400).json({ error: "Debes adjuntar tu CV en PDF." });
      }

      const cvTexto = await extraerTextoPdf(cvFile.path);
      const analisisIA = await analizarCvConIA(cvTexto);

      let tipoSugerido = "";

      if (normalizarTexto(analisisIA.perfilRecomendado).includes("administr")) {
        tipoSugerido = "administrativa";
      }

      if (normalizarTexto(analisisIA.perfilRecomendado).includes("oper")) {
        tipoSugerido = "operativa";
      }

      const sugerenciasIA = sugerirVacantesBasicas(
        `${cvTexto} ${analisisIA.habilidadesDetectadas.join(" ")} ${analisisIA.palabrasClave.join(" ")} ${analisisIA.areasCompatibles.join(" ")}`,
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
          palabrasClave: analisisIA.palabrasClave,
          areasCompatibles: analisisIA.areasCompatibles,
          sugerenciasIA
        }
      });
    } catch (error) {
      console.error("❌ Error analizando CV:", error);
      res.status(500).json({ error: "No fue posible analizar el CV." });
    }
  }
);

/* =========================
   POSTULACION PUBLICA
========================= */
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
      postulaciones = leerPostulaciones();
      vacantes = leerVacantes();

      const {
        nombre,
        correo,
        telefono,
        edad,
        pais,
        estado,
        ciudad,
        disponibilidad,
        tipoVacante,
        grupoSeleccionado,
        vacanteSeleccionada,
        puestoInteres,
        escolaridad,
        experiencia,
        habilidades
      } = req.body;

      if (!nombre || !correo || !telefono || !vacanteSeleccionada) {
        return res.status(400).json({ error: "Faltan campos obligatorios." });
      }

      const cvFile = req.files?.cvFile?.[0];

      if (!cvFile) {
        return res.status(400).json({ error: "Debes adjuntar tu CV en PDF." });
      }

      const vacante = vacantes.find((v) => v.id === vacanteSeleccionada);

      if (!vacante) {
        return res.status(400).json({ error: "La vacante seleccionada no existe." });
      }

      const cvTexto = await extraerTextoPdf(cvFile.path);
      const analisisIA = await analizarCvConIA(cvTexto);

      const postulacion = {
        id: Date.now().toString(),
        nombre,
        correo,
        telefono,
        edad,
        pais: pais || vacante.pais,
        estado: estado || vacante.estado,
        ciudad: ciudad || vacante.ciudad,
        disponibilidad,
        tipoVacante: tipoVacante || vacante.tipoVacante,
        grupoSeleccionado: grupoSeleccionado || vacante.grupo,
        vacanteId: vacante.id,
        vacanteTitulo: vacante.titulo,
        puestoInteres: puestoInteres || vacante.titulo,
        escolaridad,
        experiencia,
        habilidades,
        cvNombre: cvFile.originalname,
        cvRuta: `/uploads/${cvFile.filename}`,
        resumenIA: analisisIA.resumen,
        habilidadesDetectadas: analisisIA.habilidadesDetectadas,
        perfilRecomendado: analisisIA.perfilRecomendado,
        estadoSolicitud: "pendiente",
        fechaRegistro: new Date().toISOString()
      };

      postulaciones.push(postulacion);
      guardarPostulaciones(postulaciones);

      res.json({
        ok: true,
        message: "Postulación recibida correctamente.",
        postulacion
      });
    } catch (error) {
      console.error("❌ Error guardando postulación:", error);
      res.status(500).json({ error: "No fue posible guardar la postulación." });
    }
  }
);

/* =========================
   CHAT PUBLICO
========================= */
app.post("/chat", async (req, res) => {
  try {
    const { messages, candidateProfile } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "El campo messages debe ser un arreglo." });
    }

    const lastMessages = messages.slice(-10);

    const systemPrompt = `
Eres un asistente profesional de reclutamiento de GA Hospitality.

Ayudas con:
- vacantes disponibles
- orientación para candidatos
- análisis general del CV
- pasos de postulación
- consulta de estatus mediante folio

No inventes políticas internas.
Responde en español, claro, profesional y breve.

Perfil candidato:
${JSON.stringify(candidateProfile || {}, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...lastMessages
      ]
    });

    const reply = completion.choices?.[0]?.message;

    res.json({
      reply: {
        role: "assistant",
        content: reply?.content || "No pude generar respuesta."
      }
    });
  } catch (error) {
    console.error("❌ Error chat:", error);
    res.status(500).json({ error: "Error generando respuesta." });
  }
});

/* =========================
   RUTAS ADMIN PROTEGIDAS
========================= */
app.get("/api/admin/me", verifyAdmin, (req, res) => {
  res.json({
    ok: true,
    email: req.adminUser.email
  });
});

app.get("/api/postulaciones", verifyAdmin, (req, res) => {
  postulaciones = leerPostulaciones();
  res.json(postulaciones);
});

app.patch("/api/postulaciones/:id/estado", verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ["pendiente", "aprobado", "rechazado"];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "Estado no válido." });
  }

  postulaciones = leerPostulaciones();

  const postulacion = postulaciones.find((p) => p.id === id);

  if (!postulacion) {
    return res.status(404).json({ error: "Postulación no encontrada." });
  }

  postulacion.estadoSolicitud = estado;
  postulacion.fechaActualizacion = new Date().toISOString();

  guardarPostulaciones(postulaciones);

  res.json({
    ok: true,
    message: "Estado actualizado correctamente.",
    postulacion
  });
});

/* =========================
   CRUD VACANTES ADMIN
========================= */
app.post("/api/vacantes", verifyAdmin, (req, res) => {
  vacantes = leerVacantes();

  const {
    tipoVacante,
    grupo,
    titulo,
    area,
    pais,
    estado,
    ciudad,
    sucursal,
    requisitos
  } = req.body;

  if (!tipoVacante || !grupo || !titulo || !area || !pais || !estado || !ciudad || !sucursal) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  const nuevaVacante = {
    id: `vac-${Date.now()}`,
    tipoVacante,
    grupo,
    titulo,
    area,
    pais,
    estado,
    ciudad,
    sucursal,
    requisitos: Array.isArray(requisitos) ? requisitos : []
  };

  vacantes.push(nuevaVacante);
  guardarVacantes(vacantes);

  res.json({
    ok: true,
    message: "Vacante creada correctamente.",
    vacante: nuevaVacante
  });
});

app.put("/api/vacantes/:id", verifyAdmin, (req, res) => {
  vacantes = leerVacantes();

  const { id } = req.params;
  const index = vacantes.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Vacante no encontrada." });
  }

  vacantes[index] = {
    ...vacantes[index],
    ...req.body,
    id
  };

  guardarVacantes(vacantes);

  res.json({
    ok: true,
    message: "Vacante actualizada correctamente.",
    vacante: vacantes[index]
  });
});

app.delete("/api/vacantes/:id", verifyAdmin, (req, res) => {
  vacantes = leerVacantes();

  const { id } = req.params;
  const index = vacantes.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Vacante no encontrada." });
  }

  const eliminada = vacantes.splice(index, 1)[0];

  guardarVacantes(vacantes);

  res.json({
    ok: true,
    message: "Vacante eliminada correctamente.",
    vacante: eliminada
  });
});

/* =========================
   ERRORES
========================= */
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

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});