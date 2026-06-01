/**
 * AzurTant PRO — Sandboxed HTML Canvas
 * Permite a los agentes renderizar HTML rico (forms, dashboards, mockups)
 * en sus respuestas, similar a Castor.
 *
 * Convención: el agente envuelve HTML en bloques ```html ... ``` en su respuesta.
 * El Canvas extrae, sanitiza y renderiza en un iframe sandboxed.
 */

import { JSDOM } from 'jsdom'; // fallback si no hay JSDOM, usar regex simple

// Sanitizador básico: bloquea <script>, on*, javascript:, iframes externos
function sanitizeHtml(html) {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^>]*>/gi, '')
        .replace(/<iframe\s*\/\s*>/gi, '')
        .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/javascript\s*:/gi, 'blocked:')
        .replace(/<link\b[^>]*>/gi, '')
        .replace(/<meta\b[^>]*>/gi, '');
}

export function extractHtmlBlocks(text) {
    if (!text) return [];
    const blocks = [];
    const re = /```html\s*([\s\S]*?)\s*```/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        blocks.push(m[1].trim());
    }
    return blocks;
}

export function renderCanvas(text) {
    const blocks = extractHtmlBlocks(text);
    if (!blocks.length) return null;

    return blocks.map((html, i) => ({
        id: `canvas-${Date.now()}-${i}`,
        html: sanitizeHtml(html),
        sandboxed: true,
        // El frontend usaría un iframe con sandbox="allow-scripts" o similar
    }));
}

// ─── Generadores de UI común para los agentes ─────────────
export const UI = {
    // Tabla simple
    table: (headers, rows) => `<table class="canvas-table" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
        <thead><tr style="background:#0a0e1a;color:white">${headers.map(h => `<th style="padding:8px;text-align:left">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr style="background:${i%2 ? '#f8fafc' : '#fff'}">${r.map(c => `<td style="padding:8px;border-bottom:1px solid #e2e8f0">${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`,

    // KPI card
    kpi: (label, value, trend = '') => `<div style="display:inline-block;padding:16px 24px;margin:8px;background:#0a0e1a;color:white;border-radius:12px;min-width:160px">
        <div style="font-size:13px;color:#8a96b0;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
        <div style="font-size:32px;font-weight:800;margin:8px 0">${value}</div>
        ${trend ? `<div style="font-size:12px;color:#4ade80">${trend}</div>` : ''}
    </div>`,

    // Form de captura
    form: (title, fields) => `<form style="background:white;padding:20px;border-radius:12px;font-family:sans-serif;max-width:480px">
        <h3 style="margin:0 0 16px">${title}</h3>
        ${fields.map(f => `<div style="margin-bottom:12px">
            <label style="display:block;font-size:13px;color:#475569;margin-bottom:4px">${f.label}</label>
            ${f.type === 'textarea' ? `<textarea name="${f.name}" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px" rows="3" placeholder="${f.placeholder||''}"></textarea>`
                : f.type === 'select' ? `<select name="${f.name}" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px">${(f.options||[]).map(o => `<option>${o}</option>`).join('')}</select>`
                : `<input name="${f.name}" type="${f.type||'text'}" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px" placeholder="${f.placeholder||''}" />`}
        </div>`).join('')}
        <button type="submit" style="background:#4ade80;color:#052e16;border:none;padding:10px 20px;border-radius:6px;font-weight:700;cursor:pointer">Enviar</button>
    </form>`,

    // Card de mockup
    card: (title, body) => `<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:8px;font-family:sans-serif">
        <h3 style="margin:0 0 8px;color:#0a0e1a">${title}</h3>
        <div style="color:#475569">${body}</div>
    </div>`,
};
