// AzurTant PRO - Voice Service (Multimodal STT + TTS)
// Real-time voice interaction

class VoiceService {
    constructor() {
        this.enabled = false;
        this.listening = false;
        this.speaking = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.onResultCallback = null;
        this.onErrorCallback = null;
    }

    async initialize() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return { status: 'error', error: 'WebRTC not supported' };
            }
            this.enabled = true;
            return { status: 'ready', provider: 'webRTC' };
        } catch (e) {
            return { status: 'error', error: e.message };
        }
    }

    async startListening(onResult, onError) {
        if (!this.enabled || this.listening) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            this.audioChunks = [];
            this.onResultCallback = onResult;
            this.onErrorCallback = onError;

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const text = await this._transcribe(audioBlob);
                if (text && this.onResultCallback) {
                    this.onResultCallback(text);
                }
            };

            this.mediaRecorder.start();
            this.listening = true;
            return { status: 'listening' };
        } catch (e) {
            if (this.onErrorCallback) this.onErrorCallback(e.message);
            return { status: 'error', error: e.message };
        }
    }

    stopListening() {
        if (this.mediaRecorder && this.listening) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
            this.listening = false;
        }
    }

    async _transcribe(audioBlob) {
        // Use Ollama Whisper if available
        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            const resp = await fetch('http://localhost:11434/api/whisper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'whisper',
                    audio: base64,
                    language: 'es'
                })
            });

            if (resp.ok) {
                const data = await resp.json();
                return data.text?.trim() || '';
            }
        } catch (e) {
            console.error('STT error:', e);
        }

        // Fallback: Return placeholder (actual implementation would use browser STT)
        return '';
    }

    async speak(text) {
        if (this.speaking) return;
        this.speaking = true;

        try {
            // Try Edge TTS if available
            const resp = await fetch('http://localhost:3000/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: 'es-MX-GenesisNeural' })
            });

            if (resp.ok) {
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                await audio.play();
                URL.revokeObjectURL(url);
            }
        } catch (e) {
            // Fallback: Use Web Speech API
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-MX';
                utterance.rate = 1;
                utterance.pitch = 1;
                speechSynthesis.speak(utterance);
            }
        }

        this.speaking = false;
    }

    setEnabled(val) {
        this.enabled = val;
    }

    isListening() {
        return this.listening;
    }

    isSpeaking() {
        return this.speaking;
    }
}

export const voiceService = new VoiceService();
export default voiceService;