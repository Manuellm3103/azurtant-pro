/**
 * Test Co — MultiLLMRouter v2.0
 * Router multi-modelo multi-modal con fallback chains.
 * Generado por AzurTant Factory AI v1.0.0
 * 
 * Modelos disponibles (Ollama Cloud $20/mes):
 *   minimax-m3:cloud         → Orquestación, clasificación
 *   deepseek-v4-pro:cloud    → Análisis profundo, código
 *   qwen3.5:397b-cloud       → Multilingüe, contenido
 *   qwen3-vl:235b-cloud      → Visión, imágenes
 *   deepseek-v4-flash:cloud  → Respuesta rápida
 */

const MODEL_REGISTRY = {
  'minimax-m3:cloud': {
    id: 'minimax-m3:cloud', name: 'MiniMax M3',
    capabilities: ['orchestration', 'classification', 'chat', 'summarization', 'routing'],
    priority: 1, maxTokens: 8192, temperature: 0.7, costProfile: 'balanced',
  },
  'deepseek-v4-pro:cloud': {
    id: 'deepseek-v4-pro:cloud', name: 'DeepSeek V4 Pro',
    capabilities: ['deep_analysis', 'code', 'reasoning', 'math', 'research', 'security'],
    priority: 2, maxTokens: 16384, temperature: 0.3, costProfile: 'premium',
  },
  'qwen3.5:397b-cloud': {
    id: 'qwen3.5:397b-cloud', name: 'Qwen 3.5 397B',
    capabilities: ['multilingual', 'content', 'creative', 'translation', 'writing', 'branding'],
    priority: 3, maxTokens: 8192, temperature: 0.8, costProfile: 'balanced',
  },
  'qwen3-vl:235b-cloud': {
    id: 'qwen3-vl:235b-cloud', name: 'Qwen 3 VL 235B',
    capabilities: ['vision', 'image_analysis', 'ocr', 'screenshot', 'design_review'],
    priority: 4, maxTokens: 4096, temperature: 0.3, costProfile: 'premium',
    multimodal: true, modalities: ['text', 'image'],
  },
  'deepseek-v4-flash:cloud': {
    id: 'deepseek-v4-flash:cloud', name: 'DeepSeek V4 Flash',
    capabilities: ['fast_response', 'simple_tasks', 'classification', 'routing', 'health_check'],
    priority: 5, maxTokens: 4096, temperature: 0.3, costProfile: 'economy',
  },
};

const TASK_MODEL_MAP = {
  orchestrate: 'minimax-m3:cloud', classify: 'minimax-m3:cloud',
  route: 'minimax-m3:cloud', summarize: 'minimax-m3:cloud',
  analyze: 'deepseek-v4-pro:cloud', reason: 'deepseek-v4-pro:cloud',
  code: 'deepseek-v4-pro:cloud', debug: 'deepseek-v4-pro:cloud',
  research: 'deepseek-v4-pro:cloud', security: 'deepseek-v4-pro:cloud',
  math: 'deepseek-v4-pro:cloud', audit: 'deepseek-v4-pro:cloud',
  architecture: 'deepseek-v4-pro:cloud', plan: 'deepseek-v4-pro:cloud',
  write: 'qwen3.5:397b-cloud', create: 'qwen3.5:397b-cloud',
  translate: 'qwen3.5:397b-cloud', content: 'qwen3.5:397b-cloud',
  branding: 'qwen3.5:397b-cloud', copy: 'qwen3.5:397b-cloud',
  social: 'qwen3.5:397b-cloud', design_text: 'qwen3.5:397b-cloud',
  vision: 'qwen3-vl:235b-cloud', image: 'qwen3-vl:235b-cloud',
  ocr: 'qwen3-vl:235b-cloud', screenshot: 'qwen3-vl:235b-cloud',
  photo: 'qwen3-vl:235b-cloud',
  quick: 'deepseek-v4-flash:cloud', ping: 'deepseek-v4-flash:cloud',
  health: 'deepseek-v4-flash:cloud', status: 'deepseek-v4-flash:cloud',
};

const FALLBACK_CHAINS = {
  'minimax-m3:cloud': ['deepseek-v4-flash:cloud', 'qwen3.5:397b-cloud'],
  'deepseek-v4-pro:cloud': ['minimax-m3:cloud', 'deepseek-v4-flash:cloud'],
  'qwen3.5:397b-cloud': ['minimax-m3:cloud', 'deepseek-v4-flash:cloud'],
  'qwen3-vl:235b-cloud': ['deepseek-v4-pro:cloud', 'minimax-m3:cloud'],
  'deepseek-v4-flash:cloud': ['minimax-m3:cloud'],
};

const MODEL_TIMEOUTS = {
  'minimax-m3:cloud': 120000,
  'deepseek-v4-pro:cloud': 180000,
  'qwen3.5:397b-cloud': 120000,
  'qwen3-vl:235b-cloud': 90000,
  'deepseek-v4-flash:cloud': 30000,
};

export class MultiLLMRouter {
  constructor(config = {}) {
    this.defaultModel = config.defaultModel || 'minimax-m3:cloud';
    this.ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
    this.maxRetries = config.maxRetries || 3;
    this.fallbackEnabled = config.fallbackEnabled !== false;
    this.deptId = config.deptId || 'core';
    this.projectName = 'Test Co';
    this.modelHealth = {};
    for (const mid of Object.keys(MODEL_REGISTRY)) {
      this.modelHealth[mid] = { healthy: true, lastCheck: 0, failures: 0 };
    }
    this.stats = { total: 0, ok: 0, fail: 0, fallbacks: 0, usage: {} };
    for (const mid of Object.keys(MODEL_REGISTRY)) this.stats.usage[mid] = 0;
  }

  selectModel(task, ctx = {}) {
    if (ctx.forceModel && MODEL_REGISTRY[ctx.forceModel]) return ctx.forceModel;
    if (ctx.images || ctx.multimodal) return 'qwen3-vl:235b-cloud';
    const t = (typeof task === 'string' ? task : task.type || '').toLowerCase();
    for (const [kw, m] of Object.entries(TASK_MODEL_MAP)) {
      if (t.includes(kw)) return m;
    }
    if (ctx.urgent || ctx.quick) return 'deepseek-v4-flash:cloud';
    return this.defaultModel;
  }

  async route(task, ctx = {}) {
    const t0 = Date.now();
    this.stats.total++;
    const msgs = this._msgs(task, ctx);
    const primary = this.selectModel(task, ctx);
    const opts = this._opts(primary, ctx);

    let res = await this._try(primary, msgs, opts, ctx);
    if (res.ok) { this._ok(primary); return { ...res, deptId: this.deptId, model: primary, modelInfo: MODEL_REGISTRY[primary], fallback: false, latency_ms: Date.now() - t0, ts: new Date().toISOString() }; }

    if (this.fallbackEnabled) {
      const fbs = FALLBACK_CHAINS[primary] || [];
      for (const fb of fbs) {
        if (!this.modelHealth[fb]?.healthy) continue;
        this.stats.fallbacks++;
        const fbRes = await this._try(fb, msgs, this._opts(fb, ctx), ctx);
        if (fbRes.ok) { this._ok(fb); return { ...fbRes, deptId: this.deptId, model: fb, modelInfo: MODEL_REGISTRY[fb], fallback: true, latency_ms: Date.now() - t0, ts: new Date().toISOString() }; }
      }
    }

    this.stats.fail++;
    return { success: true, message: this._contingency(task), model: 'fallback', deptId: this.deptId, fallback: true, emergency: true, latency_ms: Date.now() - t0 };
  }

  async _try(modelId, msgs, opts, ctx) {
    const timeout = MODEL_TIMEOUTS[modelId] || 120000;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeout);
    try {
      const body = { model: modelId, messages: msgs, stream: false, options: { temperature: opts.temp, num_predict: opts.maxT, num_ctx: opts.ctxSize || 8192 } };
      if (ctx.images && modelId === 'qwen3-vl:235b-cloud') {
        const last = [...body.messages].reverse().find(m => m.role === 'user');
        if (last) {
          const parts = [{ type: 'text', text: typeof last.content === 'string' ? last.content : '' }];
          for (const img of ctx.images) parts.push({ type: 'image_url', image_url: { url: typeof img === 'string' ? img : img.url || img.data } });
          last.content = parts;
        }
      }
      const r = await fetch(this.ollamaUrl + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      return { ok: true, message: d.message?.content || '' };
    } catch (e) {
      const h = this.modelHealth[modelId] || { failures: 0 }; h.failures++; if (h.failures >= 3) h.healthy = false; this.modelHealth[modelId] = h;
      return { ok: false, error: e.name === 'AbortError' ? 'timeout' : e.message };
    } finally { clearTimeout(tid); }
  }

  _msgs(task, ctx) {
    const msgs = [];
    if (ctx.systemPrompt) msgs.push({ role: 'system', content: ctx.systemPrompt });
    msgs.push({ role: 'user', content: typeof task === 'string' ? task : task.message || task.prompt || JSON.stringify(task) });
    return msgs;
  }

  _opts(modelId, ctx) {
    const r = MODEL_REGISTRY[modelId] || {};
    return { temp: ctx.temperature || r.temperature || 0.7, maxT: ctx.maxTokens || r.maxTokens || 4096, ctxSize: ctx.contextSize || 8192 };
  }

  _ok(modelId) {
    this.stats.ok++; this.stats.usage[modelId] = (this.stats.usage[modelId] || 0) + 1;
    this.modelHealth[modelId] = { healthy: true, lastCheck: Date.now(), failures: 0 };
  }

  _contingency(task) {
    const t = typeof task === 'string' ? task.substring(0, 100) : 'tu solicitud';
    return '[' + this.deptId + '] Recibido: "' + t + '". Todos los modelos están temporalmente no disponibles. Protocolo de contingencia activado. Se procesará al restablecerse la conexión.';
  }

  async healthCheck() {
    const r = {};
    for (const mid of Object.keys(MODEL_REGISTRY)) {
      try {
        const resp = await fetch(this.ollamaUrl + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: mid, messages: [{ role: 'user', content: 'ping' }], stream: false, options: { num_predict: 1 } }), signal: AbortSignal.timeout(8000) });
        r[mid] = { healthy: resp.ok };
        this.modelHealth[mid] = { healthy: resp.ok, lastCheck: Date.now(), failures: resp.ok ? 0 : (this.modelHealth[mid]?.failures || 0) + 1 };
      } catch { r[mid] = { healthy: false }; this.modelHealth[mid] = { healthy: false, lastCheck: Date.now(), failures: (this.modelHealth[mid]?.failures || 0) + 1 }; }
    }
    return r;
  }

  getBestModel(pref = null) {
    if (pref && this.modelHealth[pref]?.healthy) return pref;
    for (const [mid, h] of Object.entries(this.modelHealth)) { if (h.healthy) return mid; }
    return this.defaultModel;
  }

  getStats() { return { ...this.stats, health: { ...this.modelHealth }, defaultModel: this.defaultModel, deptId: this.deptId, fallbackEnabled: this.fallbackEnabled }; }

  getManifest() {
    return {
      name: 'MultiLLMRouter — ' + this.deptId, version: '2.0.0', project: this.projectName,
      models: Object.entries(MODEL_REGISTRY).map(([id, info]) => ({ id, name: info.name, capabilities: info.capabilities, multimodal: info.multimodal || false, costProfile: info.costProfile })),
      taskMappings: TASK_MODEL_MAP, fallbackChains: FALLBACK_CHAINS,
      totalModels: Object.keys(MODEL_REGISTRY).length,
      activeModels: Object.values(this.modelHealth).filter(h => h.healthy).length,
    };
  }
}

export { MODEL_REGISTRY, TASK_MODEL_MAP, FALLBACK_CHAINS, MODEL_TIMEOUTS };
export default MultiLLMRouter;
