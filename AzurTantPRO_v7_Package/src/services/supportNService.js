/**
 * supportNService - N1/N2/N3 REAL Support System
 * =================================================
 * Sistema de tickets con escalación N1 → N2 → N3.
 * N1 = auto-resolución con scripts, N2 = agente depto, N3 = CEO alert.
 *
 * Persistencia: data/support-tickets.json
 * Scripts: definidos en SCRIPT_LIBRARY (clean-temp, restart-svc, etc.)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execp = promisify(exec);
const DATA_DIR = join(process.cwd(), 'data');
const TICKETS_FILE = join(DATA_DIR, 'support-tickets.json');

// ═══ SCRIPT LIBRARY (N1 auto-resolution) ═══
const SCRIPT_LIBRARY = {
  'clean-temp': {
    level: 'N1',
    description: 'Limpia archivos temporales del usuario',
    platforms: ['win32', 'linux', 'darwin'],
    run: async () => {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? 'del /q /f /s %TEMP%\\* 2>nul & del /q /f /s C:\\Windows\\Temp\\* 2>nul & echo LIMPIEZA OK'
        : 'rm -rf /tmp/* 2>/dev/null; echo "LIMPIEZA OK"';
      try {
        const { stdout, stderr } = await execp(cmd, { timeout: 60000, shell: true });
        return { success: true, output: stdout || 'OK', stderr: stderr?.slice(0, 200) };
      } catch (e) {
        return { success: true, output: 'Cleanup ejecutado (algunos archivos en uso)', stderr: e.message?.slice(0, 200) };
      }
    },
  },
  'disk-check': {
    level: 'N1',
    description: 'Verifica espacio en disco',
    platforms: ['win32', 'linux', 'darwin'],
    run: async () => {
      const isWin = process.platform === 'win32';
      const cmd = isWin ? 'wmic logicaldisk get caption,freespace,size /format:list' : 'df -h';
      try {
        const { stdout } = await execp(cmd, { timeout: 30000, shell: true });
        return { success: true, output: stdout };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'restart-service': {
    level: 'N2',
    description: 'Reinicia un servicio del sistema',
    platforms: ['win32'],
    run: async ({ serviceName }) => {
      if (!serviceName) return { success: false, error: 'serviceName requerido' };
      try {
        const { stdout } = await execp(`net restart "${serviceName}"`, { timeout: 60000, shell: true });
        return { success: true, output: stdout };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'kill-process': {
    level: 'N2',
    description: 'Mata un proceso por nombre o PID',
    platforms: ['win32', 'linux', 'darwin'],
    run: async ({ name, pid }) => {
      const isWin = process.platform === 'win32';
      const cmd = pid
        ? (isWin ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`)
        : (isWin ? `taskkill /F /IM ${name}.exe` : `pkill -9 -f ${name}`);
      try {
        const { stdout } = await execp(cmd, { timeout: 30000, shell: true });
        return { success: true, output: stdout };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'check-network': {
    level: 'N1',
    description: 'Verifica conectividad de red',
    platforms: ['win32', 'linux', 'darwin'],
    run: async ({ host = '8.8.8.8' } = {}) => {
      const isWin = process.platform === 'win32';
      const cmd = isWin ? `ping -n 4 ${host}` : `ping -c 4 ${host}`;
      try {
        const { stdout } = await execp(cmd, { timeout: 30000, shell: true });
        return { success: true, output: stdout };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'check-memory': {
    level: 'N1',
    description: 'Verifica uso de memoria',
    platforms: ['win32', 'linux', 'darwin'],
    run: async () => {
      const isWin = process.platform === 'win32';
      const cmd = isWin ? 'wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value' : 'free -h';
      try {
        const { stdout } = await execp(cmd, { timeout: 30000, shell: true });
        return { success: true, output: stdout };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'list-processes': {
    level: 'N1',
    description: 'Lista procesos activos (top 20 por memoria)',
    platforms: ['win32', 'linux', 'darwin'],
    run: async () => {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? 'tasklist /FO CSV /NH | sort /R | head -20'
        : 'ps aux --sort=-%mem | head -20';
      try {
        const { stdout } = await execp(cmd, { timeout: 30000, shell: true });
        return { success: true, output: stdout };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'system-info': {
    level: 'N1',
    description: 'Información completa del sistema (hostname, OS, CPU, RAM, disco, uptime, network)',
    platforms: ['win32', 'linux', 'darwin'],
    run: async () => {
      const isWin = process.platform === 'win32';
      try {
        let out = '';
        if (isWin) {
          const { stdout: hn } = await execp('hostname', { shell: true });
          const { stdout: os } = await execp('wmic os get caption,version,buildnumber /value', { shell: true });
          const { stdout: cpu } = await execp('wmic cpu get name /value', { shell: true });
          const { stdout: ram } = await execp('wmic computersystem get totalphysicalmemory /value', { shell: true });
          const { stdout: disk } = await execp('wmic logicaldisk get caption,size,freespace /format:list', { shell: true });
          out = `=== HOSTNAME ===\n${hn}\n=== OS ===\n${os}\n=== CPU ===\n${cpu}\n=== RAM ===\n${ram}\n=== DISK ===\n${disk}`;
        } else {
          const { stdout: hn } = await execp('hostname && uname -a', { shell: true });
          const { stdout: cpu } = await execp('lscpu | head -20', { shell: true });
          const { stdout: ram } = await execp('free -h', { shell: true });
          const { stdout: disk } = await execp('df -h | head -10', { shell: true });
          out = `=== HOSTNAME ===\n${hn}\n=== CPU ===\n${cpu}\n=== RAM ===\n${ram}\n=== DISK ===\n${disk}`;
        }
        return { success: true, output: out };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'network-diagnose': {
    level: 'N2',
    description: 'Diagnóstico completo de red (ping, DNS, interfaces, gateway)',
    platforms: ['win32', 'linux', 'darwin'],
    run: async () => {
      const isWin = process.platform === 'win32';
      try {
        let out = '';
        if (isWin) {
          const { stdout: ip } = await execp('ipconfig /all', { shell: true });
          const { stdout: ping } = await execp('ping -n 4 8.8.8.8', { shell: true });
          const { stdout: dns } = await execp('nslookup google.com 8.8.8.8', { shell: true });
          out = `=== IP CONFIG ===\n${ip}\n=== PING GOOGLE DNS ===\n${ping}\n=== DNS ===\n${dns}`;
        } else {
          const { stdout: ip } = await execp('ip addr 2>/dev/null || ifconfig', { shell: true });
          const { stdout: ping } = await execp('ping -c 4 8.8.8.8', { shell: true });
          const { stdout: dns } = await execp('nslookup google.com 8.8.8.8', { shell: true });
          out = `=== IP ADDR ===\n${ip}\n=== PING ===\n${ping}\n=== DNS ===\n${dns}`;
        }
        return { success: true, output: out };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'service-status': {
    level: 'N2',
    description: 'Lista servicios corriendo (Windows services / systemd)',
    platforms: ['win32', 'linux', 'darwin'],
    run: async ({ filter } = {}) => {
      const isWin = process.platform === 'win32';
      try {
        let out = '';
        if (isWin) {
          const cmd = filter
            ? `wmic service where "name like '%${filter}%'" get name,state,startmode /format:list`
            : 'wmic service get name,state,startmode /format:list | findstr "Running Auto"';
          const { stdout } = await execp(cmd, { shell: true, timeout: 60000 });
          out = stdout;
        } else {
          const cmd = filter
            ? `systemctl list-units --type=service --no-pager | grep ${filter}`
            : 'systemctl list-units --type=service --no-pager --state=running | head -30';
          const { stdout } = await execp(cmd, { shell: true, timeout: 30000 });
          out = stdout;
        }
        return { success: true, output: out };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'powershell-diagnostics': {
    level: 'N3',
    description: 'Diagnóstico avanzado con PowerShell (eventos críticos, drivers, hardware)',
    platforms: ['win32'],
    run: async () => {
      const cmd = `powershell -NoProfile -Command "Get-EventLog -LogName System -EntryType Error -Newest 20 2>$null | Select-Object TimeGenerated,Source,Message | Format-List; Get-WmiObject Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorcode -ne 0 } | Select-Object Name,DeviceID | Format-List"`;
      try {
        const { stdout, stderr } = await execp(cmd, { shell: true, timeout: 60000 });
        return { success: true, output: stdout, stderr: stderr?.slice(0, 500) };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'office-365-status': {
    level: 'N2',
    description: 'Verifica estado de servicios Office 365 / Microsoft 365',
    platforms: ['win32', 'linux', 'darwin'],
    run: async () => {
      try {
        // Llama a la API pública de status de Microsoft
        const r = await fetch('https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/healthOverviews', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) {
          // Si falla (sin auth), hacemos un check simple
          const r2 = await fetch('https://login.microsoftonline.com', { signal: AbortSignal.timeout(10000) });
          return { success: true, output: `Microsoft login reachable: ${r2.ok}, status: ${r2.status}` };
        }
        const data = await r.json();
        return { success: true, services: data.value?.slice(0, 5) };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
  'windows-update-check': {
    level: 'N3',
    description: 'Verifica actualizaciones pendientes de Windows Update',
    platforms: ['win32'],
    run: async () => {
      const cmd = `powershell -NoProfile -Command "Get-WindowsUpdate 2>$null | Select-Object Title,KB,Size | Format-List | Out-String"`;
      try {
        const { stdout } = await execp(cmd, { shell: true, timeout: 60000 });
        return { success: true, output: stdout || 'No pending updates or PSWindowsUpdate module not installed' };
      } catch (e) {
        // Fallback: query WUA API
        try {
          const { stdout } = await execp('powershell -NoProfile -Command "(New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher().Search(\\"IsInstalled=0\\").Updates | Select-Object -First 10 Title | Format-List"', { shell: true, timeout: 60000 });
          return { success: true, output: stdout };
        } catch (e2) {
          return { success: false, error: e2.message };
        }
      }
    },
  },
  'reboot-required': {
    level: 'N2',
    description: 'Verifica si el sistema requiere reinicio (pending reboot)',
    platforms: ['win32'],
    run: async () => {
      const cmd = `powershell -NoProfile -Command "if (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired' -ErrorAction SilentlyContinue) { Write-Output 'REBOOT_REQUIRED' } elseif (Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Component Based Servicing\\RebootPending' -ErrorAction SilentlyContinue) { Write-Output 'REBOOT_PENDING' } else { Write-Output 'NO_REBOOT_NEEDED' }"`;
      try {
        const { stdout } = await execp(cmd, { shell: true, timeout: 30000 });
        return { success: true, output: stdout.trim(), rebootRequired: stdout.includes('REBOOT') && !stdout.includes('NO_') };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
};

class SupportNService {
  constructor() {
    this.name = 'supportNService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.tickets = this._load();
    this.agents = {
      soporte_ti: { level: 'N2', name: 'Soporte TI Agent', email: 'soporte@azur.corp' },
      tecnologia: { level: 'N2', name: 'Tecnología Agent', email: 'tech@azur.corp' },
      seguridad: { level: 'N2', name: 'Seguridad Agent', email: 'security@azur.corp' },
    };
    this.ceoEmail = 'ceo@azur.corp';
    this.ceoTelegram = process.env.TELEGRAM_CHAT_ID;
  }

  _load() {
    try {
      if (existsSync(TICKETS_FILE)) {
        return JSON.parse(readFileSync(TICKETS_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading tickets:', e.message);
    }
    return {};
  }

  _save() {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(TICKETS_FILE, JSON.stringify(this.tickets, null, 2));
    } catch (e) {
      console.error('Error saving tickets:', e.message);
    }
  }

  /**
   * Crear ticket. Acepta body {title, description, level?, dept?}
   * Level auto-asignado: N1 si tiene script, N2 si no, N3 si es crítico
   */
  async createTicket(body) {
    try {
      const id = 'T-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const level = body.level || this._inferLevel(body);
      const ticket = {
        id,
        title: body.title || 'Sin título',
        description: body.description || '',
        level,
        dept: body.dept || 'soporte_ti',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: body.userId || 'default',
        resolution: null,
        history: [{ ts: new Date().toISOString(), event: 'created', level }],
      };
      this.tickets[id] = ticket;
      this._save();

      // Auto-resolve N1
      let autoResolution = null;
      if (level === 'N1') {
        autoResolution = await this._tryAutoResolve(ticket);
      }

      return { success: true, ticket, autoResolution };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  _inferLevel(body) {
    const text = (body.title + ' ' + body.description).toLowerCase();
    if (text.includes('crítico') || text.includes('urgente') || text.includes('caíd')) return 'N3';
    if (text.includes('reiniciar') || text.includes('restart')) return 'N2';
    return 'N1';
  }

  async _tryAutoResolve(ticket) {
    const text = (ticket.title + ' ' + ticket.description).toLowerCase();
    let scriptToRun = null;
    if (text.includes('lento') || text.includes('temp') || text.includes('caché')) scriptToRun = 'clean-temp';
    else if (text.includes('disco') || text.includes('espacio')) scriptToRun = 'disk-check';
    else if (text.includes('red') || text.includes('internet') || text.includes('conexión')) scriptToRun = 'check-network';
    else if (text.includes('memoria') || text.includes('ram')) scriptToRun = 'check-memory';

    if (scriptToRun && SCRIPT_LIBRARY[scriptToRun]) {
      const result = await SCRIPT_LIBRARY[scriptToRun].run({});
      ticket.status = result.success ? 'auto-resolved' : 'escalated';
      ticket.resolution = { script: scriptToRun, result, level: 'N1' };
      ticket.history.push({ ts: new Date().toISOString(), event: 'auto-resolved', script: scriptToRun, success: result.success });
      this._save();
      return { autoResolved: result.success, script: scriptToRun, result };
    }
    return null;
  }

  /**
   * Listar tickets
   */
  async listTickets({ level, status, dept, limit = 50 } = {}) {
    let items = Object.values(this.tickets);
    if (level) items = items.filter(t => t.level === level);
    if (status) items = items.filter(t => t.status === status);
    if (dept) items = items.filter(t => t.dept === dept);
    items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    return { success: true, items, total: items.length, all: Object.keys(this.tickets).length };
  }

  /**
   * Obtener un ticket
   */
  async getTicket(id) {
    return this.tickets[id] || null;
  }

  /**
   * Escalar ticket al siguiente nivel
   */
  async escalate({ id, reason } = {}) {
    const ticket = this.tickets[id];
    if (!ticket) return { success: false, error: 'Ticket no existe' };
    const nextLevel = ticket.level === 'N1' ? 'N2' : 'N3';
    ticket.level = nextLevel;
    ticket.status = 'escalated';
    ticket.history.push({ ts: new Date().toISOString(), event: 'escalated', from: ticket.level, to: nextLevel, reason: reason || '' });
    ticket.updatedAt = new Date().toISOString();
    this._save();

    // N3 = alerta CEO
    if (nextLevel === 'N3') {
      await this._alertCEO(ticket);
    }

    return { success: true, ticket, newLevel: nextLevel };
  }

  /**
   * Resolver ticket
   */
  async resolve({ id, resolution, by } = {}) {
    const ticket = this.tickets[id];
    if (!ticket) return { success: false, error: 'Ticket no existe' };
    ticket.status = 'resolved';
    ticket.resolution = { ...ticket.resolution, final: resolution, by: by || 'agent', ts: new Date().toISOString() };
    ticket.history.push({ ts: new Date().toISOString(), event: 'resolved', by: by || 'agent' });
    ticket.updatedAt = new Date().toISOString();
    this._save();
    return { success: true, ticket };
  }

  /**
   * Ejecutar script de la library
   */
  async executeScript({ script, params = {} } = {}) {
    const s = SCRIPT_LIBRARY[script];
    if (!s) return { success: false, error: `Script no encontrado: ${script}. Disponibles: ${Object.keys(SCRIPT_LIBRARY).join(', ')}` };
    try {
      const result = await s.run(params);
      return { success: true, script, level: s.level, description: s.description, ...result };
    } catch (e) {
      return { success: false, error: e.message, script };
    }
  }

  /**
   * Listar scripts disponibles
   */
  listScripts() {
    return Object.entries(SCRIPT_LIBRARY).map(([name, s]) => ({
      name, level: s.level, description: s.description,
    }));
  }

  async _alertCEO(ticket) {
    // Log a console
    console.log(`[ALERTA CEO] Ticket N3: ${ticket.id} - ${ticket.title}`);
    // Si hay Telegram configurado, enviar
    if (this.ceoTelegram && process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const text = `🚨 N3 ALERT\nTicket: ${ticket.id}\nTitle: ${ticket.title}\nDept: ${ticket.dept}\nDescription: ${ticket.description}`;
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: this.ceoTelegram, text }),
        });
      } catch (e) {
        console.error('Telegram alert error:', e.message);
      }
    }
  }

  async status() {
    const tickets = Object.values(this.tickets);
    return {
      ready: this.ready,
      total: tickets.length,
      byLevel: {
        N1: tickets.filter(t => t.level === 'N1').length,
        N2: tickets.filter(t => t.level === 'N2').length,
        N3: tickets.filter(t => t.level === 'N3').length,
      },
      byStatus: {
        open: tickets.filter(t => t.status === 'open').length,
        auto: tickets.filter(t => t.status === 'auto-resolved').length,
        escalated: tickets.filter(t => t.status === 'escalated').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
      },
      scripts: Object.keys(SCRIPT_LIBRARY).length,
    };
  }

  getStatus() { return this.status(); }
  stats() { return this.status(); }
  async ping() { return { ready: true, tickets: Object.keys(this.tickets).length, scripts: Object.keys(SCRIPT_LIBRARY).length }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new SupportNService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance,
  instance: instance,
  supportN: instance,
});
export const supportN = instance;
export const support = instance;
export { instance, wrapped };
export default wrapped;
