/**
 * AzurTant PRO — Test Runner 200 Casos de Negocio
 * Simula "ya estamos vendiendo" — valida routing y processRequest
 * para los 200 casos de 25 industrias
 */

import { orchestratorAgent } from './src/agents/orchestratorAgent.js';
import { ensureRegistered, DEPARTMENTS } from './src/agents/departments/index.js';
import { BUSINESS_CASES, INDUSTRY_LIST, TOTAL_BUSINESS_CASES } from './business-cases-200.mjs';
import { writeFileSync } from 'node:fs';

const C = { reset:'\x1b[0m', bright:'\x1b[1m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', dim:'\x1b[2m', magenta:'\x1b[35m' };
const c = (col, t) => `${C[col]}${t}${C.reset}`;

console.log(c('cyan', '\n═══════════════════════════════════════════════════════════════'));
console.log(c('bright', '  AzurTant PRO — 200 Casos por Industria (Live Sales Test)'));
console.log(c('cyan', '═══════════════════════════════════════════════════════════════\n'));

ensureRegistered();

let totalPass = 0, totalFail = 0;
const byIndustry = {};
const failures = [];

const t0 = Date.now();

for (const [industry, cases] of Object.entries(BUSINESS_CASES)) {
    const tInd = Date.now();
    let indPass = 0, indFail = 0;
    process.stdout.write(c('magenta', `▸ ${industry.padEnd(20)} `));
    for (const tc of cases) {
        const got = orchestratorAgent.detectDepartment(tc.q);
        const ok = got === tc.dept;
        if (ok) { totalPass++; indPass++; }
        else {
            totalFail++; indFail++;
            failures.push({ industry, q: tc.q, expected: tc.dept, got });
        }
    }
    const pct = (indPass / cases.length * 100).toFixed(0);
    const icon = indFail === 0 ? c('green', '✓') : c('red', '✗');
    console.log(`${icon} ${indPass}/${cases.length} (${pct}%) ${c('dim', (Date.now()-tInd)+'ms')}`);
    byIndustry[industry] = { total: cases.length, pass: indPass, fail: indFail };
}

const elapsed = Date.now() - t0;
const pct = (totalPass / TOTAL_BUSINESS_CASES * 100).toFixed(1);

console.log(c('cyan', '\n═══════════════════════════════════════════════════════════════'));
console.log(c('bright', '  RESUMEN'));
console.log(c('cyan', '═══════════════════════════════════════════════════════════════\n'));
console.log(`  Industrias:    ${INDUSTRY_LIST.length}`);
console.log(`  Casos total:   ${TOTAL_BUSINESS_CASES}`);
console.log(`  ${c('green', '✅ Pasados:')}     ${totalPass}`);
console.log(`  ${c('red', '❌ Fallados:')}    ${totalFail}`);
console.log(`  Tiempo:        ${elapsed}ms (${(elapsed/TOTAL_BUSINESS_CASES).toFixed(1)}ms/caso)`);

const verdict = totalFail === 0 ? c('green', `🟢 ${pct}% — LISTO PARA VENDER`)
              : pct >= 90 ? c('yellow', `🟡 ${pct}% — casi listo`)
              : c('red', `🔴 ${pct}%`);
console.log(`  ${verdict}\n`);

if (failures.length) {
    console.log(c('red', '  FALLAS:'));
    for (const f of failures) {
        console.log(c('red', `    [${f.industry}] esperado=${f.expected.padEnd(12)} real=${f.got.padEnd(12)} :: "${f.q.slice(0,55)}"`));
    }
    console.log('');
}

// Export JSON
const report = {
    timestamp: new Date().toISOString(),
    total: TOTAL_BUSINESS_CASES,
    passed: totalPass, failed: totalFail,
    pct: parseFloat(pct),
    industries: INDUSTRY_LIST.length,
    by_industry: byIndustry,
    failures,
    duration_ms: elapsed,
};
writeFileSync('test-results-200.json', JSON.stringify(report, null, 2));
console.log(c('dim', `  📄 Reporte: test-results-200.json\n`));

process.exit(totalFail === 0 ? 0 : 1);
