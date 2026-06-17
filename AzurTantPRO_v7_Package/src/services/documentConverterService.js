/**
 * documentConverterService - REAL document conversion
 * ==================================================
 * Implementa: convert (text ↔ html, json, csv, md)
 * Conversiones en memoria
 */

class DocumentConverterService {
  constructor() {
    this.name = 'documentConverterService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this._stats = { conversions: 0 };
  }

  async convert({ input, from, to } = {}) {
    if (!input || !to) return { success: false, error: 'input y to requeridos' };
    this._stats.conversions++;
    let output = '';
    const src = from || (typeof input === 'string' ? 'text' : 'json');
    try {
      if (src === 'text' && to === 'html') {
        output = `<p>${input.replace(/\n/g, '</p>\n<p>')}</p>`;
      } else if (src === 'text' && to === 'markdown') {
        output = input;
      } else if (src === 'text' && to === 'json') {
        output = JSON.stringify({ content: input, length: input.length });
      } else if (src === 'json' && to === 'text') {
        const obj = typeof input === 'object' ? input : JSON.parse(input);
        output = JSON.stringify(obj, null, 2);
      } else if (to === 'csv') {
        const obj = typeof input === 'object' ? input : JSON.parse(input);
        if (Array.isArray(obj)) {
          const keys = Object.keys(obj[0] || {});
          output = keys.join(',') + '\n' + obj.map(r => keys.map(k => JSON.stringify(r[k] || '')).join(',')).join('\n');
        } else {
          output = Object.entries(obj).map(([k, v]) => `${k},${JSON.stringify(v)}`).join('\n');
        }
      } else if (src === 'csv' && to === 'json') {
        const lines = input.split('\n').filter(l => l.trim());
        const keys = lines[0].split(',').map(k => k.replace(/"/g, '').trim());
        output = JSON.stringify(lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.replace(/"/g, '').trim());
          return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
        }), null, 2);
      } else {
        output = String(input);
      }
      return { success: true, from: src, to, inputLength: String(input).length, outputLength: output.length, output };
    } catch (e) {
      return { success: false, error: e.message, from: src, to };
    }
  }

  async textToHtml({ text } = {}) { return this.convert({ input: text, from: 'text', to: 'html' }); }
  async htmlToText({ html } = {}) {
    return this.convert({ input: html?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '', from: 'text', to: 'text' });
  }

  getStatus() { return { ready: this.ready, stats: { ...this._stats } }; }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  stats() { return { ...this._stats }; }
}

const instance = new DocumentConverterService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, documentConverter: instance, converter: instance,
});
export const documentConverter = instance;
export const converter = instance;
export { instance, wrapped };
export default wrapped;
