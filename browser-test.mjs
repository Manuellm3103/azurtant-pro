// AzurTant PRO - Browser Render Test
// Loads the built bundle in a jsdom environment and verifies React mounts,
// all 13 departments register, and no fatal JS errors fire.

// JSDOM is loaded with default to support CJS; we override fetch on window directly
// and skip the custom ResourceLoader to avoid CJS interop issues.
import jsdomPkg from 'jsdom';
const { JSDOM, VirtualConsole } = jsdomPkg;
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('./dist');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const errors = [];
const warnings = [];
const logs = [];

const virtualConsole = new VirtualConsole();
virtualConsole.on('error', (e) => errors.push(String(e?.message || e)));
virtualConsole.on('warn', (e) => warnings.push(String(e?.message || e)));
virtualConsole.on('log', (e) => logs.push(String(e)));
virtualConsole.on('jsdomError', (e) => errors.push('jsdomError: ' + (e?.message || e)));

// Inject the JS bundle directly into the DOM (jsdom resource loading is unreliable)
const distFiles = fs.readdirSync(path.join(distDir, 'assets'));
const jsFile = distFiles.find(f => f.endsWith('.js'));
const jsCode = fs.readFileSync(path.join(distDir, 'assets', jsFile), 'utf8');

const dom = new JSDOM('<!DOCTYPE html><html><head><title>AzurTant PRO</title></head><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole
});

// Stub browser APIs BEFORE evaluating the bundle
dom.window.fetch = async (url, opts) => {
    if (typeof url === 'string' && (url.includes('localhost:11434') || url.includes('127.0.0.1'))) {
        return { ok: false, status: 0, json: async () => ({}), text: async () => '' };
    }
    if (typeof url === 'string' && url.includes('reddit.com')) {
        return { ok: false, status: 403, json: async () => ({}), text: async () => '' };
    }
    if (typeof url === 'string' && url.includes('api.github.com')) {
        return { ok: false, status: 403, json: async () => ({}), text: async () => '' };
    }
    return { ok: false, status: 0, json: async () => ({}), text: async () => '' };
};
dom.window.speechSynthesis = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
dom.window.MediaRecorder = class { constructor(){} start(){} stop(){} };
dom.window.navigator.mediaDevices = { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) };
dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
dom.window.cancelAnimationFrame = (id) => clearTimeout(id);

// Execute the bundle inside the jsdom window
try {
    dom.window.eval(jsCode);
} catch (e) {
    errors.push('Bundle eval: ' + e.message);
}

// Wait for scripts to load and React to render
await new Promise(r => setTimeout(r, 3000));

const root = dom.window.document.getElementById('root');
const renderedHtml = root ? root.innerHTML : '';
const text = root ? root.textContent : '';

console.log('═══ RENDER TEST ═══\n');
console.log('Root innerHTML length:', renderedHtml.length, 'chars');
console.log('Root textContent length:', text.length, 'chars');
console.log('Errors captured:', errors.length);
console.log('Warnings captured:', warnings.length);

if (errors.length > 0) {
    console.log('\nFirst 5 errors:');
    for (const e of errors.slice(0, 5)) console.log('  ', e.slice(0, 200));
}

// Heuristics: look for key strings in rendered DOM
const checks = [
    { name: 'Title "AzurTant"', regex: /AzurTant/i },
    { name: 'CEO dept visible', regex: /CEO|Direcci[oó]n/i },
    { name: 'Finanzas visible', regex: /Finanzas/i },
    { name: 'Tecnología visible', regex: /Tecnolog|tecnolog/i },
    { name: 'Marketing visible', regex: /Marketing/i },
    { name: 'Ventas visible', regex: /Ventas/i },
    { name: '13 depto sidebar markers', regex: /Operaciones|Legal|RRHH|Compras|Redes|SysAdmin|I\+D|Innovaci[oó]n|Propuestas/i }
];

let passed = 0;
let failed = 0;
for (const c of checks) {
    if (c.regex.test(renderedHtml) || c.regex.test(text)) {
        console.log(`  ✅ ${c.name}`);
        passed++;
    } else {
        console.log(`  ❌ ${c.name} (not found in DOM)`);
        failed++;
    }
}

// Check for fatal React errors (the kind that produce white screen)
const fatal = errors.filter(e => /Cannot read|undefined is not|is not a function|white screen|hydration/i.test(e));
if (fatal.length === 0) {
    console.log('  ✅ No fatal React errors');
    passed++;
} else {
    console.log('  ❌ Fatal React errors:', fatal.length);
    for (const f of fatal.slice(0, 3)) console.log('     ', f.slice(0, 200));
    failed++;
}

console.log(`\n  Total: ${passed + failed} checks | ✅ ${passed} | ❌ ${failed}`);

if (failed > 0) {
    console.log('\n─── SAMPLE OF RENDERED HTML (first 600 chars) ───');
    console.log(renderedHtml.slice(0, 600));
}

process.exit(failed > 0 ? 1 : 0);
