#!/usr/bin/env node
// ═══ AzurTant Watchdog (Node, multiplataforma) ═══
// Verifica cada 30s que :5182 (PRO) y :5190 (Factory) estén vivos.
// Si :5190 cae, lo levanta. Si :5182 cae, alerta por log.
// Uso: node scripts/watchdog.js

import { spawn } from 'child_process';
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOG_DIR = join(ROOT, 'logs');
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = join(LOG_DIR, 'watchdog.log');

const PRO_URL = 'http://localhost:5182/api/health';
const FACTORY_URL = 'http://localhost:5190/api/health';
const FACTORY_DIR = join(ROOT, 'factory');
const INTERVAL_MS = 30_000;

function log(level, msg) {
  const line = `${new Date().toISOString()} [${level}] ${msg}\n`;
  appendFileSync(LOG_FILE, line);
  process.stdout.write(line);
}

async function check(name, url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const ok = r.status === 200;
    log(ok ? 'OK' : 'WARN', `${name} ${url} → ${r.status}`);
    return ok;
  } catch (e) {
    log('ERROR', `${name} ${url} → ${e.name}: ${e.message}`);
    return false;
  }
}

function startFactory() {
  log('INFO', `Levantando Factory en ${FACTORY_DIR}`);
  const child = spawn('node', ['server.mjs'], {
    cwd: FACTORY_DIR,
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
  });
  child.unref();
  return child.pid;
}

async function mainLoop() {
  log('INFO', `Watchdog iniciado (PID ${process.pid}, host ${os.hostname()})`);
  while (true) {
    const proOk = await check('PRO', PRO_URL);
    const factoryOk = await check('FACTORY', FACTORY_URL);
    if (!factoryOk) {
      log('WARN', 'Factory caído, intentando levantar...');
      const pid = startFactory();
      log('INFO', `Factory spawn PID ${pid}`);
      await new Promise(r => setTimeout(r, 4000));
      const ok = await check('FACTORY', FACTORY_URL);
      log(ok ? 'OK' : 'ERROR', ok ? 'Factory restaurado' : 'Factory no levantó (revisar Ollama)');
    }
    if (!proOk) {
      log('WARN', 'PRO caído — requiere restart manual (node server.mjs)');
    }
    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }
}

mainLoop().catch(e => { log('FATAL', e.stack); process.exit(1); });
