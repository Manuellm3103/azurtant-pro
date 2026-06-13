#!/usr/bin/env node
/**
 * AzurTant PRO v9 Watchdog — Mantiene el server Node.js (Bun) vivo en :5182
 * Auto-restart si se cae, health check cada 15s, logs a archivo.
 *
 * Uso: node watchdog_pro_v9.js
 *      o como servicio:  taskkill /F /IM node.exe  →  no, este SÍ debe correr
 *
 * Compatible con el server.mjs ya corriendo (PID via netstat o lista de procesos bun).
 */

import { createServer as httpCreate } from 'http';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, `watchdog-pro-v9-${new Date().toISOString().slice(0,10)}.log`);
const TARGET_URL = 'http://localhost:5182/api/health';
const PORT = 5182;
const CHECK_INTERVAL_MS = 15_000;      // health check cada 15s
const RESTART_COOLDOWN_MS = 5_000;     // espera 5s antes de reintentar
const MAX_RESTARTS_PER_HOUR = 20;      // circuit breaker
const SERVER_CMD = 'bun';
const SERVER_ARGS = ['server.mjs'];
const SERVER_CWD = join(process.cwd(), 'AzurTantPRO_v7_Package');

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

function log(level, msg) {
  const ts = new Date().toISOString();
  const line = `[${ts.slice(11,19)}] [${level}] ${msg}\n`;
  try { appendFileSync(LOG_FILE, line); } catch {}
  const c = { INFO:'\x1b[36m', OK:'\x1b[32m', WARN:'\x1b[33m', ERR:'\x1b[31m' };
  console.log(`${c[level]||''}${line.trim()}\x1b[0m`);
}

let serverProc = null;
let restartHistory = []; // timestamps de restarts

function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = httpCreate((res) => { resolve(res.statusCode === 200); });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
    req.end();
  }).then(() => {
    // Fallback: fetch health
    return new Promise((resolve) => {
      const http = require('http');
      const r = http.get(`http://localhost:${port}/api/health`, { timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200);
        res.resume();
      });
      r.on('error', () => resolve(false));
      r.on('timeout', () => { r.destroy(); resolve(false); });
    });
  });
}

async function startServer() {
  log('INFO', `Starting server: ${SERVER_CMD} ${SERVER_ARGS.join(' ')} in ${SERVER_CWD}`);
  const { spawn } = await import('child_process');
  serverProc = spawn(SERVER_CMD, SERVER_ARGS, {
    cwd: SERVER_CWD,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env, AZURTANT_WATCHDOG: '1' }
  });
  serverProc.stdout.on('data', d => {
    const s = d.toString().trimEnd();
    if (s) log('INFO', `[server] ${s}`);
  });
  serverProc.stderr.on('data', d => {
    const s = d.toString().trimEnd();
    if (s) log('WARN', `[server] ${s}`);
  });
  serverProc.on('exit', (code, sig) => {
    log('WARN', `Server exited code=${code} sig=${sig}`);
    serverProc = null;
    scheduleRestart();
  });
}

function scheduleRestart() {
  // Circuit breaker
  const now = Date.now();
  restartHistory = restartHistory.filter(t => now - t < 3600_000);
  if (restartHistory.length >= MAX_RESTARTS_PER_HOUR) {
    log('ERR', `Circuit breaker: ${MAX_RESTARTS_PER_HOUR} restarts/hora. Pausa 5 min.`);
    setTimeout(scheduleRestart, 300_000);
    return;
  }
  restartHistory.push(now);
  setTimeout(async () => {
    if (!await isPortOpen(PORT)) {
      log('WARN', 'Puerto aún cerrado. Reiniciando...');
      await startServer();
    }
  }, RESTART_COOLDOWN_MS);
}

async function healthLoop() {
  while (true) {
    await new Promise(r => setTimeout(r, CHECK_INTERVAL_MS));
    const up = await isPortOpen(PORT);
    if (!up) {
      log('WARN', `Health check FAIL on :${PORT}. Servidor down.`);
      if (!serverProc) {
        log('INFO', 'Auto-restarting server...');
        await startServer();
      }
    }
  }
}

(async () => {
  log('OK', `AzurTant PRO v9 Watchdog started — PID ${process.pid}`);
  log('INFO', `Target: ${TARGET_URL} | Check: ${CHECK_INTERVAL_MS/1000}s | Cooldown: ${RESTART_COOLDOWN_MS/1000}s`);

  const alreadyUp = await isPortOpen(PORT);
  if (alreadyUp) {
    log('OK', `Server ya responde en :${PORT} — watchdog en modo monitoreo (no接管)`);
  } else {
    log('INFO', `Server NO responde. Arrancando...`);
    await startServer();
  }

  healthLoop().catch(e => log('ERR', `Health loop crashed: ${e.message}`));

  process.on('SIGINT', () => { log('INFO', 'Watchdog SIGINT — bye'); process.exit(0); });
  process.on('SIGTERM', () => { log('INFO', 'Watchdog SIGTERM — bye'); process.exit(0); });
})();