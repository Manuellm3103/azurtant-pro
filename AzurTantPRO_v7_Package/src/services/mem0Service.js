/**
 * mem0Service — Memory layer real
 * ================================
 * Implementa: add, getDashboard, search, recall, remember
 * Persiste en data/memories.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const MEM_FILE = join(DATA_DIR, 'memories.json');

class Mem0Service {
  constructor() {
    this.name = 'mem0Service';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.memories = this._load();
  }

  _load() {
    try {
      if (existsSync(MEM_FILE)) return JSON.parse(readFileSync(MEM_FILE, 'utf8'));
    } catch {}
    return [];
  }

  _save() {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(MEM_FILE, JSON.stringify(this.memories.slice(-2000), null, 2));
    } catch {}
  }

  async add(content, metadata = {}) {
    if (!content) return { success: false, error: 'content requerido' };
    const mem = {
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ts: new Date().toISOString(),
      content,
      userId: metadata.userId || 'default',
      category: metadata.category || 'general',
      tags: metadata.tags || [],
      importance: metadata.importance || 0.5,
    };
    this.memories.push(mem);
    this._save();
    return { success: true, memory: mem };
  }

  async search({ query, limit = 10, userId } = {}) {
    let items = this.memories;
    if (userId) items = items.filter(m => m.userId === userId);
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(m => m.content.toLowerCase().includes(q));
    }
    return { success: true, items: items.slice(-limit), total: items.length };
  }

  async recall({ userId, limit = 10 } = {}) {
    let items = userId ? this.memories.filter(m => m.userId === userId) : this.memories;
    return { success: true, items: items.slice(-limit), total: items.length };
  }

  async remember(content, metadata) {
    return this.add(content, metadata);
  }

  getDashboard() {
    const total = this.memories.length;
    const byCategory = {};
    for (const m of this.memories) {
      const c = m.category || 'general';
      byCategory[c] = (byCategory[c] || 0) + 1;
    }
    return {
      total,
      byCategory,
      byUser: this._countBy(this.memories, 'userId'),
      lastAdded: this.memories[this.memories.length - 1],
      timestamp: new Date().toISOString(),
    };
  }

  _countBy(arr, field) {
    const counts = {};
    for (const item of arr) {
      const key = item[field] || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  getStatus() {
    return { ready: this.ready, total: this.memories.length, name: this.name };
  }

  status() { return this.getStatus(); }
  stats() { return this.getDashboard(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new Mem0Service();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, mem0: instance, memory: instance,
});
export const mem0 = instance;
export { instance, wrapped };
export default wrapped;
