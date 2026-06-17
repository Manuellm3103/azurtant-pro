/**
 * workflowService — REAL workflow engine
 * ======================================
 * Implementa: list, create, execute, delete, getStatus
 * Persiste en data/workflows.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execp = promisify(exec);
const DATA_DIR = join(process.cwd(), 'data');
const WORKFLOWS_FILE = join(DATA_DIR, 'workflows.json');

class WorkflowAutomationService {
  constructor() {
    this.name = 'workflowAutomationService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.workflows = this._load();
    this.executions = [];
  }

  _load() {
    try {
      if (existsSync(WORKFLOWS_FILE)) return JSON.parse(readFileSync(WORKFLOWS_FILE, 'utf8'));
    } catch {}
    return this._seedDefaults();
  }

  _seedDefaults() {
    return {
      'wf-health-check': {
        id: 'wf-health-check',
        name: 'Health Check Diario',
        description: 'Verifica servicios clave del sistema',
        steps: [
          { type: 'command', command: process.platform === 'win32' ? 'wmic OS get FreePhysicalMemory /Value' : 'free -h' },
          { type: 'command', command: process.platform === 'win32' ? 'wmic logicaldisk get caption,freespace /format:list' : 'df -h' },
        ],
        schedule: 'daily',
        enabled: true,
        createdAt: new Date().toISOString(),
      },
      'wf-cleanup-temp': {
        id: 'wf-cleanup-temp',
        name: 'Limpieza de Temporales',
        description: 'Limpia archivos temporales del sistema',
        steps: [
          { type: 'command', command: process.platform === 'win32' ? 'del /q /f /s %TEMP%\\*.tmp 2>nul' : 'find /tmp -type f -name "*.tmp" -delete 2>/dev/null' },
        ],
        schedule: 'weekly',
        enabled: true,
        createdAt: new Date().toISOString(),
      },
    };
  }

  _save() {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(WORKFLOWS_FILE, JSON.stringify(this.workflows, null, 2));
    } catch {}
  }

  list({ enabled } = {}) {
    let items = Object.values(this.workflows);
    if (enabled !== undefined) items = items.filter(w => w.enabled === enabled);
    return items;
  }

  create({ name, description, steps, schedule = 'manual', enabled = true } = {}) {
    if (!name || !steps) return { success: false, error: 'name y steps requeridos' };
    const id = 'wf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const wf = { id, name, description, steps, schedule, enabled, createdAt: new Date().toISOString() };
    this.workflows[id] = wf;
    this._save();
    return { success: true, workflow: wf };
  }

  async execute({ id } = {}) {
    const wf = this.workflows[id];
    if (!wf) return { success: false, error: 'Workflow no existe' };
    const execId = 'exec-' + Date.now();
    const results = [];
    for (const step of wf.steps) {
      const ts = new Date().toISOString();
      try {
        if (step.type === 'command') {
          const { stdout, stderr } = await execp(step.command, { timeout: 60000, shell: true });
          results.push({ step, status: 'ok', output: stdout, stderr: stderr?.slice(0, 200), ts });
        } else {
          results.push({ step, status: 'skipped', reason: `Tipo ${step.type} no implementado`, ts });
        }
      } catch (e) {
        results.push({ step, status: 'error', error: e.message.slice(0, 200), ts });
      }
    }
    const execution = { execId, workflowId: id, ts: new Date().toISOString(), results, status: 'completed' };
    this.executions.push(execution);
    return { success: true, execution };
  }

  delete({ id } = {}) {
    if (!this.workflows[id]) return { success: false, error: 'No existe' };
    delete this.workflows[id];
    this._save();
    return { success: true, deleted: id };
  }

  getStatus({ id } = {}) {
    if (id) return this.workflows[id] || null;
    return {
      total: Object.keys(this.workflows).length,
      enabled: Object.values(this.workflows).filter(w => w.enabled).length,
      executions: this.executions.length,
    };
  }

  getDashboard() {
    return {
      workflows: this.getStatus(),
      recentExecutions: this.executions.slice(-10).reverse(),
    };
  }

  async status() { return { ready: this.ready, ...this.getStatus() }; }
  getStatus_legacy() { return this.status(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new WorkflowAutomationService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, workflow: instance,
});
export const workflowAutomation = instance;
export { instance, wrapped };
export default wrapped;
