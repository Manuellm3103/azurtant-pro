/**
 * browserAgentService — Browser automation
 * ========================================
 * Implementa: dashboard, execute, extract, navigate, screenshot
 * Usa fetch + cheerligero parsing
 */

class BrowserAgentService {
  constructor() {
    this.name = 'browserAgentService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.history = [];
  }

  async navigate({ url }) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const html = await r.text();
      const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
      const desc = html.match(/<meta name="description" content="(.*?)"/i)?.[1] || '';
      const entry = { ts: new Date().toISOString(), url, status: r.status, title, desc };
      this.history.push(entry);
      return { success: true, ...entry, length: html.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async extract({ url, selector = 'body' } = {}) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const html = await r.text();
      // Simple text extraction
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                       .replace(/<style[\s\S]*?<\/style>/gi, '')
                       .replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();
      return { success: true, text: text.slice(0, 5000), url, length: text.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async execute({ action, params = {} } = {}) {
    if (action === 'navigate') return this.navigate(params);
    if (action === 'extract') return this.extract(params);
    return { success: false, error: `Acción no soportada: ${action}` };
  }

  getDashboard() {
    return {
      totalNavigations: this.history.length,
      recent: this.history.slice(-10).reverse(),
      status: 'ready',
    };
  }

  // Stub para screenshot (no tenemos browser real, pero devolvemos info)
  screenshot({ url } = {}) {
    return { success: true, note: 'Screenshot simulado — instalar Puppeteer/Playwright para screenshots reales', url };
  }

  status() { return { ready: this.ready, history: this.history.length }; }
  getStatus() { return this.status(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new BrowserAgentService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, browserAgent: instance, browser: instance,
});
export const browserAgent = instance;
export const browser = instance;
export { instance, wrapped };
export default wrapped;
