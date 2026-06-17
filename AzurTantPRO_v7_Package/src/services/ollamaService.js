/**
 * ollamaService - Service (STUB INTELIGENTE)
 * =====================================
 * Stub generado automáticamente con los métodos que server.mjs espera.
 * Cada método devuelve respuesta válida (sin lógica de negocio).
 *
 * Métodos implementados: setup, createOllama, stop, build, create, createVoiceWebSocketServer, init, destroy, close, getOllama, createVoiceWSServer, disconnect, updateOllama, listOllama, initialize, ping, start, status, deleteOllama, stats, connect, getStatus, cleanup, reset
 */
class OllamaService {
  constructor() {
    this.name = 'ollamaService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
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

  async createOllama(...args) {
    return { success: true, service: this.name, method: "createOllama", stub: true, timestamp: new Date().toISOString() };
  }

  async createVoiceWSServer(...args) {
    return { success: true, service: this.name, method: "createVoiceWSServer", stub: true, timestamp: new Date().toISOString() };
  }

  async createVoiceWebSocketServer(...args) {
    return { success: true, service: this.name, method: "createVoiceWebSocketServer", stub: true, timestamp: new Date().toISOString() };
  }

  async deleteOllama(...args) {
    return { success: true, service: this.name, method: "deleteOllama", stub: true, timestamp: new Date().toISOString() };
  }

  async destroy(...args) {
    return { success: true, service: this.name, method: "destroy", stub: true, timestamp: new Date().toISOString() };
  }

  async disconnect(...args) {
    return true;
  }

  async getOllama(...args) {
    return { success: true, service: this.name, method: "getOllama", stub: true, timestamp: new Date().toISOString() };
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

  async listOllama(...args) {
    return { success: true, service: this.name, method: "listOllama", stub: true, timestamp: new Date().toISOString() };
  }

  async ping(...args) {
    return { service: this.name, ready: true, stub: true, timestamp: new Date().toISOString() };
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

  async updateOllama(...args) {
    return { success: true, service: this.name, method: "updateOllama", stub: true, timestamp: new Date().toISOString() };
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

const instance = new OllamaService();
// Compatibilidad: server.mjs usa m.X.method(), m.default.method(), m.instance.method()
// y m.shortName.method() (e.g. m.watchdog.start())
const shortName = 'ollama';
// wrapped: copia TODO (prototype + propios) para que los métodos sean accesibles como propiedades
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance,
  instance: instance,
  [shortName]: instance,
});
export const ollamaService = instance;
export default wrapped;  // default = wrapped para que m.X funcione
export const ollama = instance;
export { instance, wrapped };
