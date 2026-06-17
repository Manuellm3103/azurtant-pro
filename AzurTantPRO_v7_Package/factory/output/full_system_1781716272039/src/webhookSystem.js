/**
 * Test Co — Webhook Alert System
 * Notifica emergencias a Manuel por Telegram/WhatsApp/Email
 */

import { appendFileSync } from 'fs';
import { join } from 'path';

const ALERTS_LOG = join(process.cwd(), 'logs', 'webhooks.jsonl');

export class WebhookDispatcher {
  constructor(config = {}) {
    this.telegramBotToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.telegramChatId = config.telegramChatId || process.env.TELEGRAM_CHAT_ID || '';
    this.ownerPhone = config.ownerPhone || 'Manuel';
    this.ownerEmail = config.ownerEmail || 'manuel@emanuelazurcorp.com';
    this.companyName = 'Test Co';
    this.webhookUrl = config.webhookUrl || process.env.WEBHOOK_URL || '';
  }

  /**
   * Enviar alerta de emergencia
   */
  async sendEmergency(diagnosis, quoteRequest = null) {
    const message = this._formatEmergency(diagnosis, quoteRequest);
    
    const results = { telegram: false, whatsapp: false, email: false, webhook: false };

    // Telegram
    if (this.telegramBotToken) {
      results.telegram = await this._sendTelegram(message);
    }

    // Webhook genérico (WhatsApp via Twilio, etc)
    if (this.webhookUrl) {
      results.webhook = await this._sendWebhook({ type: 'emergency', diagnosis, quoteRequest });
    }

    // Email
    if (this.ownerEmail) {
      results.email = await this._sendEmail(
        `🚨 EMERGENCIA: ${this.companyName} — ${diagnosis.recommendedAction}`,
        message
      );
    }

    // Registrar
    appendFileSync(ALERTS_LOG, JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'emergency',
      diagnosis: diagnosis.id,
      results,
    }) + '\n');

    console.log(`\\n📤 Alertas enviadas: ${JSON.stringify(results)}\\n`);
    return results;
  }

  /**
   * Enviar resumen diario
   */
  async sendDailySummary(summary) {
    const message = this._formatSummary(summary);
    if (this.telegramBotToken) {
      await this._sendTelegram(message);
    }
    if (this.ownerEmail) {
      await this._sendEmail(
        `📊 Resumen Diario: ${this.companyName} — ${summary.date}`,
        message
      );
    }
  }

  _formatEmergency(diagnosis, quoteRequest) {
    let msg = `🚨 *EMERGENCIA — ${this.companyName}*`;
    msg += `\\n\\n*Incidencia:* \${diagnosis.id}`;
    msg += `\\n*Severidad:* \${diagnosis.severity.toUpperCase()}`;
    msg += `\\n*Diagnóstico:* \${diagnosis.recommendedAction}`;
    msg += `\\n*Detalles:* \${JSON.stringify(diagnosis.details)}`;
    msg += `\\n*Timestamp:* \${diagnosis.timestamp}`;
    
    if (quoteRequest) {
      msg += `\\n\\n💰 *Cotización Pendiente:* \${quoteRequest.quoteId}`;
      msg += `\\n*Status:* PENDING_OWNER_PRICE`;
      msg += `\\n📞 Manuel debe asignar precio.`;
    }

    msg += `\\n\\n📞 Contacto: \${this.ownerPhone}`;
    return msg;
  }

  _formatSummary(summary) {
    let msg = `📊 *Resumen Diario — ${this.companyName}*`;
    msg += `\\n📅 Fecha: \${summary.date}`;
    msg += `\\n\\n🔴 Emergencias: \${summary.emergency}`;
    msg += `\\n🟠 Críticos: \${summary.critical}`;
    msg += `\\n🟡 Advertencias: \${summary.warning}`;
    msg += `\\n🟢 Info: \${summary.info || 0}`;
    if (summary.recommendations?.length > 0) {
      msg += `\\n\\n📋 Recomendaciones:`;
      summary.recommendations.forEach(r => msg += `\\n  • ${r}`);
    }
    return msg;
  }

  async _sendTelegram(message) {
    try {
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'Markdown',
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await resp.json();
      return data.ok;
    } catch (e) {
      console.error('Telegram error:', e.message);
      return false;
    }
  }

  async _sendWebhook(payload) {
    try {
      const resp = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  async _sendEmail(subject, body) {
    // Email via webhook o SMTP
    console.log(`📧 EMAIL: ${subject}`);
    console.log(body);
    return true; // Placeholder — integrar con servicio SMTP real
  }
}

export const webhookDispatcher = new WebhookDispatcher();
export default webhookDispatcher;
