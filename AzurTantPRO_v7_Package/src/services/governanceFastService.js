/**
 * governanceFastService — REAL governance & KPI tracking
 * =====================================================
 * Implementa: getReport, getActivity, getKPIs, getDailyReport, getAnomalies
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const ACTIVITY_FILE = join(DATA_DIR, 'governance-activity.json');

class GovernanceFastService {
  constructor() {
    this.name = 'governanceFastService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.activities = this._load();
  }

  _load() {
    try {
      if (existsSync(ACTIVITY_FILE)) return JSON.parse(readFileSync(ACTIVITY_FILE, 'utf8'));
    } catch {}
    return [];
  }

  _save() {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(ACTIVITY_FILE, JSON.stringify(this.activities.slice(-1000), null, 2));
    } catch {}
  }

  logActivity(event) {
    const entry = {
      ts: new Date().toISOString(),
      type: event.type || 'info',
      actor: event.actor || 'system',
      action: event.action || '',
      details: event.details || {},
    };
    this.activities.push(entry);
    this._save();
    return entry;
  }

  getActivity({ limit = 50, type, actor } = {}) {
    let items = [...this.activities];
    if (type) items = items.filter(a => a.type === type);
    if (actor) items = items.filter(a => a.actor === actor);
    return items.reverse().slice(0, limit);
  }

  getKPIs() {
    const all = this.activities;
    const now = Date.now();
    const last24h = all.filter(a => now - new Date(a.ts).getTime() < 86400000);
    return {
      totalActivities: all.length,
      last24h: last24h.length,
      byType: this._countBy(all, 'type'),
      byActor: this._countBy(all, 'actor'),
      uptime: process.uptime(),
      memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
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

  getAnomalies() {
    const now = Date.now();
    const last5min = this.activities.filter(a => now - new Date(a.ts).getTime() < 300000);
    const anomalies = [];
    // Detección simple: muchas acciones en poco tiempo
    if (last5min.length > 50) {
      anomalies.push({ severity: 'medium', message: `${last5min.length} acciones en 5min — posible actividad inusual` });
    }
    // Errores frecuentes
    const errors = this.activities.filter(a => a.type === 'error').slice(-10);
    if (errors.length > 5) {
      anomalies.push({ severity: 'high', message: `${errors.length} errores recientes — revisar logs` });
    }
    return anomalies;
  }

  getDailyReport() {
    const kpis = this.getKPIs();
    return {
      date: new Date().toISOString().slice(0, 10),
      kpis,
      recentActivity: this.getActivity({ limit: 20 }),
      anomalies: this.getAnomalies(),
    };
  }

  getReport({ period = '24h' } = {}) {
    const hours = period === '7d' ? 168 : period === '1h' ? 1 : 24;
    const cutoff = Date.now() - hours * 3600000;
    const items = this.activities.filter(a => new Date(a.ts).getTime() > cutoff);
    return {
      period,
      totalEvents: items.length,
      events: items,
      kpis: this.getKPIs(),
    };
  }

  getTokens() {
    return this.getKPIs();
  }

  async status() { return { ready: this.ready, name: this.name }; }
  getStatus() { return this.status(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new GovernanceFastService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, governanceFast: instance,
});
export const governanceFast = instance;
export { instance, wrapped };
export default wrapped;
