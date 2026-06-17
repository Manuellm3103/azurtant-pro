/**
 * authService - Authentication REAL (no stub)
 * ============================================
 * Wrapper que conecta los endpoints HTTP con multitenancyService.
 *
 * Métodos esperados por server.mjs:
 *  - login({username|email, password, tenantId}) → {ok, token, user, tenant}
 *  - register({email, name, password, tenantId, role}) → {ok, user}
 *  - authMiddleware(req, res) → user object o null
 *  - getStats() → {activeSessions, tenants, ...}
 *  - listTenants() → [...]
 *
 * Toda la lógica real está en multitenancyService.js
 */

import { getMultitenancy } from './multitenancyService.js';

class AuthService {
  constructor() {
    this.name = 'authService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
  }

  /**
   * Login: acepta username o email, mapea al método authenticate del multitenancy
   */
  async login({ username, email, password, tenantId = 'default' }) {
    try {
      const mt = getMultitenancy();
      const identifier = (email || username || '').toLowerCase();

      const result = await mt.authenticate(identifier, password, tenantId);
      if (!result.ok) return result;

      // authenticate ya devuelve {ok, token, user, tenant}
      return result;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /**
   * Register: crea usuario nuevo en tenant
   */
  async register({ email, name, password, tenantId, role = 'agent' }) {
    try {
      const mt = getMultitenancy();
      if (!mt.getTenant(tenantId)) {
        // Auto-crear tenant si no existe (onboarding)
        const t = mt.createTenant({ name: tenantId, slug: tenantId, plan: 'starter' });
        tenantId = t.id;
      }
      const u = mt.createUser({ email, name, password, tenantId, role });
      return { ok: true, user: { id: u.id, email: u.email, name: u.name, role: u.role, tenantId } };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /**
   * Middleware: valida Authorization header
   * Devuelve user object si OK, o null (envía 401 si res está disponible)
   *
   * multitenancyService.validateToken devuelve la session ({userId, tenantId, role})
   * Lo traducimos al formato que server.mjs espera ({id, username, role, displayName, tenantId, tenant})
   */
  async authMiddleware(req, res) {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return null;  // backward compat: sin token = public
    const mt = getMultitenancy();
    const session = await mt.validateToken(token);
    if (!session) {
      if (res && typeof res.writeHead === 'function') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token inválido' }));
      }
      return null;
    }
    // Buscar user completo y tenant
    const user = mt.getUser ? mt.getUser(session.tenantId, session.userId) : null;
    const tenant = mt.getTenant(session.tenantId);
    if (!user || !tenant) {
      return {
        id: session.userId,
        username: session.userId,
        role: session.role,
        displayName: session.userId,
        tenantId: session.tenantId,
        tenant: { id: session.tenantId, name: session.tenantId, plan: 'starter' },
      };
    }
    return {
      id: user.id,
      username: user.email,
      role: session.role || user.role,
      displayName: user.name,
      tenantId: session.tenantId,
      tenant,
    };
  }

  async getStats() {
    const mt = getMultitenancy();
    const sessions = mt.listSessions ? mt.listSessions().length : 0;
    return {
      activeSessions: sessions,
      tenants: mt.listTenants().length,
      timestamp: new Date().toISOString(),
    };
  }

  async listTenants() {
    return getMultitenancy().listTenants();
  }

  // Compatibilidad
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async status() { return { ready: this.ready }; }
  async stats() { return this.getStats(); }
  async getStatus() { return { ready: this.ready }; }
}

const instance = new AuthService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance,
  instance: instance,
  auth: instance,
});
export const authService = instance;
export const authentication = instance;
export const authenticator = instance;
export const auth = instance;
export { instance, wrapped };
export default wrapped;
