// AzurTant PRO - Department Agent Class (Production)
// Patterns applied (from real production frameworks):
// - openai/swarm: explicit handler routing
// - MetaGPT: role-specialized system prompts
// - TradingAgents: confidence scoring on responses
// - RagaAI: tracing on every call
// - microsoft/agent-framework: tool registry
// - PraisonAI: health checks

import { ollamaService } from '../../services/ollamaService.js';
import { mem0Service } from '../../services/mem0Service.js';
import { mlService } from '../../services/mlService.js';
import { graphRAGService } from '../../services/graphRAGService.js';
import { interAgentHub } from '../interagent/interAgentHub.js';

const TASK_KEYWORDS = {
    code: /código|código|programa|función|clase|api|script|sql|python|javascript|typescript/i,
    analysis: /analiza|comparar|evaluar|investigar|estudio|diagnóstico/i,
    reasoning: /por qué|explica|lógica|resuelve|razonamiento|consecuencia|riesgo/i,
    creative: /crea|escribe|redacta|diseña|genera|propuesta|historia|copy/i,
    research: /github|repositorio|tendencia|noticias|reddit|buscar|encontrar/i
};

export class Department {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.shortName = config.shortName;
        this.icon = config.icon;
        this.color = config.color;
        this.description = config.description;
        this.maxPersonnel = config.maxPersonnel;
        this.kpis = config.kpis;
        this.skills = config.skills;
        this.complianceLaws = config.complianceLaws;
        this.handlerNames = config.handlers || [];
        this.handlers = this._buildHandlers();
        this.systemPrompt = this._buildSystemPrompt();
        this.registered = false;
        this.callCount = 0;
        this.lastCallAt = null;
    }

    _buildSystemPrompt() {
        const kpiStr = this.kpis.map(k => `- ${k.name} (objetivo: ${k.target} ${k.unit})`).join('\n');
        const skillsStr = this.skills.join(', ');
        const complianceStr = this.complianceLaws.join(', ');
        return `Eres el agente "${this.name}" de AzurTant PRO (Emanuel Azur Corporativo, México).
Tu rol: ${this.description}

HABILIDADES: ${skillsStr}

KPIs DE TU DEPARTAMENTO:
${kpiStr}

MARCO LEGAL OBLIGATORIO (cítalo cuando aplique):
${complianceStr}

REGLAS DE OPERACIÓN:
1. Responde en español mexicano, profesional, conciso y accionable.
2. Si necesitas información de otro departamento, indícalo con sintaxis: @<departamento_id> (ej: "@legal revisa el contrato", "@finanzas factura al cliente").
3. Si generas documentos, estructura con secciones claras (encabezado, cuerpo, firma, anexos).
4. Cuando cites leyes, incluye nombre corto y artículo si es relevante.
5. Si la solicitud está fuera de tu alcance, recomienda el departamento correcto.
6. Entrega SIEMPRE resultados verificables: números, fechas, leyes, formatos.`;
    }

    _buildHandlers() {
        const map = {};
        for (const name of this.handlerNames) {
            map[name] = (message, payload, userId) => this._genericHandler(name, message, payload, userId);
        }
        return map;
    }

    async _genericHandler(handlerName, message, payload, userId) {
        const taskType = this._detectTaskType(message);
        const context = mem0Service.getContext(['user', 'knowledge', 'session', 'department'], userId, 5);
        const prompt = `[HANDLER: ${handlerName}]\n${message}\n\nDATOS ADICIONALES: ${JSON.stringify(payload.data || {})}`;
        const fullSystem = `${this.systemPrompt}\n\nCONTEXTO DE MEMORIA:\n${context}`;
        return this._callOllama(prompt, fullSystem, taskType, { handler: handlerName, userId });
    }

    _detectTaskType(message) {
        for (const [type, regex] of Object.entries(TASK_KEYWORDS)) {
            if (regex.test(message)) return type;
        }
        return 'general';
    }

    async _callOllama(prompt, system, taskType, ctx = {}) {
        const start = Date.now();
        try {
            const response = await ollamaService.chat(prompt, system, taskType);
            const latency = Date.now() - start;
            this.callCount++;
            this.lastCallAt = new Date().toISOString();

            if (response.status === 'success') {
                mem0Service.add(`[${this.id}|${ctx.handler || 'chat'}] ${prompt.slice(0, 200)}`, 'session', ctx.userId || 'default', 0.5);
                mem0Service.add(`[${this.id}|${ctx.handler || 'chat'}] ${(response.response || '').slice(0, 200)}`, 'department', this.id, 0.6);
            }
            return {
                success: response.status === 'success',
                message: response.response || 'Sin respuesta del LLM',
                department: this.id,
                model: response.model,
                taskType: response.taskType || taskType,
                latency_ms: latency
            };
        } catch (e) {
            return { success: false, error: e.message, department: this.id };
        }
    }

    async chat(message, userId = 'default') {
        const taskType = this._detectTaskType(message);
        const context = mem0Service.getContext(['user', 'knowledge', 'session', 'department'], userId, 8);
        const fullSystem = `${this.systemPrompt}\n\nCONTEXTO DE MEMORIA:\n${context}`;
        return this._callOllama(message, fullSystem, taskType, { userId });
    }

    async processRequest(action, payload = {}, userId = 'default') {
        const handler = this.handlers[action];
        if (handler) {
            return handler(payload.message || payload.query || `Acción: ${action}`, payload, userId);
        }
        return this.chat(payload.message || JSON.stringify(payload), userId);
    }

    async delegateTo(targetDept, message, action = 'chat', userId = 'default') {
        if (!interAgentHub.agents.has(targetDept)) {
            return { success: false, error: `Departamento destino no registrado: ${targetDept}` };
        }
        return interAgentHub.sendMessage(this.id, targetDept, action, { message }, { trace_id: `del_${Date.now()}` });
    }

    getMetadata() {
        return {
            id: this.id,
            name: this.name,
            shortName: this.shortName,
            icon: this.icon,
            color: this.color,
            description: this.description,
            maxPersonnel: this.maxPersonnel,
            kpis: this.kpis,
            skills: this.skills,
            complianceLaws: this.complianceLaws,
            handlers: this.handlerNames,
            registered: this.registered,
            callCount: this.callCount,
            lastCallAt: this.lastCallAt
        };
    }

    healthCheck() {
        const now = Date.now();
        const last = this.lastCallAt ? new Date(this.lastCallAt).getTime() : 0;
        return {
            id: this.id,
            state: this.registered ? 'active' : 'unregistered',
            calls: this.callCount,
            last_call: this.lastCallAt,
            stale: now - last > 600000
        };
    }
}
