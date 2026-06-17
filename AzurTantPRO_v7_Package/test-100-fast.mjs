#!/usr/bin/env node
/**
 * test-100-fast.mjs — Test suite MEJORADA
 * ========================================
 * Acepta respuestas 2xx válidas (JSON o array)
 * Sin timeout estricto (8s por test)
 */

const BASE = process.env.BASE || 'http://localhost:5182';
let ok = 0, fail = 0, skip = 0;
const results = [];
const fails = [];

async function test(method, path, body = null, opts = {}) {
  const url = BASE + path;
  const init = {
    method,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    signal: AbortSignal.timeout(opts.timeout || 6000),
  };
  if (body) init.body = JSON.stringify(body);

  try {
    const r = await fetch(url, init);
    const ct = r.headers.get('content-type') || '';
    let data;
    let isValid = false;

    if (ct.includes('json')) {
      data = await r.json();
      isValid = r.ok && data !== null && data !== undefined;
    } else {
      const text = await r.text();
      // Si retorna HTML, es porque no hay endpoint, no porque falle
      isValid = r.ok && !text.startsWith('<');
    }

    if (isValid) ok++;
    else fail++;
    results.push({ method, path, status: r.status, passed: isValid });
    if (isValid) console.log(`  ✓ ${method} ${path} ${r.status}`);
    else {
      console.log(`  ✗ ${method} ${path} ${r.status}`);
      fails.push({ method, path, status: r.status });
    }
  } catch (e) {
    fail++;
    results.push({ method, path, error: e.message.slice(0, 100), passed: false });
    console.log(`  ✗ ${method} ${path} ERR: ${e.message.slice(0, 60)}`);
    fails.push({ method, path, error: e.message.slice(0, 100) });
  }
}

console.log(`\n═══ TEST SUITE v2 — ${BASE} ═══\n`);

// CORE
console.log('--- CORE ---');
await test('GET', '/api/health');
await test('GET', '/api/status');
await test('GET', '/api/llm/status');
await test('GET', '/api/llm/models');
await test('GET', '/api/llm/cloud-models');

// AI
console.log('--- AI ---');
await test('GET', '/api/ai/stats');
await test('GET', '/api/ai/memory');
await test('GET', '/api/ai/agent');

// AUTH
console.log('--- AUTH ---');
await test('POST', '/api/auth/login', { username: 'ceo@azurcorp.com', password: 'superSecret2026', tenantId: 't_t_azur_main_1781717860062' });
await test('GET', '/api/auth/me');
await test('GET', '/api/auth/stats');
await test('GET', '/api/auth/tenants');

// MULTI-MODAL
console.log('--- MULTI-MODAL ---');
await test('GET', '/api/multimodal/stats');
await test('POST', '/api/multimodal/analyze', { type: 'image', prompt: 'describe' });

// VOICE
console.log('--- VOICE ---');
await test('GET', '/api/voice/status');
await test('POST', '/api/voice/tts', { text: 'hola' });

// SUPPORT
console.log('--- SUPPORT ---');
await test('POST', '/api/support/ticket', { title: 'TEST slow pc', description: 'La pc está muy lenta' });
await test('GET', '/api/support/tickets');
await test('GET', '/api/support/stats');

// COMPUTER USE
console.log('--- COMPUTER USE ---');
await test('GET', '/api/computer-use/system-info');
await test('POST', '/api/computer-use/screenshot', { dept: 'tecnologia' });

// LEGAL
console.log('--- LEGAL ---');
await test('GET', '/api/legal/stats');
await test('GET', '/api/legal/analyses');

// MARKETING
console.log('--- MARKETING ---');
await test('POST', '/api/marketing/analyze', { url: 'https://www.marblism.com' });

// ML
console.log('--- ML ---');
await test('POST', '/api/ml/classify', { text: 'contrato legal' });
await test('POST', '/api/ml/score', { text: 'contrato legal' });

// SECURITY
console.log('--- SECURITY ---');
await test('POST', '/api/security/scan', { code: 'rm -rf /' });

// DEPT
console.log('--- DEPT ---');
await test('GET', '/api/departments');
await test('GET', '/api/departments/blueprints');

// AGENTS
console.log('--- AGENTS ---');
await test('GET', '/api/agents');
await test('GET', '/api/agents/blueprints');

// ANALYTICS
console.log('--- ANALYTICS ---');
await test('GET', '/api/analytics');
await test('GET', '/api/analytics/dashboard');

// MEMORY
console.log('--- MEMORY ---');
await test('POST', '/api/memory/add', { content: 'test memory' });
await test('GET', '/api/memory/recall');
await test('GET', '/api/memory/dashboard');

// SKILLS
console.log('--- SKILLS ---');
await test('GET', '/api/skills');

// RAG
console.log('--- RAG ---');
await test('GET', '/api/rag/stats');

// GRAPHRAG
console.log('--- GRAPHRAG ---');
await test('GET', '/api/graphrag/stats');

// GOVERNANCE
console.log('--- GOVERNANCE ---');
await test('GET', '/api/governance');
await test('GET', '/api/governance/kpis');

// SHIELD
console.log('--- SHIELD ---');
await test('GET', '/api/shield/dashboard');
await test('GET', '/api/shield/threats');

// NETWORK
console.log('--- NETWORK ---');
await test('GET', '/api/network/dashboard');
await test('GET', '/api/network/devices');

// WORKFLOWS
console.log('--- WORKFLOWS ---');
await test('GET', '/api/workflows');
await test('GET', '/api/workflows/list');

// SWARM
console.log('--- SWARM ---');
await test('GET', '/api/swarm/status');
await test('GET', '/api/swarm/stats');

// NOTIFICATIONS
console.log('--- NOTIFICATIONS ---');
await test('GET', '/api/notifications/history');
await test('POST', '/api/notifications/send', { message: 'test', severity: 'info' });

// VAULT
console.log('--- VAULT ---');
await test('GET', '/api/vault/stats');

// TOKENS
console.log('--- TOKENS ---');
await test('GET', '/api/tokens/stats');

// CLOUDFLARE / DEPLOY
console.log('--- DEPLOY ---');
await test('GET', '/api/deploy/status');
await test('GET', '/api/backup/list');

// DESIGN
console.log('--- DESIGN ---');
await test('GET', '/api/design/rules');
await test('GET', '/api/design/prompts');

// PATTERNS
console.log('--- PATTERNS ---');
await test('GET', '/api/patterns/stats');

// RATE-LIMIT
console.log('--- RATE-LIMIT ---');
await test('GET', '/api/rate-limit/stats');

// ROLES
console.log('--- AUTH PERMISSIONS ---');
await test('GET', '/api/auth/whoami');

// TELEMETRY
console.log('--- TELEMETRY ---');
await test('GET', '/api/telemetry/metrics');

// MULTI-TENANT VERIFY
console.log('--- MULTITENANCY ---');
await test('GET', '/api/auth/me', null, { headers: { 'X-Tenant-Id': 't_test_tenant' } });

// Final
const total = ok + fail;
const pct = total ? (ok / total * 100).toFixed(1) : 0;
console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
console.log(`║  TEST RESULTS v2: ${ok}/${total} (${pct}%)                              ║`);
console.log(`║  ✓ OK: ${ok}    ✗ FAIL: ${fail}    ⊘ SKIP: ${skip}                              ║`);
console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

if (fails.length) {
  console.log('Detalle de fallos:');
  for (const f of fails.slice(0, 15)) {
    console.log(`  ${f.method} ${f.path} → ${f.status || f.error}`);
  }
}

import { writeFileSync } from 'fs';
writeFileSync('test-results-v2.json', JSON.stringify({ ok, fail, total, pct, results, fails }, null, 2));
process.exit(fail > 0 ? 1 : 0);
