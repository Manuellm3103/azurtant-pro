/**
 * modelSelector.js
 * ═══════════════════════════════════════════════════════════
 * Selector central de modelos LLM para AzurTant PRO.
 *
 * Permite que cualquier endpoint o servicio use el modelo que quiera
 * pasando `model` en el body o usando el default configurable.
 *
 * Reglas:
 *  - El usuario puede especificar 'model' en el body de cualquier request
 *  - Si no, se usa el default por depto (env: AZURTANT_DEFAULT_MODEL_<DEPTO>)
 *  - Si no, se usa el default global (env: AZURTANT_DEFAULT_MODEL ollama cloud)
 *  - Si no, se usa 'ministral-3:8b-cloud' (Ollama Cloud, gratis)
 *
 * Multi-cloud: Ollama Cloud, Ollama Local, o cualquier modelo
 * cargado en Ollama.
 */

import { ollamaGenerate, ollamaListModels, getCloudStatus } from './ollamaCloud.js';

const DEFAULT_MODEL = process.env.AZURTANT_DEFAULT_MODEL || 'ministral-3:8b-cloud';
const FALLBACK_LOCAL = process.env.AZURTANT_FALLBACK_LOCAL || 'gemma3:4b'; // solo si cloud no responde

/**
 * Devuelve el modelo a usar para un request.
 * Prioridad: 1) body.model, 2) depto default, 3) global default.
 */
export function selectModel({ body = null, dept = null } = {}) {
  if (body && typeof body.model === 'string' && body.model.trim()) {
    return body.model.trim();
  }
  if (dept) {
    const envKey = `AZURTANT_DEFAULT_MODEL_${dept.toUpperCase()}`;
    if (process.env[envKey]) return process.env[envKey];
  }
  return DEFAULT_MODEL;
}

/**
 * Genera texto con el modelo seleccionado.
 * Wrapper sobre ollamaGenerate con fallback automático.
 *
 * @param {string} prompt - El prompt completo
 * @param {object} opts - { model, temperature, maxTokens, system, format }
 */
export async function generate(prompt, opts = {}) {
  const model = opts.model || DEFAULT_MODEL;
  const r = await ollamaGenerate({
    model,
    prompt,
    system: opts.system,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    format: opts.format,
    stream: false
  });
  if (!r?.success && model !== FALLBACK_LOCAL) {
    // Fallback a local
    return await ollamaGenerate({
      model: FALLBACK_LOCAL,
      prompt,
      system: opts.system,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
      stream: false
    });
  }
  return r;
}

/**
 * Devuelve la lista de modelos disponibles con metadatos.
 */
export async function listAvailable() {
  const status = getCloudStatus();
  const r = await ollamaListModels();
  return {
    mode: status.mode,
    default: DEFAULT_MODEL,
    fallback: FALLBACK_LOCAL,
    count: r.models?.length || 0,
    models: r.models || []
  };
}

export { DEFAULT_MODEL, FALLBACK_LOCAL };
