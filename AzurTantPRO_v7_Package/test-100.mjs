#!/usr/bin/env node
/**
 * test-100.mjs — Test suite completa
 * ===================================
 * Prueba todos los endpoints de AzurTant PRO con curl real.
 * Output: resumen de OK/fail por categoría.
 *
 * Uso: node test-100.mjs
 */

import { writeFileSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:5182';
let ok = 0, fail = 0, skip = 0;
const results = [];

async function test(method, path, body = null, expectField = null, opts = {}) {
  const url = BASE + path;
  const init = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  if (opts.timeout) init.signal = AbortSignal.timeout(opts.timeout);

  try {
    const r = await fetch(url, init);
    const ct = r.headers.get('content-type') || '';
    let data;
    if (ct.includes('json')) data = await r.json();
    else data = await r.text();

    const passed = r.ok && (!expectField || (typeof data === 'object' && data[expectField] !== undefined));
    const result = {
      method, path,
      status: r.status,
      passed,
      hasField: expectField ? (typeof data === 'object' ? data[expectField] !== undefined : 'text') : null,
    };
    if (passed) ok++; else fail++;
    results.push(result);
    return result;
  } catch (e) {
    fail++;
    results.push({ method, path, error: e.message, passed: false });
    return { passed: false, error: e.message };
  }
}

// ═══ TESTS ═══
console.log(`\n═══ TEST SUITE — ${BASE} ═══\n`);

// CORE
await test('GET', '/api/health', null, 'status');
await test('GET', '/api/status');
await test('GET', '/api/llm/status', null, 'mode');
await test('GET', '/api/llm/models');
await test('GET', '/api/llm/cloud-models', null, 'subscription');

// AI
await test('POST', '/api/ai/think', { message: 'hola', dept: 'ceo' }, 'response', { timeout: 60000 });
await test('GET', '/api/ai/stats', null, 'success');
await test('GET', '/api/ai/memory', null, 'memories');

// AUTH
await test('POST', '/api/auth/register', { email: `test${Date.now()}@x.com`, name: 'Test', password: 'pwd123', tenantId: 't_emanuel_default' }, 'ok');
await test('POST', '/api/auth/login', { username: 'ceo@azurcorp.com', password: 'superSecret2026', tenantId: 't_t_azur_main_1781717860062' }, 'success');
await test('GET', '/api/auth/me');
await test('GET', '/api/auth/stats', null, 'success');
await test('GET', '/api/auth/tenants', null, 'success');

// MULTI-MODAL
await test('GET', '/api/multimodal/stats', null, 'capabilities');
await test('POST', '/api/multimodal/analyze', { type: 'image', prompt: 'describe' });

// VOICE
await test('GET', '/api/voice/status', null, 'status');
await test('POST', '/api/voice/tts', { text: 'hola' });

// SUPPORT
await test('POST', '/api/support/ticket', { title: 'TEST slow pc', description: 'La pc está muy lenta' }, 'ticket');
await test('GET', '/api/support/tickets', null, 'tickets');
await test('GET', '/api/support/stats', null, 'success');

// COMPUTER USE
await test('GET', '/api/computer-use/system-info', null, 'success');
await test('POST', '/api/computer-use/screenshot', { dept: 'tecnologia' });

// CHAT
await test('POST', '/api/chat', { message: 'hola' }, 'success', { timeout: 30000 });

// LEGAL
await test('POST', '/api/legal/analyze-contract', { contract: 'El arrendador no se hace responsable...' }, 'success', { timeout: 60000 });
await test('GET', '/api/legal/stats', null, 'success');

// MARKETING
await test('POST', '/api/marketing/analyze', { url: 'https://www.marblism.com' }, 'success', { timeout: 30000 });

// DEPT
await test('POST', '/api/dept-think', { message: 'optimiza el proceso de ventas', dept: 'ventas' }, 'response', { timeout: 60000 });

// ML
await test('POST', '/api/ml/classify', { text: 'contrato legal' }, 'success');
await test('POST', '/api/ml/score', { text: 'contrato legal' }, 'success');

// SECURITY
await test('POST', '/api/security/scan', { code: 'rm -rf /' }, 'success');

// DEPARTMENTS
await test('GET', '/api/departments', null, 'success');
await test('GET', '/api/departments/blueprints', null, 'success');

// AGENTS
await test('GET', '/api/agents', null, 'success');
await test('GET', '/api/agents/blueprints', null, 'success');

// ANALYTICS
await test('GET', '/api/analytics', null, 'success');
await test('GET', '/api/analytics/dashboard', null, 'success');

// MEMORY
await test('POST', '/api/memory/add', { content: 'test memory' }, 'success');
await test('GET', '/api/memory/recall', null, 'success');

// SKILLS
await test('GET', '/api/skills', null, 'success');

// RAG
await test('GET', '/api/rag/stats', null, 'success');

// GRAPHRAG
await test('GET', '/api/graphrag/stats', null, 'success');

// GOVERNANCE
await test('GET', '/api/governance', null, 'success');
await test('GET', '/api/governance/kpis', null, 'success');

// SHIELD
await test('GET', '/api/shield/dashboard', null, 'success');
await test('GET', '/api/shield/threats', null, 'success');

// NETWORK
await test('GET', '/api/network/dashboard', null, 'success');
await test('GET', '/api/network/devices', null, 'success');

// WORKFLOWS
await test('GET', '/api/workflows', null, 'success');
await test('GET', '/api/workflows/list', null, 'success');

// SWARM
await test('GET', '/api/swarm/status', null, 'success');
await test('GET', '/api/swarm/stats', null, 'success');

// NOTIFICATIONS
await test('GET', '/api/notifications/history', null, 'success');

// VAULT
await test('GET', '/api/vault/stats', null, 'success');

// TOKENS
await test('GET', '/api/tokens/stats', null, 'success');

// EMERGENT
await test('GET', '/api/orchestrator/status', null, 'success');
await test('GET', '/api/swarm/think', null, 'success');

// ═══ RESULTADOS ═══
const total = ok + fail;
const pct = total ? (ok / total * 100).toFixed(1) : 0;

console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
console.log(`║  TEST RESULTS: ${ok}/${total} (${pct}%)                                  ║`);
console.log(`║  ✓ OK: ${ok}    ✗ FAIL: ${fail}    ⊘ SKIP: ${skip}                              ║`);
console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

// Top 10 fallos
const fails = results.filter(r => !r.passed).slice(0, 10);
if (fails.length) {
  console.log('FALLOS:');
  for (const f of fails) {
    console.log(`  ${f.method} ${f.path} → ${f.status || f.error || 'fail'}`);
  }
}

// Guardar resultados
writeFileSync('test-results.json', JSON.stringify({ ok, fail, total, pct, results }, null, 2));
process.exit(fail > 0 ? 1 : 0);
