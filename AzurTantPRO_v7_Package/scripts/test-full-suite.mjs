/**
 * test-full-suite.mjs
 * ═══════════════════════════════════════════════════════════
 * Test suite exhaustiva para AzurTant PRO.
 * Cubre TODOS los endpoints con bodies válidos y mide:
 *  - HTTP status
 *  - Tiempo de respuesta
 *  - Contenido de respuesta (presencia de campos esperados)
 *  - Éxito vs fallo
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PRO = process.env.PRO_URL || 'http://localhost:5182';
const FACTORY = process.env.FACTORY_URL || 'http://localhost:5190';

// ═══ ENDPOINTS CON BODIES VÁLIDOS ═══
const PRO_TESTS = [
  // Health
  { method: 'GET', path: '/api/health', expect: 200, fields: ['status'] },
  { method: 'GET', path: '/api/status', expect: 200, fields: ['status'] },

  // Multitenancy
  { method: 'GET', path: '/api/tenants', expect: 200, fields: ['tenants'] },
  { method: 'GET', path: '/api/auth/whoami', expect: 200, fields: ['tenantId'] },
  { method: 'POST', path: '/api/tenants', body: { name: 'Test Co', slug: `test${Date.now()}`, plan: 'pro' }, expect: 201, fields: ['tenant'] },
  { method: 'POST', path: '/api/auth/tenant-register', body: { email: `user${Date.now()}@test.com`, name: 'Test', password: 'demo123', tenantId: 't_emanuel_default' }, expect: 201 },

  // LLM Multi-Model
  { method: 'GET', path: '/api/llm/models', expect: 200, fields: ['default', 'models'] },
  { method: 'POST', path: '/api/llm/generate', body: { prompt: 'Di hola en 3 palabras' }, expect: 200, fields: ['response', 'model'] },
  { method: 'POST', path: '/api/llm/generate', body: { prompt: 'Test', model: 'ministral-3:8b-cloud' }, expect: 200, fields: ['model'] },

  // Multimodal
  { method: 'GET', path: '/api/multimodal/stats', expect: 200, fields: ['capabilities'] },
  { method: 'POST', path: '/api/multimodal/image', body: { filePath: 'C:/Users/Manu/azurant-app/AzurTantPRO_v7_Package/data/screenshots/screen-1781715100045.png', prompt: 'describe en español' }, expect: 200, fields: ['description'] },

  // Computer Use (chat routing)
  { method: 'POST', path: '/api/chat', body: { message: 'toma screenshot', dept: 'tecnologia' }, expect: 200, fields: ['desktopAction'] },
  { method: 'POST', path: '/api/chat', body: { message: 'dame info del sistema', dept: 'tecnologia' }, expect: 200 },
  { method: 'POST', path: '/api/chat', body: { message: 'hola como estas', dept: 'ceo' }, expect: 200, fields: ['message'] },

  // AI
  { method: 'POST', path: '/api/ai/think', body: { message: 'que es la inteligencia artificial' }, expect: 200 },
  { method: 'GET', path: '/api/ai/stats', expect: 200 },

  // Support
  { method: 'POST', path: '/api/support/ticket', body: { title: 'Test', description: 'Test desc', dept: 'tecnologia', level: 'N1' }, expect: 200 },
  { method: 'GET', path: '/api/support/tickets', expect: 200, fields: ['tickets'] },
  { method: 'GET', path: '/api/support/stats', expect: 200 },

  // Legal
  { method: 'POST', path: '/api/legal/analyze-contract', body: { contractText: 'Este contrato establece que el trabajador debe laborar 12 horas diarias sin pago extra.' }, expect: 200 },
  { method: 'GET', path: '/api/legal/analyses', expect: 200 },

  // Marketing
  { method: 'POST', path: '/api/marketing/content', body: { topic: 'lanzamiento de producto AI', channel: 'instagram' }, expect: 200 },

  // Skills
  { method: 'GET', path: '/api/skills', expect: 200, fields: ['skills'] },

  // Security
  { method: 'POST', path: '/api/security/scan', body: { code: 'import os; os.system("rm -rf /")' }, expect: 200, fields: ['blocked'] },

  // ML
  { method: 'POST', path: '/api/ml/classify', body: { text: 'Necesito un abogado' }, expect: 200 },
  { method: 'POST', path: '/api/ml/score', body: { data: [1,2,3,4,5] }, expect: 200 },

  // Voice
  { method: 'POST', path: '/api/voice/tts', body: { text: 'Hola mundo', voice: 'es-MX-DaliaNeural' }, expect: 200 },

  // Departments
  { method: 'GET', path: '/api/departments', expect: 200, fields: ['departments'] },
  { method: 'POST', path: '/api/dept-think', body: { message: 'analiza ventas', dept: 'ventas' }, expect: 200 },

  // GraphRAG
  { method: 'POST', path: '/api/graphrag/build', body: { documents: ['texto de prueba 1', 'texto de prueba 2'] }, expect: 200 },
  { method: 'GET', path: '/api/graphrag/stats', expect: 200 },

  // Memory
  { method: 'POST', path: '/api/memory/remember', body: { content: 'memoria de prueba', category: 'test' }, expect: 200 },
  { method: 'GET', path: '/api/memory/brain', expect: 200 },

  // Factory ecosystem
  { method: 'GET', path: '/api/ecosystem/status', expect: 200 },
  { method: 'POST', path: '/api/ecosystem/generate', body: { type: 'landing', businessName: 'Test Co', industry: 'tech' }, expect: 200 },

  // Network
  { method: 'GET', path: '/api/network/dashboard', expect: 200 },

  // Analytics
  { method: 'GET', path: '/api/dashboard/full', expect: 200 },

  // Quality
  { method: 'GET', path: '/api/quality/dashboard', expect: 200 }
];

const FACTORY_TESTS = [
  { method: 'GET', path: '/api/health', expect: 200 },
  { method: 'GET', path: '/api/ollama-models', expect: 200 }
];

async function runTest(endpoint) {
  const url = `${PRO}${endpoint.path}`;
  const start = Date.now();
  try {
    const opts = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (endpoint.body) opts.body = JSON.stringify(endpoint.body);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    const latency = Date.now() - start;
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}

    const fieldsOk = !endpoint.fields || (data && endpoint.fields.every(f => f in data));
    const statusOk = r.status === endpoint.expect;
    return {
      ok: statusOk && fieldsOk,
      method: endpoint.method,
      path: endpoint.path,
      status: r.status,
      expected: endpoint.expect,
      latency_ms: latency,
      fields_ok: fieldsOk,
      data_size: text.length,
      data_preview: text.slice(0, 150)
    };
  } catch (e) {
    return {
      ok: false,
      method: endpoint.method,
      path: endpoint.path,
      status: 0,
      error: e.message,
      latency_ms: Date.now() - start
    };
  }
}

async function runAll() {
  console.log(`\n═══ AZURTANT PRO v9.0.0 — TEST SUITE EXHAUSTIVA ═══\n`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(`Endpoints a probar: ${PRO_TESTS.length + FACTORY_TESTS.length}\n`);

  const results = { pro: [], factory: [] };

  // Probar PRO secuencial
  for (const ep of PRO_TESTS) {
    process.stdout.write(`  [PRO] ${ep.method.padEnd(5)} ${ep.path.padEnd(50)} ... `);
    const r = await runTest(ep);
    results.pro.push(r);
    process.stdout.write(r.ok ? `✓ ${r.status} (${r.latency_ms}ms)\n` : `✗ ${r.status} (${r.latency_ms}ms)${r.error ? ' ERROR: ' + r.error.slice(0, 50) : ''}\n`);
  }

  // Probar Factory
  for (const ep of FACTORY_TESTS) {
    process.stdout.write(`  [FACTORY] ${ep.method.padEnd(5)} ${ep.path.padEnd(50)} ... `);
    const url = `${FACTORY}${ep.path}`;
    try {
      const r = await fetch(url);
      const ok = r.status === ep.expect;
      results.factory.push({ ok, status: r.status, path: ep.path });
      process.stdout.write(ok ? `✓ ${r.status}\n` : `✗ ${r.status}\n`);
    } catch (e) {
      results.factory.push({ ok: false, path: ep.path, error: e.message });
      process.stdout.write(`✗ ERROR\n`);
    }
  }

  // Resumen
  const totalPro = results.pro.length;
  const okPro = results.pro.filter(r => r.ok).length;
  const totalFactory = results.factory.length;
  const okFactory = results.factory.filter(r => r.ok).length;
  const total = totalPro + totalFactory;
  const ok = okPro + okFactory;
  const pct = ((ok / total) * 100).toFixed(2);

  console.log(`\n═══ RESUMEN ═══\n`);
  console.log(`PRO:      ${okPro}/${totalPro} (${((okPro/totalPro)*100).toFixed(2)}%)`);
  console.log(`Factory:  ${okFactory}/${totalFactory} (${((okFactory/totalFactory)*100).toFixed(2)}%)`);
  console.log(`TOTAL:    ${ok}/${total} (${pct}%)\n`);

  // Fallos
  const failures = results.pro.filter(r => !r.ok);
  if (failures.length > 0) {
    console.log(`═══ FALLOS (${failures.length}) ═══\n`);
    for (const f of failures) {
      console.log(`  ✗ ${f.method} ${f.path} → ${f.status}${f.error ? ' (' + f.error.slice(0, 80) + ')' : ''}`);
    }
  }

  // Guardar reporte
  const report = {
    timestamp: new Date().toISOString(),
    pro: { total: totalPro, ok: okPro, failures: failures.length, results: results.pro },
    factory: { total: totalFactory, ok: okFactory, results: results.factory },
    total: { endpoints: total, ok, pct }
  };
  writeFileSync(join(process.cwd(), 'logs', `test-suite-${new Date().toISOString().slice(0,10)}.json`), JSON.stringify(report, null, 2));
  console.log(`\nReporte guardado en logs/test-suite-${new Date().toISOString().slice(0,10)}.json`);

  process.exit(failures.length === 0 ? 0 : 1);
}

runAll().catch(e => { console.error('FATAL:', e); process.exit(1); });
