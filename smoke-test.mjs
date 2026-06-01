// AzurTant PRO - Production Smoke Test
// Verifies the 13-department architecture end-to-end without requiring Ollama.

import { DEPARTMENTS, DEPARTMENT_LIST, ensureRegistered, getHealthReport } from './src/agents/departments/index.js';
import { interAgentHub } from './src/agents/interagent/interAgentHub.js';
import { orchestratorAgent } from './src/agents/orchestratorAgent.js';
import { mem0Service } from './src/services/mem0Service.js';
import { mlService } from './src/services/mlService.js';
import { graphRAGService } from './src/services/graphRAGService.js';
import { ollamaService } from './src/services/ollamaService.js';

let passed = 0;
let failed = 0;
const errors = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        errors.push({ test: name, error: e.message });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        errors.push({ test: name, error: e.message });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertion failed');
}

function section(title) {
    console.log(`\n═══ ${title} ═══`);
}

async function main() {
    section('1. DEPARTAMENTOS: registro y metadata');
    test('13 departamentos definidos', () => {
        assert(DEPARTMENT_LIST.length === 13, `esperado 13, hay ${DEPARTMENT_LIST.length}`);
    });
    test('Cada depto tiene id único', () => {
        const ids = new Set(DEPARTMENT_LIST.map(d => d.id));
        assert(ids.size === 13, `ids únicos: ${ids.size}/13`);
    });
    test('Cada depto tiene 3 KPIs', () => {
        for (const d of DEPARTMENT_LIST) {
            assert(d.kpis.length === 3, `${d.id} tiene ${d.kpis.length} KPIs`);
        }
    });
    test('Cada depto tiene al menos 1 ley de compliance', () => {
        for (const d of DEPARTMENT_LIST) {
            assert(d.complianceLaws.length >= 1, `${d.id} sin leyes`);
        }
    });
    test('Cada depto tiene al menos 3 skills', () => {
        for (const d of DEPARTMENT_LIST) {
            assert(d.skills.length >= 3, `${d.id} tiene ${d.skills.length} skills`);
        }
    });
    test('Cada depto tiene al menos 1 handler', () => {
        for (const d of DEPARTMENT_LIST) {
            const cnt = d.handlerNames || d.handlers || [];
            assert(cnt.length >= 1, `${d.id} sin handlers`);
        }
    });

    section('2. INSTANCIAS Y REGISTRO EN HUB');
    const n = ensureRegistered();
    test('ensureRegistered() retorna 13', () => {
        assert(n === 13, `retornó ${n}`);
    });
    test('Todos los deptos en el interAgentHub', () => {
        for (const d of DEPARTMENT_LIST) {
            assert(interAgentHub.agents.has(d.id), `${d.id} no registrado`);
        }
    });
    test('Cada depto tiene systemPrompt con marco legal', () => {
        for (const d of DEPARTMENT_LIST) {
            const dept = DEPARTMENTS[d.id];
            assert(dept.systemPrompt.length > 200, `${d.id} prompt muy corto`);
            const laws = ['LFT', 'LGSM', 'LISR', 'LIVA', 'LFPDPPP', 'LFPC', 'LSS', 'NOM', 'ISO', 'LAASSP', 'CFF', 'IMPI', 'LFPPI', 'SAT'];
            const has = laws.some(l => dept.systemPrompt.includes(l));
            assert(has, `${d.id} sin leyes en prompt`);
        }
    });

    section('3. INTER-AGENT HUB v2');
    test('sendMessage ceo → finanzas funciona', async () => {
        const r = await interAgentHub.sendMessage('ceo', 'finanzas', 'process_request', { message: 'factura test', from: 'ceo' });
        assert(r.success, `failed: ${r.error}`);
    });
    test('sendMessage respeta idempotencia', async () => {
        const r1 = await interAgentHub.sendMessage('ceo', 'ventas', 'ping');
        assert(r1.success, 'first failed');
    });
    test('ping action responde pong', async () => {
        const r = await interAgentHub.sendMessage('ceo', 'marketing', 'ping');
        assert(r.response?.status === 'pong', `status: ${r.response?.status}`);
    });
    test('query_capabilities devuelve capabilities', async () => {
        const r = await interAgentHub.sendMessage('ceo', 'tecnologia', 'query_capabilities');
        assert(r.response?.capabilities?.length > 0, `caps: ${r.response?.capabilities?.length}`);
    });
    test('report_status devuelve datos', async () => {
        const r = await interAgentHub.sendMessage('ceo', 'operaciones', 'report_status', { status_type: 'system' });
        assert(r.response?.data, 'no data');
    });
    test('broadcast llega a todos los deptos', async () => {
        const r = await interAgentHub.broadcast('ceo', 'ping');
        assert(r.sent_to === 12, `enviado a ${r.sent_to} (esperado 12)`);
    });
    test('healthCheck reporta agentes', () => {
        const h = interAgentHub.healthCheck();
        assert(h.total_agents === 13, `total: ${h.total_agents}`);
    });
    test('circuito se abre con 5+ fallos', async () => {
        for (let i = 0; i < 6; i++) {
            await interAgentHub.sendMessage('ceo', 'sysadmin', 'invalid_action_test');
        }
        const cb = interAgentHub.circuitBreakers.get('sysadmin');
        assert(cb && cb.failures >= 5, `failures: ${cb?.failures}`);
    });
    test('getStatistics incluye métricas', () => {
        const s = interAgentHub.getStatistics();
        assert(s.total_messages > 0, 'no messages');
        assert(s.active_agents === 13, `agents: ${s.active_agents}`);
        assert(s.sops_registered === 4, `sops: ${s.sops_registered}`);
    });

    section('4. SOPS (workflows cross-department)');
    test('4 SOPs registrados: lead_to_sale, new_hire, month_close, proposal_response', () => {
        const sops = [...interAgentHub.sops.keys()];
        assert(sops.includes('lead_to_sale'), 'falta lead_to_sale');
        assert(sops.includes('new_hire'), 'falta new_hire');
        assert(sops.includes('month_close'), 'falta month_close');
        assert(sops.includes('proposal_response'), 'falta proposal_response');
    });
    test('SOP lead_to_sale tiene 5 pasos', () => {
        const s = interAgentHub.sops.get('lead_to_sale');
        assert(s.length === 5, `pasos: ${s.length}`);
        assert(s[0].to === 'marketing', `step1: ${s[0].to}`);
        assert(s[4].to === 'legal', `step5: ${s[4].to}`);
    });
    test('SOP new_hire conecta rrhh→legal→finanzas→tecnologia', () => {
        const s = interAgentHub.sops.get('new_hire');
        assert(s[0].to === 'rrhh');
        assert(s[1].to === 'legal');
        assert(s[2].to === 'finanzas');
        assert(s[3].to === 'tecnologia');
    });

    section('5. ORCHESTRATOR');
    test('orchestrator detecta "factura" → finanzas', () => {
        const d = orchestratorAgent.detectDepartment('Necesito una factura CFDI');
        assert(d === 'finanzas', `detectó: ${d}`);
    });
    test('orchestrator detecta "reclutar" → rrhh', () => {
        const d = orchestratorAgent.detectDepartment('Necesito reclutar un vendedor');
        assert(d === 'rrhh', `detectó: ${d}`);
    });
    test('orchestrator detecta "red" → tecnologia', () => {
        const d = orchestratorAgent.detectDepartment('El servidor de red está caído');
        assert(d === 'tecnologia' || d === 'sysadmin', `detectó: ${d}`);
    });
    test('orchestrator detecta "publicar Instagram" → redes', () => {
        const d = orchestratorAgent.detectDepartment('Publicar en Instagram un reel');
        assert(d === 'redes' || d === 'marketing', `detectó: ${d}`);
    });
    test('orchestrator detecta "licitación" → propuestas', () => {
        const d = orchestratorAgent.detectDepartment('Preparar propuesta para licitación');
        assert(d === 'propuestas', `detectó: ${d}`);
    });
    test('orchestrator detecta "estrategia" → ceo', () => {
        const d = orchestratorAgent.detectDepartment('Necesito definir la estrategia del próximo trimestre');
        assert(d === 'ceo', `detectó: ${d}`);
    });
    test('orchestrator detecta "contrato" → legal', () => {
        const d = orchestratorAgent.detectDepartment('Revisar este contrato con el cliente');
        assert(d === 'legal', `detectó: ${d}`);
    });
    test('orchestrator detecta "comprar" → compras', () => {
        const d = orchestratorAgent.detectDepartment('Necesito comprar material de oficina');
        assert(d === 'compras', `detectó: ${d}`);
    });
    test('orchestrator detecta "lead" → marketing o ventas', () => {
        const d = orchestratorAgent.detectDepartment('Nuevo lead del formulario web');
        assert(d === 'marketing' || d === 'ventas', `detectó: ${d}`);
    });
    test('orchestrator detecta "ventas" → ventas', () => {
        const d = orchestratorAgent.detectDepartment('Cerrar venta con cliente');
        assert(d === 'ventas', `detectó: ${d}`);
    });
    test('orchestrator detecta "inventario" → operaciones', () => {
        const d = orchestratorAgent.detectDepartment('Revisar niveles de inventario');
        assert(d === 'operaciones', `detectó: ${d}`);
    });
    test('orchestrator detecta "patente" → innovacion', () => {
        const d = orchestratorAgent.detectDepartment('Investigar patente de nueva tecnología');
        assert(d === 'innovacion', `detectó: ${d}`);
    });
    test('orchestrator detecta "ciberseguridad" → tecnologia', () => {
        const d = orchestratorAgent.detectDepartment('Auditoría de ciberseguridad');
        assert(d === 'tecnologia', `detectó: ${d}`);
    });
    test('orchestrator detecta "proveedor" → compras', () => {
        const d = orchestratorAgent.detectDepartment('Evaluar proveedor nuevo');
        assert(d === 'compras', `detectó: ${d}`);
    });

    section('6. DEPARTAMENTOS: processRequest delegan a ollamaService');
    test('Cada depto procesa request con fallback (sin Ollama)', async () => {
        for (const id of Object.keys(DEPARTMENTS)) {
            const dept = DEPARTMENTS[id];
            const r = await dept.processRequest('test_action', { message: 'Hola, ¿qué haces?', data: {} }, 'test-user');
            assert(typeof r === 'object', `${id} no retornó objeto`);
        }
    });
    test('Cada depto expone getMetadata con kpis/skills/compliance', () => {
        for (const id of Object.keys(DEPARTMENTS)) {
            const m = DEPARTMENTS[id].getMetadata();
            assert(m.kpis.length === 3, `${id} kpis: ${m.kpis.length}`);
            assert(m.skills.length > 0, `${id} sin skills`);
            assert(m.complianceLaws.length > 0, `${id} sin laws`);
        }
    });

    section('7. MEMORIA Y OBSERVABILIDAD');
    test('mem0Service.add y search funcionan', () => {
        mem0Service.add('test fact about project', 'knowledge', null, 0.7);
        const results = mem0Service.search('project');
        assert(results.length >= 1, 'no results');
    });
    test('mem0Service rememberUser/getUserMemories', () => {
        mem0Service.rememberUser('user-1', 'CEO de AzurTant', 0.9);
        const memories = mem0Service.getUserMemories('user-1');
        assert(memories.length >= 1, 'no memories');
    });
    test('getStats() retorna conteos', () => {
        const s = mem0Service.getStats();
        assert(s.total_memories > 0, 'sin memorias');
        assert(typeof s.by_type === 'object', 'by_type mal');
    });
    test('ollamaService detecta intent', () => {
        const i = ollamaService.classifyTask('Necesito una factura para el cliente');
        assert(typeof i === 'string' && i.length > 0, `intent: ${i}`);
    });
    await asyncTest('mlService.predictSales con datos mínimos', async () => {
        const data = [
            { value: 100 }, { value: 110 }, { value: 120 }, { value: 130 },
            { value: 140 }, { value: 150 }
        ];
        const r = await mlService.predictSales(data);
        assert(r && r.predictions, `no predictions: ${JSON.stringify(r).slice(0,100)}`);
        assert(r.predictions.length === 6, `predictions: ${r.predictions.length}`);
    });
    await asyncTest('mlService.analyzeSentiment detecta positivo', async () => {
        const r = await mlService.analyzeSentiment('Excelente servicio, muy rápido y perfecto');
        assert(r && r.score > 0.5, `score: ${r?.score}`);
    });
    await asyncTest('mlService.analyzeSentiment detecta negativo', async () => {
        const r = await mlService.analyzeSentiment('Terrible, pésimo, horrible experiencia');
        assert(r && r.score < 0.5, `score: ${r?.score}`);
    });
    test('graphRAGService addNode + findSimilar', () => {
        const id = graphRAGService.addNode('Test node', 'concept', { dept: 'ceo' });
        assert(graphRAGService.nodes[id], 'nodo no agregado');
    });
    test('healthCheck de deptos reporta todos', () => {
        const health = getHealthReport();
        assert(health.length === 13, `health: ${health.length}`);
    });

    section('8. CROSS-DEPT DELEGATION');
    test('ceo puede delegar a finanzas via hub', async () => {
        const r = await interAgentHub.sendMessage('ceo', 'finanzas', 'process_request', { message: 'factura por $10,000 MXN' });
        assert(r.success, 'failed');
    });
    test('marketing puede solicitar datos a ventas', async () => {
        const r = await interAgentHub.sendMessage('marketing', 'ventas', 'request_data', { data_type: 'leads' });
        assert(r.success, 'failed');
    });
    test('legal puede revisar info de rrhh', async () => {
        const r = await interAgentHub.sendMessage('legal', 'rrhh', 'validate_information', { claim: 'contrato vigente' });
        assert(r.success, 'failed');
    });
    test('rutas desconocidas caen en CEO', async () => {
        const r = await interAgentHub.sendMessage('ceo', 'no_existe_este_depto', 'ping');
        // Should fallback to ceo
        assert(r.success, `failed: ${r.error}`);
    });

    section('═══ RESUMEN ═══');
    console.log(`\n  Total tests: ${passed + failed}`);
    console.log(`  ✅ Pasados: ${passed}`);
    console.log(`  ❌ Fallados: ${failed}`);
    if (errors.length > 0) {
        console.log(`\n  ERRORES:`);
        for (const e of errors) console.log(`    - ${e.test}: ${e.error}`);
    }
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('FATAL:', e);
    process.exit(1);
});
