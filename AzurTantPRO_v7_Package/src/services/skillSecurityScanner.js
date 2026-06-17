/**
 * skillSecurityScanner - REAL security scanner
 * ==============================================
 * Implementa: scanCode, scanSkill, scanString
 * Detecta: secretos, secrets API, comandos peligrosos, SQL injection, etc.
 */

class SkillSecurityScanner {
  constructor() {
    this.name = 'skillSecurityScanner';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.rules = [
      // Secretos hardcoded
      { id: 'sk_live_', severity: 'critical', type: 'secret', pattern: /sk_live_[a-zA-Z0-9]+/g, description: 'Stripe live key' },
      { id: 'sk_test_', severity: 'high', type: 'secret', pattern: /sk_test_[a-zA-Z0-9]+/g, description: 'Stripe test key' },
      { id: 'api_key', severity: 'high', type: 'secret', pattern: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/gi, description: 'API key in code' },
      { id: 'aws_key', severity: 'critical', type: 'secret', pattern: /AKIA[0-9A-Z]{16}/g, description: 'AWS access key' },
      { id: 'github_pat', severity: 'high', type: 'secret', pattern: /github_pat_[a-zA-Z0-9_]+/g, description: 'GitHub PAT' },
      { id: 'ghp_token', severity: 'high', type: 'secret', pattern: /ghp_[a-zA-Z0-9]{36}/g, description: 'GitHub classic token' },
      // Comandos peligrosos
      { id: 'rm_rf', severity: 'critical', type: 'command', pattern: /rm\s+-rf\s+[\/\\]/g, description: 'Recursive force delete from root' },
      { id: 'curl_pipe', severity: 'high', type: 'command', pattern: /curl[^|]*\|\s*(bash|sh)\b/g, description: 'Pipe curl to shell' },
      { id: 'eval', severity: 'high', type: 'command', pattern: /\beval\s*\(/g, description: 'Use of eval()' },
      // SQL injection
      { id: 'sql_drop', severity: 'critical', type: 'sqli', pattern: /\bDROP\s+TABLE\b/gi, description: 'DROP TABLE statement' },
      { id: 'sql_quote', severity: 'medium', type: 'sqli', pattern: /(['"])\s*OR\s+\1?\d+\1?\s*=\s*\1?\d+/gi, description: 'SQL OR 1=1 pattern' },
      // XSS
      { id: 'xss_script', severity: 'high', type: 'xss', pattern: /<script[^>]*>[^<]*<\/script>/gi, description: 'Inline script tag' },
      { id: 'xss_event', severity: 'medium', type: 'xss', pattern: /\bon\w+\s*=\s*['"]?[^'"]*/gi, description: 'Inline event handler' },
    ];
    this._stats = { scans: 0, threats: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } };
  }

  scanCode(code = '', opts = {}) {
    if (!code) return { success: false, error: 'code requerido', threats: [] };
    const threats = [];
    for (const rule of this.rules) {
      const matches = code.match(rule.pattern);
      if (matches && matches.length > 0) {
        threats.push({
          id: rule.id,
          type: rule.type,
          severity: rule.severity,
          description: rule.description,
          occurrences: matches.length,
          samples: matches.slice(0, 3).map(m => m.slice(0, 40) + (m.length > 40 ? '...' : '')),
        });
        this._stats.threats += matches.length;
        this._stats.bySeverity[rule.severity] = (this._stats.bySeverity[rule.severity] || 0) + 1;
      }
    }
    this._stats.scans++;
    const verdict = threats.some(t => t.severity === 'critical') ? 'critical'
      : threats.some(t => t.severity === 'high') ? 'unsafe'
      : threats.length > 0 ? 'warning' : 'safe';
    return {
      success: true,
      scannedChars: code.length,
      threats,
      threatCount: threats.length,
      verdict,
      stats: { ...this._stats },
    };
  }

  scanSkill(skill = {}) {
    const code = skill.code || skill.skill || JSON.stringify(skill);
    return this.scanCode(code);
  }

  scanString(str = '') { return this.scanCode(str); }

  getStatus() {
    return { ready: this.ready, name: this.name, stats: { ...this._stats } };
  }
  getDashboard() { return this.getStatus(); }
  status() { return this.getStatus(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
  stats() { return { total: this._stats.scans, byOp: {} }; }
}

const instance = new SkillSecurityScanner();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, skillSecurityScanner: instance, scanner: instance,
});
export const skillSecurityScanner = instance;
export const scanner = instance;
export { instance, wrapped };
export default wrapped;
