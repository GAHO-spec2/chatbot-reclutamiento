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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase Admin inicializado correctamente.");
  } catch (error) {
    console.error("Firebase Admin no inicializado:", error.message);
  }
}

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

const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const postulacionesFile = path.join(dataDir, "postulaciones.json");
const vacantesFile = path.join(dataDir, "vacantes.json");
const sucursalesFile = path.join(dataDir, "sucursales.json");

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
    mapX: 36,
    mapY: 28
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
    mapX: 42,
    mapY: 36
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
    mapX: 48,
    mapY: 44
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
    mapX: 58,
    mapY: 48
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
    mapX: 66,
    mapY: 58
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
    mapX: 54,
    mapY: 70
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

if (!fs.existsSync(postulacionesFile)) {
  fs.writeFileSync(postulacionesFile, "[]", "utf-8");
}

if (!fs.existsSync(sucursalesFile)) {
  fs.writeFileSync(sucursalesFile, JSON.stringify(sucursalesIniciales, null, 2), "utf-8");
}

if (!fs.existsSync(vacantesFile)) {
  fs.writeFileSync(vacantesFile, JSON.stringify(vacantesIniciales, null, 2), "utf-8");
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

function leerSucursales() {
  return leerJson(sucursalesFile, sucursalesIniciales);
}

function guardarSucursales(data) {
  guardarJson(sucursalesFile, data);
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

function enriquecerVacanteConSucursal(vacante = {}) {
  const sucursales = leerSucursales();
  const sucursalId = resolverSucursalId(vacante);
  const sucursal = sucursales.find((item) => item.id === sucursalId);
  const query = `${vacante.sucursal || sucursal?.sucursal || ""}, ${vacante.ciudad || sucursal?.ciudad || ""}, ${vacante.estado || sucursal?.estado || ""}, ${vacante.pais || sucursal?.pais || ""}`;

  return {
    ...vacante,
    branchId: sucursalId,
    sucursalId,
    numeroTienda: vacante.numeroTienda || sucursal?.numeroTienda || "",
    direccion: vacante.direccion || sucursal?.direccion || "",
    googleMapsUrl: vacante.googleMapsUrl || sucursal?.googleMapsUrl || crearMapsUrl(query),
    appleMapsUrl: vacante.appleMapsUrl || sucursal?.appleMapsUrl || crearAppleMapsUrl(query),
    lat: vacante.lat ?? sucursal?.lat ?? null,
    lng: vacante.lng ?? sucursal?.lng ?? null,
    mapX: sucursal?.mapX,
    mapY: sucursal?.mapY
  };
}

const ubicaciones = {
  Mexico: {
    Chihuahua: ["Ciudad Juarez", "Chihuahua"],
    "Baja California": ["Mexicali"],
    Jalisco: ["Guadalajara"]
  },
  "Estados Unidos": {
    Texas: ["El Paso"]
  }
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
app.use(express.static(__dirname));
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

function sugerirVacantesBasicas(texto = "", tipoVacante = "") {
  const lower = normalizarTexto(texto);

  return leerVacantes()
    .map(enriquecerVacanteConSucursal)
    .filter((v) => !tipoVacante || v.tipoVacante === tipoVacante)
    .map((v) => {
      let score = 0;
      const full = normalizarTexto(`${v.titulo} ${v.area} ${v.grupo} ${(v.requisitos || []).join(" ")} ${v.sucursal}`);

      ["cliente", "servicio", "ventas", "caja", "cajero", "cocina", "restaurante", "excel", "contabilidad", "reclutamiento", "rh", "sistemas"].forEach((k) => {
        if (lower.includes(k) && full.includes(k)) score += 25;
      });

      return { ...v, score };
    })
    .filter((v) => v.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

async function analizarCvConIA(cvTexto = "") {
  if (!cvTexto.trim() || !process.env.OPENAI_API_KEY) {
    return {
      resumen: "CV recibido correctamente.",
      habilidadesDetectadas: [],
      perfilRecomendado: "",
      palabrasClave: [],
      areasCompatibles: []
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: "Responde unicamente JSON valido, sin markdown." },
        {
          role: "user",
          content: `Analiza este CV para reclutamiento y devuelve JSON con resumen, habilidadesDetectadas, perfilRecomendado, palabrasClave y areasCompatibles.\n\nCV:\n${cvTexto.slice(0, 12000)}`
        }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(limpiarJsonRespuesta(content));

    return {
      resumen: parsed.resumen || "CV recibido correctamente.",
      habilidadesDetectadas: Array.isArray(parsed.habilidadesDetectadas) ? parsed.habilidadesDetectadas : [],
      perfilRecomendado: parsed.perfilRecomendado || "",
      palabrasClave: Array.isArray(parsed.palabrasClave) ? parsed.palabrasClave : [],
      areasCompatibles: Array.isArray(parsed.areasCompatibles) ? parsed.areasCompatibles : []
    };
  } catch (error) {
    console.error("Error IA CV:", error);

    return {
      resumen: "CV recibido correctamente. El analisis automatico no estuvo disponible en este momento.",
      habilidadesDetectadas: [],
      perfilRecomendado: "",
      palabrasClave: [],
      areasCompatibles: []
    };
  }
}

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/vacantes.html", (req, res) => res.sendFile(path.join(__dirname, "vacantes.html")));
app.get("/login-admin.html", (req, res) => res.sendFile(path.join(__dirname, "login-admin.html")));
app.get("/dashboard.html", (req, res) => res.sendFile(path.join(__dirname, "dashboard.html")));
app.get("/vacantes-admin.html", (req, res) => res.sendFile(path.join(__dirname, "vacantes-admin.html")));

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

app.get("/api/sucursales", (req, res) => {
  const vacantes = leerVacantes().map(enriquecerVacanteConSucursal);
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
    if ((sucursal.lat === null || sucursal.lat === undefined) && vacante.lat !== null && vacante.lat !== undefined) sucursal.lat = vacante.lat;
    if ((sucursal.lng === null || sucursal.lng === undefined) && vacante.lng !== null && vacante.lng !== undefined) sucursal.lng = vacante.lng;
  });

  res.json(Array.from(bySucursal.values()));
});

app.get("/api/vacantes", (req, res) => {
  const tipoVacante = req.query.tipoVacante ? normalizarTexto(req.query.tipoVacante) : "";
  const pais = req.query.pais ? normalizarTexto(resolverPais(req.query.pais)) : "";
  const estado = req.query.estado ? normalizarTexto(resolverEstado(req.query.estado)) : "";
  const ciudad = req.query.ciudad ? normalizarTexto(resolverCiudad(req.query.ciudad)) : "";
  const grupo = req.query.grupo ? normalizarTexto(resolverGrupo(req.query.grupo)) : "";

  const resultado = leerVacantes().filter((v) => {
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
});

app.get("/api/postulacion/:id", (req, res) => {
  const item = leerPostulaciones().find((p) => p.id === req.params.id);

  if (!item) {
    return res.status(404).json({ error: "Postulacion no encontrada." });
  }

  res.json(item);
});

app.post("/api/analizar-cv", upload.fields([{ name: "cvFile", maxCount: 1 }]), async (req, res) => {
  try {
    const cvFile = req.files?.cvFile?.[0];

    if (!cvFile) {
      return res.status(400).json({ error: "Debes adjuntar tu CV en PDF." });
    }

    const cvTexto = await extraerTextoPdf(cvFile.path);
    const analisisIA = await analizarCvConIA(cvTexto);
    const tipoSugerido = normalizarTexto(analisisIA.perfilRecomendado).includes("administr") ? "administrativa" : "";

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
      const postulaciones = leerPostulaciones();
      const vacantes = leerVacantes().map(enriquecerVacanteConSucursal);

      const {
        nombre,
        correo,
        telefono,
        edad,
        disponibilidad,
        vacanteSeleccionada,
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
        pais: vacante.pais,
        estado: vacante.estado,
        ciudad: vacante.ciudad,
        sucursal: vacante.sucursal,
        sucursalId: vacante.sucursalId,
        direccion: vacante.direccion,
        googleMapsUrl: vacante.googleMapsUrl,
        appleMapsUrl: vacante.appleMapsUrl,
        disponibilidad,
        tipoVacante: vacante.tipoVacante,
        grupoSeleccionado: vacante.grupo,
        vacanteId: vacante.id,
        vacanteTitulo: vacante.titulo,
        puestoInteres: vacante.titulo,
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
        message: "Postulacion recibida correctamente.",
        postulacion
      });
    } catch (error) {
      console.error("Error guardando postulacion:", error);
      res.status(500).json({ error: "No fue posible guardar la postulacion." });
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

app.get("/api/postulaciones", verifyAdmin, (req, res) => {
  res.json(leerPostulaciones());
});

app.patch("/api/postulaciones/:id/estado", verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ["pendiente", "aprobado", "rechazado"];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "Estado no valido." });
  }

  const postulaciones = leerPostulaciones();
  const postulacion = postulaciones.find((p) => p.id === id);

  if (!postulacion) {
    return res.status(404).json({ error: "Postulacion no encontrada." });
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

app.post("/api/vacantes", verifyAdmin, (req, res) => {
  const vacantes = leerVacantes();

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
  requisitos
} = req.body;

  if (!tipoVacante || !grupo || !titulo || !area || !pais || !estado || !ciudad || !sucursal) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  const finalSucursalId = sucursalId || slugify(`${grupo} ${sucursal} ${ciudad} ${estado} ${pais}`);
  const query = `${direccion || sucursal}, ${ciudad}, ${estado}, ${pais}`;

  const nuevaVacante = {
  id: `vac-${Date.now()}`,
  sucursalId: finalSucursalId,
  branchId: finalSucursalId,
  tipoVacante,
  grupo,
  titulo,
  area,
  pais,
  estado,
  ciudad,
  sucursal,
  numeroTienda: numeroTienda || "",
  direccion: direccion || "",
  googleMapsUrl: googleMapsUrl || crearMapsUrl(query),
  appleMapsUrl: appleMapsUrl || crearAppleMapsUrl(query),
  lat: lat ?? null,
  lng: lng ?? null,
  requisitos: Array.isArray(requisitos)
    ? requisitos
    : String(requisitos || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
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
  const vacantes = leerVacantes();
  const { id } = req.params;
  const index = vacantes.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Vacante no encontrada." });
  }

  vacantes[index] = {
  ...vacantes[index],
  ...req.body,
  id,
  lat: req.body.lat ?? vacantes[index].lat ?? null,
  lng: req.body.lng ?? vacantes[index].lng ?? null,
  numeroTienda: req.body.numeroTienda || vacantes[index].numeroTienda || "",
  direccion: req.body.direccion || vacantes[index].direccion || "",
  googleMapsUrl: req.body.googleMapsUrl || vacantes[index].googleMapsUrl || "",
  appleMapsUrl: req.body.appleMapsUrl || vacantes[index].appleMapsUrl || ""
};

  guardarVacantes(vacantes);

  res.json({
    ok: true,
    message: "Vacante actualizada correctamente.",
    vacante: vacantes[index]
  });
});

app.delete("/api/vacantes/:id", verifyAdmin, (req, res) => {
  const vacantes = leerVacantes();
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
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});