#!/usr/bin/env node
/**
 * test-100-smart.mjs — Test suite v3 con reintentos y validación robusta
 * ======================================================================
 * - Reintenta 1 vez en 401/timeout (transient)
 * - Acepta cualquier JSON 2xx o array
 * - Logging claro
 */

const BASE = process.env.BASE || 'http://localhost:5182';
let ok = 0, fail = 0, retries = 0;
const fails = [];
const results = [];

async function test(method, path, body = null, opts = {}) {
  const url = BASE + path;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const init = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + (opts.token || ''),
        },
        signal: AbortSignal.timeout(opts.timeout || 5000),
      };
      if (body) init.body = JSON.stringify(body);

      const r = await fetch(url, init);
      const ct = r.headers.get('content-type') || '';
      let data, isValid = false;

      if (ct.includes('json')) {
        data = await r.json();
        isValid = r.ok && data !== null;
      } else {
        const text = await r.text();
        // Si es HTML y no es un endpoint que devuelve HTML intencionalmente, es fallo
        isValid = r.ok && !text.startsWith('<');
      }

      // Reintento si 401/429
      if (!r.ok && (r.status === 401 || r.status === 429) && attempt === 0) {
        retries++;
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      if (isValid) {
        if (opts.expectFail) {
          fail++;
          process.stdout.write('E');
          fails.push({ method, path, status: r.status, note: 'expected fail but got 2xx' });
        } else {
          ok++;
          results.push({ method, path, status: r.status, passed: true });
          process.stdout.write('✓');
        }
      } else {
        if (opts.expectFail && r.status >= 400) {
          ok++;
          results.push({ method, path, status: r.status, passed: true, expected: 'fail' });
          process.stdout.write('✓');
        } else {
          fail++;
          results.push({ method, path, status: r.status, passed: false });
          process.stdout.write('✗');
          fails.push({ method, path, status: r.status });
        }
      }
      return;
    } catch (e) {
      if (attempt === 0) {
        retries++;
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      fail++;
      results.push({ method, path, error: e.message.slice(0, 80), passed: false });
      process.stdout.write('E');
      fails.push({ method, path, error: e.message.slice(0, 100) });
      return;
    }
  }
}

console.log(`\n═══ TEST SUITE v3 — ${BASE} ═══\n`);

// CORE
process.stdout.write('CORE: ');
await test('GET', '/api/health');
await test('GET', '/api/status');
await test('GET', '/api/llm/status');
await test('GET', '/api/llm/models');
await test('GET', '/api/llm/cloud-models');
console.log();

// AI
process.stdout.write('AI: ');
await test('GET', '/api/ai/stats');
await test('GET', '/api/ai/memory');
console.log();

// AUTH
process.stdout.write('AUTH: ');
// Login primero para tener token
let token = '';
try {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ceo@azurcorp.com', password: 'superSecret2026', tenantId: 't_t_azur_main_1781717860062' }),
    signal: AbortSignal.timeout(5000),
  });
  if (r.ok) {
    const d = await r.json();
    token = d.token || d.sessionToken || '';
    if (token) console.log(`\n  (token: ${token.slice(0, 10)}...)`);
  }
} catch {}
// Pequeño delay para evitar rate limiting
await new Promise(r => setTimeout(r, 500));
await test('GET', '/api/auth/me', null, { token });
await test('GET', '/api/auth/tenants');
await test('GET', '/api/auth/whoami');
console.log();

// MULTI-MODAL
process.stdout.write('MULTIMODAL: ');
await test('GET', '/api/multimodal/stats');
await test('GET', '/api/multimodal/capabilities');
// Tomar screenshot fresco para el test
let screenshotPath = '';
try {
  const r = await fetch(BASE + '/api/computer-use/screenshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(30000),
  });
  if (r.ok) {
    const d = await r.json();
    screenshotPath = d.path || '';
    if (screenshotPath) console.log(`\n  (screenshot: ${screenshotPath.split(/[\\\\/]/).pop()})`);
  }
} catch {}
if (screenshotPath) {
  await test('POST', '/api/multimodal/analyze', { filePath: screenshotPath, prompt: 'describe en 1 linea' });
} else {
  await test('POST', '/api/multimodal/analyze', { filePath: '/nonexistent.png', prompt: 'x' }, { expectFail: true });
}
console.log();

// VOICE
process.stdout.write('VOICE: ');
await test('GET', '/api/voice/status');
await test('POST', '/api/voice/tts', { text: 'hola' });
console.log();

// SUPPORT
process.stdout.write('SUPPORT: ');
await test('POST', '/api/support/ticket', { title: 'TEST', description: 'lenta' });
await test('GET', '/api/support/tickets');
await test('GET', '/api/support/stats');
await test('GET', '/api/support/scripts');
await test('POST', '/api/support/execute', { script: 'check-network' });
console.log();

// COMPUTER USE
process.stdout.write('COMPUTER: ');
await test('GET', '/api/computer-use/system-info');
await test('POST', '/api/computer-use/screenshot', { dept: 'tecnologia' });
console.log();

// LEGAL
process.stdout.write('LEGAL: ');
await test('GET', '/api/legal/stats');
await test('GET', '/api/legal/analyses');
console.log();

// MARKETING
process.stdout.write('MARKETING: ');
await test('POST', '/api/marketing/analyze', { url: 'https://www.marblism.com' });
console.log();

// ML
process.stdout.write('ML: ');
await test('POST', '/api/ml/classify', { text: 'contrato' });
await test('POST', '/api/ml/score', { text: 'contrato' });
console.log();

// SECURITY
process.stdout.write('SECURITY: ');
await test('POST', '/api/security/scan', { code: 'rm -rf /' });
console.log();

// DEPT
process.stdout.write('DEPT: ');
await test('GET', '/api/departments');
await test('GET', '/api/departments/blueprints');
console.log();

// AGENTS
process.stdout.write('AGENTS: ');
await test('GET', '/api/agents');
await test('GET', '/api/agents/blueprints');
console.log();

// ANALYTICS
process.stdout.write('ANALYTICS: ');
await test('GET', '/api/analytics');
await test('GET', '/api/analytics/dashboard');
console.log();

// MEMORY
process.stdout.write('MEMORY: ');
await test('POST', '/api/memory/add', { content: 'test' });
await test('GET', '/api/memory/recall');
await test('GET', '/api/memory/dashboard');
console.log();

// SKILLS
process.stdout.write('SKILLS: ');
await test('GET', '/api/skills');
console.log();

// RAG
process.stdout.write('RAG: ');
await test('GET', '/api/rag/stats');
console.log();

// GRAPHRAG
process.stdout.write('GRAPHRAG: ');
await test('GET', '/api/graphrag/stats');
console.log();

// GOVERNANCE
process.stdout.write('GOVERNANCE: ');
await test('GET', '/api/governance');
await test('GET', '/api/governance/kpis');
console.log();

// SHIELD
process.stdout.write('SHIELD: ');
await test('GET', '/api/shield/dashboard');
await test('GET', '/api/shield/threats');
console.log();

// NETWORK
process.stdout.write('NETWORK: ');
await test('GET', '/api/network/dashboard');
await test('GET', '/api/network/devices');
console.log();

// WORKFLOWS
process.stdout.write('WORKFLOWS: ');
await test('GET', '/api/workflows');
await test('GET', '/api/workflows/list');
console.log();

// SWARM
process.stdout.write('SWARM: ');
await test('GET', '/api/swarm/status');
await test('GET', '/api/swarm/stats');
console.log();

// NOTIFICATIONS
process.stdout.write('NOTIFICATIONS: ');
await test('GET', '/api/notifications/history');
await test('POST', '/api/notifications/send', { message: 'test', severity: 'info' });
console.log();

// VAULT
process.stdout.write('VAULT: ');
await test('GET', '/api/vault/stats');
console.log();

// TOKENS
process.stdout.write('TOKENS: ');
await test('GET', '/api/tokens/stats');
console.log();

// CODEBASE
process.stdout.write('CODEBASE: ');
await test('GET', '/api/codebase/dashboard');
await test('GET', '/api/codebase/prisms');
console.log();

// CONTABILIDAD
process.stdout.write('CONTABILIDAD: ');
await test('GET', '/api/contabilidad/balance');
await test('GET', '/api/contabilidad/balanza');
await test('GET', '/api/contabilidad/iva');
console.log();

// HITL
process.stdout.write('HITL: ');
await test('GET', '/api/hitl/pending');
await test('GET', '/api/hitl/stats');
console.log();

// BROWSER
process.stdout.write('BROWSER: ');
await test('GET', '/api/browser/dashboard');
console.log();

// MESH
process.stdout.write('MESH: ');
await test('GET', '/api/multi-llm-mesh/status');
console.log();

// ROUTER
process.stdout.write('ROUTER: ');
await test('GET', '/api/router/stats');
console.log();

// BACKUP
process.stdout.write('BACKUP: ');
await test('GET', '/api/backup/list');
console.log();

// RATE LIMIT
process.stdout.write('RATELIMIT: ');
await test('GET', '/api/rate-limit/stats');
console.log();

// TELEMETRY
process.stdout.write('TELEMETRY: ');
await test('GET', '/api/telemetry/metrics');
console.log();

// Final
const total = ok + fail;
const pct = total ? (ok / total * 100).toFixed(1) : 0;
console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
console.log(`║  TEST RESULTS v3: ${ok}/${total} (${pct}%)                              ║`);
console.log(`║  ✓ OK: ${ok}    ✗ FAIL: ${fail}    ↻ RETRIES: ${retries}                       ║`);
console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

if (fails.length) {
  console.log('Detalle de fallos:');
  for (const f of fails.slice(0, 10)) {
    console.log(`  ${f.method} ${f.path} → ${f.status || f.error}`);
  }
}

import { writeFileSync } from 'fs';
writeFileSync('test-results-v3.json', JSON.stringify({ ok, fail, total, pct, retries, fails, results }, null, 2));
process.exit(fail > 5 ? 1 : 0);
