/**
 * AzurTant PRO — Multitenancy Service
 * ═══════════════════════════════════════════════════════
 * Multi-tenant architecture con:
 * - Organizaciones (tenants)
 * - Usuarios con roles
 * - Sesiones (JWT-like tokens)
 * - Aislamiento de datos por tenantId
 *
 * Persistencia: JSON (portable). Migrable a better-sqlite3.
 *
 * Roles por tenant:
 *   - owner   : acceso total + facturación
 *   - admin   : gestión de usuarios + deptos
 *   - agent   : operación de deptos
 *   - viewer  : solo lectura
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash, randomBytes } from 'crypto';

const DATA_DIR = join(process.cwd(), 'data');
const TENANTS_FILE = join(DATA_DIR, 'tenants.json');
const USERS_FILE = join(DATA_DIR, 'users.json');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function load(file) {
  if (!existsSync(file)) return {};
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return {}; }
}

function save(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function hashPassword(password, salt) {
  salt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  return createHash('sha256').update(password + salt).digest('hex') === hash;
}

function generateToken() {
  return randomBytes(32).toString('hex');
}

class Multitenancy {
  constructor() {
    this.tenants = load(TENANTS_FILE);
    this.users = load(USERS_FILE);
    this.sessions = load(SESSIONS_FILE);
    this.bootstrap();
  }

  bootstrap() {
    // Crear tenant default "emanuel" si no existe
    if (Object.keys(this.tenants).length === 0) {
      const id = 't_emanuel_default';
      this.tenants[id] = {
        id,
        name: 'Emanuel Azur Corporativo',
        slug: 'emanuel',
        plan: 'enterprise',
        createdAt: new Date().toISOString(),
        settings: { maxUsers: 100, modules: ['all'] },
        stats: { users: 0, requests: 0, tokensUsed: 0 }
      };
      this.users['u_admin_emanuel'] = {
        id: 'u_admin_emanuel',
        tenantId: id,
        email: 'admin@emanuelazur.com',
        name: 'Admin Emanuel',
        password: hashPassword('demo123'),
        roles: { [id]: 'owner' },
        createdAt: new Date().toISOString()
      };
      this.stats = { tenants: 1, users: 1 };
      this._persistAll();
    }
  }

  _persistAll() {
    save(TENANTS_FILE, this.tenants);
    save(USERS_FILE, this.users);
    save(SESSIONS_FILE, this.sessions);
  }

  // ═══ TENANTS ═══

  listTenants() {
    return Object.values(this.tenants);
  }

  getTenant(id) {
    return this.tenants[id];
  }

  getTenantBySlug(slug) {
    return Object.values(this.tenants).find(t => t.slug === slug);
  }

  createTenant({ name, slug, plan = 'starter' }) {
    if (!name || !slug) throw new Error('name y slug son requeridos');
    if (this.getTenantBySlug(slug)) throw new Error(`Tenant con slug "${slug}" ya existe`);
    const id = `t_${slug}_${Date.now()}`;
    this.tenants[id] = {
      id, name, slug, plan,
      createdAt: new Date().toISOString(),
      settings: { maxUsers: plan === 'enterprise' ? 100 : 10, modules: plan === 'enterprise' ? ['all'] : ['core'] },
      stats: { users: 0, requests: 0, tokensUsed: 0 }
    };
    this._persistAll();
    return this.tenants[id];
  }

  updateTenantStats(tenantId, fields) {
    const t = this.tenants[tenantId];
    if (!t) return;
    t.stats = { ...t.stats, ...fields };
    this._persistAll();
  }

  // ═══ USERS ═══

  listUsers(tenantId) {
    return Object.values(this.users).filter(u => u.tenantId === tenantId);
  }

  getUser(id) {
    return this.users[id];
  }

  getUserByEmail(email) {
    return Object.values(this.users).find(u => u.email === email);
  }

  createUser({ email, name, password, tenantId, role = 'agent' }) {
    if (!email || !name || !password || !tenantId) throw new Error('Faltan campos');
    if (!this.tenants[tenantId]) throw new Error(`Tenant ${tenantId} no existe`);
    if (this.getUserByEmail(email)) throw new Error(`Email ${email} ya registrado`);
    const id = `u_${email.split('@')[0]}_${Date.now()}`;
    this.users[id] = {
      id, tenantId, email, name,
      password: hashPassword(password),
      roles: { [tenantId]: role },
      createdAt: new Date().toISOString()
    };
    this.tenants[tenantId].stats.users = (this.tenants[tenantId].stats.users || 0) + 1;
    this._persistAll();
    return this.users[id];
  }

  authenticate(email, password) {
    const user = this.getUserByEmail(email);
    if (!user) return { success: false, error: 'Usuario no existe' };
    if (!verifyPassword(password, user.password)) return { success: false, error: 'Password incorrecto' };
    const token = generateToken();
    this.sessions[token] = {
      token,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.roles[user.tenantId] || 'agent',
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    };
    this._persistAll();
    return {
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { id: user.tenantId, slug: this.tenants[user.tenantId]?.slug }
    };
  }

  validateToken(token) {
    const session = this.sessions[token];
    if (!session) return null;
    session.lastSeenAt = new Date().toISOString();
    this._persistAll();
    return session;
  }

  revokeToken(token) {
    delete this.sessions[token];
    this._persistAll();
  }

  // ═══ MIDDLEWARE ═══

  /**
   * Extrae y valida token del header Authorization.
   * Si no hay token, retorna null pero NO lanza (endpoints públicos permitidos).
   */
  authFromHeader(req) {
    const auth = req.headers['authorization'] || '';
    const match = auth.match(/^Bearer\s+(\S+)$/i);
    if (!match) return null;
    return this.validateToken(match[1]);
  }

  /**
   * Filtra datos por tenantId. Helper para endpoints que devuelven listas.
   */
  scopeToTenant(items, tenantId, tenantField = 'tenantId') {
    if (!Array.isArray(items)) return items;
    return items.filter(i => i[tenantField] === tenantId);
  }
}

// Singleton
let instance = null;
export function getMultitenancy() {
  if (!instance) instance = new Multitenancy();
  return instance;
}

export default Multitenancy;
