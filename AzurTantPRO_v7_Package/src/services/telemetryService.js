/**
 * telemetryService — Real-time metrics
 * =====================================
 * Implementa: getMetrics, metrics
 */

class TelemetryService {
  constructor() {
    this.name = 'telemetryService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.metrics = {
      requests: 0,
      errors: 0,
      byEndpoint: {},
      byMethod: {},
      responseTimes: [],
      byStatus: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    };
  }

  record({ method, path, status, durationMs } = {}) {
    this.metrics.requests++;
    this.metrics.byMethod[method] = (this.metrics.byMethod[method] || 0) + 1;
    this.metrics.byEndpoint[path] = (this.metrics.byEndpoint[path] || 0) + 1;
    if (status >= 200 && status < 300) this.metrics.byStatus['2xx']++;
    else if (status >= 300 && status < 400) this.metrics.byStatus['3xx']++;
    else if (status >= 400 && status < 500) { this.metrics.byStatus['4xx']++; this.metrics.errors++; }
    else if (status >= 500) { this.metrics.byStatus['5xx']++; this.metrics.errors++; }
    if (durationMs != null) {
      this.metrics.responseTimes.push(durationMs);
      if (this.metrics.responseTimes.length > 1000) this.metrics.responseTimes.shift();
    }
  }

  getMetrics() {
    const times = this.metrics.responseTimes;
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const p95 = times.length ? times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] : 0;
    return {
      ...this.metrics,
      avgResponseMs: avg,
      p95ResponseMs: p95,
      uptime: process.uptime(),
      memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      timestamp: new Date().toISOString(),
    };
  }

  metrics() { return this.getMetrics(); }
  getStatus() { return { ready: this.ready, ...this.getMetrics() }; }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new TelemetryService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, telemetry: instance,
});
export const telemetry = instance;
export { instance, wrapped };
export default wrapped;
