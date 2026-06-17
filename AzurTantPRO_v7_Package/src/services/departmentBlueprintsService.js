/**
 * departmentBlueprintsService — REAL blueprints for 14 departments
 * ================================================================
 * Implementa: getAllBlueprintSummaries, getAll
 */

const BLUEPRINTS = {
  ceo: { name: 'CEO', icon: '👑', color: '#FFD700', depts: ['strategy', 'vision', 'leadership', 'governance'] },
  tecnologia: { name: 'Tecnología', icon: '🧬', color: '#06B6D4', depts: ['ai', 'ml', 'devops', 'infrastructure', 'computer-use'] },
  marketing: { name: 'Marketing', icon: '📣', color: '#EC4899', depts: ['content', 'seo', 'social', 'campaigns', 'analytics'] },
  ventas: { name: 'Ventas', icon: '💰', color: '#10B981', depts: ['pipeline', 'deals', 'forecasting', 'sdr'] },
  legal: { name: 'Legal', icon: '⚖️', color: '#8B5CF6', depts: ['contracts', 'compliance', 'risk', 'ip'] },
  rrhh: { name: 'RRHH', icon: '👥', color: '#F59E0B', depts: ['hiring', 'culture', 'payroll', 'lft'] },
  finanzas: { name: 'Finanzas', icon: '💵', color: '#14B8A6', depts: ['accounting', 'tax', 'audit', 'cfdi'] },
  operaciones: { name: 'Operaciones', icon: '⚙️', color: '#6366F1', depts: ['logistics', 'supply', 'procurement'] },
  seguridad: { name: 'Seguridad', icon: '🛡️', color: '#EF4444', depts: ['cybersec', 'physical', 'compliance', 'audit'] },
  innovacion: { name: 'Innovación', icon: '💡', color: '#A855F7', depts: ['rnd', 'patents', 'trends', 'experimentation'] },
  compliance: { name: 'Compliance', icon: '📋', color: '#0EA5E9', depts: ['regulatory', 'audit', 'controls', 'reporting'] },
  admin: { name: 'Admin', icon: '🗂️', color: '#64748B', depts: ['office', 'facilities', 'logistics'] },
  soporte_ti: { name: 'Soporte TI', icon: '🛠️', color: '#84CC16', depts: ['helpdesk', 'network', 'hardware', 'software'] },
  developer: { name: 'Developer', icon: '💻', color: '#3B82F6', depts: ['frontend', 'backend', 'devops', 'qa'] },
};

class DepartmentBlueprintsService {
  constructor() {
    this.name = 'departmentBlueprintsService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
  }

  getAll() {
    return BLUEPRINTS;
  }

  getAllBlueprintSummaries() {
    return Object.entries(BLUEPRINTS).map(([id, bp]) => ({
      id, name: bp.name, icon: bp.icon, color: bp.color,
      capabilities: bp.depts.length,
      deptList: bp.depts,
    }));
  }

  getById(id) {
    return BLUEPRINTS[id] || null;
  }

  list() {
    return Object.keys(BLUEPRINTS);
  }

  async status() { return { ready: this.ready, departments: Object.keys(BLUEPRINTS).length }; }
  getStatus() { return this.status(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new DepartmentBlueprintsService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, departmentBlueprints: instance, blueprints: instance,
});
export const departmentBlueprints = instance;
export const blueprints = instance;
export { instance, wrapped };
export default wrapped;
