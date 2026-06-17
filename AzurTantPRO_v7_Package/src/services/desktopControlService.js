/**
 * desktopControlService - IMPLEMENTACIÓN REAL
 * ═══════════════════════════════════════════════════════════
 * Control real de Windows usando pyautogui (Python) vía subprocess.
 * Backup: comandos nativos Windows (nircmd, powertoys, etc.)
 *
 * Acciones soportadas:
 *  - screenshot, click, doubleClick, type, hotkey
 *  - openApp, runCommand, systemInfo
 *  - rustdesk, rdp
 *
 * Convergencia: las acciones se ejecutan vía Python para máximo
 * soporte cross-platform (Windows ahora, macOS/Linux en el futuro).
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

// ═══ Python path (venv Hermes) ═══
const PYTHON_EXE = process.env.HERMES_PYTHON
  || 'C:/Users/Manu/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe';

class DesktopControlService {
  constructor() {
    this.name = 'desktopControlService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.screenshotDir = join(process.cwd(), 'data', 'screenshots');
    if (!existsSync(this.screenshotDir)) {
      try { mkdirSync(this.screenshotDir, { recursive: true }); } catch {}
    }
  }

  /**
   * Ejecuta un script Python y retorna { success, output, error }.
   */
  _py(script, timeout = 30000) {
    return new Promise((resolve) => {
      try {
        if (!existsSync(PYTHON_EXE)) {
          return resolve({ success: false, error: `Python no encontrado: ${PYTHON_EXE}` });
        }
        const proc = spawn(PYTHON_EXE, ['-c', script], { shell: false });
        let stdout = '', stderr = '';
        const timer = setTimeout(() => {
          try { proc.kill(); } catch {}
          resolve({ success: false, error: 'timeout', output: stdout, stderr });
        }, timeout);
        proc.stdout.on('data', d => stdout += d.toString());
        proc.stderr.on('data', d => stderr += d.toString());
        proc.on('error', e => { clearTimeout(timer); resolve({ success: false, error: e.message }); });
        proc.on('close', code => {
          clearTimeout(timer);
          resolve({ success: code === 0, output: stdout, stderr, code });
        });
      } catch (e) {
        resolve({ success: false, error: e.message });
      }
    });
  }

  // ═══ ACCIONES REALES ═══

  async screenshot(path) {
    // Acepta string u objeto {path, dept, etc}
    const out = (typeof path === 'string' ? path : (path?.path || path?.filePath)) || join(this.screenshotDir, `screen-${Date.now()}.png`);
    const outWin = String(out).replace(/\\/g, '\\\\');
    const script = `import pyautogui; pyautogui.screenshot('${outWin.replace(/\\\\/g, '\\\\\\\\')}'); print('OK ' + '${outWin}')`;
    try {
      const r = await this._py(script);
      if (r && r.success) {
        return { success: true, output: r.output, path: out, timestamp: new Date().toISOString() };
      }
      return { success: false, error: r?.error || 'unknown', output: r?.output, path: out, timestamp: new Date().toISOString() };
    } catch (e) {
      return { success: false, error: e.message, path: out, timestamp: new Date().toISOString() };
    }
  }

  async click(x, y, button = 'left') {
    const script = `import pyautogui; pyautogui.click(${x}, ${y}, button='${button}'); print('CLICK ' + str(${x}) + ',' + str(${y}))`;
    const r = await this._py(script);
    return { success: r.success, output: r.output, error: r.error, timestamp: new Date().toISOString() };
  }

  async doubleClick(x, y) {
    const script = `import pyautogui; pyautogui.doubleClick(${x}, ${y}); print('DCLICK ' + str(${x}) + ',' + str(${y}))`;
    const r = await this._py(script);
    return { success: r.success, output: r.output, error: r.error, timestamp: new Date().toISOString() };
  }

  async typeText(text) {
    // Escapar comillas
    const safe = String(text).replace(/"/g, '\\"').replace(/'/g, "\\'");
    const script = `import pyautogui; pyautogui.typewrite(${JSON.stringify(text)}, interval=0.02); print('TYPED ' + str(len(${JSON.stringify(text)})))`;
    const r = await this._py(script);
    return { success: r.success, output: r.output, error: r.error, timestamp: new Date().toISOString() };
  }

  async hotkey(...keys) {
    const keysStr = JSON.stringify(keys);
    const script = `import pyautogui; pyautogui.hotkey(*${keysStr}); print('HOTKEY ' + '${keys.join('+')}')`;
    const r = await this._py(script);
    return { success: r.success, output: r.output, error: r.error, timestamp: new Date().toISOString() };
  }

  async openApp(app) {
    // app puede ser: 'winword', 'chrome', 'notepad', 'cmd', etc. o nombre de archivo .exe
    const safe = String(app).replace(/"/g, '\\"');
    // Windows start
    const script = `import subprocess; subprocess.Popen(['start', '', '${safe}'], shell=True); print('OPENED ' + '${safe}')`;
    const r = await this._py(script);
    return { success: r.success, output: r.output, error: r.error, timestamp: new Date().toISOString() };
  }

  async runCommand(command) {
    // Ejecuta un comando Windows con allowlist de seguridad
    if (!command || (typeof command !== 'string' && typeof command !== 'object')) {
      return { success: false, error: 'Comando inválido' };
    }
    // Si es objeto, buscar propiedad 'command' o 'cmd'
    if (typeof command === 'object') {
      command = command.command || command.cmd || command.text || JSON.stringify(command);
    }
    if (typeof command !== 'string' || !command.trim()) {
      return { success: false, error: 'Comando vacío o inválido' };
    }
    // Allowlist de comandos seguros
    const ALLOWED_PREFIXES = [
      'dir', 'ls', 'cd', 'pwd', 'echo', 'type', 'cat', 'ipconfig', 'ifconfig',
      'ping', 'tracert', 'traceroute', 'nslookup', 'systeminfo', 'tasklist',
      'wmic', 'netstat', 'hostname', 'whoami', 'date', 'time', 'ver'
    ];
    const lower = command.toLowerCase().trim();
    const firstWord = lower.split(/\s+/)[0];
    if (!ALLOWED_PREFIXES.includes(firstWord)) {
      return { success: false, error: `Comando no permitido: "${firstWord}". Permitidos: ${ALLOWED_PREFIXES.slice(0,5).join(', ')}...` };
    }
    const safe = String(command).replace(/"/g, '\\"');
    const script = `import subprocess; r = subprocess.run('${safe}', shell=True, capture_output=True, text=True); print(r.stdout); print('EXIT ' + str(r.returncode))`;
    const r = await this._py(script, 60000);
    return { success: r.success, output: r.output, error: r.error, timestamp: new Date().toISOString() };
  }

  async systemInfo() {
    const script = `
import platform, psutil, json
info = {
  'os': platform.platform(),
  'cpu': platform.processor(),
  'cores': psutil.cpu_count(),
  'ram_total_gb': round(psutil.virtual_memory().total / 1024**3, 2),
  'ram_used_pct': psutil.virtual_memory().percent,
  'disk_used_gb': round(psutil.disk_usage('/').used / 1024**3, 2),
  'disk_free_gb': round(psutil.disk_usage('/').free / 1024**3, 2),
  'disk_total_gb': round(psutil.disk_usage('/').total / 1024**3, 2),
  'hostname': platform.node(),
  'python': platform.python_version()
}
print(json.dumps(info))
`;
    const r = await this._py(script);
    try {
      const data = JSON.parse(r.output.split('\n').filter(l => l.startsWith('{'))[0] || '{}');
      return { success: true, info: data, timestamp: new Date().toISOString() };
    } catch (e) {
      return { success: r.success, output: r.output, error: e.message, timestamp: new Date().toISOString() };
    }
  }

  async rustdeskConnect(id, password) {
    if (!id) return { success: false, error: 'Falta ID' };
    const safe = String(id).replace(/[^0-9]/g, '');
    if (!safe) return { success: false, error: 'ID inválido' };
    const script = `import subprocess; subprocess.Popen(['rustdesk', '--connect', '${safe}']); print('RUSTDESK ' + '${safe}')`;
    const r = await this._py(script);
    return { success: r.success, output: r.output, error: r.error, id: safe, timestamp: new Date().toISOString() };
  }

  async rdpConnect(host) {
    if (!host) return { success: false, error: 'Falta host' };
    const script = `import subprocess; subprocess.Popen(['mstsc', '/v:${host}']); print('RDP ' + '${host}')`;
    const r = await this._py(script);
    return { success: r.success, output: r.output, error: r.error, host, timestamp: new Date().toISOString() };
  }

  // Stubs compatibles (delegan a las reales)
  async getStatus() { return { ready: this.ready, name: this.name, python: PYTHON_EXE, screenshotDir: this.screenshotDir }; }
  async init() { return true; }
  async initialize() { return true; }
  async ping() { return { ok: true, timestamp: new Date().toISOString() }; }
  async start() { return true; }
  async stop() { return true; }
  async status() { return { success: true, service: this.name, ready: this.ready, timestamp: new Date().toISOString() }; }
  async stats() {
    const info = await this.systemInfo();
    return { items: [info.info || {}], total: 1 };
  }

  /**
   * Procesa respuesta de un agente (texto) y extrae acciones.
   * Backward compat con código viejo.
   */
  async processAgentResponse(text) {
    // Si el texto parece contener un JSON de acciones, ejecutarlas
    let actions = [];
    try {
      const m = text.match(/\{[\s\S]*"actions"[\s\S]*\}/);
      if (m) {
        const parsed = JSON.parse(m[0]);
        if (Array.isArray(parsed.actions)) actions = parsed.actions;
      }
    } catch {}
    const executed = [];
    for (const a of actions) {
      try {
        let r = null;
        if (a.type === 'screenshot') r = await this.screenshot(a.path);
        else if (a.type === 'click') r = await this.click(a.x, a.y);
        else if (a.type === 'type') r = await this.typeText(a.text);
        else if (a.type === 'hotkey') r = await this.hotkey(...(a.keys || []));
        else if (a.type === 'open-app') r = await this.openApp(a.app);
        executed.push({ ...a, result: r });
      } catch (e) {
        executed.push({ ...a, error: e.message });
      }
    }
    return {
      actionsExecuted: executed.length > 0,
      actionCount: executed.length,
      allSuccess: executed.every(e => e.result?.success !== false),
      text: JSON.stringify(executed, null, 2)
    };
  }
}

const instance = new DesktopControlService();
export const desktopControl = instance;
// Aliases para compatibilidad
export const screenshot = (...a) => instance.screenshot(...a);
export const click = (...a) => instance.click(...a);
export const typeText = (...a) => instance.typeText(...a);
export const hotkey = (...a) => instance.hotkey(...a);
export const openApp = (...a) => instance.openApp(...a);
export const runCommand = (...a) => instance.runCommand(...a);
export const systemInfo = (...a) => instance.systemInfo(...a);
export const rustdeskConnect = (...a) => instance.rustdeskConnect(...a);
export const rdpConnect = (...a) => instance.rdpConnect(...a);
export const processAgentResponse = (...a) => instance.processAgentResponse(...a);
export const getStatus = (...a) => instance.getStatus(...a);
export const init = (...a) => instance.init(...a);
export const initialize = (...a) => instance.initialize(...a);
export const ping = (...a) => instance.ping(...a);
export const start = (...a) => instance.start(...a);
export const stop = (...a) => instance.stop(...a);
export const status = (...a) => instance.status(...a);
export const stats = (...a) => instance.stats(...a);
export default instance;
export { instance };
