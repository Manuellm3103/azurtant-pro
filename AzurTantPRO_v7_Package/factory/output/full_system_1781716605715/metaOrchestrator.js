/**
 * Test Co — Meta-Orquestador
 * Sistema multi-agente con 1 departamentos
 * MultiLLMRouter: 5 modelos con fallback chains
 * Generado por AzurTant Factory AI
 * Cliente: Test Co
 */

import { OperacionesAgent } from './src/departments/operaciones.js';
import { MultiLLMRouter } from './src/multiLLMRouter.js';
import { DesktopControl } from './src/desktopControl.js';

// ═══ META-ORCHESTRATOR (Réplica AzurTant PRO) ═══
class MetaOrchestrator {
  constructor() {
    this.departments = {
  'operaciones': new OperacionesAgent(),
    };
    this.primaryOrchestrator = this.departments[Object.keys(this.departments)[0]];
    this.model = 'minimax-m3:cloud';
    this.initialized = false;
    this.router = new MultiLLMRouter({
      deptId: 'meta-orchestrator',
      defaultModel: 'minimax-m3:cloud',
      projectName: 'Test Co',
    });
  }

  async initialize() {
    if (this.initialized) return true;
    await this.router.healthCheck();
    for (const [id, agent] of Object.entries(this.departments)) {
      if (agent.register) agent.register();
    }
    this.initialized = true;
    console.log(`[MetaOrchestrator] ${Object.keys(this.departments).length} agentes activos | MultiLLMRouter: ${Object.keys(this.router.getStats().health).filter(k => this.router.getStats().health[k].healthy).length} modelos`);
    return true;
  }

  /**
   * Orquestador Principal — contacto humano directo
   * Clasifica el mensaje con LLM (via MultiLLMRouter), delega al departamento adecuado, consolida respuesta
   */
  async processHumanRequest(message, userId = 'cliente', context = {}) {
    await this.initialize();

    // 1. Clasificar con MultiLLMRouter (modelo óptimo automático)
    const targetDept = await this._classifyWithLLM(message);
    const agent = this.departments[targetDept] || this.primaryOrchestrator;

    // 2. Delegar al departamento (con timeout de 120s)
    const response = await Promise.race([
      agent.processRequest(message, { ...context, userId }, userId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 120000)),
    ]).catch(() => ({
      success: true,
      message: '[' + targetDept + '] Procesando tu solicitud. El agente está trabajando...',
      department: targetDept,
      model: this.router.getBestModel(),
      fallback: true,
    }));

    // 3. Extraer @delegaciones de la respuesta y ejecutar sub-deptos
    const delegations = this._extractDelegations(response.message || '');
    const subResponses = {};
    for (const deptId of delegations) {
      if (this.departments[deptId] && deptId !== targetDept) {
        try {
          const sub = await this.departments[deptId].processRequest(message, { userId }, userId);
          subResponses[deptId] = sub.message || sub.response || '';
        } catch {}
      }
    }

    if (Object.keys(subResponses).length > 0) {
      const parts = [];
      for (const [id, text] of Object.entries(subResponses)) {
        parts.push('[' + id + ']: ' + text);
      }
      return {
        success: true,
        message: (response.message || response.response || '') + '\\n\\n---\\n' + parts.join('\\n\\n'),
        department: targetDept,
        subDepartments: Object.keys(subResponses),
        model: response.model || this.router.getBestModel(),
      };
    }

    return {
      success: true,
      message: response.message || response.response || '',
      department: targetDept,
      model: response.model || this.router.getBestModel(),
      desktopActions: await DesktopControl.processAgentResponse(response.message || response.response || ''),
    };
  }

  /**
   * CLASIFICACIÓN INTELIGENTE con MultiLLMRouter
   */
  async _classifyWithLLM(message) {
    const deptList = Object.keys(this.departments).map(id => {
      const a = this.departments[id];
      return id + '=' + (a.name || a.id);
    }).join(', ');
    try {
      const result = await this.router.route('classify: ' + message, {
        systemPrompt: 'Eres un clasificador de mensajes. Responde ÚNICAMENTE con el ID del departamento más adecuado de esta lista: ' + deptList + '. Responde solo el ID, nada más. Si no estás seguro, responde con el primer departamento.',
        temperature: 0.1,
        maxTokens: 20,
      });
      const classified = (result.message || '').trim().toLowerCase();
      for (const deptId of Object.keys(this.departments)) {
        if (classified === deptId || classified.includes(deptId)) return deptId;
      }
      return Object.keys(this.departments)[0];
    } catch {
      return this._classify(message);
    }
  }

  _extractDelegations(text) {
    const matches = text.match(/@(\w+)/g) || [];
    return [...new Set(matches.map(m => m.slice(1)))];
  }

  getStatus() {
    return {
      client: 'Test Co',
      agents: Object.keys(this.departments).length,
      model: this.model,
      primaryOrchestrator: Object.keys(this.departments)[0],
      departments: Object.keys(this.departments),
    };
  }

  _classify(message) {
    const msg = message.toLowerCase();
    const keywords = {
      marketing: ['marketing','campaña','anuncio','seo','sem','contenido','blog','red social','instagram','facebook','tiktok','branding','logo','marca'],
      ventas: ['venta','cliente','lead','pipeline','deal','propuesta','cotización','prospecto','cierre','comisión'],
      finanzas: ['factura','cfdi','sat','impuesto','iva','isr','contabilidad','balance','flujo','caja','nómina','salario'],
      legal: ['contrato','legal','demanda','ley','nda','abogado','jurídico','cláusula'],
      tecnologia: ['servidor','error','bug','código','api','programación','software','hardware','red','wifi'],
      rrhh: ['empleado','rrhh','reclutar','entrevista','cv','contratación','despido','vacaciones'],
      operaciones: ['logística','inventario','envío','entrega','ruta','cadena','suministro'],
      compras: ['comprar','proveedor','cotizar','adquisición'],
      seguridad: ['seguridad','hack','vulnerabilidad','phishing','malware','virus'],
      innovacion: ['innovar','patente','investigación','paper','arxiv'],
      redes: ['instagram','facebook','tiktok','twitter','linkedin','post','reel','hashtag'],
      sysadmin: ['servidor','backup','dns','ssl','dominio','hosting','cpu','ram','disco'],
      propuestas: ['propuesta','licitación','concurso','gobierno'],
    };
    const scores = {};
    for (const [dept, kws] of Object.entries(keywords)) {
      scores[dept] = kws.filter(k => msg.includes(k)).length;
    }
    const best = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
    return (best && best[1] > 0 && this.departments[best[0]]) ? best[0] : Object.keys(this.departments)[0];
  }

  async _initOllama() {
    try {
      const resp = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const data = await resp.json();
        return { status: 'connected', models: data.models?.length || 0 };
      }
    } catch (e) { /* Ollama no disponible */ }
    return { status: 'unavailable', models: 0 };
  }
}

export const metaOrchestrator = new MetaOrchestrator();
export default metaOrchestrator;
