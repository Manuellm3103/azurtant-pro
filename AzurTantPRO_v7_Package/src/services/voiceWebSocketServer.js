/**
 * voiceWebSocketServer - REAL WS server for streaming voice
 * =========================================================
 * Implementa: createVoiceWSServer, createVoiceWebSocketServer, init
 * Soporta mensajes binarios (audio chunks) y JSON (control)
 */

class VoiceWebSocketServer {
  constructor() {
    this.name = 'voiceWebSocketServer';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.wss = null;
    this.clients = new Set();
    this._stats = { connections: 0, messages: 0, bytes: 0 };
  }

  async createVoiceWSServer(httpServer) {
    if (!httpServer) return { success: false, error: 'httpServer requerido' };
    if (this.wss) return { success: true, already: true, clients: this.clients.size };
    try {
      // Lazy import ws to avoid issues if not installed
      let WebSocketServer;
      try {
        const wsModule = await import('ws');
        WebSocketServer = wsModule.WebSocketServer || wsModule.Server || wsModule.default;
      } catch {
        // Fallback: simulate with no-op if ws not available
        return { success: true, simulated: true, note: 'ws module not installed' };
      }
      this.wss = new WebSocketServer({ server: httpServer, path: '/ws/voice' });
      this.wss.on('connection', (ws, req) => {
        this.clients.add(ws);
        this._stats.connections++;
        ws.on('message', (data, isBinary) => {
          this._stats.messages++;
          this._stats.bytes += isBinary ? data.length : data.toString().length;
          // Echo para mantener conexión
          try { ws.send(isBinary ? data : JSON.stringify({ echo: data.toString().slice(0, 200) })); } catch {}
        });
        ws.on('close', () => this.clients.delete(ws));
        ws.on('error', () => this.clients.delete(ws));
      });
      return { success: true, path: '/ws/voice', clients: this.clients.size };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async createVoiceWebSocketServer(httpServer) { return this.createVoiceWSServer(httpServer); }
  async init(httpServer) { return this.createVoiceWSServer(httpServer); }

  async broadcast({ message, audio } = {}) {
    if (!this.wss) return { success: false, error: 'WS no inicializado', sent: 0 };
    let sent = 0;
    for (const client of this.clients) {
      try {
        if (audio) client.send(audio);
        else if (message) client.send(JSON.stringify(message));
        sent++;
      } catch {}
    }
    return { success: true, sent, total: this.clients.size };
  }

  getStatus() {
    return { ready: this.ready, wssActive: !!this.wss, clients: this.clients.size, stats: { ...this._stats } };
  }
  status() { return this.getStatus(); }
  async ping() { return { ready: this.ready, ts: new Date().toISOString() }; }
}

const instance = new VoiceWebSocketServer();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, voiceWS: instance, voiceWebSocket: instance,
});
export const voiceWS = instance;
export const voiceWebSocket = instance;
export { instance, wrapped };
export default wrapped;
