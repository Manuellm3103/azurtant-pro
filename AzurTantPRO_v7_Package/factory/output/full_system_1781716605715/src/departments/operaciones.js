/**
 * AzurTant Operaciones y Logística AI — Department Module
 * Generado por AzurTant Factory AI v1.0.0
 */

import { operacionesRouter } from './operaciones-router.js';

export class OperacionesAgent {
  constructor() {
    this.id = 'operaciones';
    this.name = 'Operaciones y Logística';
    this.icon = '⚙️';
    this.color = '#3B82F6';
    this.skills = ["cadena suministro","logística","inventario","calidad","optimización","VRP"];
    this.kpis = [{"name":"On-Time Delivery","target":"98%"},{"name":"Costo Logístico","target":"-15%"},{"name":"Rotación Inventario","target":"12x/año"}];
    this.complianceLaws = ["NOM-006","NOM-087","ISO 9001"];
    this.systemPrompt = `Eres AzurTant Operaciones AI — Agente de Operaciones y Logística de Emanuel Azur Corporativo (México).
Optimizas cadena de suministro, logística, inventarios, control de calidad, rutas (VRP).
Aplicas NOM-006, ISO 9001. Delegas a @compras para proveedores.`;
    this.router = operacionesRouter;
  }

  async processRequest(message, payload = {}, userId = 'cliente') {
    const result = await this.router.route(message, {
      systemPrompt: this.systemPrompt,
      images: payload.images || null,
      temperature: payload.temperature || null,
      maxTokens: payload.maxTokens || null,
      urgent: payload.urgent || false,
      userId,
      ...payload,
    });

    return {
      success: true,
      message: result.message,
      department: this.id,
      model: result.model,
      modelInfo: result.modelInfo || null,
      fallback: result.fallback || false,
      latency_ms: result.latency_ms || 0,
    };
  }

  getMetadata() {
    return {
      id: this.id, name: this.name, icon: this.icon,
      skills: this.skills, kpis: this.kpis, compliance: this.complianceLaws,
      factory: 'AzurTant Factory AI v1.0.0',
      multiLLMRouter: this.router.getManifest(),
    };
  }
}
