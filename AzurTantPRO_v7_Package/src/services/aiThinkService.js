/**
 * AzurTant PRO — AI Think Service (Senior AI Engineer Orchestrator)
 * ==================================================================
 * Orquesta RAG + GraphRAG + mem0 (persistent memory) + ML pipeline
 * + Computer Use para resolver queries complejas en MODO AGENT.
 *
 * Inspirado en:
 *   - NirDiamant/agents-towards-production (mem0 + RAG)
 *   - microsoft/graphrag (graph-local-ollama)
 *   - mem0ai/mem0 (memory layer)
 *
 * Modos:
 *   - 'simple': solo Ollama directo (rápido)
 *   - 'rag': RAG con contexto desde local-rag
 *   - 'graph': multi-hop reasoning con GraphRAG
 *   - 'agent': orquesta tools + memoria + computer use (slow pero smart)
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

const AI_DIR = join(process.cwd(), 'ai_think_data');
const MEMORY_DB = join(AI_DIR, 'memory.db');
const DECISIONS_LOG = join(AI_DIR, 'decisions.jsonl');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.AZURTANT_MODEL || 'qwen2.5:0.5b';

class AIThinkService {
  constructor() {
    this.db = null;
    this._ready = false;
  }

  ready() {
    if (this._ready) return true;
    if (!existsSync(AI_DIR)) mkdirSync(AI_DIR, { recursive: true });
    this.db = new Database(MEMORY_DB);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default',
        session_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        embedding_score REAL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_user ON memory(user_id);
      CREATE INDEX IF NOT EXISTS idx_session ON memory(session_id);
      CREATE INDEX IF NOT EXISTS idx_created ON memory(created_at);
    `);
    this._ready = true;
    return true;
  }

  /**
   * Punto de entrada principal. Decide modo según la query.
   */
  async think({ message, mode, userId = 'default', sessionId, context = {}, useMemory = true, useGraph = false, useRag = true, useComputerUse = false }) {
    this.ready();
    if (!message || message.length < 3) throw new Error('message requerido (min 3 chars)');

    // Auto-detect mode si no se especifica
    if (!mode) {
      if (useComputerUse) mode = 'agent';
      else if (useGraph) mode = 'graph';
      else if (useRag) mode = 'rag';
      else mode = 'simple';
    }

    const t0 = Date.now();
    const trace = { mode, steps: [], tools_used: [] };

    // 1) Recolectar contexto
    let memoryContext = '';
    let ragContext = '';
    let graphContext = '';
    let computerResult = null;

    if (useMemory) {
      const memRes = await this._getRelevantMemory(message, userId, sessionId, 5);
      memoryContext = memRes.context;
      trace.steps.push({ step: 'memory_recall', hits: memRes.count, ms: memRes.ms });
    }

    if (mode === 'rag' || mode === 'agent') {
      try {
        const { localRAG } = await import('./localRAGService.js');
        const ragRes = await localRAG.query(message, { topK: 3, useLLM: false });
        if (ragRes.results) {
          ragContext = ragRes.results.map(r => r.content || r.text).join('\n').slice(0, 1500);
          trace.tools_used.push('localRAG');
        }
        trace.steps.push({ step: 'rag_query', sources: ragRes.results?.length || 0 });
      } catch (e) {
        trace.steps.push({ step: 'rag_query', error: e.message });
      }
    }

    if (useGraph || mode === 'graph') {
      try {
        const { graphRAG } = await import('./graphRAGService.js');
        const nodes = graphRAG.findNodes('entity', {});
        if (nodes.length > 0) {
          graphContext = nodes.slice(0, 5).map(n => `${n.type}:${n.properties?.name || n.id}`).join(', ');
          trace.tools_used.push('graphRAG');
        }
        trace.steps.push({ step: 'graph_query', entities: nodes.length });
      } catch (e) {
        trace.steps.push({ step: 'graph_query', error: e.message });
      }
    }

    if (useComputerUse || mode === 'agent') {
      try {
        const { default: desktop } = await import('./desktopControlService.js');
        computerResult = await desktop.executeAction('screenshot', {}, { dept: 'tecnologia' });
        trace.tools_used.push('computerUse');
        trace.steps.push({ step: 'computer_screenshot', success: computerResult?.ok });
      } catch (e) {
        trace.steps.push({ step: 'computer_use', error: e.message });
      }
    }

    // 2) Construir prompt con contexto
    const systemPrompt = this._buildSystemPrompt(mode, { memoryContext, ragContext, graphContext, computerResult, context });
    const userPrompt = this._buildUserPrompt(message, mode);

    // 3) Llamar Ollama
    const ollamaRes = await this._callOllama(systemPrompt, userPrompt, DEFAULT_MODEL);
    trace.steps.push({ step: 'ollama_call', model: DEFAULT_MODEL, ms: ollamaRes.ms, tokens: ollamaRes.tokens });

    // 4) Persistir en memoria
    if (useMemory) {
      this._saveMemory(userId, sessionId, 'user', message);
      this._saveMemory(userId, sessionId, 'assistant', ollamaRes.text, { mode, tools: trace.tools_used });
    }

    // 5) Log de decisión
    this._logDecision({ message, response: ollamaRes.text, mode, tools: trace.tools_used, userId, sessionId, totalMs: Date.now() - t0 });

    return {
      success: true,
      mode,
      response: ollamaRes.text,
      model: DEFAULT_MODEL,
      tools_used: trace.tools_used,
      context: {
        memory: memoryContext ? 'present' : 'empty',
        rag: ragContext ? `${ragContext.length} chars` : 'empty',
        graph: graphContext ? `${graphContext.length} chars` : 'empty',
        computerUse: computerResult ? 'executed' : 'not_used',
      },
      trace,
      totalMs: Date.now() - t0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Modo AGENT: descompone query, ejecuta tools, sintetiza respuesta.
   * Para queries complejas tipo "investiga X, busca en Y, genera Z".
   */
  async agent({ message, userId = 'default', sessionId, maxSteps = 5 }) {
    this.ready();
    const trace = [];
    let currentMessage = message;
    let finalResponse = null;

    for (let step = 0; step < maxSteps; step++) {
      const t0 = Date.now();
      const res = await this.think({
        message: currentMessage,
        mode: step === 0 ? 'rag' : 'simple',
        userId,
        sessionId,
        useMemory: true,
        useRag: true,
        useGraph: true,
      });
      trace.push({ step, mode: res.mode, response: res.response?.slice(0, 200), ms: Date.now() - t0 });

      // Si la respuesta contiene "FINAL:" o resuelve la query, paramos
      if (res.response && (res.response.includes('FINAL:') || res.response.length > 100)) {
        finalResponse = res.response;
        break;
      }
      currentMessage = `Continúa investigando: ${message}. Lo que sé hasta ahora: ${res.response?.slice(0, 300)}`;
    }

    return {
      success: true,
      mode: 'agent',
      response: finalResponse || 'No se pudo resolver en ' + maxSteps + ' pasos',
      steps: trace,
      totalSteps: trace.length,
    };
  }

  /** Lista memorias de un usuario */
  listMemory({ userId = 'default', limit = 20, sessionId } = {}) {
    this.ready();
    let q = 'SELECT * FROM memory WHERE user_id = ?';
    const params = [userId];
    if (sessionId) { q += ' AND session_id = ?'; params.push(sessionId); }
    q += ' ORDER BY created_at DESC LIMIT ?'; params.push(limit);
    return this.db.prepare(q).all(...params);
  }

  /** Estadísticas del servicio */
  stats() {
    this.ready();
    const total = this.db.prepare('SELECT COUNT(*) as c FROM memory').get().c;
    const users = this.db.prepare('SELECT COUNT(DISTINCT user_id) as c FROM memory').get().c;
    const sessions = this.db.prepare('SELECT COUNT(DISTINCT session_id) as c FROM memory WHERE session_id IS NOT NULL').get().c;
    const recent = this.db.prepare('SELECT COUNT(*) as c FROM memory WHERE created_at > ?').get(new Date(Date.now() - 24 * 3600 * 1000).toISOString()).c;
    return { totalMemories: total, uniqueUsers: users, uniqueSessions: sessions, last24h: recent, model: DEFAULT_MODEL };
  }

  /** Reset memoria de un usuario */
  resetMemory(userId = 'default') {
    this.ready();
    const r = this.db.prepare('DELETE FROM memory WHERE user_id = ?').run(userId);
    return { deleted: r.changes };
  }

  // ─── internals ───

  async _getRelevantMemory(query, userId, sessionId, limit) {
    const t0 = Date.now();
    // Búsqueda simple: últimas N memorias del usuario (keyword matching)
    const rows = this.db.prepare('SELECT * FROM memory WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
    const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = rows.map(r => {
      const text = (r.content || '').toLowerCase();
      let score = 0;
      for (const w of qWords) if (text.includes(w)) score++;
      return { ...r, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    const context = scored.map(r => `[${r.role}] ${r.content}`).join('\n').slice(0, 1500);
    return { context, count: scored.length, ms: Date.now() - t0 };
  }

  _saveMemory(userId, sessionId, role, content, metadata = {}) {
    try {
      this.db.prepare('INSERT INTO memory (user_id, session_id, role, content, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, sessionId, role, content, JSON.stringify(metadata), new Date().toISOString());
    } catch {}
  }

  _logDecision(entry) {
    try {
      appendFileSync(DECISIONS_LOG, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n');
    } catch {}
  }

  _buildSystemPrompt(mode, ctx) {
    const parts = [
      `Eres un AI Senior Engineer de AzurTant PRO (sistema multi-agente para empresas zero-employees).`,
      `Responde en español México. Directo, técnico, sin fluff.`,
    ];
    if (ctx.memoryContext) parts.push(`\nMEMORIA RELEVANTE:\n${ctx.memoryContext}`);
    if (ctx.ragContext) parts.push(`\nCONTEXTO RAG (documentos):\n${ctx.ragContext}`);
    if (ctx.graphContext) parts.push(`\nCONTEXTO GRAFO (entidades):\n${ctx.graphContext}`);
    if (ctx.computerResult) parts.push(`\nCOMPUTER USE: screenshot tomado, ventana activa detectada.`);
    if (mode === 'agent') parts.push(`\nMODO AGENT: razona paso a paso, usa las herramientas, y al final escribe "FINAL:" + tu respuesta consolidada.`);
    return parts.join('\n');
  }

  _buildUserPrompt(message, mode) {
    if (mode === 'agent') return `Query: ${message}\n\nPaso 1: Analiza qué información necesitas.\nPaso 2: Busca en memoria/RAG/grafo.\nPaso 3: Sintetiza respuesta. Termina con "FINAL: <respuesta>".`;
    return message;
  }

  async _callOllama(system, prompt, model) {
    const t0 = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60_000);
    try {
      const r = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, system, prompt, stream: false, options: { temperature: 0.7 } }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const data = await r.json();
      return {
        text: data.response || '',
        tokens: (data.eval_count || 0) + (data.prompt_eval_count || 0),
        ms: Date.now() - t0,
      };
    } catch (e) {
      clearTimeout(t);
      return { text: `[ERROR Ollama: ${e.message}]`, tokens: 0, ms: Date.now() - t0 };
    }
  }
}

export const aiThink = new AIThinkService();
export default aiThink;
