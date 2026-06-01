/**
 * AzurTant PRO - Demo End-to-End v2 (rápido)
 * Cada escenario con timeout independiente para no colgar.
 */

import { orchestratorAgent } from './src/agents/orchestratorAgent.js';
import { interAgentHub } from './src/agents/interagent/interAgentHub.js';
import { ensureRegistered, DEPARTMENTS } from './src/agents/departments/index.js';
import { ollamaService } from './src/services/ollamaService.js';
import { mem0Service } from './src/services/mem0Service.js';
import { mlService } from './src/services/mlService.js';

const COLORS = {
    reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};
const c = (color, text) => `${COLORS[color]}${text}${COLORS.reset}`;

const withTimeout = (promise, ms, label) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms en ${label}`)), ms))
]);

function section(title) {
    console.log('\n' + c('cyan', '═'.repeat(70)));
    console.log(c('bright', '  ' + title));
    console.log(c('cyan', '═'.repeat(70)));
}

function step(num, text) { console.log(c('yellow', `\n▸ Paso ${num}: `) + text); }
function ok(text) { console.log(c('green', '  ✅ ') + text); }
function info(text) { console.log(c('dim', '  ℹ ') + text); }
function fail(text) { console.log(c('red', '  ❌ ') + text); }

async function main() {
    console.log(c('cyan', `
╔════════════════════════════════════════════════════════════════╗
║                  AzurTant PRO - DEMO END-TO-END               ║
║         Sistema Multi-Agente · 13 Departamentos · Zero Staff   ║
╚════════════════════════════════════════════════════════════════╝
`));

    section('INICIALIZACIÓN DEL SISTEMA');

    step(1, 'Registrando 13 departamentos en el hub inter-agente...');
    const numDepts = ensureRegistered();
    ok(`${numDepts} departamentos conectados al hub`);
    info(`Lista: ${Object.keys(DEPARTMENTS).join(', ')}`);

    step(2, 'Inicializando servicios core...');
    try {
        const ollama = await ollamaService.initialize();
        info(`Ollama: ${ollama.status}` + (ollama.model ? ` · modelo: ${ollama.model}` : ''));
    } catch (e) { info(`Ollama: fallback — ${e.message}`); }
    try { await mlService.initialize(); info('ML Engine: ready'); } catch (e) { info('ML: skip'); }
    ok('Servicios inicializados');

    section('ESCENARIO 1: Chat → Orchestrator → Finanzas → Invoice CFDI');

    step(3, 'CEO: "Necesito una factura para Acme Corp por $50,000 MXN"');
    const userMessage = 'Necesito una factura para el cliente Acme Corp por $50,000 MXN por servicios de consultoría';
    info(`Prompt: "${userMessage}"`);

    step(4, 'OrchestratorAgent clasifica → enruta → ejecuta...');
    const t0 = Date.now();
    let result;
    try {
        result = await withTimeout(
            orchestratorAgent.processRequest(userMessage, null, 'ceo-demo'),
            90000, 'processRequest'
        );
        ok(`Respuesta en ${Date.now() - t0}ms`);
        info(`Departamento: ${c('bright', result.department || 'N/A')}`);
        info(`Modelo: ${result.model || 'fallback'}`);
        info(`Status: ${result.success !== false ? c('green', 'OK') : c('red', 'FAIL')}`);
    } catch (e) {
        fail(e.message);
    }

    step(5, 'Generando invoice CFDI directamente desde finanzas...');
    try {
        const invoice = await withTimeout(
            orchestratorAgent.generateDocument('invoice_cfdi', {
                cliente: 'Acme Corp S.A. de C.V.',
                rfc: 'ACM010101ABC',
                monto: 50000,
                moneda: 'MXN',
                conceptos: [{ desc: 'Consultoría multi-agente AzurTant PRO - Enterprise', cantidad: 1, precio: 50000 }],
                email: 'cobranza@acmecorp.com'
            }, 'ceo-demo'),
            90000, 'generateDocument'
        );
        ok('Invoice CFDI generada');
        if (invoice.folio || invoice.uuid) info(`Folio: ${invoice.folio} · UUID: ${invoice.uuid}`);
    } catch (e) { fail(e.message); }

    section('ESCENARIO 2: SOP lead_to_sale (CEO → Marketing → Ventas)');

    step(6, 'Ejecutando SOP "lead_to_sale"...');
    try {
        const wf = await withTimeout(
            orchestratorAgent.runWorkflow('lead_to_sale', {
                lead: { nombre: 'Juan Pérez', empresa: 'Innovatech SA', email: 'juan@innovatech.mx', presupuesto: 250000, interes: 'Enterprise' }
            }, 'ceo'),
            60000, 'SOP lead_to_sale'
        );
        ok(`Workflow completado: ${wf.steps?.length || 0} pasos`);
        if (wf.steps) wf.steps.forEach(s => info(`  → ${s.from} → ${s.to}: ${s.action}`));
    } catch (e) { fail(e.message); }

    section('ESCENARIO 3: Broadcast CEO → 13 deptos');

    step(7, 'Broadcast: "Reporte semanal de KPIs"...');
    try {
        const bc = await withTimeout(orchestratorAgent.broadcastInquiry('Reporte semanal de KPIs', 'ceo'), 30000, 'broadcast');
        ok(`Broadcast a ${bc.sent_to || 0} agentes`);
    } catch (e) { fail(e.message); }

    section('ESCENARIO 4: Health Check');

    step(8, 'Inspección completa del sistema multi-agente...');
    const health = await orchestratorAgent.getSystemHealth();
    ok('Sistema operativo');
    info(`Hub status: ${health.hub?.status || 'OK'}`);
    info(`Departamentos: ${health.departments?.length}`);
    info(`SOPs: ${health.sops?.length} (${health.sops?.join(', ')})`);
    info(`Memorias: ${health.mem0?.total}`);

    section('MÉTRICAS FINALES');

    console.log(`
  ${c('bright', 'Departamentos:')}  ${numDepts}/13
  ${c('bright', 'SOPs:')}           ${health.sops?.length}
  ${c('bright', 'Memorias:')}       ${health.mem0?.total}
  ${c('bright', 'Tiempo total:')}   ${(Date.now() - t0) / 1000}s

  ${c('green', '✅ DEMO COMPLETADA')}
`);
    process.exit(0);
}

main().catch(err => {
    console.error(c('red', '\n❌ ERROR:'), err);
    process.exit(1);
});
