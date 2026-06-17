/**
 * persistentMemoryService - REAL long-term memory
 * ==============================================
 * Implementa: store, recall, search, forget
 * Persiste en data/persistent-memory.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const MEM_FILE = join(DATA_DIR, 'persistent-memory.json');

class PersistentMemoryService {
  constructor() {
    this.name = 'persistentMemoryService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.memories = this._load();
    this._stats = { stores: 0, recalls: 0, forgets: 0 };
  }

  _load() {
    try {
      if (existsSync(MEM_FILE)) return JSON.parse(readFileSync(MEM_FILE, 'utf8'));
    } catch {}
    return { items: [] };
  }

  _save() {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(MEM_FILE, JSON.stringify(this.memories, null, 2));
    } catch {}
  }

  async store({ key, value, category = 'general', ttl = 0 } = {}) {
    if (!key) return { success: false, error: 'key requerido' };
    const item = {
      id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      key, value, category,
      createdAt: new Date().toISOString(),
      expiresAt: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
    };
    // Eliminar anterior con mismo key
    this.memories.items = this.memories.items.filter(m => m.key !== key);
    this.memories.items.push(item);
    this._save();
    this._stats.stores++;
    return { success: true, id: item.id, item };
  }

  async recall({ key, id, query } = {}) {
    this._stats.recalls++;
    if (id) {
      return { success: true, found: this.memories.items.find(m => m.id === id) || null };
    }
    if (key) {
      return { success: true, found: this.memories.items.find(m => m.key === key) || null };
    }
    if (query) {
      const q = query.toLowerCase();
      const matched = this.memories.items.filter(m =>
        m.key.toLowerCase().includes(q) ||
        (typeof m.value === 'string' && m.value.toLowerCase().includes(q)) ||
        m.category.toLowerCase().includes(q)
      );
      return { success: true, found: matched, total: matched.length };
    }
    return { success: true, items: this.memories.items.slice(-50), total: this.memories.items.length };
  }

  async search({ query, limit = 10 } = {}) {
    if (!query) return { success: false, error: 'query requerido' };
    return this.recall({ query });
  }

  async forget({ key, id } = {}) {
    const before = this.memories.items.length;
    this.memories.items = this.memories.items.filter(m => m.key !== key && m.id !== id);
    const removed = before - this.memories.items.length;
    this._save();
    this._stats.forgets += removed;
    return { success: true, removed };
  }

  async cleanup() {
    const now = Date.now();
    const before = this.memories.items.length;
    this.memories.items = this.memories.items.filter(m => !m.expiresAt || new Date(m.expiresAt).getTime() > now);
    const removed = before - this.memories.items.length;
    this._save();
    return { success: true, removed };
  }

  getStatus() {
    return { ready: this.ready, total: this.memories.items.length, stats: { ...this._stats } };
  }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new PersistentMemoryService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, persistentMemory: instance, memory: instance,
});
export const persistentMemory = instance;
export const memory = instance;
export { instance, wrapped };
export default wrapped;
