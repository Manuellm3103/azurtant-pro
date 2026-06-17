/**
 * Test Co — Server Full Stack
 * Puerto 5182 | Meta-Orquestador + 1 departamentos
 * Generado por AzurTant Factory AI
 */

import { createServer } from 'http';
import { metaOrchestrator } from './metaOrchestrator.js';

const COMPANY_NAME = 'Test Co';
const PORT = 5182;

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

function json(res, data, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({ raw: body }); }
    });
  });
}

function serveFile(res, filePath) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html lang="es-MX"><head><meta charset="UTF-8"><title>Test Co</title><style>body{background:#070b1a;color:#d4c6a8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{text-align:center;padding:48px;border:1px solid #1e293b;border-radius:20px;background:#0d1225}h1{font-size:24px;background:linear-gradient(135deg,#d4c6a8,#c59b60);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}p{color:#8a96b0;font-size:14px;margin:4px 0}code{color:#d4c6a8;background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:4px;font-size:12px}</style></head><body><div class="card"><h1>Test Co</h1><p>AzurTant PRO - Operativo</p><p style="margin-top:16px"><code>POST /api/chat</code> | <code>GET /api/health</code></p></div></body></html>');
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  // API: Chat (Orquestador Principal)
  if (path === '/api/chat' && req.method === 'POST') {
    const body = await readBody(req);
    const message = body.message || '';
    if (!message) return json(res, { error: 'Mensaje requerido' }, 400);
    const result = await metaOrchestrator.processHumanRequest(message, body.userId || 'cliente', { lang: body.lang || 'es-MX' });
    return json(res, result);
  }

  // API: Health
  if (path === '/api/health') {
    return json(res, {
      status: 'operational',
      company: 'Test Co',
      agents: 1,
      orchestrator: 'loaded',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  // API: Status
  if (path === '/api/status') {
    return json(res, metaOrchestrator.getStatus());
  }

  // API: Emergency — Reportar incidencia
  if (path === '/api/emergency' && req.method === 'POST') {
    const body = await readBody(req);
    const { emergencySystem } = await import('./src/emergencySystem.js');
    const diagnosis = emergencySystem.diagnose(body);
    if (diagnosis.severity === 'emergency' || diagnosis.severity === 'critical') {
      const quote = emergencySystem.requestQuote(diagnosis);
      return json(res, { alert: true, diagnosis, quoteRequest: quote });
    }
    return json(res, { diagnosis });
  }

  // API: Emergency — Resumen diario
  if (path === '/api/emergency/summary') {
    const { emergencySystem } = await import('./src/emergencySystem.js');
    return json(res, emergencySystem.dailySummary());
  }

  // API: Emergency — ML Predict
  if (path === '/api/emergency/predict' && req.method === 'POST') {
    const body = await readBody(req);
    const { emergencySystem } = await import('./src/emergencySystem.js');
    return json(res, { prediction: emergencySystem.predict(body.eventType) });
  }

  // API: Desktop — Computer Use
  if (path === '/api/desktop' && req.method === 'POST') {
    const body = await readBody(req);
    const { DesktopControl } = await import('./src/desktopControl.js');
    if (body.action === 'system_info') {
      return json(res, await DesktopControl.getSystemInfo());
    }
    if (body.action === 'health_check') {
      return json(res, await DesktopControl.healthCheck());
    }
    if (body.command) {
      return json(res, DesktopControl.execute(body.command, { requireApproval: true }));
    }
    return json(res, { error: 'action o command requerido' }, 400);
  }

  // Home page (Chat UI completo — sin dependencias externas)
  if (path === '/' || path === '/index.html') {
    const html = `<!DOCTYPE html><html lang="es-MX"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${COMPANY_NAME} — AzurTant PRO</title><style>
:root{--gold:#d4c6a8;--copper:#c59b60;--navy:#070b1a;--navy2:#0d1225;--card:#111827;--border:#1e293b;--muted:#8a96b0;--w:#fff}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--navy);color:var(--w);height:100vh;display:flex;flex-direction:column}
.header{background:var(--navy2);border-bottom:1px solid var(--border);padding:12px 20px;display:flex;align-items:center;gap:10px}
.header .dot{width:10px;height:10px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80}
.header h1{font-size:16px;background:linear-gradient(135deg,var(--gold),var(--copper));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header .badge{font-size:11px;color:var(--muted);margin-left:auto}
.chat{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px}
.msg{max-width:80%;padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.5;animation:fadeIn .3s}
.msg.user{align-self:flex-end;background:rgba(197,155,96,0.15);border:1px solid rgba(197,155,96,0.3);color:var(--gold)}
.msg.agent{align-self:flex-start;background:var(--card);border:1px solid var(--border);color:var(--w)}
.msg .dept{font-size:11px;color:var(--copper);margin-bottom:4px;font-weight:600}
.msg .time{font-size:10px;color:var(--muted);margin-top:4px}
.typing{padding:12px 16px;color:var(--muted);font-size:13px;animation:pulse 1.5s infinite}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.input-bar{background:var(--navy2);border-top:1px solid var(--border);padding:12px 20px;display:flex;gap:10px}
.input-bar input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px;color:var(--w);font-size:14px;outline:none;transition:border .2s}
.input-bar input:focus{border-color:var(--gold)}
.input-bar button{background:linear-gradient(135deg,var(--gold),var(--copper));color:var(--navy);border:none;border-radius:12px;padding:12px 24px;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s}
.input-bar button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 16px rgba(197,155,96,0.4)}
.input-bar button:disabled{opacity:.4;cursor:not-allowed}
</style></head><body>
<div class="header"><div class="dot"></div><h1>${COMPANY_NAME}</h1><span class="badge" id="deptCount">1 agentes</span></div>
<div class="chat" id="chat"><div class="msg agent"><div class="dept">🤖 AzurTant PRO</div>¡Hola! Soy el sistema multi-agente de <b>${COMPANY_NAME}</b>. Pregúntame lo que necesites — finanzas, legal, tecnología, ventas, marketing, RRHH, operaciones, seguridad, o lo que requieras. Estoy listo.</div></div>
<div class="input-bar"><input id="msgInput" type="text" placeholder="Escribe tu mensaje... (Ctrl+Enter para enviar)" onkeydown="if(event.ctrlKey&&event.key==='Enter')sendMsg()"><button id="sendBtn" onclick="sendMsg()">Enviar</button></div>
<script>
const chat=document.getElementById('chat'),input=document.getElementById('msgInput'),btn=document.getElementById('sendBtn');
async function sendMsg(){
  const msg=input.value.trim();if(!msg)return;
  input.value='';btn.disabled=true;
  chat.insertAdjacentHTML('beforeend','<div class="msg user">'+esc(msg)+'<div class="time">Ahora</div></div>');
  chat.insertAdjacentHTML('beforeend','<div class="typing" id="typing">Pensando...</div>');
  chat.scrollTop=chat.scrollHeight;
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,userId:'web',lang:'es-MX'})});
    const d=await r.json();
    document.getElementById('typing')?.remove();
    const dept=d.department||'orchestrator';
    const sub=d.subDepartments?' +'+d.subDepartments.join(', '):'';
    chat.insertAdjacentHTML('beforeend','<div class="msg agent"><div class="dept">'+dept+sub+'</div>'+esc(d.message||'Sin respuesta')+'<div class="time">'+d.model+'</div></div>');
  }catch(e){
    document.getElementById('typing')?.remove();
    chat.insertAdjacentHTML('beforeend','<div class="msg agent"><div class="dept">⚠ Error</div>'+esc(e.message)+'</div>');
  }
  chat.scrollTop=chat.scrollHeight;btn.disabled=false;input.focus();
}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML.replace(/\n/g,'<br>')}
input.focus();
</script></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\\n🏢  ${'Test Co'} — AzurTant PRO`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   ${1} departamentos | Meta-Orquestador activo\\n`);
});
