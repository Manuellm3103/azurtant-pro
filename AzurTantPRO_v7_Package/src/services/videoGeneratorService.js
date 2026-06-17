/**
 * videoGeneratorService - REAL video script generator
 * ===================================================
 * Implementa: generateScript, planShots, getStatus
 * Genera guiones de video con estructura y shots
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'video-scripts.json');

class VideoGeneratorService {
  constructor() {
    this.name = 'videoGeneratorService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.scripts = this._load();
    this._stats = { generated: 0 };
  }
  _load() { try { if (existsSync(FILE)) return JSON.parse(readFileSync(FILE, 'utf8')); } catch {} return { scripts: [] }; }
  _save() { try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(this.scripts, null, 2)); } catch {} }

  async generateScript({ topic, duration = 60, style = 'explainer' } = {}) {
    if (!topic) return { success: false, error: 'topic requerido' };
    this._stats.generated++;
    const script = {
      id: 'vid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      topic, duration, style,
      createdAt: new Date().toISOString(),
      scenes: this._buildScenes(topic, duration, style),
      totalShots: 0,
    };
    script.totalShots = script.scenes.reduce((a, s) => a + s.shots.length, 0);
    this.scripts.scripts.push(script);
    this._save();
    return { success: true, script };
  }

  _buildScenes(topic, duration, style) {
    const sceneCount = Math.max(3, Math.floor(duration / 20));
    const scenes = [];
    for (let i = 0; i < sceneCount; i++) {
      const isFirst = i === 0, isLast = i === sceneCount - 1;
      const title = isFirst ? 'Hook' : isLast ? 'Cierre/CTA' : `Escena ${i}`;
      scenes.push({
        index: i + 1, title,
        description: isFirst ? `Captar atención sobre ${topic}` : isLast ? `Llamada a la acción sobre ${topic}` : `Desarrollo de ${topic} - parte ${i}`,
        shots: [
          { id: 1, type: 'wide', description: 'Plano general', duration: 5 },
          { id: 2, type: 'medium', description: 'Plano medio', duration: 5 },
        ],
        estimatedDuration: Math.floor(duration / sceneCount),
      });
    }
    return scenes;
  }

  async planShots({ topic } = {}) {
    if (!topic) return { success: false, error: 'topic requerido' };
    return {
      success: true,
      topic,
      shots: [
        { id: 1, type: 'establishing', description: `Plano de apertura para "${topic}"`, duration: 3 },
        { id: 2, type: 'close-up', description: `Detalle clave de "${topic}"`, duration: 4 },
        { id: 3, type: 'medium', description: `Contexto de "${topic}"`, duration: 5 },
        { id: 4, type: 'wide', description: `Cierre visual de "${topic}"`, duration: 3 },
      ],
    };
  }

  async list() { return { success: true, scripts: this.scripts.scripts, total: this.scripts.scripts.length }; }
  async get({ id } = {}) {
    const s = this.scripts.scripts.find(x => x.id === id);
    return s ? { success: true, script: s } : { success: false, error: 'no encontrado' };
  }

  getStatus() { return { ready: this.ready, total: this.scripts.scripts.length, stats: { ...this._stats } }; }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new VideoGeneratorService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, videoGenerator: instance,
});
export const videoGenerator = instance;
export { instance, wrapped };
export default wrapped;
