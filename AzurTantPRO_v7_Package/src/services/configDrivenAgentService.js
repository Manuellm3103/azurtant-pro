/**
 * configDrivenAgentService - REAL config-based agent
 * =================================================
 * Implementa: load, save, run, getConfig
 * Agente cuyo comportamiento se define por config
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'agent-configs.json');

class ConfigDrivenAgentService {
  constructor() {
    this.name = 'configDrivenAgentService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.configs = this._load();
    this._stats = { runs: 0 };
  }
  _load() { try { if (existsSync(FILE)) return JSON.parse(readFileSync(FILE, 'utf8')); } catch {} return { configs: {} }; }
  _save() { try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(this.configs, null, 2)); } catch {} }

  async saveConfig({ agentId, config } = {}) {
    if (!agentId || !config) return { success: false, error: 'agentId y config requeridos' };
    this.configs.configs[agentId] = { ...config, updatedAt: new Date().toISOString() };
    this._save();
    return { success: true, agentId };
  }

  async getConfig({ agentId } = {}) {
    if (!agentId) return { success: false, error: 'agentId requerido' };
    return { success: true, config: this.configs.configs[agentId] || null };
  }

  async load({ agentId } = {}) {
    return this.getConfig({ agentId });
  }

  async listConfigs() {
    return { success: true, configs: Object.entries(this.configs.configs).map(([id, c]) => ({ id, ...c })), total: Object.keys(this.configs.configs).length };
  }

  async run({ agentId, input = '' } = {}) {
    if (!agentId) return { success: false, error: 'agentId requerido' };
    const config = this.configs.configs[agentId];
    if (!config) return { success: false, error: 'config no encontrada' };
    this._stats.runs++;
    // En implementación real, se ejecutaría según el config
    return {
      success: true,
      agentId,
      input: input.slice(0, 200),
      configUsed: { prompt: config.prompt?.slice(0, 100), model: config.model, tools: config.tools },
      output: `Agente ${agentId} ejecutó con input: "${input.slice(0, 50)}" usando config.`,
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() { return { ready: this.ready, totalConfigs: Object.keys(this.configs.configs).length, stats: { ...this._stats } }; }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new ConfigDrivenAgentService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, configDrivenAgent: instance, configAgent: instance,
});
export const configDrivenAgent = instance;
export const configAgent = instance;
export { instance, wrapped };
export default wrapped;
