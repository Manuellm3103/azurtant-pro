/**
 * presentationService - REAL presentation builder
 * ===============================================
 * Implementa: build, list, get
 * Genera estructura de presentación con slides
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'presentations.json');

class PresentationService {
  constructor() {
    this.name = 'presentationService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.presentations = this._load();
    this._stats = { built: 0 };
  }
  _load() { try { if (existsSync(FILE)) return JSON.parse(readFileSync(FILE, 'utf8')); } catch {} return { items: [] }; }
  _save() { try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(this.presentations, null, 2)); } catch {} }

  async build({ title, topic, slides = 10, style = 'corporate' } = {}) {
    if (!title) return { success: false, error: 'title requerido' };
    this._stats.built++;
    const deck = {
      id: 'pres-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title, topic: topic || title, style, slides,
      createdAt: new Date().toISOString(),
      slideList: this._generateSlideOutline(title, topic, slides, style),
    };
    this.presentations.items.push(deck);
    this._save();
    return { success: true, deck };
  }

  _generateSlideOutline(title, topic, n, style) {
    const templates = {
      corporate: ['Portada', 'Resumen ejecutivo', 'Contexto', 'Problema', 'Solución', 'Mercado', 'Competencia', 'Modelo de negocio', 'Equipo', 'Roadmap', 'Financiero', 'Cierre'],
      pitch: ['Portada', 'Problema', 'Solución', 'Por qué ahora', 'Tracción', 'Mercado', 'Modelo', 'Equipo', 'Ask'],
      tech: ['Portada', 'Arquitectura', 'Stack', 'Demo', 'Casos de uso', 'Performance', 'Seguridad', 'Roadmap'],
    };
    const tmpl = templates[style] || templates.corporate;
    const slides = [];
    for (let i = 0; i < n; i++) {
      const t = tmpl[i] || `Slide ${i + 1}`;
      slides.push({ index: i + 1, title: t, body: `${t} sobre ${topic || title}` });
    }
    return slides;
  }

  async list() { return { success: true, items: this.presentations.items, total: this.presentations.items.length }; }
  async get({ id } = {}) {
    const p = this.presentations.items.find(x => x.id === id);
    return p ? { success: true, presentation: p } : { success: false, error: 'no encontrado' };
  }
  async delete({ id } = {}) {
    const before = this.presentations.items.length;
    this.presentations.items = this.presentations.items.filter(x => x.id !== id);
    this._save();
    return { success: true, removed: before - this.presentations.items.length };
  }

  getStatus() { return { ready: this.ready, total: this.presentations.items.length, stats: { ...this._stats } }; }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new PresentationService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, presentation: instance,
});
export const presentation = instance;
export { instance, wrapped };
export default wrapped;
