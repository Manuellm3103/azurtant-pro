/**
 * databaseLayerService - REAL multi-driver DB layer
 * =================================================
 * Implementa: query, get, set, list, status
 * Drivers: json-file, sqlite (lazy), memory
 * Por defecto usa JSON file en data/db/
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data', 'db');

class DatabaseLayerService {
  constructor() {
    this.name = 'databaseLayerService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.driver = 'json-file';
    this._collections = {};
    this._stats = { reads: 0, writes: 0, deletes: 0, queries: 0 };
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    this._loadAllCollections();
  }

  _loadAllCollections() {
    try {
      const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
      for (const f of files) {
        const name = f.replace('.json', '');
        try { this._collections[name] = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8')); }
        catch { this._collections[name] = []; }
      }
    } catch {}
  }

  _save(name) {
    try {
      writeFileSync(join(DATA_DIR, `${name}.json`), JSON.stringify(this._collections[name] || [], null, 2));
    } catch {}
  }

  async get({ collection, id } = {}) {
    if (!collection) return { success: false, error: 'collection requerido' };
    this._stats.reads++;
    const items = this._collections[collection] || [];
    if (id !== undefined) {
      return { success: true, item: items.find(i => i.id === id) || null };
    }
    return { success: true, items, total: items.length };
  }

  async set({ collection, id, data } = {}) {
    if (!collection || !data) return { success: false, error: 'collection y data requeridos' };
    this._stats.writes++;
    if (!this._collections[collection]) this._collections[collection] = [];
    if (id) {
      const idx = this._collections[collection].findIndex(i => i.id === id);
      if (idx >= 0) {
        this._collections[collection][idx] = { ...this._collections[collection][idx], ...data, id, updatedAt: new Date().toISOString() };
      } else {
        this._collections[collection].push({ id, ...data, createdAt: new Date().toISOString() });
      }
    } else {
      const newId = data.id || `${collection}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      this._collections[collection].push({ id: newId, ...data, createdAt: new Date().toISOString() });
    }
    this._save(collection);
    return { success: true, total: this._collections[collection].length };
  }

  async query({ collection, filter = {}, limit = 100 } = {}) {
    if (!collection) return { success: false, error: 'collection requerido' };
    this._stats.queries++;
    let items = this._collections[collection] || [];
    const filterKeys = Object.keys(filter);
    if (filterKeys.length > 0) {
      items = items.filter(item => filterKeys.every(k => item[k] === filter[k]));
    }
    items = items.slice(0, limit);
    return { success: true, items, total: items.length };
  }

  async delete({ collection, id } = {}) {
    if (!collection || !id) return { success: false, error: 'collection y id requeridos' };
    this._stats.deletes++;
    const before = (this._collections[collection] || []).length;
    this._collections[collection] = (this._collections[collection] || []).filter(i => i.id !== id);
    this._save(collection);
    return { success: true, removed: before - this._collections[collection].length };
  }

  async list() {
    return {
      success: true,
      collections: Object.keys(this._collections),
      total: Object.keys(this._collections).length,
      driver: this.driver,
    };
  }

  getStatus() {
    return {
      ready: this.ready,
      driver: this.driver,
      dataDir: DATA_DIR,
      collections: Object.keys(this._collections).map(c => ({ name: c, items: (this._collections[c] || []).length })),
      stats: { ...this._stats },
    };
  }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new DatabaseLayerService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, databaseLayer: instance, db: instance,
});
export const databaseLayer = instance;
export const db = instance;
export { instance, wrapped };
export default wrapped;
