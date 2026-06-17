/**
 * pcIntentService.js
 * ═══════════════════════════════════════════════════════
 * Detecta la intención de un usuario de usar la PC / ejecutar scripts
 * y devuelve un plan estructurado de acciones.
 *
 * Usa el LLM (aiThinkService) para clasificar la intención y
 * extraer acciones específicas.
 *
 * Retorna:
 *   {
 *     confidence: 0..1,
 *     desktopActions: [{ type, ...params }],
 *     supportScripts: [{ type, name, level, ... }]
 *   }
 */

import { aiThink } from './aiThinkService.js';

const intentFn = (typeof aiThink === 'function') ? aiThink : aiThink.think;

const INTENT_PROMPT = (message, deptId, context) => `Eres un clasificador de intenciones para AzurTant PRO.

Mensaje del usuario: "${message}"
Departamento: ${deptId}
Contexto adicional: ${context ? context.slice(0, 500) : 'ninguno'}

Analiza si el usuario quiere:
1. **Controlar la PC** (screenshot, click, type, abrir app, ejecutar comando, conexiones remotas)
2. **Ejecutar scripts de soporte** (N1/N2/N3: diagnóstico de red, limpieza, etc.)
3. **Solo conversar** (respuesta textual)

Si detectas intención de PC o scripts, responde SOLO con este JSON:
{
  "confidence": 0.0-1.0,
  "intent_type": "pc_control" | "support_script" | "chat_only" | "mixed",
  "desktopActions": [
    {"type": "screenshot" | "click" | "type" | "hotkey" | "open-app" | "system-info" | "run-command" | "rustdesk" | "rdp", "params": {...}}
  ],
  "supportScripts": [
    {"type": "network-diagnose" | "disk-cleanup" | "service-restart" | "system-info" | "user-info", "name": "nombre del script", "level": "N1" | "N2" | "N3", "params": {...}}
  ]
}

Si NO hay intención de PC ni scripts, devuelve:
{"confidence": 0.0, "intent_type": "chat_only", "desktopActions": [], "supportScripts": []}

Sé conservador: solo marca confidence > 0.6 si estás seguro. Responde SOLO el JSON, sin explicaciones.`;

const KEYWORD_FALLBACK_PATTERNS = [
  { pattern: /(toma|captura|haz|saca).{0,30}(screenshot|captura|pantalla|escritorio|screen)/i, action: { type: 'screenshot' } },
  { pattern: /(screenshot|screen ?shot)/i, action: { type: 'screenshot' } },
  { pattern: /(abre|ejecuta|inicia|lanza).{0,30}(word|excel|powerpoint|chrome|firefox|notepad|calculadora)/i, action: { type: 'open-app', app: null } },
  { pattern: /(escribe|teclea|digita).{0,30}(en|sobre)/i, action: { type: 'type' } },
  { pattern: /(click|clic|presiona).{0,30}(en|sobre|boton)/i, action: { type: 'click' } },
  { pattern: /(ejecuta|corre|lanza).{0,30}(comando|script|cmd|powershell)/i, action: { type: 'run-command' } },
  { pattern: /(conecta|conéctame|abre).{0,30}(rustdesk|rdp|escritorio remoto|anydesk|teamviewer)/i, action: { type: 'remote-connect' } },
  { pattern: /(info|informacion).{0,20}(sistema|pc|computadora|equipo)/i, action: { type: 'system-info' } },
  { pattern: /(diagnostica|escanea|repara|arregla).{0,30}(red|wifi|internet|conexion)/i, action: { type: 'support_script', scriptType: 'network-diagnose' } },
  { pattern: /(limpia|libera).{0,30}(disco|espacio|memoria)/i, action: { type: 'support_script', scriptType: 'disk-cleanup' } },
  { pattern: /(reinicia|restart).{0,30}(servicio|service)/i, action: { type: 'support_script', scriptType: 'service-restart' } }
];

const APP_PATTERNS = {
  'word': 'winword', 'microsoft word': 'winword',
  'excel': 'excel', 'microsoft excel': 'excel',
  'powerpoint': 'powerpnt', 'chrome': 'chrome', 'google chrome': 'chrome',
  'firefox': 'firefox', 'notepad': 'notepad', 'bloc de notas': 'notepad',
  'calculadora': 'calc', 'cmd': 'cmd', 'terminal': 'wt'
};

/**
 * Detecta intención usando LLM + fallback a keywords.
 * Retorna { confidence, desktopActions, supportScripts, intent_type }
 */
export async function detectPCIntent(message, deptId, context = null) {
  // 1. Intentar con LLM (rápido) + fallback keywords en paralelo
  let llmIntent = null;
  try {
    const { selectModel } = await import('./modelSelector.js');
    const model = selectModel({ dept: deptId });
    const llmResult = await Promise.race([
      intentFn({
        message: INTENT_PROMPT(message, deptId, context),
        model,
        temperature: 0.1,
        maxTokens: 500
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
    ]);
    llmIntent = extractJSON(llmResult);
  } catch (e) {
    // LLM falló → solo keyword
  }

  // 2. Fallback: keyword matching (SIEMPRE corre)
  const kwIntent = keywordFallback(message);

  // 3. Combinar: union de acciones, max confidence
  if (llmIntent && llmIntent.desktopActions && llmIntent.desktopActions.length > 0) {
    // LLM encontró acciones → usar las suyas + scripts del keyword
    return {
      ...kwIntent,
      ...llmIntent,
      desktopActions: llmIntent.desktopActions.map(a => enrichAction(a, message)),
      supportScripts: [...(kwIntent.supportScripts || []), ...(llmIntent.supportScripts || [])]
    };
  }
  // Si LLM no encontró nada, usar keyword
  return kwIntent;
}

function enrichAction(action, message) {
  // Extraer app name de mensajes como "abre chrome"
  if (action.type === 'open-app' && !action.app) {
    for (const [key, val] of Object.entries(APP_PATTERNS)) {
      if (message.toLowerCase().includes(key)) {
        action.app = val;
        action.appName = key;
        break;
      }
    }
  }
  // Extraer texto a escribir
  if (action.type === 'type' && !action.text) {
    const m = message.match(/(?:escribe|teclea|digita)\s+["']?([^"']{1,200})["']?/i);
    if (m) action.text = m[1];
  }
  // Extraer coordenadas de click
  if (action.type === 'click' && (action.x == null || action.y == null)) {
    const m = message.match(/(\d{2,4})[,\s]+(\d{2,4})/);
    if (m) {
      action.x = parseInt(m[1]);
      action.y = parseInt(m[2]);
    }
  }
  return action;
}

function keywordFallback(message) {
  const actions = [];
  const scripts = [];
  let maxConfidence = 0;

  for (const { pattern, action } of KEYWORD_FALLBACK_PATTERNS) {
    if (pattern.test(message)) {
      if (action.type === 'support_script') {
        scripts.push({
          type: action.scriptType,
          name: action.scriptType,
          level: 'N1',
          title: `Auto: ${action.scriptType}`,
          description: message
        });
        maxConfidence = Math.max(maxConfidence, 0.7);
      } else if (action.type === 'remote-connect') {
        // Detectar tipo de conexión
        const m = message.match(/(rustdesk|rdp|anydesk|teamviewer)/i);
        if (m) {
          if (/rustdesk/i.test(message)) {
            const idMatch = message.match(/(\d{8,10})/);
            if (idMatch) actions.push({ type: 'rustdesk', id: idMatch[1] });
          } else if (/rdp|escritorio remoto/i.test(message)) {
            const hostMatch = message.match(/([\w.-]+\.\w{2,})/);
            if (hostMatch) actions.push({ type: 'rdp', host: hostMatch[1] });
          }
        }
      } else if (action.type === 'system-info') {
        actions.push({ type: 'system-info' });
      } else {
        actions.push({ ...action });
        maxConfidence = Math.max(maxConfidence, 0.7);
      }
    }
  }

  return {
    confidence: maxConfidence,
    intent_type: actions.length || scripts.length ? 'pc_control' : 'chat_only',
    desktopActions: actions,
    supportScripts: scripts
  };
}

function extractJSON(text) {
  if (!text) return null;
  // Buscar bloque JSON en la respuesta
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    return null;
  }
}
