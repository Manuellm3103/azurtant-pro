/**
 * AzurTant PRO — Cron Scheduler
 * Ejecuta tareas recurrentes sobre los agentes sin intervención humana.
 *
 * Uso:
 *   import { scheduler } from './src/scheduler.js';
 *   scheduler.schedule('0 9 * * *', 'finanzas', 'Genera el reporte de cierre diario');
 *   scheduler.schedule cada 15 min, tecnologia, 'Health check de servidores');
 *   scheduler.list();
 *   scheduler.run('daily_closing');  // ejecuta manualmente
 */

import { orchestratorAgent } from './agents/orchestratorAgent.js';
import { ensureRegistered, DEPARTMENTS } from './agents/departments/index.js';

class Scheduler {
    constructor() {
        this.jobs = new Map();
        this.intervals = new Map();
        this.running = false;
        this.history = [];
    }

    // Cron parser minimalista: soporta "*", "*/n", "5", rangos "1-5", listas "1,3,5"
    _parseCron(expr) {
        const parts = expr.trim().split(/\s+/);
        if (parts.length !== 5) throw new Error(`Cron inválido: "${expr}" (esperado 5 campos)`);
        const [min, hour, dom, mon, dow] = parts.map(this._parseField);
        return { min, hour, dom, mon, dow };
    }

    _parseField(field) {
        if (field === '*') return { type: 'any' };
        if (field.startsWith('*/')) {
            return { type: 'step', value: parseInt(field.slice(2)) };
        }
        if (field.includes(',')) {
            return { type: 'list', values: field.split(',').map(s => parseInt(s)) };
        }
        if (field.includes('-')) {
            const [a, b] = field.split('-').map(s => parseInt(s));
            return { type: 'range', from: a, to: b };
        }
        return { type: 'fixed', value: parseInt(field) };
    }

    _matches(field, value) {
        switch (field.type) {
            case 'any': return true;
            case 'step': return value % field.value === 0;
            case 'list': return field.values.includes(value);
            case 'range': return value >= field.from && value <= field.to;
            case 'fixed': return field.value === value;
            default: return false;
        }
    }

    _cronMatches(cron, date = new Date()) {
        return this._matches(cron.min, date.getMinutes())
            && this._matches(cron.hour, date.getHours())
            && this._matches(cron.dom, date.getDate())
            && this._matches(cron.mon, date.getMonth() + 1)
            && this._matches(cron.dow, date.getDay());
    }

    schedule(id, cronExpr, dept, prompt, opts = {}) {
        if (!DEPARTMENTS[dept]) throw new Error(`Departamento no existe: ${dept}`);
        const cron = this._parseCron(cronExpr);
        this.jobs.set(id, {
            id, cron, cronExpr, dept, prompt,
            enabled: true,
            last_run: null,
            last_status: null,
            last_error: null,
            created_at: new Date().toISOString(),
            ...opts,
        });
        return id;
    }

    unschedule(id) {
        this.jobs.delete(id);
        return true;
    }

    enable(id) { if (this.jobs.has(id)) { this.jobs.get(id).enabled = true; return true; } return false; }
    disable(id) { if (this.jobs.has(id)) { this.jobs.get(id).enabled = false; return true; } return false; }

    list() {
        const items = [];
        for (const job of this.jobs.values()) {
            items.push({
                id: job.id,
                cron: job.cronExpr,
                dept: job.dept,
                prompt: (job.prompt || '').slice(0, 60),
                enabled: job.enabled,
                last_run: job.last_run,
                last_status: job.last_status,
            });
        }
        return items;
    }

    async run(id) {
        const job = this.jobs.get(id);
        if (!job) throw new Error(`Job no existe: ${id}`);
        return this._execute(job);
    }

    async _execute(job) {
        const t0 = Date.now();
        try {
            const result = await orchestratorAgent.processRequest(job.prompt, job.dept, `sched-${job.id}`);
            job.last_run = new Date().toISOString();
            job.last_status = result.success !== false ? 'success' : 'failed';
            job.last_error = result.error || null;
            this.history.push({
                id: job.id, ts: job.last_run, status: job.last_status,
                elapsed_ms: Date.now() - t0, dept: job.dept,
            });
            return { status: job.last_status, elapsed_ms: Date.now() - t0, response: (result.message || '').slice(0, 200) };
        } catch (e) {
            job.last_status = 'error';
            job.last_error = e.message;
            return { status: 'error', error: e.message };
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        ensureRegistered();
        this.intervals.set('tick', setInterval(() => this._tick(), 60000)); // 1 min
        console.log('[scheduler] Iniciado. Jobs:', this.jobs.size);
    }

    stop() {
        this.running = false;
        for (const id of this.intervals.keys()) clearInterval(this.intervals.get(id));
        this.intervals.clear();
    }

    _tick() {
        const now = new Date();
        for (const job of this.jobs.values()) {
            if (!job.enabled) continue;
            if (this._cronMatches(job.cron, now)) {
                // Evitar correr 2 veces en el mismo minuto
                const lastTs = job.last_run ? new Date(job.last_run).getTime() : 0;
                if (now.getTime() - lastTs < 50000) continue;
                console.log(`[scheduler] Ejecutando: ${job.id} (${job.dept})`);
                this._execute(job).catch(e => console.error(`[scheduler] Error: ${e.message}`));
            }
        }
    }
}

export const scheduler = new Scheduler();

// ─── Default jobs preconfigurados (cualquier empresa puede activar) ───
export const DEFAULT_JOBS = [
    { id: 'daily_closing',  cron: '0 22 * * *',  dept: 'finanzas',     prompt: 'Genera el cierre de caja del día: ventas, propinas, CFDI global, reporte del dueño.' },
    { id: 'morning_health', cron: '0 8 * * *',   dept: 'tecnologia',   prompt: 'Health check de servidores, respaldos, alertas de seguridad. Resume estado.' },
    { id: 'weekly_kpis',    cron: '0 9 * * 1',    dept: 'ceo',          prompt: 'Reporte semanal de KPIs por departamento. Identifica tendencias y alertas.' },
    { id: 'inventory_check',cron: '0 23 * * *',   dept: 'operaciones',  prompt: 'Revisa niveles de inventario. Identifica qué reordenar esta semana.' },
    { id: 'inbox_triage',   cron: '*/30 * * * *', dept: 'redes',        prompt: 'Revisa bandeja de WhatsApp/redes. Responde mensajes urgentes, marca los demás.' },
    { id: 'cfdi_pending',   cron: '0 10,14,18 * * *', dept: 'finanzas',  prompt: '¿Hay facturas CFDI pendientes de timbrar? Si hay, timbra automáticamente y notifica.' },
];

export function activateDefaultJobs() {
    for (const j of DEFAULT_JOBS) {
        scheduler.schedule(j.id, j.cron, j.dept, j.prompt);
    }
    return scheduler.list();
}
