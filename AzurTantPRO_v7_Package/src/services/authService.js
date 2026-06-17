/**
 * authService - Service (STUB INTELIGENTE)
 * =====================================
 * Stub generado automáticamente con los métodos que server.mjs espera.
 * Cada método devuelve respuesta válida (sin lógica de negocio).
 *
 * Métodos implementados: setup, stop, updateAuth, build, create, createVoiceWebSocketServer, init, getStats, destroy, createAuth, login, close, deleteAuth, createVoiceWSServer, disconnect, listAuth, initialize, getAuth, ping, authMiddleware, start, status, listTenants, stats, connect, register, getStatus, cleanup, reset
 */
class AuthService {
  constructor() {
    this.name = 'authService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
  }

  async authMiddleware(...args) {
    return { success: true, service: this.name, method: "authMiddleware", stub: true, timestamp: new Date().toISOString() };
  }

  async build(...args) {
    return { id: "stub-" + Date.now(), created: true, stub: true };
  }

  async cleanup(...args) {
    return { success: true, service: this.name, method: "cleanup", stub: true, timestamp: new Date().toISOString() };
  }

  async close(...args) {
    return { success: true, service: this.name, method: "close", stub: true, timestamp: new Date().toISOString() };
  }

  async connect(...args) {
    return true;
  }

  async create(...args) {
    return { id: "stub-" + Date.now(), created: true, stub: true };
  }

  async createAuth(...args) {
    return { success: true, service: this.name, method: "createAuth", stub: true, timestamp: new Date().toISOString() };
  }

  async createVoiceWSServer(...args) {
    return { success: true, service: this.name, method: "createVoiceWSServer", stub: true, timestamp: new Date().toISOString() };
  }

  async createVoiceWebSocketServer(...args) {
    return { success: true, service: this.name, method: "createVoiceWebSocketServer", stub: true, timestamp: new Date().toISOString() };
  }

  async deleteAuth(...args) {
    return { success: true, service: this.name, method: "deleteAuth", stub: true, timestamp: new Date().toISOString() };
  }

  async destroy(...args) {
    return { success: true, service: this.name, method: "destroy", stub: true, timestamp: new Date().toISOString() };
  }

  async disconnect(...args) {
    return true;
  }

  async getAuth(...args) {
    return { success: true, service: this.name, method: "getAuth", stub: true, timestamp: new Date().toISOString() };
  }

  async getStats(...args) {
    return { success: true, service: this.name, method: "getStats", stub: true, timestamp: new Date().toISOString() };
  }

  async getStatus(...args) {
    return { success: true, service: this.name, method: "getStatus", stub: true, timestamp: new Date().toISOString() };
  }

  async init(...args) {
    return true;
  }

  async initialize(...args) {
    return true;
  }

  async listAuth(...args) {
    return { success: true, service: this.name, method: "listAuth", stub: true, timestamp: new Date().toISOString() };
  }

  async listTenants(...args) {
    return { success: true, service: this.name, method: "listTenants", stub: true, timestamp: new Date().toISOString() };
  }

  async login(...args) {
    return { success: true, service: this.name, method: "login", stub: true, timestamp: new Date().toISOString() };
  }

  async ping(...args) {
    return { service: this.name, ready: true, stub: true, timestamp: new Date().toISOString() };
  }

  async register(...args) {
    return { success: true, service: this.name, method: "register", stub: true, timestamp: new Date().toISOString() };
  }

  async reset(...args) {
    return { success: true, service: this.name, method: "reset", stub: true, timestamp: new Date().toISOString() };
  }

  async setup(...args) {
    return true;
  }

  async start(...args) {
    return true;
  }

  async stats(...args) {
    return { service: this.name, ready: true, stub: true, timestamp: new Date().toISOString() };
  }

  async status(...args) {
    return { service: this.name, ready: true, stub: true, timestamp: new Date().toISOString() };
  }

  async stop(...args) {
    return true;
  }

  async updateAuth(...args) {
    return { success: true, service: this.name, method: "updateAuth", stub: true, timestamp: new Date().toISOString() };
  }



  // Método genérico de fallback
  async execute(action, params = {}) {
    return {
      success: true,
      service: this.name,
      action,
      params,
      stub: true,
      timestamp: new Date().toISOString(),
    };
  }
}

const instance = new AuthService();
// Compatibilidad: server.mjs usa m.X.method(), m.default.method(), m.instance.method()
// y m.shortName.method() (e.g. m.watchdog.start())
const shortName = 'auth';
// wrapped: copia TODO (prototype + propios) para que los métodos sean accesibles como propiedades
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance,
  instance: instance,
  [shortName]: instance,
});
export const authService = instance;
export const authentication = instance;
export const authenticator = instance;
export default wrapped;  // default = wrapped para que m.X funcione
export const auth = instance;
export { instance, wrapped };
