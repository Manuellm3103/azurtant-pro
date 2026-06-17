/**
 * multimodalService.js
 * ═══════════════════════════════════════════════════════════
 * Servicio multimodal para AzurTant PRO.
 *
 * Capacidades:
 *  - analyzeImage: usa Ollama (LLaVA, gemma3) para describir una imagen
 *  - analyzeVideo: extrae frames clave y los analiza
 *  - transcribeAudio: usa Whisper local (Python) o retorna placeholder
 *  - ttsAudio: sintetiza voz desde texto (ya cubierto por /api/voice/tts)
 *
 * Para visión, usa modelos multimodales de Ollama Cloud:
 *  - gemma3:4b (multimodal, soporta imágenes)
 *  - llava (local fallback)
 */

import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { ollamaGenerate, _OLLAMA_API_KEY as OLLAMA_KEY_INTERNAL, _OLLAMA_CLOUD_URL as OLLAMA_CLOUD_URL_INTERNAL, _OLLAMA_LOCAL_URL as OLLAMA_LOCAL_URL_INTERNAL } from './ollamaCloud.js';

const PYTHON_EXE = process.env.HERMES_PYTHON
  || 'C:/Users/Manu/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe';

class MultimodalService {
  constructor() {
    this.name = 'multimodalService';
    this.visionModels = ['gemma3:4b', 'llava', 'ministral-3:8b-cloud'];
    this.defaultVisionModel = process.env.AZURTANT_VISION_MODEL || 'gemma3:4b';
  }

  /**
   * Analiza una imagen (path local o base64) con un modelo multimodal.
   * @param {string} imagePath - ruta al archivo o base64
   * @param {string} prompt - qué preguntar sobre la imagen
   * @param {string} model - modelo a usar (default: gemma3:4b)
   */
  async analyzeImage(imagePath, prompt = 'Describe esta imagen en detalle', model = null) {
    const useModel = model || this.defaultVisionModel;
    try {
      let imageData = null;
      if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
        imageData = imagePath;
      } else if (existsSync(imagePath)) {
        // Convertir a base64
        const buf = readFileSync(imagePath);
        const ext = extname(imagePath).slice(1) || 'png';
        imageData = `data:image/${ext};base64,${buf.toString('base64')}`;
      } else {
        return { success: false, error: `Imagen no encontrada: ${imagePath}` };
      }

      // Cargar API key del .env si no está en process.env
      let apiKey = process.env.OLLAMA_API_KEY || '';
      if (!apiKey && existsSync(join(process.cwd(), '.env'))) {
        try {
          const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
          for (const line of envContent.split('\n')) {
            const m = line.match(/^OLLAMA_API_KEY=(.+)$/);
            if (m) apiKey = m[1].trim().replace(/^["']|["']$/g, '');
          }
        } catch {}
      }

      // Si el modelo es cloud, usar Ollama Cloud
      const isCloud = useModel.includes(':cloud') || !!apiKey;
      const url = isCloud ? (process.env.OLLAMA_CLOUD_URL || 'https://ollama.com') : 'http://localhost:11434';
      const headers = { 'Content-Type': 'application/json' };
      if (isCloud && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const body = {
        model: useModel,
        prompt,
        images: [imageData.split(',')[1] || imageData], // base64 sin prefix
        stream: false
      };

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 60000);
      const r = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
      clearTimeout(t);
      if (!r.ok) {
        const errText = await r.text();
        return { success: false, error: `HTTP ${r.status}: ${errText.slice(0, 200)}` };
      }
      const data = await r.json();
      return {
        success: true,
        description: data.response || '',
        model: useModel,
        mode: isCloud ? 'cloud' : 'local',
        latency_ms: data.total_duration ? Math.round(data.total_duration / 1e6) : 0
      };
    } catch (e) {
      return { success: false, error: e.message, model: useModel };
    }
  }

  /**
   * Analiza video extrayendo frames con ffmpeg.
   */
  async analyzeVideo(videoPath, prompt = '¿Qué pasa en este video?', frames = 5) {
    if (!existsSync(videoPath)) return { success: false, error: `Video no encontrado: ${videoPath}` };
    try {
      // Usar Python con opencv o ffmpeg para extraer frames
      const script = `
import subprocess, os, json, base64
video = r'${videoPath.replace(/\\/g, '\\\\')}'
out_dir = r'${process.cwd().replace(/\\/g, '\\\\')}\\\\data\\\\frames'
os.makedirs(out_dir, exist_ok=True)
# Extraer N frames usando ffmpeg
cmd = ['ffmpeg', '-i', video, '-vf', f'fps=1/{frames}', '-vframes', str(frames), f'{out_dir}/frame_%03d.jpg', '-y']
r = subprocess.run(cmd, capture_output=True, text=True)
frames = sorted([f for f in os.listdir(out_dir) if f.endswith('.jpg')])
print(json.dumps({'frames': frames[:${frames}], 'count': len(frames), 'ffmpeg': r.returncode == 0}))
`;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 60000);
      const proc = await import('child_process').then(m => m.spawn(PYTHON_EXE, ['-c', script], { shell: false }));
      let stdout = '';
      proc.stdout.on('data', d => stdout += d);
      await new Promise((resolve) => {
        proc.on('close', resolve);
        setTimeout(() => { try { proc.kill(); } catch {} resolve(); }, 30000);
      });
      clearTimeout(t);

      const result = JSON.parse(stdout.split('\n').filter(l => l.startsWith('{'))[0] || '{}');
      if (!result.frames || result.frames.length === 0) {
        return { success: false, error: 'No se pudieron extraer frames' };
      }

      // Analizar cada frame con el modelo
      const analyses = [];
      for (const frame of result.frames) {
        const framePath = join(process.cwd(), 'data', 'frames', frame);
        const a = await this.analyzeImage(framePath, prompt);
        if (a.success) analyses.push({ frame, description: a.description });
      }
      return {
        success: true,
        frameCount: result.frames.length,
        analyses,
        summary: analyses.map(a => a.description).join('\n\n')
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Transcribe audio usando Whisper local (si está disponible).
   */
  async transcribeAudio(audioPath) {
    if (!existsSync(audioPath)) return { success: false, error: `Audio no encontrado: ${audioPath}` };
    try {
      const script = `
try:
    import whisper
    model = whisper.load_model('base')
    result = model.transcribe(r'${audioPath.replace(/\\/g, '\\\\')}', language='es')
    import json
    print(json.dumps({'success': True, 'text': result['text'], 'language': result.get('language', 'es')}))
except Exception as e:
    import json
    print(json.dumps({'success': False, 'error': str(e), 'note': 'whisper no instalado. Instala con: pip install openai-whisper'}))
`;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 120000);
      const proc = await import('child_process').then(m => m.spawn(PYTHON_EXE, ['-c', script], { shell: false }));
      let stdout = '';
      proc.stdout.on('data', d => stdout += d);
      await new Promise((resolve) => {
        proc.on('close', resolve);
        setTimeout(() => { try { proc.kill(); } catch {} resolve(); }, 90000);
      });
      clearTimeout(t);
      const out = stdout.split('\n').filter(l => l.startsWith('{'))[0] || '{}';
      return JSON.parse(out);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async stats() {
    return {
      visionModels: this.visionModels,
      defaultVisionModel: this.defaultVisionModel,
      capabilities: ['analyzeImage', 'analyzeVideo', 'transcribeAudio']
    };
  }
}

const instance = new MultimodalService();
export const multimodal = instance;
export const analyzeImage = (...a) => instance.analyzeImage(...a);
export const analyzeVideo = (...a) => instance.analyzeVideo(...a);
export const transcribeAudio = (...a) => instance.transcribeAudio(...a);
export const stats = (...a) => instance.stats(...a);
export default instance;
export { instance };
