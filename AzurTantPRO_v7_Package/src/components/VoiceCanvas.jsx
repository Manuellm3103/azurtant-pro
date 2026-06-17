/**
 * VoiceCanvas.jsx
 * ═══════════════════════════════════════════════════════
 * Componente React de Voice + Canvas para AzurTant PRO.
 *
 * Funcionalidades:
 *  - STT (Speech-to-Text) via Web Speech API nativa del browser
 *  - TTS (Text-to-Speech) via /api/voice/tts
 *  - Canvas con waveform en tiempo real
 *  - Botón flotante que se puede arrastrar
 *  - Modo push-to-talk y manos libres
 *  - Integración con /api/chat para enrutar la voz como comando
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ═══ WAVEFORM CANVAS ═══
class WaveformVisualizer {
  constructor(canvas, getStream) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.raf = null;
    this.getStream = getStream;
  }

  async start() {
    try {
      const stream = this.getStream();
      if (!stream) return false;
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source.connect(this.analyser);
      this.draw();
      return true;
    } catch (e) {
      console.error('Waveform start error:', e);
      return false;
    }
  }

  draw() {
    if (!this.analyser) return;
    const buf = new Uint8Array(this.analyser.fftSize);
    const draw = () => {
      this.analyser.getByteTimeDomainData(buf);
      const w = this.canvas.width, h = this.canvas.height;
      this.ctx.fillStyle = 'rgba(20, 20, 30, 0.15)';
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#FBCC00';
      this.ctx.beginPath();
      const slice = w / buf.length;
      let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i] / 128.0;
        const y = v * h / 2;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
        x += slice;
      }
      this.ctx.lineTo(w, h / 2);
      this.ctx.stroke();
      this.raf = requestAnimationFrame(draw);
    };
    draw();
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.source) this.source.disconnect();
    if (this.analyser) this.analyser.disconnect();
    if (this.audioCtx && this.audioCtx.state !== 'closed') this.audioCtx.close();
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.raf = null;
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'rgba(20, 20, 30, 1)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// ═══ STT (Web Speech API) ═══
function useSTT(onResult) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const r = new SR();
    r.lang = 'es-MX';
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      onResult({ final, interim, listening: true });
    };
    r.onerror = (e) => {
      console.error('STT error:', e.error);
      setListening(false);
    };
    r.onend = () => setListening(false);
    recRef.current = r;
  }, []);

  const start = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.start(); setListening(true); } catch (e) {}
  }, []);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch (e) {}
  }, []);

  return { listening, supported, start, stop };
}

// ═══ TTS (Backend) ═══
async function speak(text, opts = {}) {
  try {
    const r = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: opts.voice || 'es-MX-DaliaNeural', rate: opts.rate || 1.0, pitch: opts.pitch || 0 })
    });
    if (!r.ok) throw new Error(`TTS ${r.status}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play();
    return true;
  } catch (e) {
    // Fallback a Web Speech API
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'es-MX';
      u.rate = opts.rate || 1.0;
      window.speechSynthesis.speak(u);
      return true;
    }
    return false;
  }
}

// ═══ COMPONENTE PRINCIPAL ═══
export default function VoiceCanvas({ onCommand, dept = 'ceo', position = 'bottom-right' }) {
  const canvasRef = useRef(null);
  const waveRef = useRef(null);
  const mediaRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioStream, setAudioStream] = useState(null);
  const [position2, setPosition2] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const stt = useSTT(({ final, interim }) => {
    setInterim(interim);
    if (final) {
      const newText = (transcript + ' ' + final).trim();
      setTranscript(newText);
      setText(newText);
      setInterim('');
      // Auto-enviar si tiene más de 5 palabras y termina en puntuación
      if (newText.length > 10 && /[.!?]$/.test(newText)) {
        handleSend(newText);
      }
    }
  });

  // Visualizer
  useEffect(() => {
    if (open && stt.listening && audioStream && canvasRef.current) {
      waveRef.current = new WaveformVisualizer(canvasRef.current, () => audioStream);
      waveRef.current.start();
      return () => waveRef.current?.stop();
    }
  }, [open, stt.listening, audioStream]);

  // Drag
  const onPointerDown = (e) => {
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: position2.x, initialY: position2.y };
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    setPosition2({
      x: dragRef.current.initialX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.initialY + (e.clientY - dragRef.current.startY)
    });
  };
  const onPointerUp = () => setDragging(false);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      mediaRef.current = stream;
      stt.start();
    } catch (e) {
      alert('No se pudo acceder al micrófono: ' + e.message);
    }
  };

  const stopListening = () => {
    stt.stop();
    if (mediaRef.current) {
      mediaRef.current.getTracks().forEach(t => t.stop());
      setAudioStream(null);
    }
  };

  const handleSend = async (msg) => {
    const message = msg || text;
    if (!message.trim()) return;
    setText('');
    setTranscript('');
    // Enviar al backend (chat routing que usa la PC)
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          dept,
          voice: true,
          tenantId: window.localStorage?.getItem('azurant.tenantId') || 't_emanuel_default'
        })
      });
      const data = await r.json();
      const reply = data.reply || data.message || data.response || 'Sin respuesta';
      // TTS del reply
      await speak(reply, { voice: 'es-MX-DaliaNeural' });
      if (onCommand) onCommand({ message, reply, dept });
    } catch (e) {
      await speak('Error: ' + e.message);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const styles = {
    container: {
      position: 'fixed',
      bottom: position === 'bottom-right' ? (20 + position2.y) : 'auto',
      top: position === 'top-right' ? (20 - position2.y) : 'auto',
      right: 20 - position2.x,
      zIndex: 9999,
      fontFamily: 'system-ui, sans-serif'
    },
    button: {
      width: 64, height: 64, borderRadius: '50%',
      background: stt.listening ? '#FF6B4A' : '#FBCC00',
      border: '4px solid #191919',
      boxShadow: '4px 4px 0 #191919',
      cursor: dragging ? 'grabbing' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28, fontWeight: 'bold',
      transition: 'background 0.2s, transform 0.1s',
      transform: dragging ? 'scale(1.1)' : 'scale(1)',
      userSelect: 'none'
    },
    panel: {
      position: 'absolute', bottom: 80, right: 0,
      width: 380, maxWidth: '90vw',
      background: '#191919', color: '#fff',
      border: '4px solid #FBCC00', borderRadius: 12,
      boxShadow: '8px 8px 0 rgba(0,0,0,0.5)',
      padding: 16
    },
    canvas: {
      width: '100%', height: 80,
      background: 'rgba(20,20,30,1)', borderRadius: 8,
      border: '1px solid #333'
    },
    input: {
      width: '100%', minHeight: 60, padding: 10,
      background: '#222', color: '#fff',
      border: '2px solid #333', borderRadius: 6,
      fontFamily: 'inherit', fontSize: 14,
      resize: 'vertical'
    },
    primaryBtn: {
      padding: '8px 16px',
      background: '#FBCC00', color: '#191919',
      border: '2px solid #191919', borderRadius: 6,
      fontWeight: 'bold', cursor: 'pointer'
    },
    secondaryBtn: {
      padding: '8px 16px',
      background: 'transparent', color: '#FBCC00',
      border: '2px solid #FBCC00', borderRadius: 6,
      fontWeight: 'bold', cursor: 'pointer'
    },
    badge: {
      display: 'inline-block', padding: '2px 8px',
      background: '#FBCC00', color: '#191919',
      borderRadius: 4, fontSize: 11, fontWeight: 'bold',
      marginRight: 6
    }
  };

  return (
    <div style={styles.container}>
      {open && (
        <div style={styles.panel}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={styles.badge}>🎤 VOICE</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>Depto: {dept}</span>
            {!stt.supported && <span style={{ ...styles.badge, background: '#FF6B4A', color: '#fff', marginLeft: 6 }}>NO SOPORTADO</span>}
          </div>
          <canvas ref={canvasRef} style={styles.canvas} width="700" height="160" />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 }}>
            {!stt.listening ? (
              <button onClick={startListening} style={styles.primaryBtn}>🎤 Escuchar</button>
            ) : (
              <button onClick={stopListening} style={{ ...styles.primaryBtn, background: '#FF6B4A' }}>⏹ Detener</button>
            )}
            <button onClick={() => speak(text || 'Hola, soy AzurTant', { voice: 'es-MX-DaliaNeural' })} style={styles.secondaryBtn}>🔊 Probar TTS</button>
            <button onClick={() => { setText(''); setTranscript(''); setInterim(''); }} style={styles.secondaryBtn}>🗑 Limpiar</button>
          </div>
          <textarea
            value={text + (interim ? ' ' + interim : '')}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Habla o escribe tu comando al depto..."
            style={styles.input}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => handleSend()} style={{ ...styles.primaryBtn, flex: 1 }}>📤 Enviar al depto</button>
            <button onClick={() => setOpen(false)} style={styles.secondaryBtn}>✕</button>
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 8 }}>
            La voz se enruta al chat del depto. Si incluye acciones de PC, se ejecutan automáticamente.
          </div>
        </div>
      )}
      <div
        style={styles.button}
        onClick={() => setOpen(!open)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        title="Voice Canvas — arrastra para mover"
      >
        {stt.listening ? '🔴' : '🎙'}
      </div>
    </div>
  );
}
