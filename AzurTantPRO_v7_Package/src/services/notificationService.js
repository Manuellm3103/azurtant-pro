/**
 * notificationService — REAL multi-channel notifications
 * ======================================================
 * Implementa: getHistory, send, markRead
 * Canales: console (always), telegram (si hay token), file (persiste)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const NOTIF_FILE = join(DATA_DIR, 'notifications.json');

class NotificationService {
  constructor() {
    this.name = 'notificationService';
    this.ready = true;
    this.initializedAt = new Date().toISOString();
    this.notifications = this._load();
  }

  _load() {
    try {
      if (existsSync(NOTIF_FILE)) return JSON.parse(readFileSync(NOTIF_FILE, 'utf8'));
    } catch {}
    return [];
  }

  _save() {
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(NOTIF_FILE, JSON.stringify(this.notifications.slice(-500), null, 2));
    } catch {}
  }

  async send({ channel = 'console', message, title, severity = 'info', target, userId, metadata } = {}) {
    const notif = {
      id: 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ts: new Date().toISOString(),
      channel, message, title, severity, target, userId, metadata,
      read: false,
    };
    this.notifications.push(notif);

    // Log a console
    console.log(`[NOTIF ${severity.toUpperCase()}] ${title || ''} ${message}`);

    // Telegram
    if (channel === 'telegram' || channel === 'all') {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = target || process.env.TELEGRAM_CHAT_ID;
      if (token && chatId) {
        try {
          const text = `${severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️'} *${title || 'Notificación'}*\n${message}`;
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
          });
          notif.telegramSent = true;
        } catch (e) {
          notif.telegramError = e.message.slice(0, 200);
        }
      }
    }

    this._save();
    return { success: true, notification: notif };
  }

  sendBatch({ notifications = [] } = {}) {
    return Promise.all(notifications.map(n => this.send(n)));
  }

  getHistory({ limit = 50, severity, userId, unreadOnly } = {}) {
    let items = [...this.notifications].reverse();
    if (severity) items = items.filter(n => n.severity === severity);
    if (userId) items = items.filter(n => n.userId === userId);
    if (unreadOnly) items = items.filter(n => !n.read);
    return items.slice(0, limit);
  }

  markRead({ id, all = false } = {}) {
    if (all) {
      this.notifications.forEach(n => n.read = true);
    } else if (id) {
      const n = this.notifications.find(x => x.id === id);
      if (n) n.read = true;
    }
    this._save();
    return { success: true };
  }

  async status() {
    return {
      ready: this.ready,
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.read).length,
      channels: ['console', 'telegram', 'all'],
    };
  }

  getStatus() { return this.status(); }
  async ping() { return { ready: true, ts: new Date().toISOString() }; }
  async init() { return this.ready; }
  async initialize() { return this.ready; }
  async start() { return true; }
  async stop() { return true; }
}

const instance = new NotificationService();
const proto = Object.getPrototypeOf(instance);
const wrapped = Object.assign(Object.create(proto), instance, proto, {
  default: instance, instance, notification: instance,
});
export const notification = instance;
export { instance, wrapped };
export default wrapped;
