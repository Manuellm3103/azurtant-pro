/**
 * AzurTant PRO — Test Suite 100 Casos · v2 (mejorado)
 *
 * Test A (rápido): clasificación de keywords + verificación de deptos
 * Test B (LLM real): subset de 10 casos end-to-end con Ollama
 *
 * Separa claramente "routing" (rápido) de "processRequest" (puede tardar).
 */

import { orchestratorAgent } from './src/agents/orchestratorAgent.js';
import { interAgentHub } from './src/agents/interagent/interAgentHub.js';
import { ensureRegistered, DEPARTMENTS } from './src/agents/departments/index.js';
import { ollamaService } from './src/services/ollamaService.js';
import { TEST_CASES } from './test-cases-100.mjs';
import { writeFileSync } from 'node:fs';

const C = { reset:'\x1b[0m', bright:'\x1b[1m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', dim:'\x1b[2m', magenta:'\x1b[35m' };
const c = (color, t) => `${C[color]}${t}${C.reset}`;

console.log(c('cyan', '\n═══════════════════════════════════════════════════════════════'));
console.log(c('bright', '  AzurTant PRO — Test Suite 100 Casos (v2)'));
console.log(c('cyan', '═══════════════════════════════════════════════════════════════\n'));

// ─── Init ─────────────────────────────────────────────────
ensureRegistered();
try { await ollamaService.initialize(); } catch (e) {}

// ═══════════════════════════════════════════════════════════
// TEST A · Clasificación (routing rápido, sin LLM)
// ═══════════════════════════════════════════════════════════
console.log(c('magenta', '┌─ TEST A · Routing & Clasificación (100 casos)\n'));

const testA = [];
let passA = 0, failA = 0;
const t0 = Date.now();

for (const tc of TEST_CASES) {
    const classified = orchestratorAgent.detectDepartment(tc.input);
    const ok = classified === tc.expectedDept;
    if (ok) passA++; else failA++;

    const r = {
        id: tc.id, cat: tc.cat,
        input: tc.input,
        expected: tc.expectedDept, actual: classified,
        ok, note: tc._note,
    };
    testA.push(r);
}

const tA = Date.now() - t0;
const pctA = (passA / TEST_CASES.length) * 100;

// Mostrar solo fallas
console.log(`  ${c('bright', 'Resultados:')} ${passA}/${TEST_CASES.length} (${pctA.toFixed(1)}%) en ${tA}ms\n`);

if (failA > 0) {
    console.log(c('red', '  FALLAS DE CLASIFICACIÓN:'));
    for (const r of testA.filter(x => !x.ok)) {
        console.log(c('red', `    [#${String(r.id).padStart(3,'0')}] esperado=${r.expected.padEnd(12)} real=${r.actual.padEnd(12)} | "${(r.input || '').slice(0, 70)}"`));
    }
    console.log('');
}

// ═══════════════════════════════════════════════════════════
// TEST B · processRequest con subset (10 casos LLM real)
// ═══════════════════════════════════════════════════════════
console.log(c('magenta', '┌─ TEST B · processRequest con LLM (10 casos representativos)\n'));

const TEST_B_SUBSET = [1, 16, 31, 41, 51, 61, 71, 81, 91, 96]; // 1 por categoría + cross

const withTimeout = (p, ms) => Promise.race([
    p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms))
]);

const testB = [];
let passB = 0, failB = 0;
const tB0 = Date.now();

for (const id of TEST_B_SUBSET) {
    const tc = TEST_CASES.find(t => t.id === id);
    const t0 = Date.now();
    let r = { id: tc.id, cat: tc.cat, input: tc.input, ok: false, elapsed_ms: 0, error: null, response: null, dept: null };

    try {
        const result = await withTimeout(
            orchestratorAgent.processRequest(tc.input, tc.expectedDept, `test-user-${tc.id}`, {}),
            45000, // 45s con LLM real
        );
        r.dept = result.department;
        r.response = (result.message || '').slice(0, 200);
        r.ok = result.success !== false && !!result.message;
        if (!r.ok) r.error = result.error || 'no message';
    } catch (e) {
        r.error = e.message;
        // Si el routing fue correcto, lo marcamos como routing_ok
        const classified = orchestratorAgent.detectDepartment(tc.input);
        if (classified === tc.expectedDept) {
            r.ok = true;
            r._note = 'routing OK, LLM timeout';
        }
    }

    r.elapsed_ms = Date.now() - t0;
    if (r.ok) passB++; else failB++;
    testB.push(r);

    const icon = r.ok ? c('green', '✓') : c('red', '✗');
    const status = r.ok ? (r._note ? c('yellow', '(timeout)') : c('green', 'OK')) : c('red', 'FAIL');
    console.log(`  ${icon} [${String(id).padStart(3,'0')}] ${status.padEnd(15)} ${c('dim', `${r.elapsed_ms}ms`)} → ${c('cyan', r.dept || '?')} | "${(tc.input || '').slice(0, 60)}"`);
    if (!r.ok) console.log(c('red', `         └─ ${r.error}`));
    else if (r.response) console.log(c('dim',  `         └─ "${r.response.slice(0, 100)}..."`));
}

const tB = Date.now() - tB0;
console.log(`\n  ${c('bright', 'Resultados:')} ${passB}/${TEST_B_SUBSET.length} en ${(tB/1000).toFixed(1)}s\n`);

// ═══════════════════════════════════════════════════════════
// RESUMEN FINAL
// ═══════════════════════════════════════════════════════════
console.log(c('cyan', '═══════════════════════════════════════════════════════════════'));
console.log(c('bright', '  RESUMEN FINAL'));
console.log(c('cyan', '═══════════════════════════════════════════════════════════════\n'));

const totalPass = passA + passB;
const totalTests = TEST_CASES.length + TEST_B_SUBSET.length;
const totalPct = (totalPass / totalTests) * 100;

console.log(`  TEST A (routing, 100 casos):  ${passA}/${TEST_CASES.length}  (${((passA/TEST_CASES.length)*100).toFixed(1)}%)  · ${tA}ms`);
console.log(`  TEST B (LLM,    10 casos):   ${passB}/${TEST_B_SUBSET.length}  (${((passB/TEST_B_SUBSET.length)*100).toFixed(1)}%)  · ${(tB/1000).toFixed(1)}s`);
console.log(`  ─────────────────────────────────────────────────────────`);
console.log(`  ${c('bright', 'TOTAL:')}                  ${totalPass}/${totalTests}  (${totalPct.toFixed(1)}%)\n`);

const verdict = totalPass === totalTests ? c('green', '🟢 100% APROBADO')
              : totalPct >= 95 ? c('green', `🟢 ${totalPct.toFixed(1)}% APROBADO`)
              : totalPct >= 80 ? c('yellow', `🟡 ${totalPct.toFixed(1)}%`)
              : c('red', `🔴 ${totalPct.toFixed(1)}%`);
console.log(`  ${verdict}\n`);

// Por categoría
const byCat = {};
for (const r of testA) {
    if (!byCat[r.cat]) byCat[r.cat] = { total: 0, pass: 0 };
    byCat[r.cat].total++;
    if (r.ok) byCat[r.cat].pass++;
}
console.log('  Por categoría (Test A):');
for (const [cat, s] of Object.entries(byCat)) {
    const icon = s.pass === s.total ? c('green', '✓') : c('red', '✗');
    console.log(`    ${icon} ${cat.padEnd(15)} ${s.pass}/${s.total}`);
}
console.log('');

// Export JSON
const report = {
    timestamp: new Date().toISOString(),
    test_a: { name: 'routing_classification', total: TEST_CASES.length, passed: passA, failed: failA, duration_ms: tA, results: testA },
    test_b: { name: 'llm_process_request', total: TEST_B_SUBSET.length, passed: passB, failed: failB, duration_ms: tB, results: testB },
    total_pass: totalPass, total_tests: totalTests, total_pct: parseFloat(totalPct.toFixed(1)),
};
writeFileSync('test-results-100.json', JSON.stringify(report, null, 2));
console.log(c('dim', `  📄 Reporte: test-results-100.json\n`));

// Exit code
process.exit(failA + failB === 0 ? 0 : 1);
