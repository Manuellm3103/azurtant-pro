// AzurTant PRO - Ollama Multi-LLM Auto-Selector Service
// Automatically selects the best model based on task type

class OllamaService {
    constructor() {
        this.baseUrl = 'http://localhost:11434';
        this.models = {
            general: 'llama3.2',
            code: 'codellama',
            analysis: 'mixtral',
            reasoning: 'deepseek-r1',
            embedding: 'nomic-embed-text',
            vision: 'llava',
            multilingual: 'qwen2.5'
        };
        this.availableModels = [];
    }

    async initialize() {
        try {
            const resp = await fetch(`${this.baseUrl}/api/tags`);
            if (resp.ok) {
                const data = await resp.json();
                this.availableModels = data.models?.map(m => m.name) || [];
                return { status: 'connected', models: this.availableModels };
            }
        } catch (e) {
            return { status: 'error', error: e.message };
        }
    }

    classifyTask(prompt) {
        const p = prompt.toLowerCase();
        if (/code|python|javascript|function|class|api|programming/.test(p)) return 'code';
        if (/analyze|analysis|compare|evaluate|assess|research/.test(p)) return 'analysis';
        if (/reason|think|explain|why|how|logic|solve|problem/.test(p)) return 'reasoning';
        if (/create|write|story|poem|design|generate|creative/.test(p)) return 'creative';
        if (/github|repo|search|find|lookup|discover/.test(p)) return 'research';
        return 'general';
    }

    selectModel(taskType) {
        const model = this.models[taskType] || this.models.general;
        if (this.availableModels.includes(model)) return model;
        if (taskType !== 'general' && this.availableModels.includes(this.models.general)) return this.models.general;
        return this.availableModels[0] || 'llama3.2';
    }

    async chat(prompt, system = '', taskType = null) {
        const type = taskType || this.classifyTask(prompt);
        const model = this.selectModel(type);

        try {
            const resp = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: [
                        ...(system ? [{ role: 'system', content: system }] : []),
                        { role: 'user', content: prompt }
                    ],
                    stream: false
                })
            });

            if (resp.ok) {
                const data = await resp.json();
                return {
                    status: 'success',
                    model,
                    taskType: type,
                    response: data.message?.content || ''
                };
            }
        } catch (e) {
            return { status: 'error', error: e.message };
        }

        return { status: 'error', error: 'Request failed' };
    }

    async generateEmbeddings(text) {
        const model = this.selectModel('embedding');
        try {
            const resp = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt: text })
            });
            if (resp.ok) {
                const data = await resp.json();
                return data.embedding;
            }
        } catch (e) {}
        return null;
    }
}

export const ollamaService = new OllamaService();
export default ollamaService;