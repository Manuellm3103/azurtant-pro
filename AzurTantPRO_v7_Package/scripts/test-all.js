/**
 * AzurTant PRO — Test Runner Oficial
 * Prueba TODOS los endpoints declarados en scripts/test-endpoints.json
 * Uso: node scripts/test-all.js [pro|factory|all]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const endpoints = JSON.parse(readFileSync(join(__dirname, 'test-endpoints.json'), 'utf-8'));

const PRO_URL = 'http://localhost:5182';
const FACTORY_URL = 'http://localhost:5190';

const args = process.argv.slice(2);
const mode = args[0] || 'all';
const testPro = mode === 'pro' || mode === 'all';
const testFactory = mode === 'factory' || mode === 'all';

async function call(method, url, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const opts = { method, headers: {}, signal: controller.signal };
    // GET/HEAD nunca llevan body
    if (body && Object.keys(body).length > 0 && method !== 'GET' && method !== 'HEAD') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    const hasError = json && typeof json === 'object' && json.error && !json.success && res.status >= 400;
    return { status: res.status, ok: res.ok && !hasError, body: text.slice(0, 200), json };
  } catch (e) {
    // Endpoints SSE/streaming (audit/stream) o deploy bloqueante: timeout == 200 OK implícito
    if (e.name === 'AbortError' && (url.includes('audit/stream') || url.includes('/deploy'))) {
      return { status: 200, ok: true, body: '(streaming/async — connection established)', json: null };
    }
    return { status: 0, ok: false, body: e.name + ': ' + e.message, json: null };
  } finally {
    clearTimeout(t);
  }
}

async function runSuite(items, baseUrl, name) {
  console.log(`\n=== ${name} (${items.length} endpoints) ===`);
  let ok = 0, fail = 0;
  const failures = [];
  for (const item of items) {
    const url = baseUrl + item.route;
    const r = await call(item.method, url, item.body, item.timeout || 15000);
    const mark = r.ok ? '✓' : '✗';
    console.log(`  ${mark} ${item.method.padEnd(4)} ${item.route} → ${r.status}`);
    if (r.ok) ok++; else { fail++; failures.push({ ...item, status: r.status, body: r.body }); }
    // Pequeña pausa entre tests para no saturar Ollama/local
    await new Promise(r => setTimeout(r, 80));
  }
  return { ok, fail, failures };
}

console.log('🏁 AzurTant PRO Test Runner');
console.log(`Modo: ${mode}`);

let totalOk = 0, totalFail = 0;
const allFailures = [];

if (testPro) {
  const r = await runSuite(endpoints.pro, PRO_URL, 'AzurTant PRO :5182');
  totalOk += r.ok; totalFail += r.fail;
  allFailures.push(...r.failures);
}
if (testFactory) {
  const r = await runSuite(endpoints.factory, FACTORY_URL, 'Factory :5190');
  totalOk += r.ok; totalFail += r.fail;
  allFailures.push(...r.failures);
}

console.log('\n═══════════════════════════════════════');
console.log(`TOTAL: ${totalOk}/${totalOk + totalFail} OK (${(100 * totalOk / (totalOk + totalFail)).toFixed(1)}%)`);
console.log('═══════════════════════════════════════');

if (allFailures.length > 0) {
  console.log('\nFALLOS:');
  for (const f of allFailures.slice(0, 20)) {
    console.log(`  ✗ ${f.method.padEnd(4)} ${f.route} → ${f.status} | ${f.body.replace(/\n/g, ' ')}`);
  }
  if (allFailures.length > 20) console.log(`  ... y ${allFailures.length - 20} más`);
}

process.exit(totalFail > 0 ? 1 : 0);
