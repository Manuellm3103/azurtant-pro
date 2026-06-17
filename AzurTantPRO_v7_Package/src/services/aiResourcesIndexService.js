/**
 * aiResourcesIndexService - REAL AI resources index
 * =================================================
 * Implementa: index, search, listCategories
 * Indexa modelos, skills, datasets disponibles
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'ai-resources.json');

class AiResourcesIndexService {
  constructor() {
    this.name = 'aiResourcesIndexService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.resources = this._load();
    this._stats = { indexes: 0, searches: 0 };
  }

  _load() {
    try { if (existsSync(FILE)) return JSON.parse(readFileSync(FILE, 'utf8')); } catch {}
    return { resources: this._defaultResources() };
  }
  _defaultResources() {
    return [
      { id: 'r-1', type: 'model', name: 'ministral-3:8b-cloud', provider: 'Ollama Cloud', category: 'reasoning', tags: ['fast', 'cloud', 'default'] },
      { id: 'r-2', type: 'model', name: 'gpt-oss:120b-cloud', provider: 'Ollama Cloud', category: 'reasoning', tags: ['large', 'cloud'] },
      { id: 'r-3', type: 'model', name: 'gemma3:4b', provider: 'Ollama Local', category: 'vision', tags: ['vision', 'local', 'multimodal'] },
      { id: 'r-4', type: 'model', name: 'llava:7b', provider: 'Ollama Local', category: 'vision', tags: ['vision', 'local'] },
      { id: 'r-5', type: 'skill', name: 'legal-advisor', provider: 'AzurTant', category: 'legal', tags: ['contracts', 'analysis'] },
      { id: 'r-6', type: 'skill', name: 'marketing-analysis', provider: 'AzurTant', category: 'marketing', tags: ['seo', 'content'] },
      { id: 'r-7', type: 'skill', name: 'skill-security-scanner', provider: 'AzurTant', category: 'security', tags: ['scanning', 'owasp'] },
      { id: 'r-8', type: 'skill', name: 'ml-pipeline', provider: 'AzurTant', category: 'ml', tags: ['classify', 'forecast'] },
    ];
  }
  _save() {
    try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(this.resources, null, 2)); } catch {}
  }

  async index({ type, name, provider, category, tags = [] } = {}) {
    if (!name || !type) return { success: false, error: 'name y type requeridos' };
    const existing = this.resources.resources.find(r => r.name === name && r.type === type);
    if (existing) {
      existing.category = category || existing.category;
      existing.tags = [...new Set([...existing.tags, ...tags])];
    } else {
      this.resources.resources.push({ id: 'r-' + Date.now(), type, name, provider, category, tags });
    }
    this._stats.indexes++;
    this._save();
    return { success: true, total: this.resources.resources.length };
  }

  async search({ query, type, category, limit = 20 } = {}) {
    this._stats.searches++;
    let items = this.resources.resources;
    if (type) items = items.filter(r => r.type === type);
    if (category) items = items.filter(r => r.category === category);
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(r => r.name.toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q)));
    }
    return { success: true, items: items.slice(0, limit), total: items.length };
  }

  async listCategories() {
    const cats = {};
    for (const r of this.resources.resources) {
      const k = `${r.type}:${r.category}`;
      cats[k] = (cats[k] || 0) + 1;
    }
    return { success: true, categories: cats };
  }

  getStatus() {
    return { ready: this.ready, total: this.resources.resources.length, stats: { ...this._stats } };
  }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new AiResourcesIndexService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, aiResources: instance, resources: instance,
});
export const aiResources = instance;
export const resources = instance;
export { instance, wrapped };
export default wrapped;
