/**
 * Test Co — Emergency Orchestrator + Auto-Fix + ML Federado
 * Auto-generado por AzurTant Factory AI
 * Ollama Cloud $20/mes
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const OWNER_PHONE = 'Manuel';
const OWNER_EMAIL = 'manuel@emanuelazurcorp.com';
const COMPANY = 'Test Co';
const INCIDENT_LOG = join(process.cwd(), 'logs', 'incidents.jsonl');
const ML_DB = join(process.cwd(), 'logs', 'ml-database.json');

class EmergencySystem {
  constructor() {
    this.incidents = [];
    this.learningDB = [];
    this._ensureLogs();
    this._loadML();
  }

  _ensureLogs() {
    const dir = join(process.cwd(), 'logs');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  _loadML() {
    try {
      if (existsSync(ML_DB)) {
        this.learningDB = JSON.parse(require('fs').readFileSync(ML_DB, 'utf8'));
      }
    } catch {}
  }

  _saveML() {
    writeFileSync(ML_DB, JSON.stringify(this.learningDB, null, 2));
  }

  /**
   * Diagnosticar evento del sistema
   */
  diagnose(event) {
    const severity = this._classify(event);
    const diagnosis = {
      id: `INC-${Date.now()}`,
      company: COMPANY,
      timestamp: new Date().toISOString(),
      source: event.source || 'system',
      type: event.type || 'unknown',
      severity,
      details: event.details || {},
      recommendedAction: this._recommendAction(event, severity),
    };

    // Guardar incidencia
    appendFileSync(INCIDENT_LOG, JSON.stringify(diagnosis) + '\n');
    this.incidents.push(diagnosis);

    // ML: Aprender
    this._learn(diagnosis);

    // Alerta si es grave
    if (severity === 'emergency' || severity === 'critical') {
      this._alertOwner(diagnosis);
    }

    return diagnosis;
  }

  /**
   * Clasificar severidad
   */
  _classify(event) {
    if (['disk_failure','hardware_failure','raid_degraded','psu_failure'].includes(event.type)) return 'emergency';
    if (['disk_warning','high_temp','memory_critical'].includes(event.type)) return 'critical';
    if (['memory_high','cpu_spike','disk_high'].includes(event.type)) return 'warning';
    if (event.cpu > 90 || event.memory > 95 || event.disk > 95) return 'warning';
    return 'info';
  }

  /**
   * Recomendar acción
   */
  _recommendAction(event, severity) {
    const actions = {
      disk_failure: 'REEMPLAZO INMEDIATO DE DISCO DURO',
      hardware_failure: 'REEMPLAZO DE HARDWARE DAÑADO',
      raid_degraded: 'REEMPLAZO DE DISCO EN ARRAY RAID',
      psu_failure: 'REEMPLAZO DE FUENTE DE PODER',
      disk_warning: 'Reemplazo preventivo de disco',
      high_temp: 'Revisar refrigeración / limpiar ventiladores',
      memory_critical: 'Ampliar memoria RAM',
    };
    return actions[event.type] || 'Monitoreo continuo';
  }

  /**
   * Notificar a Manuel (dueño)
   */
  _alertOwner(diagnosis) {
    const alert = {
      alert: diagnosis.severity === 'emergency' ? '🚨 EMERGENCIA' : '⚠️ CRÍTICO',
      company: COMPANY,
      incident: diagnosis.id,
      action: diagnosis.recommendedAction,
      message: diagnosis.severity === 'emergency'
        ? `LLAMAR A ${OWNER_PHONE} - ${COMPANY}: ${diagnosis.recommendedAction}`
        : `Notificar a ${OWNER_PHONE} - Requiere cotización`,
    };

    // Guardar alerta para envío
    appendFileSync(
      join(process.cwd(), 'logs', 'alerts.jsonl'),
      JSON.stringify(alert) + '\n'
    );

    console.log(`\\n${alert.alert}`);
    console.log(`Empresa: ${alert.company}`);
    console.log(`Incidencia: ${alert.incident}`);
    console.log(`Acción: ${alert.action}`);
    console.log(`${alert.message}\\n`);

    return alert;
  }

  /**
   * Generar solicitud de cotización para Manuel
   */
  requestQuote(diagnosis) {
    return {
      quoteId: `COT-${Date.now()}`,
      incidentId: diagnosis.id,
      company: COMPANY,
      problem: diagnosis.recommendedAction,
      severity: diagnosis.severity,
      status: 'PENDING_OWNER_PRICE',
      instructions: 'Manuel debe asignar precio. Luego el sistema envía cotización al cliente.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ML: Aprender de cada incidencia
   */
  _learn(diagnosis) {
    this.learningDB.push({
      pattern: diagnosis.type,
      severity: diagnosis.severity,
      action: diagnosis.recommendedAction,
      timestamp: diagnosis.timestamp,
    });

    // Limitar a 1000 entradas
    if (this.learningDB.length > 1000) {
      this.learningDB = this.learningDB.slice(-500);
    }

    this._saveML();
  }

  /**
   * Predecir acción basado en aprendizaje
   */
  predict(eventType) {
    if (this.learningDB.length < 5) return null;
    const relevant = this.learningDB.filter(e => e.pattern === eventType);
    if (relevant.length < 3) return null;

    const actionCounts = {};
    relevant.forEach(r => {
      actionCounts[r.action] = (actionCounts[r.action] || 0) + 1;
    });

    const best = Object.entries(actionCounts).sort((a,b) => b[1]-a[1])[0];
    const confidence = (best[1] / relevant.length * 100);

    return {
      predictedAction: best[0],
      confidence: confidence.toFixed(1) + '%',
      samples: relevant.length,
      autoApply: confidence > 70,
    };
  }

  /**
   * Resumen diario
   */
  dailySummary() {
    const today = new Date().toISOString().slice(0, 10);
    const todayIncidents = this.incidents.filter(i => i.timestamp.startsWith(today));

    return {
      date: today,
      company: COMPANY,
      total: todayIncidents.length,
      emergency: todayIncidents.filter(i => i.severity === 'emergency').length,
      critical: todayIncidents.filter(i => i.severity === 'critical').length,
      warning: todayIncidents.filter(i => i.severity === 'warning').length,
      recommendations: todayIncidents
        .filter(i => i.severity === 'emergency')
        .map(i => `URGENTE: ${i.recommendedAction}`),
    };
  }
}

export const emergencySystem = new EmergencySystem();
export default emergencySystem;
