/**
 * AzurTant PRO — Legal Advisor Service
 * =====================================
 * Portado de Lethe044/hermes-legal (MIT).
 * Pipeline: INGEST → CLASSIFY → EXTRACT → RISK_SCORE → REPORT
 *
 * 9 categorías de scoring (1-10 cada una, 10 = máximo riesgo):
 *   termination, liability, ipOwnership, nonCompete, payment,
 *   autoRenewal, governingLaw, confidentiality, disputeResolution
 *
 * 6 Red Flags (auto-CRITICAL):
 *   - Terminación unilateral < 7 días
 *   - Responsabilidad ilimitada de una sola parte
 *   - IP que cubre trabajo fuera del contrato
 *   - Non-compete > 2 años o global
 *   - Auto-renovación con ventana de cancelación < 30 días
 *   - Confidencialidad perpetua sobre info no-trade-secret
 *
 * Usa Ollama (granite4.1:30b local por default) en lugar de OpenAI.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const LEGAL_DIR = join(process.cwd(), 'legal_data');
const ARCHIVE_FILE = join(LEGAL_DIR, 'contracts_archive.json');

const CATEGORIES = [
  { key: 'termination', label: 'Terminación', weight: 1.2 },
  { key: 'liability', label: 'Responsabilidad', weight: 1.5 },
  { key: 'ipOwnership', label: 'Propiedad Intelectual', weight: 1.3 },
  { key: 'nonCompete', label: 'No Competencia', weight: 1.0 },
  { key: 'payment', label: 'Pago', weight: 1.1 },
  { key: 'autoRenewal', label: 'Auto-renovación', weight: 0.9 },
  { key: 'governingLaw', label: 'Ley Aplicable', weight: 0.8 },
  { key: 'confidentiality', label: 'Confidencialidad', weight: 1.0 },
  { key: 'disputeResolution', label: 'Resolución Disputas', weight: 1.0 },
];

const RED_FLAGS = [
  { id: 'RF1', pattern: /\b(\d+)\s*(d[ií]as?)\s*de\s*(preaviso|aviso|noti[cC])/i, label: 'Terminación con < 7 días de aviso', severity: 'CRITICAL' },
  { id: 'RF2', pattern: /(responsabilidad\s+(ilimitada|sin\s+l[ií]mite))/i, label: 'Responsabilidad ilimitada', severity: 'CRITICAL' },
  { id: 'RF3', pattern: /(propiedad\s+intelectual.*(incluye|cubre)\s+tiempo\s+libre|ip\s+covers\s+personal)/i, label: 'IP cubre trabajo fuera del contrato', severity: 'CRITICAL' },
  { id: 'RF4', pattern: /(no\s+compet[ei].*?(\d+)\s*a[ñn]os?|non[\s-]?compete.*?(\d+)\s*years?)/i, label: 'Non-compete > 2 años', severity: 'HIGH' },
  { id: 'RF5', pattern: /(auto[\s-]?renov|auto[\s-]?renew).*?(\d+)\s*d[ií]as?/i, label: 'Auto-renovación con ventana corta', severity: 'HIGH' },
  { id: 'RF6', pattern: /(confidencialidad\s+perpetua|perpetual\s+confidentiality)/i, label: 'Confidencialidad perpetua', severity: 'HIGH' },
];

class LegalAdvisorService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.LEGAL_MODEL || 'granite4.1:30b';
    this._ready = false;
  }

  ready() {
    if (this._ready) return true;
    if (!existsSync(LEGAL_DIR)) mkdirSync(LEGAL_DIR, { recursive: true });
    if (!existsSync(ARCHIVE_FILE)) {
      writeFileSync(ARCHIVE_FILE, JSON.stringify({ contracts: [], savedAt: new Date().toISOString() }, null, 2));
    }
    this._ready = true;
    return true;
  }

  /**
   * Análisis completo de un contrato.
   * @param {string} contractText
   * @param {object} opts {parties, contractType, language, useOllama}
   */
  async analyzeContract(contractText, opts = {}) {
    this.ready();
    if (!contractText || contractText.length < 50) {
      throw new Error('contractText requerido (mínimo 50 caracteres)');
    }

    const t0 = Date.now();
    const language = opts.language || this._detectLanguage(contractText);
    const contractType = opts.contractType || this._classifyType(contractText);
    const fingerprint = createHash('sha256').update(contractText).digest('hex').slice(0, 16);

    // 1) Extracción heurística de campos clave
    const extracted = this._extractFields(contractText, language);

    // 2) Scoring por categoría (heurístico + LLM si está disponible)
    let categoryScores;
    if (opts.useOllama !== false) {
      try {
        categoryScores = await this._scoreWithOllama(contractText, language);
      } catch (e) {
        categoryScores = this._scoreHeuristic(contractText);
      }
    } else {
      categoryScores = this._scoreHeuristic(contractText);
    }

    // 3) Red flags
    const redFlags = this._detectRedFlags(contractText);

    // 4) Overall risk
    const totalWeight = CATEGORIES.reduce((s, c) => s + c.weight, 0);
    const weightedSum = CATEGORIES.reduce((s, c) => s + (categoryScores[c.key] || 5) * c.weight, 0);
    const overall = weightedSum / totalWeight;

    let level, verdict;
    if (overall >= 7 || redFlags.some(rf => rf.severity === 'CRITICAL')) { level = 'CRITICAL'; verdict = 'REJECT'; }
    else if (overall >= 5) { level = 'HIGH'; verdict = 'NEGOTIATE'; }
    else if (overall >= 3) { level = 'MEDIUM'; verdict = 'NEGOTIATE'; }
    else { level = 'LOW'; verdict = 'SIGN'; }

    // 5) Sugerencias de negociación (top 3 categorías)
    const top3 = [...CATEGORIES]
      .map(c => ({ ...c, score: categoryScores[c.key] || 5 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(c => c.score >= 5);

    const negotiationSuggestions = top3.map(c => ({
      category: c.key,
      label: c.label,
      score: c.score,
      suggestion: this._negotiationText(c.key, language),
    }));

    // 6) Compare con archivos previos
    const comparison = this._compareWithHistory(fingerprint, contractType, extracted);

    // 7) Report
    const report = {
      fingerprint,
      contractType,
      language,
      parties: opts.parties || extracted.parties,
      effectiveDate: extracted.effectiveDate,
      wordCount: contractText.split(/\s+/).length,
      extractedFields: extracted,
      categoryScores,
      redFlags,
      overall: parseFloat(overall.toFixed(2)),
      level,
      verdict,
      negotiationSuggestions,
      comparison,
      analyzedAt: new Date().toISOString(),
      elapsedMs: Date.now() - t0,
      model: opts.useOllama !== false ? this.defaultModel : 'heuristic',
      disclaimer: 'Este análisis NO es asesoría legal. Consulte un abogado antes de firmar cualquier contrato.',
    };

    this._archive(report);
    return report;
  }

  listAnalyses(limit = 50) {
    this.ready();
    const data = JSON.parse(readFileSync(ARCHIVE_FILE, 'utf-8'));
    return (data.contracts || []).slice(-limit).reverse();
  }

  getAnalysis(fingerprint) {
    this.ready();
    const data = JSON.parse(readFileSync(ARCHIVE_FILE, 'utf-8'));
    return (data.contracts || []).find(c => c.fingerprint === fingerprint) || null;
  }

  stats() {
    this.ready();
    const data = JSON.parse(readFileSync(ARCHIVE_FILE, 'utf-8'));
    const cs = data.contracts || [];
    return {
      total: cs.length,
      byVerdict: {
        SIGN: cs.filter(c => c.verdict === 'SIGN').length,
        NEGOTIATE: cs.filter(c => c.verdict === 'NEGOTIATE').length,
        REJECT: cs.filter(c => c.verdict === 'REJECT').length,
      },
      byLevel: {
        LOW: cs.filter(c => c.level === 'LOW').length,
        MEDIUM: cs.filter(c => c.level === 'MEDIUM').length,
        HIGH: cs.filter(c => c.level === 'HIGH').length,
        CRITICAL: cs.filter(c => c.level === 'CRITICAL').length,
      },
      totalRedFlags: cs.reduce((s, c) => s + (c.redFlags?.length || 0), 0),
    };
  }

  // ─── internals ───

  _detectLanguage(text) {
    const sample = text.slice(0, 500).toLowerCase();
    const es = (sample.match(/\b(el|la|de|que|y|en|un|por|con|para|este|esta|son|del)\b/g) || []).length;
    const en = (sample.match(/\b(the|of|and|to|in|for|with|that|is|by|this|are|be)\b/g) || []).length;
    return es > en ? 'es' : 'en';
  }

  _classifyType(text) {
    const t = text.toLowerCase();
    if (/\b(nda|confidencial|non[\s-]?disclosure)\b/i.test(t)) return 'NDA';
    if (/\b(empleo|trabajador|employment|salari|employee)\b/i.test(t)) return 'Employment Agreement';
    if (/\b(arrendamiento|lease|renta|alquiler)\b/i.test(t)) return 'Lease';
    if (/\b(servicios|service\s+agreement|prestación)\b/i.test(t)) return 'Service Agreement';
    if (/\b(sociedad|partnership|joint\s+venture)\b/i.test(t)) return 'Partnership Agreement';
    if (/\b(compra|purchase|venta\s+de)\b/i.test(t)) return 'Purchase Agreement';
    if (/\b(licencia|licensing|licence)\b/i.test(t)) return 'Licensing Agreement';
    if (/\b(freelance|consultor|honorarios)\b/i.test(t)) return 'Freelance Agreement';
    return 'Other';
  }

  _extractFields(text, lang) {
    const fields = {};
    const partyMatch = text.match(/(?:entre|by\s+and\s+between)\s+([^,\n.]+)/i);
    if (partyMatch) fields.parties = partyMatch[1].trim().slice(0, 200);
    const dateMatch = text.match(/(?:fecha\s+de\s+inicio|effective\s+date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dateMatch) fields.effectiveDate = dateMatch[1];
    const termMatch = text.match(/(?:vigencia|plazo|term)[:\s]+([^.\n]{1,80})/i);
    if (termMatch) fields.term = termMatch[1].trim();
    const jurisdictionMatch = text.match(/(?:jurisdicción|governing\s+law|ley\s+aplicable)[:\s]+([^.\n]{1,80})/i);
    if (jurisdictionMatch) fields.governingLaw = jurisdictionMatch[1].trim();
    return fields;
  }

  _scoreHeuristic(text) {
    const t = text.toLowerCase();
    const scores = {};
    // Termination
    const noticeMatch = t.match(/(\d+)\s*d[ií]as?.*?(preaviso|aviso|notice)/);
    scores.termination = noticeMatch ? Math.min(10, 10 - parseInt(noticeMatch[1]) / 2) : 5;
    if (t.includes('unilateral')) scores.termination = Math.max(scores.termination, 8);
    // Liability
    scores.liability = /(ilimitada|sin\s+l[ií]mite|uncapped)/i.test(t) ? 9 : 3;
    // IP
    scores.ipOwnership = /(propiedad\s+intelectual.*(todo|all)|assigns?\s+all\s+ip)/i.test(t) ? 8 : 4;
    // Non-compete
    const ncMatch = t.match(/no\s+compet[ei].*?(\d+)\s*a[ñn]os?/);
    if (ncMatch) scores.nonCompete = Math.min(10, parseInt(ncMatch[1]) * 4);
    else scores.nonCompete = 2;
    // Payment
    scores.payment = /(intereses\s+moratorios|late\s+payment|payment\s+terms)/i.test(t) ? 3 : 5;
    // Auto-renewal
    scores.autoRenewal = /(auto[\s-]?renov|auto[\s-]?renew)/i.test(t) ? 6 : 2;
    // Governing law
    scores.governingLaw = /(extranjero|foreign\s+jurisdiction)/i.test(t) ? 7 : 3;
    // Confidentiality
    scores.confidentiality = /(perpetua|perpetual|indefinida)/i.test(t) ? 7 : 3;
    // Dispute resolution
    scores.disputeResolution = /(arbitraje|arbitration|mediación)/i.test(t) ? 3 : 5;
    return scores;
  }

  async _scoreWithOllama(text, language) {
    const prompt = `Analiza el siguiente contrato (idioma: ${language}) y asigna un score de 1-10 (10 = máximo riesgo) para cada categoría. Responde SOLO con JSON válido.\n\nCategorías: termination, liability, ipOwnership, nonCompete, payment, autoRenewal, governingLaw, confidentiality, disputeResolution.\n\nContrato:\n${text.slice(0, 3000)}\n\nJSON:`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    try {
      const r = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.defaultModel, prompt, stream: false, format: 'json' }),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const data = await r.json();
      const raw = (data.response || '').trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const out = {};
        for (const c of CATEGORIES) {
          const v = parseFloat(parsed[c.key]);
          out[c.key] = isFinite(v) ? Math.max(1, Math.min(10, v)) : 5;
        }
        return out;
      }
    } catch (e) {
      // fall through
    }
    clearTimeout(t);
    return this._scoreHeuristic(text);
  }

  _detectRedFlags(text) {
    const found = [];
    for (const rf of RED_FLAGS) {
      if (rf.pattern.test(text)) {
        found.push({ id: rf.id, label: rf.label, severity: rf.severity });
      }
    }
    return found;
  }

  _negotiationText(category, language) {
    const es = language === 'es';
    const map = {
      termination: es ? 'Negociar aviso previo de 30 días mínimo, recíproco para ambas partes.' : 'Negotiate 30+ days notice period, reciprocal.',
      liability: es ? 'Limitar responsabilidad al valor total del contrato o 12 meses de fees.' : 'Cap liability at total contract value or 12 months fees.',
      ipOwnership: es ? 'Excluir trabajo personal/hobby de la cesión de IP.' : 'Exclude personal/hobby work from IP assignment.',
      nonCompete: es ? 'Reducir a 6-12 meses, ámbito geográfico específico (ciudad/estado).' : 'Reduce to 6-12 months, narrow geographic scope.',
      payment: es ? 'Establecer penalización por pago tardío (>30 días) con interés legal.' : 'Set late payment penalty (>30 days) with legal interest.',
      autoRenewal: es ? 'Cancelación con 60 días de aviso, sin renovación automática silenciosa.' : '60-day cancellation notice, no silent auto-renewal.',
      governingLaw: es ? 'Negociar ley aplicable neutral o local.' : 'Negotiate neutral or local governing law.',
      confidentiality: es ? 'Limitar a 3-5 años post-terminación, excluir info pública.' : 'Limit to 3-5 years post-termination, exclude public info.',
      disputeResolution: es ? 'Incluir arbitraje vinculante con sede neutral.' : 'Include binding arbitration at neutral venue.',
    };
    return map[category] || '';
  }

  _compareWithHistory(fingerprint, type, fields) {
    this.ready();
    const data = JSON.parse(readFileSync(ARCHIVE_FILE, 'utf-8'));
    const sameType = (data.contracts || []).filter(c => c.contractType === type && c.fingerprint !== fingerprint);
    return {
      previousContracts: sameType.length,
      similar: sameType.slice(-3).map(c => ({ id: c.fingerprint, level: c.level, verdict: c.verdict, date: c.analyzedAt })),
    };
  }

  _archive(report) {
    this.ready();
    const data = JSON.parse(readFileSync(ARCHIVE_FILE, 'utf-8'));
    data.contracts = data.contracts || [];
    data.contracts.push(report);
    if (data.contracts.length > 500) data.contracts = data.contracts.slice(-500);
    data.savedAt = new Date().toISOString();
    writeFileSync(ARCHIVE_FILE, JSON.stringify(data, null, 2));
  }
}

export const legalAdvisor = new LegalAdvisorService();
export default legalAdvisor;
