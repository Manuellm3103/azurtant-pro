/**
 * marketingAnalysisService - REAL marketing analysis
 * ==================================================
 * Implementa: analyze (URL → estilo/colores/CTA/copy)
 * Usa fetch + parsing ligero del HTML
 */

class MarketingAnalysisService {
  constructor() {
    this.name = 'marketingAnalysisService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this._stats = { analyses: 0, byStyle: {} };
  }

  async analyze(url = '', opts = {}) {
    if (!url) return { success: false, error: 'url requerido' };
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const html = await r.text();
      const result = {
        success: true,
        url,
        status: r.status,
        title: html.match(/<title>(.*?)<\/title>/i)?.[1] || '',
        description: html.match(/<meta name="description" content="(.*?)"/i)?.[1] || '',
        colors: this._extractColors(html),
        ctas: this._extractCTAs(html),
        style: this._detectStyle(html),
        typography: this._detectTypography(html),
        images: (html.match(/<img[^>]*src=/gi) || []).length,
        headings: (html.match(/<h[1-6][^>]*>/gi) || []).length,
        length: html.length,
        timestamp: new Date().toISOString(),
      };
      this._stats.analyses++;
      this._stats.byStyle[result.style] = (this._stats.byStyle[result.style] || 0) + 1;
      return result;
    } catch (e) {
      return { success: false, error: e.message, url };
    }
  }

  _extractColors(html) {
    const colors = new Set();
    const hexMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
    hexMatches.slice(0, 10).forEach(c => colors.add(c.toLowerCase()));
    const rgbMatches = html.match(/rgb\([^)]+\)/g) || [];
    rgbMatches.slice(0, 5).forEach(c => colors.add(c));
    return Array.from(colors).slice(0, 8);
  }

  _extractCTAs(html) {
    const ctas = [];
    const patterns = [
      /<button[^>]*>(.*?)<\/button>/gi,
      /<a[^>]*class="[^"]*(?:btn|button|cta)[^"]*"[^>]*>(.*?)<\/a>/gi,
    ];
    for (const p of patterns) {
      const matches = html.match(p) || [];
      matches.slice(0, 5).forEach(m => {
        const text = m.replace(/<[^>]+>/g, '').trim();
        if (text && text.length < 50) ctas.push(text);
      });
    }
    return ctas.slice(0, 5);
  }

  _detectStyle(html) {
    if (html.includes('gradient') || html.includes('linear-gradient')) return 'gradient';
    if (html.includes('glassmorphism') || html.includes('backdrop-filter')) return 'glassmorphism';
    if (html.includes('shadow') && html.includes('rounded')) return 'modern-card';
    if (html.length > 50000) return 'enterprise';
    return 'minimal';
  }

  _detectTypography(html) {
    const fonts = new Set();
    const matches = html.match(/font-family:\s*['"]?([^;'"]+)/gi) || [];
    matches.slice(0, 5).forEach(m => {
      const font = m.split(':')[1].trim().replace(/['"]/g, '').split(',')[0].trim();
      if (font) fonts.add(font);
    });
    return Array.from(fonts).slice(0, 5);
  }

  getStatus() { return { ready: this.ready, stats: { ...this._stats } }; }
  getDashboard() { return this.getStatus(); }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
  stats() { return { total: this._stats.analyses, byStyle: this._stats.byStyle }; }
}

const instance = new MarketingAnalysisService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, marketingAnalysis: instance,
});
export const marketingAnalysis = instance;
export { instance, wrapped };
export default wrapped;
