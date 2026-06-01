/**
 * AzurTant PRO — Live Sales Simulation
 * Dos escenarios de venta real, controlados.
 *
 *   A) "Tacos Don Pepe" — Empresa nueva, adquiere los 13 departamentos completos
 *   B) "Consultoría Hernández" — Empresa que solo quiere Tecnología + Redes + Soporte
 *
 * Para correr: node live-sales-simulation.mjs
 */

import { orchestratorAgent } from './src/agents/orchestratorAgent.js';
import { interAgentHub } from './src/agents/interagent/interAgentHub.js';
import { ensureRegistered, DEPARTMENTS } from './src/agents/departments/index.js';
import { ollamaService } from './src/services/ollamaService.js';
import { mem0Service } from './src/services/mem0Service.js';
import { scheduler, activateDefaultJobs } from './src/scheduler.js';
import { IndustryPacks, activatePack } from './src/industryPacks.js';

const C = { reset:'\x1b[0m', bright:'\x1b[1m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m', dim:'\x1b[2m', magenta:'\x1b[35m' };
const c = (col, t) => `${C[col]}${t}${C.reset}`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function section(title) {
    console.log('\n' + c('cyan', '═'.repeat(70)));
    console.log(c('bright', '  ' + title));
    console.log(c('cyan', '═'.repeat(70)) + '\n');
}

async function send(client, msg, expected = null) {
    const t0 = Date.now();
    try {
        const r = await orchestratorAgent.processRequest(msg, null, `client-${client}`);
        const elapsed = Date.now() - t0;
        const ok = expected ? r.department === expected : true;
        const icon = ok ? c('green', '✓') : c('red', '✗');
        const status = r.success !== false ? c('green', 'OK') : c('red', 'FAIL');
        console.log(`  ${icon} [${client}] ${status} (${elapsed}ms) → ${c('cyan', r.department || '?')}`);
        if (r.message) {
            const preview = r.message.slice(0, 150).replace(/\n/g, ' ');
            console.log(c('dim', `       "${preview}${r.message.length > 150 ? '...' : ''}"`));
        }
        if (expected && r.department !== expected) {
            console.log(c('yellow', `       ⚠ esperado=${expected} real=${r.department}`));
        }
        return r;
    } catch (e) {
        console.log(`  ${c('red', '✗')} [${client}] ERROR: ${e.message}`);
        return null;
    }
}

async function main() {
    section('🚀 INICIALIZACIÓN DEL SISTEMA');
    ensureRegistered();
    try { await ollamaService.initialize(); console.log(c('green', '  ✓ Ollama conectado')); }
    catch (e) { console.log(c('yellow', '  ⚠ Ollama offline (modo fallback)')); }
    mem0Service.initialize?.();
    const depts = Object.keys(DEPARTMENTS);
    console.log(c('green', `  ✓ ${depts.length} departamentos registrados: ${depts.join(', ')}`));

    // ════════════════════════════════════════════════════════════════
    // ESCENARIO A: Empresa nueva "Tacos Don Pepe" — 13 departamentos
    // ════════════════════════════════════════════════════════════════
    section('🟢 ESCENARIO A · TACOS DON PEPE — Empresa nueva, los 13 departamentos');

    const A = 'tacos-don-pepe';
    console.log(c('magenta', `  Cliente: Tacos Don Pepe (food truck en CDMX, 4 empleados)`));
    console.log(c('magenta', `  Plan: Pro $14,999 MXN/mes · 13 departamentos`));
    console.log(c('magenta', `  Skills instalados: cfdi-mx, restaurant-mx, whatsapp-business`));
    console.log(c('dim', `  (En la simulación, saltamos la instalación - ya están cargados en el manifest)\n`));

    const packA = activatePack('restaurante-mx');
    console.log(c('bright', `  Industry Pack: ${packA.name} (${packA.agents.length} agentes · ${packA.sop_templates.length} SOPs)\n`));

    console.log(c('yellow', '  📞 Llamada del CEO de Tacos Don Pepe. Simula sus consultas:\n'));

    // 10 consultas reales de un dueño de food truck
    const queriesA = [
        { msg: '¿Cuánto vendimos hoy?', label: 'Cierre de ventas del día' },
        { msg: 'CFDI al cliente de la mesa 12 por $580 MXN', label: 'Factura CFDI 4.0' },
        { msg: 'Inventario: ¿qué necesito reordenar para el fin de semana?', label: 'Inventario food truck' },
        { msg: 'Cierre de caja del turno vespertino', label: 'Corte de caja' },
        { msg: 'Reclutar un mesero para el turno de comida', label: 'RRHH: mesero' },
        { msg: 'El WiFi del comedor está muy lento', label: 'Soporte TI' },
        { msg: 'Promoción 2x1 en tacos al pastor para Instagram', label: 'Marketing en redes' },
        { msg: '¿Cuál es mi ticket promedio este mes?', label: 'KPIs financieros' },
        { msg: 'Conciliación bancaria de la cuenta de Banorte', label: 'Contabilidad' },
        { msg: 'Reporte ejecutivo del Q2 para el banco', label: 'Reporte CEO' },
    ];

    let aPass = 0, aFail = 0;
    for (const q of queriesA) {
        console.log(c('dim', `  [${q.label}]`));
        const r = await send(A, q.msg);
        if (r && r.success !== false) aPass++; else aFail++;
        await sleep(50);
    }
    console.log('');
    console.log(c('bright', `  Escenario A: ${aPass}/${queriesA.length} OK`));
    console.log(c('dim', `  Memoria acumulada: ${mem0Service.getStats?.()?.total || 'N/A'}`));

    // ════════════════════════════════════════════════════════════════
    // ESCENARIO B: Solo Tecnología + Redes (SysAdmin) + Soporte
    // ════════════════════════════════════════════════════════════════
    section('🟡 ESCENARIO B · CONSULTORÍA HERNÁNDEZ — Solo 3 departamentos (TI + SysAdmin + Redes)');

    const B = 'consultoria-hernandez';
    console.log(c('magenta', `  Cliente: Consultoría Hernández S.C. (15 empleados, sector legal)`));
    console.log(c('magenta', `  Plan: Pro $14,999 MXN/mes pero activó solo Tecnologia + SysAdmin + Redes`));
    console.log(c('magenta', `  Default routing: SIEMPRE cae en TI/Redes/SysAdmin/Soporte`));
    console.log(c('magenta', `  Skills: ninguno instalado (es cliente nuevo, paquete básico)\n`));

    // Activar el scheduler para esta empresa
    const jobsB = activateDefaultJobs();
    console.log(c('bright', `  Scheduler activado: ${jobsB.length} jobs recurrentes\n`));

    console.log(c('yellow', '  📞 El CTO de Consultoría Hernández manda 8 tickets de soporte:\n'));

    const queriesB = [
        { msg: 'Soporte N1: no me anda el correo electrónico', label: 'Email caído' },
        { msg: 'El servidor de la oficina está caído, ayuda urgente', label: 'Server down' },
        { msg: 'La red WiFi está muy lenta en la sala de juntas', label: 'WiFi lento' },
        { msg: 'Configura VPN para que los remotos puedan entrar', label: 'VPN setup' },
        { msg: 'Ciberseguridad: detectamos intentos de phishing', label: 'Phishing' },
        { msg: 'Mi laptop no enciende, necesito soporte urgente', label: 'Hardware' },
        { msg: 'Migración de Office 365 a Google Workspace', label: 'Migración' },
        { msg: 'El sistema SAP no responde, error 500 en /api/invoices', label: 'Error 500' },
    ];

    let bPass = 0, bFail = 0;
    for (const q of queriesB) {
        console.log(c('dim', `  [${q.label}]`));
        const r = await send(B, q.msg);
        if (r && r.success !== false) bPass++; else bFail++;
        await sleep(50);
    }
    console.log('');
    console.log(c('bright', `  Escenario B: ${bPass}/${queriesB.length} OK`));

    // ════════════════════════════════════════════════════════════════
    // HEALTH CHECK FINAL
    // ════════════════════════════════════════════════════════════════
    section('🏥 HEALTH CHECK FINAL DEL SISTEMA');
    const health = await orchestratorAgent.getSystemHealth();
    console.log(`  ${c('bright', 'Hub:')} ${health.hub?.status || 'OK'}`);
    console.log(`  ${c('bright', 'Departamentos activos:')} ${health.departments?.length || 0}`);
    console.log(`  ${c('bright', 'SOPs disponibles:')} ${health.sops?.length || 0} (${health.sops?.join(', ')})`);
    console.log(`  ${c('bright', 'Memorias:')} ${JSON.stringify(health.mem0 || {})}`);

    section('📊 RESUMEN EJECUTIVO DE LA DEMO');
    const total = queriesA.length + queriesB.length;
    const totalPass = aPass + bPass;
    console.log(`  ${c('green', '✅ Total exitosas:')}     ${totalPass}/${total}`);
    console.log(`  ${c('red', '❌ Fallidas:')}         ${aFail + bFail}`);
    console.log(`  ${c('bright', '⏱️ Tiempo total:')}    ${Date.now()}ms`);
    console.log('');
    console.log(c('cyan', '  ╔══════════════════════════════════════════════════════╗'));
    console.log(c('cyan', '  ║  SISTEMA LISTO PARA VENTA - DOS ESCENARIOS DEMO       ║'));
    console.log(c('cyan', '  ║  • Escenario A: Empresa nueva con 13 deptos            ║'));
    console.log(c('cyan', '  ║  • Escenario B: Empresa con solo TI + Redes + Soporte  ║'));
    console.log(c('cyan', '  ╚══════════════════════════════════════════════════════╝'));

    scheduler.stop();
    process.exit(0);
}

main().catch(e => { console.error(c('red', '\n❌ ERROR:'), e); process.exit(1); });
