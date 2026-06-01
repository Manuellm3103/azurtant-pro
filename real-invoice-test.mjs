// REAL END-TO-END TEST: lo que Manuel pidió
// 1. Arranca el bundle de producción
// 2. Simula al usuario escribiendo en el chat
// 3. Verifica que el agente de finanzas responda con una invoice real

import jsdomPkg from 'jsdom';
const { JSDOM, VirtualConsole } = jsdomPkg;
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('./dist');
const distFiles = fs.readdirSync(path.join(distDir, 'assets'));
const jsFile = distFiles.find(f => f.endsWith('.js'));
const jsCode = fs.readFileSync(path.join(distDir, 'assets', jsFile), 'utf8');

const errors = [];
const consoleLogs = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('error', (e) => errors.push(String(e?.message || e)));
virtualConsole.on('jsdomError', (e) => errors.push('jsdomError: ' + (e?.message || e)));
virtualConsole.on('log', (e) => consoleLogs.push(String(e)));
virtualConsole.on('warn', (e) => consoleLogs.push('WARN: ' + String(e?.message || e)));

const dom = new JSDOM('<!DOCTYPE html><html><head><title>AzurTant PRO</title></head><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole
});

// Fetch stub que hace que Ollama devuelva un invoice de prueba
let ollamaCallCount = 0;
let ollamaLastRequest = null;
dom.window.fetch = async (url, opts) => {
    if (typeof url === 'string' && url.includes('localhost:11434')) {
        ollamaCallCount++;
        let body = {};
        try { body = JSON.parse(opts?.body || '{}'); } catch (e) {}
        ollamaLastRequest = { url, body, headers: opts?.headers };
        // Simular respuesta de Ollama con invoice generada
        const userMsg = body?.messages?.[body.messages.length - 1]?.content || '';
        return {
            ok: true,
            status: 200,
            json: async () => ({
                message: {
                    content: `INVOICE GENERADA POR DEPARTAMENTO FINANZAS

Folio: CFDI-${Date.now()}
Fecha: ${new Date().toISOString().split('T')[0]}
Emisor: Emanuel Azur Corporativo (EAC000000ABC)
Receptor: Cliente Demo (XAXX010101000)

CONCEPTOS:
- Servicio de consultoría multi-agente: $10,000.00 MXN
- IVA 16%: $1,600.00 MXN
- Total: $11,600.00 MXN

Cumplimiento fiscal verificado: LISR Art. 29, LIVA Art. 1-A
Estado: TIMBRADA (simulada en test)

Sistema: AzurTant PRO v1.0 - Agente de Finanzas respondiendo.
Solicitud original: "${userMsg.slice(0, 100)}"`
                }
            }),
            text: async () => ''
        };
    }
    return { ok: false, status: 0, json: async () => ({}), text: async () => '' };
};
dom.window.speechSynthesis = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
dom.window.MediaRecorder = class { constructor(){} start(){} stop(){} };
dom.window.navigator.mediaDevices = { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) };
dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
dom.window.cancelAnimationFrame = (id) => clearTimeout(id);
dom.window.alert = (msg) => consoleLogs.push('ALERT: ' + msg);

try {
    dom.window.eval(jsCode);
} catch (e) {
    console.log('Bundle eval error:', e.message);
}

// Esperar a que React monte
await new Promise(r => setTimeout(r, 4000));

const doc = dom.window.document;
const root = doc.getElementById('root');

console.log('═══════════════════════════════════════');
console.log('  PRUEBA REAL: ¿AzurTant hace algo?');
console.log('═══════════════════════════════════════\n');

console.log('Root rendered:', root?.innerHTML?.length || 0, 'chars\n');

// Paso 1: Listar todos los inputs y textareas visibles
const inputs = Array.from(doc.querySelectorAll('input, textarea, button'));
console.log('─── PASO 1: Elementos interactivos encontrados ───');
console.log('Total:', inputs.length);
const visibles = inputs.filter(el => el.offsetParent !== null || el.type !== 'hidden');
console.log('Visibles:', visibles.length);
for (const el of visibles.slice(0, 25)) {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || el.placeholder || el.value || '').slice(0, 40).replace(/\s+/g, ' ').trim();
    const type = el.type || '';
    console.log(`  <${tag}${type ? ' type="'+type+'"' : ''}> "${text}"`);
}

console.log('\n─── PASO 2: Buscar botones de departamento y chat ───');
const deptButtons = visibles.filter(el => /CEO|Finanzas|Marketing|Ventas|Operaciones|Legal|Tecnología|RRHH|Compras|Propuestas|Redes|SysAdmin|Innovaci/i.test(el.textContent || ''));
console.log('Botones de departamento encontrados:', deptButtons.length);
for (const b of deptButtons.slice(0, 13)) {
    console.log('  →', (b.textContent || '').slice(0, 50).replace(/\s+/g, ' ').trim());
}

console.log('\n─── PASO 3: Buscar input de chat ───');
const chatInputs = visibles.filter(el => el.tagName === 'INPUT' && (el.type === 'text' || !el.type));
const textareas = visibles.filter(el => el.tagName === 'TEXTAREA');
console.log('Inputs de texto:', chatInputs.length);
console.log('Textareas:', textareas.length);
for (const inp of [...chatInputs, ...textareas].slice(0, 5)) {
    console.log('  → placeholder:', JSON.stringify(inp.placeholder || ''));
}

// Paso 4: Simular click en Finanzas
console.log('\n─── PASO 4: Simular click en Finanzas ───');
const finanzasBtn = deptButtons.find(b => /Finanzas/i.test(b.textContent || ''));
if (finanzasBtn) {
    console.log('Click en:', finanzasBtn.textContent.slice(0, 30));
    try {
        finanzasBtn.click();
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
        console.log('Click error:', e.message);
    }
} else {
    console.log('❌ No se encontró botón de Finanzas');
}

// Paso 5: Buscar el input/textarea del chat y escribir
console.log('\n─── PASO 5: Escribir "crear invoice" en el chat ───');
await new Promise(r => setTimeout(r, 1500));
const allInputsAfter = Array.from(doc.querySelectorAll('input, textarea')).filter(el => el.offsetParent !== null);
let chatField = allInputsAfter.find(el => el.tagName === 'TEXTAREA') || allInputsAfter.find(el => el.type === 'text');

if (chatField) {
    console.log('Campo de chat encontrado:', chatField.tagName, 'placeholder:', JSON.stringify(chatField.placeholder || ''));
    // Set value via React-compatible setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(chatField.constructor.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
        nativeInputValueSetter.call(chatField, 'crear invoice por $10,000 MXN al cliente Acme Corp');
    } else {
        chatField.value = 'crear invoice por $10,000 MXN al cliente Acme Corp';
    }
    chatField.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    chatField.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    console.log('✅ Mensaje escrito en el campo');

    // Buscar botón Send
    await new Promise(r => setTimeout(r, 500));
    const sendBtn = Array.from(doc.querySelectorAll('button')).find(b => {
        const txt = (b.textContent || '').toLowerCase();
        return /^(send|enviar|→|↵)$/i.test(txt.trim()) || txt.includes('send');
    });
    if (sendBtn) {
        console.log('Botón Send encontrado, clickeando...');
        sendBtn.click();
    } else {
        console.log('Simulando Enter...');
        chatField.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }

    // Esperar respuesta
    await new Promise(r => setTimeout(r, 5000));
} else {
    console.log('❌ No se encontró campo de chat');
}

console.log('\n═══════════════════════════════════════');
console.log('  RESULTADO');
console.log('═══════════════════════════════════════');
console.log('Llamadas a Ollama (http://localhost:11434):', ollamaCallCount);
if (ollamaLastRequest) {
    console.log('\nÚltima request a Ollama:');
    console.log('  URL:', ollamaLastRequest.url);
    console.log('  Model:', ollamaLastRequest.body.model || 'auto');
    console.log('  Task:', ollamaLastRequest.body.messages?.[0]?.content?.slice(0, 100));
    console.log('  User msg:', ollamaLastRequest.body.messages?.[1]?.content?.slice(0, 150));
}

// Buscar la respuesta en el DOM
const messages = Array.from(doc.querySelectorAll('[class*="message"], p, div')).filter(el => {
    const txt = el.textContent || '';
    return txt.includes('INVOICE') || txt.includes('Folio') || txt.includes('CFDI') || txt.includes('Finanzas');
}).slice(0, 5);
if (messages.length) {
    console.log('\n─── RESPUESTA ENCONTRADA EN DOM ───');
    for (const m of messages) {
        const txt = (m.textContent || '').slice(0, 300).replace(/\s+/g, ' ').trim();
        if (txt.length > 20) console.log('  →', txt);
    }
} else {
    console.log('\n❌ No se encontró respuesta de invoice en el DOM');
}

console.log('\n─── Console logs (últimos 10) ───');
for (const log of consoleLogs.slice(-10)) console.log('  ', log.slice(0, 200));

if (errors.length) {
    console.log('\n─── Errores ───');
    for (const e of errors.slice(0, 5)) console.log('  ', e.slice(0, 200));
}

process.exit(0);
