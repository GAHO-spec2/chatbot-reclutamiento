import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4100 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${PORT}`;
let proc;

async function esperarServidor(timeoutMs = 20000) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeoutMs) {
    try {
      await fetch(`${base}/index.html`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error("El servidor no respondió a tiempo.");
}

before(async () => {
  proc = spawn("node", ["server/server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT), OPENAI_API_KEY: "test-key" },
    stdio: "ignore"
  });
  await esperarServidor();
});

after(() => {
  if (proc) proc.kill();
});

test("sirve la página principal", async () => {
  const res = await fetch(`${base}/index.html`);
  assert.equal(res.status, 200);
});

test("consulta de folio inexistente responde 404", async () => {
  const res = await fetch(`${base}/api/postulacion/no-existe`);
  assert.equal(res.status, 404);
});

test("reserva sin datos obligatorios responde 400", async () => {
  const res = await fetch(`${base}/api/entrevistas/reservar`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });
  assert.equal(res.status, 400);
});

test("el límite de tasa bloquea tras superar el umbral", async () => {
  let ultimo = 0;
  for (let i = 0; i < 25; i++) {
    const res = await fetch(`${base}/api/entrevistas/reservar`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    ultimo = res.status;
  }
  assert.equal(ultimo, 429);
});
