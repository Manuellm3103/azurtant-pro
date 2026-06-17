/**
 * AzurTant PRO — Soporte N1/N2/N3 con Escalación Automática
 * ==========================================================
 *
 * N1 — Auto-resolución (bot, < 1h SLA, sin intervención humana)
 * N2 — Agente depto Tecnología (humano o escalado internamente, < 4h SLA)
 * N3 — Escalado a CEO / alerta inmediata, < 1h SLA crítico
 *
 * Persistencia: better-sqlite3 (ya en deps).
 * Severidades: P1-critical → N3 inmediato, P2-high → N2, P3-med/P4-low → N1
 */
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';

const SUPPORT_DIR = join(process.cwd(), 'support_data');
const DB_PATH = join(SUPPORT_DIR, 'support.db');

const SLA_HOURS = { 'P1-critical': 1, 'P2-high': 4, 'P3-med': 24, 'P4-low': 72 };
const DEFAULT_LEVEL = (severity) => severity === 'P1-critical' ? 'N3' : (severity === 'P2-high' ? 'N2' : 'N1');

class SupportNService {
  constructor() {
    this.db = null;
    this._ready = false;
  }

  ready() {
    if (this._ready) return true;
    if (!existsSync(SUPPORT_DIR)) mkdirSync(SUPPORT_DIR, { recursive: true });
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        dept TEXT DEFAULT 'tecnologia',
        severity TEXT NOT NULL,
        level TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        sla_hours INTEGER,
        sla_deadline TEXT,
        assigned_to TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolved_at TEXT,
        resolution TEXT,
        escalation_chain TEXT,
        fingerprint TEXT,
        tags TEXT,
        context TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_level ON tickets(level);
      CREATE INDEX IF NOT EXISTS idx_severity ON tickets(severity);
      CREATE INDEX IF NOT EXISTS idx_sla ON tickets(sla_deadline);
    `);
    this._ready = true;
    return true;
  }

  /**
   * Crea un ticket nuevo. Si la severidad es P1-critical, escala a N3 automáticamente.
   * Si ya existe un ticket con el mismo fingerprint (deduplicación), devuelve el existente.
   */
  createTicket({ title, description, dept = 'tecnologia', severity = 'P3-med', fingerprint, tags = [], context = {} }) {
    this.ready();
    if (!title) throw new Error('title requerido');

    // Deduplicación por fingerprint
    if (fingerprint) {
      const fpHash = createHash('sha256').update(String(fingerprint)).digest('hex').slice(0, 16);
      const existing = this.db.prepare('SELECT * FROM tickets WHERE fingerprint = ? AND status != ? LIMIT 1').get(fpHash, 'resolved');
      if (existing) return { ...existing, deduplicated: true };
    }

    const id = `T-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const level = DEFAULT_LEVEL(severity);
    const slaHours = SLA_HOURS[severity] || 24;
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();

    const ticket = {
      id,
      title,
      description: description || '',
      dept,
      severity,
      level,
      status: 'open',
      sla_hours: slaHours,
      sla_deadline: slaDeadline,
      assigned_to: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      resolved_at: null,
      resolution: null,
      escalation_chain: JSON.stringify(level === 'N3' ? [{ at: now.toISOString(), from: 'N1', to: 'N3', reason: 'severity=P1-critical auto-escalation' }] : []),
      fingerprint: fingerprint ? createHash('sha256').update(String(fingerprint)).digest('hex').slice(0, 16) : null,
      tags: JSON.stringify(tags),
      context: JSON.stringify(context),
    };

    this.db.prepare(`INSERT INTO tickets (id, title, description, dept, severity, level, status, sla_hours, sla_deadline, assigned_to, created_at, updated_at, resolved_at, resolution, escalation_chain, fingerprint, tags, context)
                     VALUES (@id, @title, @description, @dept, @severity, @level, @status, @sla_hours, @sla_deadline, @assigned_to, @created_at, @updated_at, @resolved_at, @resolution, @escalation_chain, @fingerprint, @tags, @context)`).run(ticket);

    return this._format(ticket);
  }

  listTickets({ status, level, severity, dept, limit = 100 } = {}) {
    this.ready();
    let q = 'SELECT * FROM tickets WHERE 1=1';
    const params = {};
    if (status) { q += ' AND status = @status'; params.status = status; }
    if (level) { q += ' AND level = @level'; params.level = level; }
    if (severity) { q += ' AND severity = @severity'; params.severity = severity; }
    if (dept) { q += ' AND dept = @dept'; params.dept = dept; }
    q += ' ORDER BY created_at DESC LIMIT @limit';
    params.limit = limit;
    const rows = this.db.prepare(q).all(params);
    return rows.map(r => this._format(r));
  }

  getTicket(id) {
    this.ready();
    const row = this.db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    return row ? this._format(row) : null;
  }

  /**
   * Escala un ticket al siguiente nivel. N1→N2, N2→N3.
   * Si es N3, marca como alertado y notifica CEO (log).
   */
  escalate(id, reason = 'manual') {
    this.ready();
    const row = this.db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!row) throw new Error(`ticket ${id} no existe`);
    if (row.status === 'resolved') throw new Error(`ticket ${id} ya resuelto`);

    const currentLevel = row.level;
    let nextLevel = currentLevel;
    if (currentLevel === 'N1') nextLevel = 'N2';
    else if (currentLevel === 'N2') nextLevel = 'N3';
    else throw new Error(`ticket ${id} ya está en N3 (máximo)`);

    const chain = JSON.parse(row.escalation_chain || '[]');
    chain.push({ at: new Date().toISOString(), from: currentLevel, to: nextLevel, reason });

    // Ajustar SLA al nuevo nivel si es más estricto
    const newSeverity = nextLevel === 'N3' ? 'P1-critical' : (nextLevel === 'N2' ? 'P2-high' : 'P3-med');
    const newSla = SLA_HOURS[newSeverity];
    const newDeadline = new Date(Date.now() + newSla * 3600 * 1000).toISOString();

    this.db.prepare(`UPDATE tickets SET level = ?, severity = ?, sla_hours = ?, sla_deadline = ?, escalation_chain = ?, updated_at = ? WHERE id = ?`)
      .run(nextLevel, newSeverity, newSla, newDeadline, JSON.stringify(chain), new Date().toISOString(), id);

    if (nextLevel === 'N3') {
      console.log(`[SUPPORT] 🚨 N3 ALERT — ticket ${id} escalado a CEO. Razón: ${reason}`);
    }

    return this.getTicket(id);
  }

  resolve(id, resolution) {
    this.ready();
    const row = this.db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!row) throw new Error(`ticket ${id} no existe`);
    const now = new Date().toISOString();
    this.db.prepare(`UPDATE tickets SET status = 'resolved', resolved_at = ?, resolution = ?, updated_at = ? WHERE id = ?`)
      .run(now, resolution || 'resuelto sin notas', now, id);
    return this.getTicket(id);
  }

  /**
   * Auto-resolución N1 — intento de resolver sin intervención.
   * Devuelve la respuesta del runbook o null si requiere escalación.
   */
  autoResolveN1(id) {
    this.ready();
    const ticket = this.getTicket(id);
    if (!ticket) return null;
    if (ticket.level !== 'N1') return { escalated: false, reason: 'no es N1', ticket };

    const title = (ticket.title || '').toLowerCase();
    const desc = (ticket.description || '').toLowerCase();
    const text = title + ' ' + desc;

    // Runbooks automáticos
    const runbooks = [
      { match: /(wifi|wi-fi|inalámbr)/, action: 'Verificar interfaz WiFi (netsh wlan show interfaces), reiniciar adaptador WiFi, validar DHCP.' },
      { match: /(contraseña|password|clave|login)/, action: 'Reset password via /api/auth/reset. Verificar bloqueo de cuenta (5 intentos fallidos = 15 min).' },
      { match: /(impresora|printer)/, action: 'Verificar cola de impresión (netstat → :9100, :515, :631). Reiniciar spooler service. Driver actualizado.' },
      { match: /(correo|email|outlook|gmail)/, action: 'Verificar credenciales IMAP/SMTP, DNS (mail.emanuelazurcorp.com), espacio buzón (>90%?).' },
      { match: /(lento|slow|rendimiento|performance)/, action: 'Diagnóstico CPU/RAM/disco vía /api/ti/diagnose. Limpiar temp/, revisar startup programs.' },
      { match: /(pantalla|monitor|display)/, action: 'Verificar cable HDMI/DP, drivers de video (Device Manager), resolución soportada.' },
    ];

    for (const rb of runbooks) {
      if (rb.match.test(text)) {
        return {
          resolved: true,
          level: 'N1',
          runbook: rb.action,
          ticket,
          message: 'Auto-resuelto por runbook. Si no funciona, escalar a N2.',
        };
      }
    }

    // No hay runbook — escalar a N2
    const escalated = this.escalate(id, 'N1 auto-resolución no encontró runbook aplicable');
    return { resolved: false, escalated: true, ticket: escalated };
  }

  stats() {
    this.ready();
    const total = this.db.prepare('SELECT COUNT(*) as c FROM tickets').get().c;
    const open = this.db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'open'").get().c;
    const resolved = this.db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'resolved'").get().c;
    const byLevel = this.db.prepare("SELECT level, COUNT(*) as c FROM tickets GROUP BY level").all();
    const bySeverity = this.db.prepare("SELECT severity, COUNT(*) as c FROM tickets GROUP BY severity").all();
    const overdue = this.db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'open' AND sla_deadline < ?").get(new Date().toISOString()).c;
    const n3Alerts = this.db.prepare("SELECT COUNT(*) as c FROM tickets WHERE level = 'N3' AND status = 'open'").get().c;
    return { total, open, resolved, overdue, n3Alerts, byLevel, bySeverity, slaHours: SLA_HOURS };
  }

  _format(row) {
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
      context: row.context ? JSON.parse(row.context) : {},
      escalation_chain: row.escalation_chain ? JSON.parse(row.escalation_chain) : [],
      sla_remaining_hours: row.sla_deadline ? Math.max(0, (new Date(row.sla_deadline).getTime() - Date.now()) / 3600000).toFixed(2) : null,
    };
  }
}

export const supportN = new SupportNService();
export default supportN;
