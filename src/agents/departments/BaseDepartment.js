// AzurTant PRO - Base Department Class
// Foundation for all 13 department agents

import { ollamaService } from '../../services/ollamaService.js';
import { mem0Service } from '../../services/mem0Service.js';
import { interAgentHub } from '../interagent/interAgentHub.js';

export class BaseDepartment {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.icon = config.icon || '🏢';
        this.color = config.color || 'slate';
        this.description = config.description || '';
        this.skills = config.skills || [];
        this.kpis = config.kpis || [];
        this.complianceLaws = config.complianceLaws || [];
        this.parentDepartment = config.parentDepartment || null;
        this.maxPersonnel = config.maxPersonnel || 0;
        this.systemPrompt = config.systemPrompt || this._defaultSystemPrompt(config);
        this.handlers = config.handlers || {};
        this.registered = false;
    }

    _defaultSystemPrompt(config) {
        return `Eres el agente del departamento ${config.name} de AzurTant PRO (Emanuel Azur Corporativo, México).
Habilidades: ${config.skills.join(', ')}.
KPIs: ${config.kpis.map(k => k.name).join(', ')}.
Cumplimiento legal: ${config.complianceLaws.join(', ')}.
Responde en español mexicano, de forma profesional, concreta y útil.`;
    }

    register() {
        if (this.registered) return;
        interAgentHub.registerAgent(this.id, {
            name: this.name,
            capabilities: this.skills,
            kpis: this.kpis.map(k => k.name),
            compliance: this.complianceLaws
        });
        mem0Service.storeKnowledge(
            `Departamento ${this.name} (${this.id}): ${this.description}. Skills: ${this.skills.join(', ')}. Compliance: ${this.complianceLaws.join(', ')}.`,
            this.id,
            0.8
        );
        this.registered = true;
    }

    async call(prompt, taskType = 'general', userId = 'default') {
        const context = mem0Service.getContext(
            ['user', 'knowledge', 'session', 'department'],
            userId,
            8
        );

        const fullSystem = `${this.systemPrompt}

CONTEXTO DE MEMORIA:
${context}

INSTRUCCIONES:
- Responde en español mexicano
- Sé concreto y profesional
- Si requieres información de otro departamento, indícalo explícitamente con "@departamento" (ej: "@legal revisa el contrato")
- Si la solicitud requiere generar un documento, estructúralo con secciones claras
- Cita las leyes aplicables cuando sea relevante (${this.complianceLaws.join(', ')})`;

        const response = await ollamaService.chat(prompt, fullSystem, taskType);

        if (response.status === 'success') {
            mem0Service.add(`[${this.id}] Usuario: ${prompt}`, 'session', userId, 0.5);
            mem0Service.add(`[${this.id}] Respuesta: ${response.response}`, 'department', this.id, 0.6);
        }

        return {
            success: response.status === 'success',
            message: response.response || 'Sin respuesta',
            department: this.id,
            model: response.model,
            taskType: response.taskType || taskType
        };
    }

    async processRequest(message, payload = {}, userId = 'default') {
        const action = payload.action || 'chat';

        if (this.handlers[action] && typeof this.handlers[action] === 'function') {
            return await this.handlers[action](message, payload, userId);
        }

        return await this.call(message, 'general', userId);
    }

    detectTaskType(message) {
        return ollamaService.classifyTask(message);
    }

    getMetadata() {
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            color: this.color,
            description: this.description,
            skills: this.skills,
            kpis: this.kpis,
            complianceLaws: this.complianceLaws,
            parentDepartment: this.parentDepartment,
            maxPersonnel: this.maxPersonnel
        };
    }
}
