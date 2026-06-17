/**
 * apiDocsService - REAL API documentation generator
 * =================================================
 * Implementa: list, describe, generate
 * Genera docs de la API actual a partir de server.mjs
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class ApiDocsService {
  constructor() {
    this.name = 'apiDocsService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this._stats = { generated: 0 };
    this.endpoints = this._parseFromServer();
  }

  _parseFromServer() {
    const serverPath = join(process.cwd(), 'server.mjs');
    if (!existsSync(serverPath)) return [];
    try {
      const content = readFileSync(serverPath, 'utf8');
      const matches = content.matchAll(/path === '(\/api\/[^']+)' && req\.method === '(GET|POST|PUT|DELETE)'/g);
      const eps = [];
      let i = 0;
      for (const m of matches) {
        eps.push({ id: i++, path: m[1], method: m[2] });
      }
      return eps;
    } catch { return []; }
  }

  async list({ method = null } = {}) {
    let eps = this.endpoints;
    if (method) eps = eps.filter(e => e.method === method);
    return { success: true, endpoints: eps, total: eps.length };
  }

  async describe({ path, method = 'GET' } = {}) {
    if (!path) return { success: false, error: 'path requerido' };
    const found = this.endpoints.find(e => e.path === path && (!method || e.method === method));
    if (!found) return { success: false, error: 'endpoint no encontrado' };
    return {
      success: true,
      endpoint: found,
      sampleRequest: method === 'GET' ? `curl http://localhost:5182${path}` : `curl -X ${method} http://localhost:5182${path} -H "Content-Type: application/json" -d '{}'`,
    };
  }

  async generate({ format = 'markdown' } = {}) {
    this._stats.generated++;
    if (format === 'markdown') {
      let md = '# AzurTant PRO API\n\n';
      md += `Total endpoints: ${this.endpoints.length}\n\n`;
      const byMethod = {};
      for (const e of this.endpoints) {
        if (!byMethod[e.method]) byMethod[e.method] = [];
        byMethod[e.method].push(e);
      }
      for (const [m, eps] of Object.entries(byMethod)) {
        md += `## ${m}\n\n`;
        for (const e of eps) md += `- \`${e.path}\`\n`;
        md += '\n';
      }
      return { success: true, format, content: md, total: this.endpoints.length };
    }
    return { success: true, format, content: JSON.stringify(this.endpoints, null, 2), total: this.endpoints.length };
  }

  getStatus() {
    return { ready: this.ready, totalEndpoints: this.endpoints.length, stats: { ...this._stats } };
  }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new ApiDocsService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, apiDocs: instance,
});
export const apiDocs = instance;
export { instance, wrapped };
export default wrapped;
