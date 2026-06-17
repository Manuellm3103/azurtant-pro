/**
 * ollamaService - REAL Ollama direct API client
 * =============================================
 * Implementa: list, generate, chat, status
 * Conexión directa a Ollama (local + cloud)
 */

class OllamaService {
  constructor() {
    this.name = 'ollamaService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.localUrl = 'http://localhost:11434';
    this.cloudUrl = 'https://ollama.com';
    this.apiKey = process.env.OLLAMA_API_KEY || null;
    this.mode = this.apiKey ? 'cloud' : 'local';
    this._stats = { requests: 0, errors: 0 };
  }

  async list({ mode = null } = {}) {
    const m = mode || this.mode;
    const url = m === 'cloud' ? `${this.cloudUrl}/api/tags` : `${this.localUrl}/api/tags`;
    const headers = m === 'cloud' && this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
    try {
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      this._stats.requests++;
      return { success: true, mode: m, models: data.models || [], count: (data.models || []).length };
    } catch (e) {
      this._stats.errors++;
      return { success: false, error: e.message, mode: m };
    }
  }

  async generate({ model = 'ministral-3:8b-cloud', prompt, options = {} } = {}) {
    if (!prompt) return { success: false, error: 'prompt requerido' };
    this._stats.requests++;
    const url = this.mode === 'cloud' ? `${this.cloudUrl}/api/generate` : `${this.localUrl}/api/generate`;
    const headers = { 'Content-Type': 'application/json' };
    if (this.mode === 'cloud' && this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    try {
      const r = await fetch(url, {
        method: 'POST', headers,
        body: JSON.stringify({ model, prompt, stream: false, ...options }),
        signal: AbortSignal.timeout(60000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      return { success: true, response: data.response || '', model, evalCount: data.eval_count };
    } catch (e) {
      this._stats.errors++;
      return { success: false, error: e.message, model };
    }
  }

  async chat({ model = 'ministral-3:8b-cloud', messages = [], options = {} } = {}) {
    if (!Array.isArray(messages) || messages.length === 0) return { success: false, error: 'messages requerido' };
    this._stats.requests++;
    const url = this.mode === 'cloud' ? `${this.cloudUrl}/api/chat` : `${this.localUrl}/api/chat`;
    const headers = { 'Content-Type': 'application/json' };
    if (this.mode === 'cloud' && this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    try {
      const r = await fetch(url, {
        method: 'POST', headers,
        body: JSON.stringify({ model, messages, stream: false, ...options }),
        signal: AbortSignal.timeout(60000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      return { success: true, message: data.message, model, evalCount: data.eval_count };
    } catch (e) {
      this._stats.errors++;
      return { success: false, error: e.message, model };
    }
  }

  async status() {
    // Health check de ambos modos
    let localOk = false, cloudOk = false;
    try {
      const r = await fetch(`${this.localUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      localOk = r.ok;
    } catch {}
    try {
      if (this.apiKey) {
        const r = await fetch(`${this.cloudUrl}/api/tags`, { headers: { Authorization: `Bearer ${this.apiKey}` }, signal: AbortSignal.timeout(5000) });
        cloudOk = r.ok;
      }
    } catch {}
    return {
      ready: this.ready,
      mode: this.mode,
      local: { url: this.localUrl, available: localOk },
      cloud: { url: this.cloudUrl, available: cloudOk, hasKey: !!this.apiKey },
      stats: { ...this._stats },
    };
  }
  getStatus() { return this.status(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new OllamaService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, ollama: instance,
});
export const ollama = instance;
export { instance, wrapped };
export default wrapped;
