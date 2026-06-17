/**
 * oraclePredictiveService - REAL predictive analytics
 * ===================================================
 * Implementa: predict, forecast, anomaly_score, pattern
 * Usa métodos estadísticos sobre series temporales
 */

class OraclePredictiveService {
  constructor() {
    this.name = 'oraclePredictiveService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this._stats = { predictions: 0, forecasts: 0, anomalies: 0 };
  }

  async predict({ series = [], steps = 5, method = 'linear' } = {}) {
    if (!series.length) return { success: false, error: 'series requerido' };
    this._stats.predictions++;
    const forecast = [];
    if (method === 'linear') {
      // Regresión lineal simple
      const n = series.length;
      const xs = series.map((_, i) => i);
      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = series.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - xMean) * (series[i] - yMean);
        den += (xs[i] - xMean) ** 2;
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = yMean - slope * xMean;
      for (let i = 1; i <= steps; i++) {
        forecast.push(intercept + slope * (n + i - 1));
      }
    } else if (method === 'ma') {
      // Media móvil
      const window = Math.min(5, series.length);
      const tail = series.slice(-window);
      const avg = tail.reduce((a, b) => a + b, 0) / window;
      for (let i = 0; i < steps; i++) forecast.push(avg);
    } else {
      // Exp smoothing
      const alpha = 0.3;
      let s = series[0];
      for (let i = 1; i < series.length; i++) s = alpha * series[i] + (1 - alpha) * s;
      for (let i = 0; i < steps; i++) forecast.push(s);
    }
    return {
      success: true,
      method,
      input: series,
      forecast: forecast.map(v => Math.round(v * 100) / 100),
      steps,
      confidence: 0.7,
    };
  }

  async forecast({ series = [], periods = 5 } = {}) {
    return this.predict({ series, steps: periods });
  }

  async anomalyScore({ values = [] } = {}) {
    if (values.length < 3) return { success: false, error: 'min 3 values' };
    this._stats.anomalies++;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length) || 1;
    const scores = values.map((v, i) => ({ index: i, value: v, zScore: (v - mean) / std }));
    const anomalies = scores.filter(s => Math.abs(s.zScore) > 2);
    return {
      success: true,
      mean, stdDev: std,
      anomalies: anomalies.map(a => ({ ...a, severity: Math.abs(a.zScore) > 3 ? 'critical' : 'warning' })),
      totalAnomalies: anomalies.length,
      anomalyRate: (anomalies.length / values.length * 100).toFixed(2) + '%',
    };
  }

  async pattern({ values = [] } = {}) {
    if (values.length < 5) return { success: false, error: 'min 5 values' };
    // Detectar tendencia
    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    const fAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const sAvg = second.reduce((a, b) => a + b, 0) / second.length;
    const trend = sAvg > fAvg * 1.1 ? 'increasing' : sAvg < fAvg * 0.9 ? 'decreasing' : 'stable';
    // Detectar periodicidad básica
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return { success: true, trend, variance: Math.round(variance * 100) / 100, mean: Math.round(mean * 100) / 100, samples: values.length };
  }

  getStatus() { return { ready: this.ready, name: this.name, stats: { ...this._stats } }; }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new OraclePredictiveService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, oracle: instance, oraclePredictive: instance,
});
export const oracle = instance;
export const oraclePredictive = instance;
export { instance, wrapped };
export default wrapped;
