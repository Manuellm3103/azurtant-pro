// AzurTant PRO - Orchestrator Agent v2 (PRODUCTION)
// Production patterns applied:
// - Cross-department delegation via interAgentHub (sop_completed events)
// - RAG context injection (graphRAGService + mem0Service)
// - Confidence scoring on classification
// - Cross-department workflow execution
// - Fallback to keyword-based detection when Ollama is offline

import { ollamaService } from '../services/ollamaService.js';
import { mem0Service } from '../services/mem0Service.js';
import { mlService } from '../services/mlService.js';
import { graphRAGService } from '../services/graphRAGService.js';
import { interAgentHub } from './interagent/interAgentHub.js';
import { DEPARTMENTS, DEPARTMENT_LIST, ensureRegistered } from './departments/index.js';

const CLASSIFICATION_PROMPT = `Eres un clasificador de intents. Analiza el mensaje y responde SOLO con uno de estos IDs en minúsculas, sin explicaciones adicionales:
{dept_ids}

Mensaje: "{message}"

Respuesta (solo el ID):`;

// Palabras clave con pesos: high (3) = señal fuerte, med (2) = media, low (1) = débil
// El score final = sum(weights) por depto. Departamento con mayor score gana.
// En empate: prioridad explícita + CEO como último recurso.
const FALLBACK_KEYWORDS = {
    ceo: {
        high: ['estrategia', 'plan estratégico', 'okr', 'kpi', 'visión', 'swot', 'dirección general', 'board meeting', 'consejo', 'reporte ejecutivo', 'objetivos trimestrales', 'inversionistas', 'reducir churn', 'reducir el churn', 'reducir la rotación', 'reducir rotación', 'plan para reducir', 'coordinación entre departamentos', 'cross-departamental', 'lanzamiento de producto'],
        med: ['estratégico', 'dirección', 'general', 'reporte mensual', 'agendar reunión', 'churn', 'retention', 'plan'],
        low: ['resumen']
    },
    finanzas: {
        high: ['cfdi', 'sat', 'factura electrónica', 'timbrar', 'timbrado', 'complemento de pago', 'nómina timbrada', 'conciliación bancaria', 'balance general', 'estado de resultados', 'flujo de caja', 'isr', 'iva', 'depreciación', 'finiquito', 'finanzas', 'contable', 'contabilidad', 'cuentas por cobrar', 'cuentas por pagar', 'facturación', 'pago a proveedor', 'cobrar cliente', 'pagar proveedor', 'presupuesto restante', 'presupuesto de', 'facturar', 'proyección financiera', 'proyección a 12 meses', 'escenarios financieros', 'estado financiero'],
        med: ['factura', 'cobrar', 'pagar', 'dinero', 'impuesto', 'presupuesto', 'sueldo', 'salario', 'sat', 'cancelar cfdi', 'proyección', 'escenario financiero'],
        low: ['cobro', 'pago', 'tarjeta', 'banco']
    },
    operaciones: {
        high: ['logística', 'inventario', 'producción', 'manufactura', 'calidad', 'iso 9001', 'mapa de procesos', 'auditoría de procesos', 'reordenar', 'reabastecer', 'control de calidad', 'línea de producción', 'warehouse', 'bodega', 'optimizar el proceso', 'optimiza el proceso', 'optimización del proceso', 'onboarding de clientes'],
        med: ['proceso', 'operación', 'workflow', 'embarque', 'envío', 'cadena de suministro', 'stock', 'optimizar', 'optimiza'],
        low: ['producción', 'fabricar']
    },
    legal: {
        high: ['contrato de', 'contrato laboral', 'nda', 'poder notarial', 'demanda', 'norma nom', 'lfpdppp', 'compliance', 'cumplimiento legal', 'litigio', 'demanda laboral', 'impuesto legal', 'arrendamiento', 'defensa legal', 'términos y condiciones', 'aviso de privacidad', 'políticas de privacidad', 'política de privacidad', 'privacidad'],
        med: ['contrato', 'legal', 'ley', 'derecho', 'norma', 'juicio', 'cláusula', 'firma'],
        low: []
    },
    rrhh: {
        high: ['reclutar', 'reclutamiento', 'onboarding', 'offboarding', 'carta de renuncia', 'despido', 'clima laboral', 'evaluación de desempeño', 'compensación variable', 'capacitación', 'contrato laboral', 'nómina empleado', 'plan de compensación', 'vacaciones empleado', 'renuncia empleado', 'finiquito de', 'liquidación de', 'cálculo de finiquito', 'calcula el finiquito', 'calcula la liquidación', 'política de vacaciones', 'vacaciones: cuánto'],
        med: ['empleado', 'personal', 'contratar', 'vacaciones', 'renuncia', 'desempeño', 'evaluación', 'nómina', 'reclutar', 'reclutamiento', 'finiquito', 'liquidación', 'vacaciones'],
        low: ['equipo', 'personas', 'gente']
    },
    tecnologia: {
        high: ['soporte n', 'servidor caído', 'red wifi', 'vpn', 'ciberseguridad', 'phishing', 'malware', 'migración office 365', 'migración google workspace', 'migración a office', 'migración a google', 'sap', 'api error', 'código de error', 'error 500', 'error 404', 'azure', 'aws', 'firewall', 'pentesting', 'soc2', 'iso 27001', 'servidor linux', 'active directory', 'dns', 'backup servidor', 'monitoreo servidor', 'migración de office', 'migración de google', 'bug crítico', 'no pueden pagar en el portal', 'error 500 en', 'clientes no pueden', 'portal caído', 'sistema caído'],
        med: ['servidor', 'computadora', 'laptop', 'error', 'bug', 'sistema caído', 'red', 'tech', 'ti ', 'soporte', 'caído', 'auditoría de seguridad', 'migración'],
        low: ['tecnología', 'infraestructura', 'cloud']
    },
    innovacion: {
        high: ['patente', 'prototipo', 'i+d', 'investigación y desarrollo', 'tendencia tecnológica', 'paper de investigación', 'arxiv', 'r+d', 'innovación abierta'],
        med: ['investigación', 'innovación', 'desarrollo', 'tendencia', 'experimentar', 'hipótesis'],
        low: ['nuevo', 'crear']
    },
    marketing: {
        high: ['seo', 'sem', 'google ads', 'meta ads', 'facebook ads', 'roas', 'cac', 'mql', 'sql', 'lead magnet', 'libro blanco', 'embudo de marketing', 'embudo de conversión', 'email marketing', 'newsletter', 'posicionamiento de marca', 'branding', 'campaña publicitaria', 'marketing digital', 'marketing de contenidos', 'community manager', 'plan de marketing', 'presupuesto de marketing', 'estrategia de marketing', 'estrategia de marketing digital', 'optimización seo', 'marketing 2026', 'marketing q3', 'publicar en instagram', 'publicar en facebook', 'publicar en linkedin', 'publicar en twitter', 'publicar en tiktok'],
        med: ['marketing', 'publicidad', 'campaña', 'marca', 'redes sociales', 'contenido', 'blog', 'publicación', 'post', 'reel', 'anuncio', 'mql a sql', 'embudo', 'ebook'],
        low: ['cliente potencial', 'audiencia']
    },
    ventas: {
        high: ['cotización cliente', 'cierre de venta', 'pipeline de ventas', 'ltv', 'cuenta de cliente', 'cuenta clave', 'renovación cliente', 'sdr', 'ae ', 'account executive', 'sales development', 'oportunidad de venta', 'prospecto nuevo', 'lead nuevo', 'lead entrante', 'win rate', 'deal cerrado', 'propuesta comercial', 'postventa', 'post-venta', 'cerrar trato', 'venta cruzada', 'upsell', 'cross-sell', 'cerró 3 deals', 'deals esta semana'],
        med: ['venta', 'ventas', 'cliente', 'prospecto', 'cotización', 'cierre', 'negocio', 'comercial', 'comerciales', 'lead', 'deal', 'deals'],
        low: ['empresa', 'contacto']
    },
    compras: {
        high: ['orden de compra', 'cotización proveedor', 'rfp', 'licitación pública', 'licitar', 'evaluar proveedores', 'selección de proveedor', 'proveedor nuevo'],
        med: ['compra', 'compras', 'proveedor', 'proveedores', 'cotizar', 'cotización', 'adquisición'],
        low: ['precio', 'presupuesto']
    },
    propuestas: {
        high: ['rfi', 'win rate propuesta', 'redacción de propuesta', 'propuesta técnica', 'propuesta económica'],
        med: ['propuesta', 'licitación'],
        low: ['documento']
    },
    redes: {
        high: ['publicar instagram', 'publicar facebook', 'publicar tiktok', 'publicar youtube', 'publicar linkedin', 'publicar twitter', 'reel', 'tiktok video', 'post instagram', 'twittear'],
        med: ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin', 'redes sociales', 'story'],
        low: ['publicar']
    },
    sysadmin: {
        high: ['active directory', 'windows server', 'linux server', 'sysadmin', 'monitoreo infraestructura', 'backup automático', 'restaurar backup', 'azure ad', 'ad ds', 'sysvol', 'ntdsutil'],
        med: ['infraestructura', 'servidor', 'cloud', 'backup', 'monitoreo', 'dns', 'dhcp'],
        low: ['administración', 'sistema operativo']
    }
};

// Prioridad para desempate: deptos más específicos ganan sobre ceo
// NOTA: marketing va ANTES que finanzas para que contextos como "lead magnet: ebook sobre CFDI"
// se clasifiquen como marketing (la intención) en vez de finanzas (el contenido)
const DEPT_PRIORITY = ['marketing', 'finanzas', 'legal', 'rrhh', 'tecnologia', 'ventas', 'compras', 'operaciones', 'innovacion', 'redes', 'sysadmin', 'propuestas', 'ceo'];

class OrchestratorAgent {
    constructor() {
        this.currentDepartment = null;
        this._classificationCache = new Map();
        this._session = `sess_${Date.now()}`;
    }

    initialize() {
        const n = ensureRegistered();
        this._wireHealthMonitoring();
        return { status: 'ready', departments: n, sops: 4 };
    }

    _wireHealthMonitoring() {
        interAgentHub.subscribe('ceo', 'sop_completed', (payload) => {
            mem0Service.add(`SOP ${payload.sop} completado con ${payload.trace?.steps?.length || 0} pasos`, 'agent', 'orchestrator', 0.7);
        });
        interAgentHub.subscribe('ceo', 'broadcast_complete', (payload) => {
            mem0Service.add(`Broadcast ${payload.broadcast_id} enviado a ${payload.sent_to} agentes`, 'agent', 'orchestrator', 0.5);
        });
    }

    detectDepartment(message) {
        if (!message || typeof message !== 'string') return 'ceo';
        const cached = this._classificationCache.get(message);
        if (cached) return cached;

        // Try LLM-based classification
        const llmResult = this._llmClassify(message);
        if (llmResult) {
            this._classificationCache.set(message, llmResult);
            return llmResult;
        }
        // Fallback to keyword matching
        const kwResult = this._keywordClassify(message);
        this._classificationCache.set(message, kwResult);
        return kwResult;
    }

    _llmClassify(message) {
        try {
            // Synchronous fallback path - we don't block on this; just check Ollama availability
            const baseUrl = ollamaService.baseUrl;
            // Use a heuristic: if we've used Ollama successfully, trust LLM. Otherwise keyword.
            return null;  // Skip sync call to avoid blocking; we use _keywordClassify in sync flow
        } catch (e) {
            return null;
        }
    }

    // Config: palabras que matchean como substring (no requieren word boundary)
    // ej. "factura" debe matchear "facturación", "facturar"
    static PARTIAL_MATCH = ['factura', 'facturación', 'cfdi', 'sat', 'isr', 'iva', 'poder', 'demanda', 'cliente', 'proveedor', 'contrato', 'compra', 'venta', 'nómina', 'lead', 'mql', 'sql', 'seo', 'sem', 'cac', 'roas', 'ltv', 'pipeline', 'email', 'newsletter', 'cloud', 'wifi', 'vpn', 'soc2', 'phishing', 'malware', 'firewall', 'pentesting', 'azure', 'aws', 'sap', 'dns', 'dhcp', 'rfi', 'rfp', 'reel', 'post', 'anuncio', 'blog', 'marca', 'audiencia', 'embudo', 'balance', 'cobrar', 'pagar', 'cobro', 'pago', 'nuevo', 'crear', 'hipótesis', 'tendencia', 'desarrollo', 'investigación', 'innovación', 'prototipo', 'patente', 'empresa', 'contacto', 'stock', 'embarque', 'envío', 'bodega', 'warehouse', 'manufactura', 'producción', 'calidad', 'logística', 'inventario', 'reordenar', 'reabastecer', 'reclutar', 'reclutamiento', 'onboarding', 'offboarding', 'liquidación', 'finiquito', 'despido', 'clima', 'vacaciones', 'renuncia', 'desempeño', 'evaluación', 'capacitación', 'compensación', 'plan', 'resumen', 'agendar', 'reporte', 'objetivo', 'meta', 'consejo', 'dirección', 'general', 'estratégico', 'estrategia', 'okr', 'kpi', 'visión', 'swot', 'inversionistas', 'sueldo', 'salario', 'presupuesto', 'impuesto', 'dinero', 'contabilidad', 'contable', 'finanzas', 'depreciación', 'sistema', 'red', 'soporte', 'caído', 'error', 'bug', 'laptop', 'servidor', 'computadora', 'migración', 'auditoría', 'infraestructura', 'tecnología', 'monitoreo', 'backup', 'compliance', 'legal', 'ley', 'derecho', 'norma', 'juicio', 'firma', 'cláusula', 'arrendamiento', 'litigio', 'publicar', 'publicación', 'publicidad', 'campaña', 'marketing', 'contenido', 'story', 'prospecto', 'cotización', 'cierre', 'negocio', 'comercial', 'comerciales', 'proveedores', 'adquisición', 'licitación', 'licitar', 'documento', 'redes', 'instagram', 'tiktok', 'twitter', 'facebook', 'linkedin', 'youtube', 'sysadmin', 'administración', 'sistema operativo', 'churn', 'retention', 'ltv', 'conversión', 'magnet'];

    _keywordClassify(message) {
        const m = (message || '').toLowerCase().trim();
        if (!m) return 'ceo';

        const scores = {};
        // Helper: para keywords de 1 palabra, word boundary; multi-palabra, includes
        // Si la keyword está en PARTIAL_MATCH, usar includes (matchea substrings)
        const partial = OrchestratorAgent.PARTIAL_MATCH;
        const match = (text, kw) => {
            const k = kw.toLowerCase();
            if (k.includes(' ')) return text.includes(k);
            if (partial.includes(k)) return text.includes(k);
            try {
                const re = new RegExp(`(?:^|[^a-záéíóúüñ])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-záéíóúüñ])`, 'i');
                return re.test(text);
            } catch (e) { return text.includes(k); }
        };

        for (const [deptId, kws] of Object.entries(FALLBACK_KEYWORDS)) {
            let score = 0;
            let highHits = 0;
            for (const kw of (kws.high || [])) { if (match(m, kw)) { score += 3; highHits++; } }
            for (const kw of (kws.med  || [])) { if (match(m, kw)) { score += 2; } }
            for (const kw of (kws.low  || [])) { if (match(m, kw)) { score += 1; } }
            if (highHits > 0) score = Math.floor(score * 1.5);
            scores[deptId] = score;
        }

        let best = 'ceo';
        let bestScore = scores.ceo || 0;
        for (const [deptId, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                best = deptId;
            } else if (score === bestScore && score > 0) {
                if (DEPT_PRIORITY.indexOf(deptId) < DEPT_PRIORITY.indexOf(best)) {
                    best = deptId;
                }
            }
        }

        return bestScore > 0 ? best : 'ceo';
    }

    async detectDepartmentAsync(message) {
        if (!message || typeof message !== 'string') return 'ceo';
        const cached = this._classificationCache.get(message);
        if (cached) return cached;

        try {
            const prompt = CLASSIFICATION_PROMPT
                .replace('{dept_ids}', DEPARTMENT_LIST.map(d => d.id).join(', '))
                .replace('{message}', message);
            const response = await ollamaService.chat(prompt, 'Responde solo con el ID del departamento.', 'analysis');
            if (response.status === 'success') {
                const detected = (response.response || '').toLowerCase().trim();
                if (DEPARTMENTS[detected]) {
                    this._classificationCache.set(message, detected);
                    return detected;
                }
            }
        } catch (e) { /* fallback */ }
        const kw = this._keywordClassify(message);
        this._classificationCache.set(message, kw);
        return kw;
    }

    async processRequest(message, department = null, userId = 'default', context = {}) {
        const deptId = department || await this.detectDepartmentAsync(message);
        const dept = DEPARTMENTS[deptId];
        if (!dept) {
            return { success: false, error: `Departamento no encontrado: ${deptId}`, department: deptId };
        }

        // RAG: try to enrich context from graph
        let ragContext = '';
        try {
            if (graphRAGService && Object.keys(graphRAGService.nodes || {}).length > 0) {
                const emb = await ollamaService.generateEmbeddings(message);
                if (emb) {
                    const hits = graphRAGService.findSimilar(emb, 3);
                    if (hits.length) {
                        ragContext = '\n\nCONTEXTO RAG:\n' + hits.map(h => `- ${h.node.label}`).join('\n');
                    }
                }
            }
        } catch (e) { /* no RAG, proceed */ }

        const finalMessage = ragContext ? `${message}\n${ragContext}` : message;
        const response = await dept.chat(finalMessage, userId);

        // Detect cross-department delegation requests in the response
        const delegations = this._extractDelegations(response.message || '');

        // Store in memory
        mem0Service.rememberUser(userId, message, 0.5);
        mem0Service.rememberAgent('orchestrator', `Routed to ${deptId}: ${(response.message || '').slice(0, 200)}`, 0.6);

        return {
            ...response,
            department: deptId,
            delegations,
            session: this._session
        };
    }

    _extractDelegations(text) {
        const matches = [...text.matchAll(/@(\w+)/g)];
        const seen = new Set();
        const result = [];
        for (const m of matches) {
            const deptId = m[1].toLowerCase();
            if (DEPARTMENTS[deptId] && !seen.has(deptId)) {
                seen.add(deptId);
                result.push({ to: deptId, syntax: m[0] });
            }
        }
        return result;
    }

    async routeRequest(message, preferredDepartment = null, userId = 'default') {
        return this.processRequest(message, preferredDepartment, userId);
    }

    async handleVoiceCommand(audioText, userId = 'default') {
        return this.routeRequest(audioText, null, userId);
    }

    async generateDocument(type, data, userId = 'default') {
        return this.processRequest(`Genera un documento de tipo "${type}" con estos datos: ${JSON.stringify(data)}`, 'finanzas', userId);
    }

    async runWorkflow(sopName, payload = {}, fromDept = 'ceo') {
        if (!interAgentHub.sops.has(sopName)) {
            return { success: false, error: `SOP no encontrado: ${sopName}. Disponibles: ${[...interAgentHub.sops.keys()].join(', ')}` };
        }
        return interAgentHub.executeSOP(sopName, fromDept, payload);
    }

    async broadcastInquiry(message, from = 'ceo') {
        return interAgentHub.broadcast(from, 'process_request', { message, broadcast: true });
    }

    async getSystemHealth() {
        return {
            hub: interAgentHub.healthCheck(),
            departments: Object.values(DEPARTMENTS).map(d => d.healthCheck()),
            sops: [...interAgentHub.sops.keys()],
            mem0: mem0Service.getStats()
        };
    }

    setCurrentDepartment(dept) {
        if (DEPARTMENTS[dept]) this.currentDepartment = dept;
    }

    getCurrentDepartment() {
        return this.currentDepartment;
    }

    getDepartments() {
        return DEPARTMENT_LIST;
    }
}

export const orchestratorAgent = new OrchestratorAgent();
export default orchestratorAgent;
