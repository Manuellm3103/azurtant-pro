// AzurTant PRO - Mem0 Persistent Memory Service
// Persistent memory layer with user/agent/kb separation.
// Production hardening: localStorage guards so the same module works in browser and Node smoke tests.

const HAS_LS = typeof localStorage !== 'undefined' && localStorage;

class Mem0Service {
    constructor() {
        this.storageKey = 'azurant_mem0';
        this.memory = this._load();
    }

    _load() {
        try {
            if (HAS_LS) {
                const data = localStorage.getItem(this.storageKey);
                if (data) return JSON.parse(data);
            }
        } catch (e) { /* fall through */ }
        return this._initMemory();
    }

    _initMemory() {
        return {
            user: [],
            agent: [],
            knowledge: [],
            session: [],
            department: []
        };
    }

    _save() {
        try {
            if (HAS_LS) {
                localStorage.setItem(this.storageKey, JSON.stringify(this.memory));
            }
        } catch (e) { /* noop in non-browser env */ }
    }

    _generateId(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    add(content, type = 'knowledge', entityId = null, importance = 0.7, tags = []) {
        const entry = {
            id: this._generateId(content + Date.now()),
            content,
            memory_type: type,
            entity_id: entityId,
            metadata: {},
            importance,
            created_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
            access_count: 1,
            tags
        };

        if (!this.memory[type]) this.memory[type] = [];
        this.memory[type].push(entry);
        this._save();

        return entry.id;
    }

    search(query, type = null, limit = 10) {
        let results = [];
        const types = type ? [type] : Object.keys(this.memory);
        const q = query.toLowerCase();

        for (const t of types) {
            for (const entry of (this.memory[t] || [])) {
                if (entry.content.toLowerCase().includes(q)) {
                    results.push(entry);
                }
            }
        }

        results.sort((a, b) => (b.importance - a.importance) || (b.access_count - a.access_count));
        return results.slice(0, limit);
    }

    get(id) {
        for (const entries of Object.values(this.memory)) {
            const entry = entries.find(e => e.id === id);
            if (entry) {
                entry.access_count++;
                entry.last_accessed = new Date().toISOString();
                this._save();
                return entry;
            }
        }
        return null;
    }

    update(id, content = null, importance = null) {
        for (const entries of Object.values(this.memory)) {
            const entry = entries.find(e => e.id === id);
            if (entry) {
                if (content !== null) entry.content = content;
                if (importance !== null) entry.importance = importance;
                this._save();
                return true;
            }
        }
        return false;
    }

    delete(id) {
        for (const [type, entries] of Object.entries(this.memory)) {
            const idx = entries.findIndex(e => e.id === id);
            if (idx !== -1) {
                entries.splice(idx, 1);
                this._save();
                return true;
            }
        }
        return false;
    }

    getContext(types = null, entityId = null, limit = 20) {
        const allTypes = types || ['user', 'knowledge', 'session', 'department'];
        const parts = [];

        for (const type of allTypes) {
            let entries = this.memory[type] || [];
            if (entityId) {
                entries = entries.filter(e => e.entity_id === entityId);
            }
            entries.sort((a, b) => (b.importance - a.importance));
            for (const entry of entries.slice(0, limit)) {
                parts.push(`[${type.toUpperCase()}] ${entry.content}`);
            }
        }

        return parts.join('\n') || 'No relevant memories found.';
    }

    rememberUser(userId, fact, importance = 0.7) {
        return this.add(fact, 'user', userId, importance, ['user_profile']);
    }

    rememberAgent(agentId, learning, importance = 0.6) {
        return this.add(learning, 'agent', agentId, importance, ['agent_learning']);
    }

    storeKnowledge(fact, department = null, importance = 0.8) {
        const tags = department ? ['knowledge', department] : ['knowledge'];
        return this.add(fact, 'knowledge', department, importance, tags);
    }

    getUserMemories(userId) {
        return this.memory.user?.filter(e => e.entity_id === userId) || [];
    }

    getDepartmentMemories(deptId) {
        return this.memory.department?.filter(e => e.entity_id === deptId) || [];
    }

    clearSession() {
        this.memory.session = [];
        this._save();
    }

    getStats() {
        const total = Object.values(this.memory).reduce((sum, arr) => sum + arr.length, 0);
        const byType = Object.fromEntries(Object.entries(this.memory).map(([k, v]) => [k, v.length]));
        return { total_memories: total, by_type: byType };
    }
}

export const mem0Service = new Mem0Service();
export default mem0Service;
