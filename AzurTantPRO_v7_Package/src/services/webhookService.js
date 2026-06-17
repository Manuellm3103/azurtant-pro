/**
 * webhookService - REAL webhook delivery
 * ======================================
 * Implementa: register, deliver, list, retry
 * Persiste en data/webhooks.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'webhooks.json');

class WebhookService {
  constructor() {
    this.name = 'webhookService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.webhooks = this._load();
    this.deliveries = [];
    this._stats = { registered: 0, delivered: 0, failed: 0, retried: 0 };
  }

  _load() {
    try { if (existsSync(FILE)) return JSON.parse(readFileSync(FILE, 'utf8')); } catch {}
    return { hooks: [] };
  }

  _save() {
    try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(this.webhooks, null, 2)); } catch {}
  }

  async register({ url, events = ['*'], secret = null } = {}) {
    if (!url) return { success: false, error: 'url requerido' };
    const hook = {
      id: 'wh-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      url, events, secret,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.webhooks.hooks.push(hook);
    this._save();
    this._stats.registered++;
    return { success: true, hook };
  }

  async deliver({ event, payload, retries = 2 } = {}) {
    if (!event) return { success: false, error: 'event requerido' };
    const targets = this.webhooks.hooks.filter(h => h.active && (h.events.includes('*') || h.events.includes(event)));
    if (targets.length === 0) return { success: true, delivered: 0, note: 'no subscribers' };
    const results = [];
    for (const hook of targets) {
      let success = false;
      let lastError = null;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const r = await fetch(hook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Event': event,
              'X-Webhook-Id': hook.id,
              ...(hook.secret ? { 'X-Webhook-Secret': hook.secret } : {}),
            },
            body: JSON.stringify({ event, payload, ts: new Date().toISOString() }),
            signal: AbortSignal.timeout(10000),
          });
          if (r.ok) { success = true; this._stats.delivered++; break; }
          lastError = `HTTP ${r.status}`;
        } catch (e) { lastError = e.message; }
        if (attempt < retries) this._stats.retried++;
      }
      if (!success) this._stats.failed++;
      const delivery = { hookId: hook.id, url: hook.url, event, success, error: lastError, ts: new Date().toISOString() };
      this.deliveries.push(delivery);
      results.push(delivery);
    }
    return { success: true, delivered: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
  }

  async list() {
    return { success: true, hooks: this.webhooks.hooks, total: this.webhooks.hooks.length };
  }

  async unregister({ id } = {}) {
    if (!id) return { success: false, error: 'id requerido' };
    const before = this.webhooks.hooks.length;
    this.webhooks.hooks = this.webhooks.hooks.filter(h => h.id !== id);
    this._save();
    return { success: true, removed: before - this.webhooks.hooks.length };
  }

  getStatus() {
    return { ready: this.ready, totalHooks: this.webhooks.hooks.length, totalDeliveries: this.deliveries.length, stats: { ...this._stats } };
  }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new WebhookService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, webhook: instance,
});
export const webhook = instance;
export { instance, wrapped };
export default wrapped;
