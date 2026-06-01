// AzurTant PRO - Departments Index
// Wires the 13 department agents to the inter-agent hub and registers
// cross-department SOPs from the corporate document.

import { Department } from './Department.js';
import { DEPARTMENTS_CONFIG } from './config.js';
import { interAgentHub } from '../interagent/interAgentHub.js';
import { mem0Service } from '../../services/mem0Service.js';
import { mlService } from '../../services/mlService.js';
import { orchestratorAgent } from '../orchestratorAgent.js';

// Instantiate all 13 departments
const _instances = {};
for (const cfg of DEPARTMENTS_CONFIG) {
    _instances[cfg.id] = new Department(cfg);
}

export const DEPARTMENTS = _instances;
export const DEPARTMENT_LIST = DEPARTMENTS_CONFIG;

// Register all departments in the inter-agent hub on module load
export function registerAllDepartments() {
    for (const dept of Object.values(DEPARTMENTS)) {
        dept.registered = true;
        interAgentHub.registerAgent(dept.id, {
            name: dept.name,
            capabilities: dept.skills,
            kpis: dept.kpis.map(k => k.name),
            compliance: dept.complianceLaws,
            handler: async ({ action, payload, from, message_id }) => {
                return await dept.processRequest(action, { ...payload, from, message_id }, payload.userId || 'default');
            }
        });
    }
    return Object.keys(DEPARTMENTS).length;
}

// Register cross-department SOPs from the corporate document
// ("Flujo de Crecimiento", "Flujo de Blindaje", "Flujo de Innovación")
export function registerSOPs() {
    const sopLeadToSale = {
        name: 'lead_to_sale',
        description: 'Marketing→Ventas→Operaciones→Finanzas→Legal (lead → factura → contrato)',
        steps: [
            { name: 'qualify', to: 'marketing', action: 'process_request', payload: { data: { stage: 'mql_to_sql' } } },
            { name: 'open_opp', to: 'ventas', action: 'process_request', payload: { data: { stage: 'opportunity' } }, required: true },
            { name: 'plan_delivery', to: 'operaciones', action: 'process_request', payload: { data: { stage: 'fulfillment' } } },
            { name: 'create_invoice', to: 'finanzas', action: 'process_request', payload: { data: { stage: 'cfdi' } }, required: true },
            { name: 'review_contract', to: 'legal', action: 'process_request', payload: { data: { stage: 'review' } } }
        ]
    };

    const sopHire = {
        name: 'new_hire',
        description: 'RRHH→Legal→Finanzas→Tecnología (contratación → contrato → nómina → accesos)',
        steps: [
            { name: 'propose', to: 'rrhh', action: 'process_request', payload: { data: { stage: 'offer' } }, required: true },
            { name: 'contract_review', to: 'legal', action: 'process_request', payload: { data: { stage: 'contract' } }, required: true },
            { name: 'payroll_setup', to: 'finanzas', action: 'process_request', payload: { data: { stage: 'payroll' } } },
            { name: 'provision_access', to: 'tecnologia', action: 'process_request', payload: { data: { stage: 'accounts' } } }
        ]
    };

    const sopMonthClose = {
        name: 'month_close',
        description: 'Operaciones→Finanzas→Legal→CEO (cierre mensual)',
        steps: [
            { name: 'ops_report', to: 'operaciones', action: 'process_request', payload: { data: { stage: 'kpis_ops' } }, required: true },
            { name: 'fin_reconcile', to: 'finanzas', action: 'process_request', payload: { data: { stage: 'reconcile' } }, required: true },
            { name: 'legal_signoff', to: 'legal', action: 'process_request', payload: { data: { stage: 'compliance' } } },
            { name: 'ceo_approval', to: 'ceo', action: 'process_request', payload: { data: { stage: 'approval' } } }
        ]
    };

    const sopProposal = {
        name: 'proposal_response',
        description: 'Propuestas→Innovación→Finanzas→Legal→Marketing (RFP → propuesta → precio → revisión → envío)',
        steps: [
            { name: 'draft', to: 'propuestas', action: 'process_request', payload: { data: { stage: 'draft' } }, required: true },
            { name: 'tech_input', to: 'innovacion', action: 'process_request', payload: { data: { stage: 'tech' } } },
            { name: 'pricing', to: 'finanzas', action: 'process_request', payload: { data: { stage: 'price' } }, required: true },
            { name: 'review', to: 'legal', action: 'process_request', payload: { data: { stage: 'legal' } } },
            { name: 'announce', to: 'marketing', action: 'process_request', payload: { data: { stage: 'comms' } } }
        ]
    };

    interAgentHub.registerSOP('lead_to_sale', sopLeadToSale.steps);
    interAgentHub.registerSOP('new_hire', sopHire.steps);
    interAgentHub.registerSOP('month_close', sopMonthClose.steps);
    interAgentHub.registerSOP('proposal_response', sopProposal.steps);
    return [sopLeadToSale, sopHire, sopMonthClose, sopProposal];
}

// Auto-register on import
let _registered = false;
export function ensureRegistered() {
    if (_registered) return Object.keys(DEPARTMENTS).length;
    const n = registerAllDepartments();
    registerSOPs();
    _registered = true;
    return n;
}

export function getDepartment(id) {
    return DEPARTMENTS[id] || null;
}

export function getAllDepartments() {
    return Object.values(DEPARTMENTS);
}

export function getHealthReport() {
    return Object.values(DEPARTMENTS).map(d => d.healthCheck());
}
