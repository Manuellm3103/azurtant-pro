/**
 * hitlService — Human-in-the-Loop
 * ================================
 * Implementa: approve, deny, gates, learning, pending, stats
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const HITL_FILE = join(DATA_DIR, 'hitl.json');

class HitlService {
  constructor() {
    this.name = 'hitlService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.gates = this._load();
  }

  _load() {
    try {
      if (existsSync(HITL_FILE)) return JSON.parse(readFileSync(HITL_FILE, 'utf8'));
    } catch {}
    return { pending: [], approved: [], denied: [], learning: [] };
  }

  _save() {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(HITL_FILE, JSON.stringify(this.gates, null, 2));
    } catch {}
  }

  approve({ id, reason, by } = {}) {
    const item = this.gates.pending.find(g => g.id === id);
    if (!item) return { success: false, error: 'Gate no encontrado' };
    item.status = 'approved';
    item.approvedBy = by || 'agent';
    item.approvedAt = new Date().toISOString();
    item.reason = reason;
    this.gates.pending = this.gates.pending.filter(g => g.id !== id);
    this.gates.approved.push(item);
    this._save();
    return { success: true, item };
  }

  deny({ id, reason, by } = {}) {
    const item = this.gates.pending.find(g => g.id === id);
    if (!item) return { success: false, error: 'Gate no encontrado' };
    item.status = 'denied';
    item.deniedBy = by || 'agent';
    item.deniedAt = new Date().toISOString();
    item.reason = reason;
    this.gates.pending = this.gates.pending.filter(g => g.id !== id);
    this.gates.denied.push(item);
    this._save();
    return { success: true, item };
  }

  addGate({ action, reason, severity = 'medium', context = {} } = {}) {
    const gate = {
      id: 'g-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      action, reason, severity, context,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.gates.pending.push(gate);
    this._save();
    return { success: true, gate };
  }

  getPending() { return { success: true, items: this.gates.pending, total: this.gates.pending.length }; }
  listPendingApprovals() { return this.getPending(); }
  getGates() { return { success: true, ...this.gates }; }
  getStats() {
    return {
      pending: this.gates.pending.length,
      approved: this.gates.approved.length,
      denied: this.gates.denied.length,
      total: this.gates.pending.length + this.gates.approved.length + this.gates.denied.length,
    };
  }

  getLearning() { return { success: true, items: this.gates.learning }; }
  applyLearning({ id, decision } = {}) {
    const item = this.gates.learning.find(l => l.id === id);
    if (!item) return { success: false, error: 'No existe' };
    item.applied = decision;
    this._save();
    return { success: true, item };
  }

  status() { return { ready: this.ready, ...this.getStats() }; }
  getStatus() { return this.status(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new HitlService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, hitl: instance,
});
export const hitl = instance;
export { instance, wrapped };
export default wrapped;
