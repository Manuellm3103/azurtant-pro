/**
 * ollamaCloud.js
 * ═══════════════════════════════════════════════════════════
 * Helper centralizado para Ollama (Cloud + Local).
 *
 * Si OLLAMA_API_KEY está en .env, usa https://ollama.com (Cloud).
 * Si no, usa http://localhost:11434 (Local).
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let _OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
let _OLLAMA_CLOUD_URL = process.env.OLLAMA_CLOUD_URL || 'https://ollama.com';
let _OLLAMA_LOCAL_URL = process.env.OLLAMA_LOCAL_URL || 'http://localhost:11434';
let _mode = 'local_fallback';
let _status = null;

// Cargar .env manualmente si no está en process.env
if (!_OLLAMA_API_KEY && existsSync(join(process.cwd(), '.env'))) {
  try {
    const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
    for (const line of envContent.split('\n')) {
      const m = line.match(/^OLLAMA_API_KEY=(.+)$/);
      if (m) _OLLAMA_API_KEY = m[1].trim().replace(/^["']|["']$/g, '');
      const m2 = line.match(/^OLLAMA_CLOUD_URL=(.+)$/);
      if (m2) _OLLAMA_CLOUD_URL = m2[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch {}
}

if (_OLLAMA_API_KEY) {
  _mode = 'cloud';
}

export const OLLAMA_CONFIG = {
  get apiKey() { return _OLLAMA_API_KEY; },
  get cloudUrl() { return _OLLAMA_CLOUD_URL; },
  get localUrl() { return _OLLAMA_LOCAL_URL; },
  get mode() { return _mode; },
  get defaultModel() { return _mode === 'cloud' ? 'ministral-3:8b-cloud' : 'qwen2.5:0.5b'; },
};

// Exportar también las variables internas para que otros módulos las usen
export { _OLLAMA_API_KEY, _OLLAMA_CLOUD_URL, _OLLAMA_LOCAL_URL };

export function getCloudStatus() {
  return {
    mode: _mode,
    hasApiKey: !!_OLLAMA_API_KEY,
    provider: _mode === 'cloud' ? 'Ollama Cloud' : 'Ollama Local (fallback)',
    cloudUrl: _OLLAMA_CLOUD_URL,
    localUrl: _OLLAMA_LOCAL_URL
  };
}

/**
 * Llama a Ollama con el modelo dado. Detecta cloud vs local automáticamente.
 */
export async function ollamaGenerate({ model, prompt, system, temperature, maxTokens, format, stream = false }) {
  const isCloudModel = model && (model.includes(':cloud') || model.includes('cloud'));
  const useCloud = _mode === 'cloud' || isCloudModel;
  const url = useCloud ? _OLLAMA_CLOUD_URL : _OLLAMA_LOCAL_URL;
  const headers = { 'Content-Type': 'application/json' };
  if (useCloud && _OLLAMA_API_KEY) {
    headers['Authorization'] = `Bearer ${_OLLAMA_API_KEY}`;
  }

  const body = {
    model,
    prompt,
    stream
  };
  if (system) body.system = system;
  if (temperature != null) body.options = { ...body.options, temperature };
  if (maxTokens != null) body.options = { ...body.options, num_predict: maxTokens };
  if (format) body.format = format;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    const r = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!r.ok) {
      const errText = await r.text();
      return { success: false, error: `HTTP ${r.status}: ${errText.slice(0, 200)}`, model, mode: useCloud ? 'cloud' : 'local' };
    }
    const data = await r.json();
    return {
      success: true,
      response: data.response || '',
      model: data.model || model,
      mode: useCloud ? 'cloud' : 'local',
      latency_ms: data.total_duration ? Math.round(data.total_duration / 1e6) : 0,
      tokens: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0
      }
    };
  } catch (e) {
    return { success: false, error: e.message, model, mode: useCloud ? 'cloud' : 'local' };
  }
}

/**
 * Lista los modelos disponibles.
 */
export async function ollamaListModels() {
  const url = _mode === 'cloud' ? _OLLAMA_CLOUD_URL : _OLLAMA_LOCAL_URL;
  const headers = {};
  if (_mode === 'cloud' && _OLLAMA_API_KEY) {
    headers['Authorization'] = `Bearer ${_OLLAMA_API_KEY}`;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${url}/api/tags`, { headers, signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { models: [], error: `HTTP ${r.status}` };
    const data = await r.json();
    return { models: data.models || [], mode: _mode };
  } catch (e) {
    return { models: [], error: e.message, mode: _mode };
  }
}

export default { ollamaGenerate, ollamaListModels, getCloudStatus, OLLAMA_CONFIG };
