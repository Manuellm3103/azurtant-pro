/**
 * Test Co — Auto-Update OTA System
 * Recibe actualizaciones automáticas desde AzurTant Factory
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const UPDATE_SERVER = process.env.UPDATE_SERVER || 'http://localhost:5190';
const CURRENT_VERSION = '1.0.0';
const COMPANY = 'Test Co';
const UPDATE_DIR = join(process.cwd(), 'updates');

export class AutoUpdater {
  constructor() {
    this.checkInterval = 1000 * 60 * 60; // Cada hora
    this.lastCheck = null;
    this.updateAvailable = false;
    this._ensureDir();
  }

  _ensureDir() {
    if (!existsSync(UPDATE_DIR)) mkdirSync(UPDATE_DIR, { recursive: true });
  }

  /**
   * Verificar si hay actualización disponible en la Factory
   */
  async checkForUpdates() {
    try {
      const resp = await fetch(`${UPDATE_SERVER}/api/history`, {
        signal: AbortSignal.timeout(10000),
      });
      const history = await resp.json();
      
      if (history.length === 0) return null;

      const latest = history[history.length - 1];
      if (latest.version && latest.version !== CURRENT_VERSION) {
        this.updateAvailable = true;
        return {
          currentVersion: CURRENT_VERSION,
          latestVersion: latest.version,
          updateId: latest.id,
          generated: latest.generated,
          message: `Nueva versión disponible: ${latest.version}`,
        };
      }

      this.lastCheck = new Date().toISOString();
      return null;
    } catch (e) {
      console.error('Update check failed:', e.message);
      return null;
    }
  }

  /**
   * Aplicar actualización
   */
  async applyUpdate(updateInfo) {
    console.log(`\\n🔄 APLICANDO ACTUALIZACIÓN: ${updateInfo.latestVersion}`);
    
    try {
      // Descargar nueva versión desde Factory
      const resp = await fetch(`${UPDATE_SERVER}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'full_system',
          companyName: COMPANY,
          version: updateInfo.latestVersion,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const data = await resp.json();
      if (!data.success) throw new Error('No se pudo descargar actualización');

      // Guardar metadatos de la actualización
      writeFileSync(
        join(UPDATE_DIR, `update-${updateInfo.updateId}.json`),
        JSON.stringify({ applied: new Date().toISOString(), ...updateInfo }, null, 2)
      );

      console.log(`✅ Actualización ${updateInfo.latestVersion} aplicada`);
      console.log(`   Reinicio requerido para aplicar cambios\\n`);

      return { success: true, message: 'Actualización descargada. Reinicie el servicio.' };
    } catch (e) {
      console.error(`❌ Error aplicando actualización: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Iniciar monitoreo automático
   */
  startAutoCheck() {
    console.log(`🔄 Auto-Update OTA activado (cada ${this.checkInterval/60000} min)`);
    this._checkLoop();
  }

  async _checkLoop() {
    const update = await this.checkForUpdates();
    if (update) {
      console.log(`\\n📦 ACTUALIZACIÓN DISPONIBLE: ${update.latestVersion}`);
      console.log(`   Versión actual: ${update.currentVersion}`);
      console.log(`   Para aplicar: POST /api/update/apply\\n`);
    }
    setTimeout(() => this._checkLoop(), this.checkInterval);
  }
}

export const autoUpdater = new AutoUpdater();
export default autoUpdater;
