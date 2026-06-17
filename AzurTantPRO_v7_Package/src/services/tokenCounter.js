/**
 * tokenCounter — REAL token usage tracking
 * ========================================
 * Implementa: getStats
 * Trackea uso por modelo, depto, y tenant.
 */

class TokenCounter {
  constructor() {
    this.name = 'tokenCounter';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.usage = {
      total: { prompt: 0, completion: 0, requests: 0 },
      byModel: {},
      byDept: {},
      byTenant: {},
      history: [],
    };
  }

  record({ model = 'unknown', dept = 'ceo', tenantId = 'default', prompt = 0, completion = 0 }) {
    this.usage.total.prompt += prompt;
    this.usage.total.completion += completion;
    this.usage.total.requests += 1;

    if (!this.usage.byModel[model]) this.usage.byModel[model] = { prompt: 0, completion: 0, requests: 0 };
    this.usage.byModel[model].prompt += prompt;
    this.usage.byModel[model].completion += completion;
    this.usage.byModel[model].requests += 1;

    if (!this.usage.byDept[dept]) this.usage.byDept[dept] = { prompt: 0, completion: 0, requests: 0 };
    this.usage.byDept[dept].prompt += prompt;
    this.usage.byDept[dept].completion += completion;
    this.usage.byDept[dept].requests += 1;

    if (!this.usage.byTenant[tenantId]) this.usage.byTenant[tenantId] = { prompt: 0, completion: 0, requests: 0 };
    this.usage.byTenant[tenantId].prompt += prompt;
    this.usage.byTenant[tenantId].completion += completion;
    this.usage.byTenant[tenantId].requests += 1;

    this.usage.history.push({
      ts: new Date().toISOString(),
      model, dept, tenantId, prompt, completion,
    });
    if (this.usage.history.length > 1000) this.usage.history = this.usage.history.slice(-1000);
  }

  getStats() {
    return {
      total: {
        ...this.usage.total,
        total: this.usage.total.prompt + this.usage.total.completion,
      },
      byModel: this.usage.byModel,
      byDept: this.usage.byDept,
      byTenant: this.usage.byTenant,
      models: Object.keys(this.usage.byModel).length,
      depts: Object.keys(this.usage.byDept).length,
      tenants: Object.keys(this.usage.byTenant).length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  stats() { return this.getStats(); }
  getStatus() { return { ready: this.ready, ...this.getStats().total }; }
  async status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new TokenCounter();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, tokenCounter: instance,
});
export const tokenCounter = instance;
export { instance, wrapped };
export default wrapped;
