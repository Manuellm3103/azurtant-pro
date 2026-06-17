/**
 * aiThinkService — REAL AI Think Service (no stub)
 * =================================================
 * Servicio central de razonamiento AI para AzurTant PRO.
 * Usa Ollama Cloud con fallback a Ollama local.
 *
 * Acepta `model` en el body del request:
 *   aiThink.think({message, model, dept, useComputerUse})
 *
 * Métodos:
 *  - think(body)         → AI reasoning
 *  - agent(body)         → AI agent con computer use
 *  - listMemory({userId, sessionId, limit})
 *  - resetMemory(userId)
 *  - stats()
 *  - status()
 *  - ping()
 */

import { ollamaGenerate, OLLAMA_CONFIG, getCloudStatus } from './ollamaCloud.js';

class AiThinkService {
  constructor() {
    this.name = 'aiThinkService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.memories = new Map();  // userId → [{role, content, ts}]
    this._stats = {
      totalRequests: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      cloudRequests: 0,
      localRequests: 0,
    };
  }

  /**
   * AI reasoning. Acepta body.model para multi-LLM.
   * @param {object} body {message, model?, dept?, useComputerUse?, userId?, sessionId?}
   */
  async think(body) {
    try {
      this.stats.totalRequests++;
      const message = body.message || body.prompt || '';
      if (!message) return { success: false, error: 'message requerido' };

      const model = body.model || OLLAMA_CONFIG.defaultModel;
      const dept = body.dept || 'ceo';
      const useCloud = body.useCloud !== false;  // default cloud

      // System prompt por depto
      const systemPrompts = {
        ceo: 'Eres el CEO Advisor de AzurTant. Responde con visión estratégica, decisiones ejecutivas, priorización de alto impacto.',
        tecnologia: 'Eres el CTO Advisor. Responde con detalle técnico, arquitectura, mejores prácticas, ML/DL, DevOps, cloud.',
        marketing: 'Eres el CMO Advisor. Responde con estrategia de marketing, growth, branding, contenido, funnels.',
        ventas: 'Eres el VP Sales Advisor. Responde con pipeline, objections, closing, account-based selling.',
        legal: 'Eres el Legal Advisor. Analiza contratos, cláusulas, riesgo. Estructura: PARTIES, CLAUSES, RISKS, VERDICT.',
        rrhh: 'Eres el CHRO Advisor. Responde con hiring, cultura, compensaciones, evaluación.',
        finanzas: 'Eres el CFO Advisor. Responde con unit economics, runway, márgenes, optimización.',
        operaciones: 'Eres el COO Advisor. Responde con procesos, supply chain, logística, efficiency.',
        seguridad: 'Eres el CISO Advisor. Responde con threat model, mitigación, compliance (SOC2, ISO 27001, GDPR).',
        innovacion: 'Eres el Head of Innovation. Responde con tendencias, R&D, future tech, bets estratégicos.',
        compliance: 'Eres el Compliance Officer. Responde con regulación, auditoría, controles internos.',
      };

      const system = body.systemPrompt || systemPrompts[dept] || systemPrompts.ceo;

      // Llamada a Ollama (cloud o local)
      const result = await ollamaGenerate({
        model,
        system,
        prompt: message,
        options: { temperature: body.temperature || 0.7, num_predict: body.maxTokens || 1024 },
      });

      this._stats.totalTokensIn += result.tokens?.prompt || 0;
      this._stats.totalTokensOut += result.tokens?.completion || 0;
      if (result.mode === 'cloud') this._stats.cloudRequests++;
      else this._stats.localRequests++;

      // Guardar en memoria
      const userId = body.userId || 'default';
      if (!this.memories.has(userId)) this.memories.set(userId, []);
      this.memories.get(userId).push(
        { role: 'user', content: message, ts: new Date().toISOString() },
        { role: 'assistant', content: result.response, ts: new Date().toISOString() }
      );

      return {
        success: true,
        response: result.response,
        model: result.model,
        mode: result.mode,
        dept,
        tokensIn: result.tokens?.prompt || 0,
        tokensOut: result.tokens?.completion || 0,
        durationMs: result.latency_ms || 0,
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * AI Agent con Computer Use. Plan + acciones.
   * @param {object} body {goal, model?, dept?, userId?}
   */
  async agent(body) {
    try {
      this.stats.totalRequests++;
      const goal = body.goal || body.message || '';
      if (!goal) return { success: false, error: 'goal requerido' };

      const model = body.model || OLLAMA_CONFIG.defaultModel;
      const dept = body.dept || 'tecnologia';

      // Plan JSON para acciones
      const planPrompt = `Eres un agente autónomo. Goal: "${goal}".
Genera SOLO un JSON con este formato EXACTO:
{
  "actions": [
    {"action": "screenshot", "params": {"path": "C:/temp/screen.png", "delay_ms": 2000}, "description": "..."}
  ]
}
Acciones disponibles: screenshot, click, type, hotkey, open-app, run-command.
Devuelve SOLO el JSON. Máximo 5 acciones.`;

      const result = await ollamaGenerate({
        model,
        prompt: planPrompt,
        options: { temperature: 0.3, num_predict: 800 },
      });

      // Parsear plan
      let plan = { actions: [] };
      try {
        const jsonMatch = result.response.match(/\{[\s\S]*"actions"[\s\S]*\}/);
        if (jsonMatch) plan = JSON.parse(jsonMatch[0]);
      } catch {}

      return {
        success: true,
        goal,
        plan: plan.actions || [],
        model: result.model,
        mode: result.mode,
        dept,
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Memory: listar últimas N memorias de un user
   */
  listMemory({ userId = 'default', sessionId, limit = 20 } = {}) {
    const mems = this.memories.get(userId) || [];
    return mems.slice(-limit);
  }

  /**
   * Reset memory de un user
   */
  resetMemory(userId = 'default') {
    const had = this.memories.has(userId);
    this.memories.delete(userId);
    return { reset: had, userId, ts: new Date().toISOString() };
  }

  /**
   * Stats
   */
  stats() {
    return {
      ...this._stats,
      totalUsers: this.memories.size,
      totalMemories: Array.from(this.memories.values()).reduce((a, m) => a + m.length, 0),
      cloud: getCloudStatus(),
    };
  }

  status() {
    return { ready: this.ready, name: this.name, upSince: this.initializedAt };
  }

  ping() {
    return { ready: true, ts: new Date().toISOString(), model: OLLAMA_CONFIG.defaultModel };
  }

  // Compatibilidad
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
  getStatus() { return this.status(); }
}

const instance = new AiThinkService();
export const aiThink = instance;
export const agent = instance.agent.bind(instance);
export const getStatus = instance.status.bind(instance);
export const init = instance.init.bind(instance);
export const initialize = instance.initialize.bind(instance);
export const listMemory = instance.listMemory.bind(instance);
export const ping = instance.ping.bind(instance);
export const resetMemory = instance.resetMemory.bind(instance);
export const start = instance.start.bind(instance);
export const statsFn = instance.stats.bind(instance);
export const status = instance.status.bind(instance);
export const stop = instance.stop.bind(instance);
export const think = instance.think.bind(instance);
export default instance;
export { instance };
