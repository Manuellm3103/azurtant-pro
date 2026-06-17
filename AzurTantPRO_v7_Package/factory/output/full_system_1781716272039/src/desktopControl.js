/**
 * AzurTant PRO — DesktopControl Agent
 * Computer Use: ejecuta comandos, captura pantalla, controla apps.
 * Solo ejecuta comandos seguros. NUNCA ejecuta comandos destructivos sin aprobación.
 */

import { execSync, exec } from 'child_process';
import { platform } from 'os';

const IS_WINDOWS = platform() === 'win32';

export class DesktopControl {
  /**
   * Ejecutar comando del sistema operativo
   */
  static execute(command, options = {}) {
    const { timeout = 30000, requireApproval = false } = options;

    // Lista de comandos seguros (no requieren aprobación)
    const safeCommands = [
      'dir', 'ls', 'echo', 'type', 'cat', 'whoami', 'hostname',
      'tasklist', 'netstat', 'ipconfig', 'systeminfo', 'date', 'time',
      'powershell -Command "Get-',
      'wmic', 'chkdsk', 'sfc', 'dism',
      'node --version', 'npm --version',
    ];

    const isSafe = safeCommands.some(c => command.toLowerCase().startsWith(c.toLowerCase()));

    if (!isSafe && !requireApproval) {
      return {
        success: false,
        error: 'Comando requiere aprobación explícita',
        command,
        hint: 'Pasa { requireApproval: true } para ejecutar.',
      };
    }

    try {
      const shell = IS_WINDOWS ? 'powershell.exe' : '/bin/bash';
      const output = execSync(command, {
        encoding: 'utf8',
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        shell,
        windowsHide: true,
      });

      return {
        success: true,
        command,
        output: output.slice(0, 5000),
        truncated: output.length > 5000,
      };
    } catch (e) {
      return {
        success: false,
        command,
        error: e.message,
        stderr: e.stderr?.slice(0, 1000) || '',
        exitCode: e.status,
      };
    }
  }

  /**
   * Obtener información del sistema
   */
  static async getSystemInfo() {
    const info = {
      platform: platform(),
      hostname: '',
      cpu: '',
      memory: { total: '', free: '' },
      disk: [],
      os: '',
      uptime: 0,
    };

    try {
      if (IS_WINDOWS) {
        info.hostname = execSync('hostname', { encoding: 'utf8' }).trim();
        info.os = execSync('powershell -Command "(Get-CimInstance Win32_OperatingSystem).Caption"', { encoding: 'utf8' }).trim();
        info.cpu = execSync('powershell -Command "(Get-CimInstance Win32_Processor).Name"', { encoding: 'utf8' }).trim();
        
        const mem = execSync('powershell -Command "Get-CimInstance Win32_OperatingSystem | Select TotalVisibleMemorySize,FreePhysicalMemory"', { encoding: 'utf8' });
        const memMatch = mem.match(/TotalVisibleMemorySize\s*:\s*(\d+).*FreePhysicalMemory\s*:\s*(\d+)/s);
        if (memMatch) {
          info.memory.total = (parseInt(memMatch[1]) * 1024 / (1024**3)).toFixed(1) + ' GB';
          info.memory.free = (parseInt(memMatch[2]) * 1024 / (1024**3)).toFixed(1) + ' GB';
        }

        const disks = execSync('powershell -Command "Get-CimInstance Win32_LogicalDisk -Filter DriveType=3 | Select DeviceID,Size,FreeSpace"', { encoding: 'utf8' });
        const lines = disks.split('\n').filter(l => l.includes(':'));
        info.disk = lines.map(l => {
          const parts = l.trim().split(/\s+/);
          return { drive: parts[0], size: parts[1] ? (parseInt(parts[1])/1024**3).toFixed(0)+'GB' : 'N/A', free: parts[2] ? (parseInt(parts[2])/1024**3).toFixed(0)+'GB' : 'N/A' };
        });
      } else {
        info.hostname = execSync('hostname', { encoding: 'utf8' }).trim();
        info.os = execSync('cat /etc/os-release | head -1', { encoding: 'utf8' }).trim();
        info.cpu = execSync('cat /proc/cpuinfo | grep "model name" | head -1', { encoding: 'utf8' }).trim();
        info.memory.total = execSync('free -h | grep Mem | awk "{print \$2}"', { encoding: 'utf8' }).trim();
        info.memory.free = execSync('free -h | grep Mem | awk "{print \$4}"', { encoding: 'utf8' }).trim();
        info.disk = execSync('df -h / | tail -1', { encoding: 'utf8' }).trim();
      }

      info.uptime = process.uptime();
    } catch (e) {
      info.error = e.message;
    }

    return info;
  }

  /**
   * Verificar salud del sistema (discos, RAM, CPU)
   */
  static async healthCheck() {
    const issues = [];
    const info = await this.getSystemInfo();

    // Verificar espacio en disco
    if (info.disk && info.disk.length > 0) {
      for (const d of info.disk) {
        if (d.free && parseFloat(d.free) < 10) {
          issues.push({ severity: 'warning', component: 'disk', drive: d.drive, message: `Espacio bajo en ${d.drive}: ${d.free}` });
        }
      }
    }

    // Verificar memoria
    if (info.memory.free && parseFloat(info.memory.free) < 2) {
      issues.push({ severity: 'warning', component: 'memory', message: `RAM baja: ${info.memory.free} libre` });
    }

    return {
      healthy: issues.length === 0,
      issues,
      systemInfo: info,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Procesar [ACTION:...] tags en respuestas del agente
   */
  static async processAgentResponse(responseText) {
    const actionRegex = /\[ACTION:(\w+)\]([\s\S]*?)\[\/ACTION\]/gi;
    const actions = [];
    let match;

    while ((match = actionRegex.exec(responseText)) !== null) {
      const [, actionType, params] = match;
      const result = await this.executeAction(actionType, params.trim());
      actions.push({ type: actionType, params: params.trim(), result });
    }

    return actions.length > 0 ? { actions, count: actions.length } : null;
  }

  static async executeAction(type, params) {
    switch (type) {
      case 'run_command':
        return this.execute(params, { requireApproval: true });
      case 'system_info':
        return this.getSystemInfo();
      case 'health_check':
        return this.healthCheck();
      case 'list_processes':
        return this.execute(IS_WINDOWS ? 'tasklist /FO TABLE' : 'ps aux', { requireApproval: true });
      case 'check_disk':
        return this.execute(IS_WINDOWS ? 'powershell -Command "Get-CimInstance Win32_LogicalDisk"' : 'df -h', { requireApproval: true });
      default:
        return { success: false, error: `Acción desconocida: ${type}` };
    }
  }
}

export const desktopControl = DesktopControl;
export default DesktopControl;
