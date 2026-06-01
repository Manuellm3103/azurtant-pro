// AzurTant PRO - GraphRAG Service
// Graph-based Retrieval Augmented Generation

class GraphRAGService {
    constructor() {
        this.nodesKey = 'azurant_graph_nodes';
        this.edgesKey = 'azurant_graph_edges';
        this.nodes = this._loadNodes();
        this.edges = this._loadEdges();
    }

    _loadNodes() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) {
                const data = localStorage.getItem(this.nodesKey);
                return data ? JSON.parse(data) : {};
            }
        } catch {}
        return {};
    }

    _loadEdges() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) {
                const data = localStorage.getItem(this.edgesKey);
                return data ? JSON.parse(data) : [];
            }
        } catch {}
        return [];
    }

    _saveNodes() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) {
                localStorage.setItem(this.nodesKey, JSON.stringify(this.nodes));
            }
        } catch {}
    }

    _saveEdges() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage) {
                localStorage.setItem(this.edgesKey, JSON.stringify(this.edges));
            }
        } catch {}
    }

    _generateId(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).substring(0, 12);
    }

    _cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const norm = Math.sqrt(normA) * Math.sqrt(normB);
        return norm === 0 ? 0 : dot / norm;
    }

    addNode(label, nodeType, properties = {}, embeddings = [], connections = []) {
        const id = this._generateId(label);
        const node = {
            id,
            label,
            node_type: nodeType,
            properties,
            embeddings: embeddings.length ? embeddings : this._generatePlaceholderEmbeddings(label),
            connections,
            created_at: new Date().toISOString()
        };

        this.nodes[id] = node;

        for (const connId of connections) {
            if (!this.edges.find(e => e.source === id && e.target === connId)) {
                this.edges.push({ source: id, target: connId, relation: 'related_to', weight: 1.0 });
            }
        }

        this._saveNodes();
        this._saveEdges();

        return id;
    }

    _generatePlaceholderEmbeddings(text) {
        // Simple hash-based pseudo-embeddings
        const vec = [];
        let hash = 0;
        for (let i = 0; i < 128; i++) {
            hash = ((hash << 5) - hash) + (text.charCodeAt(i % text.length) || 0);
            vec.push(((hash % 100) + 100) / 200);
        }
        return vec;
    }

    findSimilar(queryEmbedding, topK = 5, nodeTypes = null) {
        const results = [];

        for (const [id, node] of Object.entries(this.nodes)) {
            if (nodeTypes && !nodeTypes.includes(node.node_type)) continue;

            const similarity = this._cosineSimilarity(queryEmbedding, node.embeddings);
            if (similarity > 0.1) {
                results.push({ node, similarity });
            }
        }

        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, topK);
    }

    getConnectedNodes(nodeId, depth = 1) {
        const visited = new Set();
        let currentLevel = [nodeId];
        let result = [];

        for (let d = 0; d < depth; d++) {
            const nextLevel = [];

            for (const edge of this.edges) {
                if (currentLevel.includes(edge.source) && !visited.has(edge.target)) {
                    nextLevel.push(edge.target);
                    visited.add(edge.target);
                    if (this.nodes[edge.target]) {
                        result.push(this.nodes[edge.target]);
                    }
                }
                if (currentLevel.includes(edge.target) && !visited.has(edge.source)) {
                    nextLevel.push(edge.source);
                    visited.add(edge.source);
                    if (this.nodes[edge.source]) {
                        result.push(this.nodes[edge.source]);
                    }
                }
            }

            currentLevel = nextLevel;
        }

        return result;
    }

    queryGraph(query, queryEmbedding, departmentFilter = null, topK = 10) {
        const similarNodes = this.findSimilar(queryEmbedding, topK);

        let results = similarNodes.map(({ node, similarity }) => ({
            id: node.id,
            label: node.label,
            type: node.node_type,
            score: similarity,
            properties: node.properties,
            connections: node.connections
        }));

        if (departmentFilter) {
            results = results.filter(r =>
                r.properties.department === departmentFilter ||
                r.type === departmentFilter
            );
        }

        // Enrich top 3 with connected nodes
        const enrichedResults = results.slice(0, 3).map(r => {
            const connected = this.getConnectedNodes(r.id, 2);
            r.expanded_context = connected.map(n => ({ label: n.label, type: n.node_type }));
            return r;
        });

        return {
            query,
            results: enrichedResults,
            total_nodes: Object.keys(this.nodes).length,
            timestamp: new Date().toISOString()
        };
    }

    exportGraph() {
        return {
            nodes: Object.values(this.nodes),
            edges: this.edges,
            stats: {
                total_nodes: Object.keys(this.nodes).length,
                total_edges: this.edges.length
            }
        };
    }

    importGraph(data) {
        try {
            this.nodes = {};
            for (const node of (data.nodes || [])) {
                this.nodes[node.id] = node;
            }
            this.edges = data.edges || [];
            this._saveNodes();
            this._saveEdges();
            return true;
        } catch { return false; }
    }

    clear() {
        this.nodes = {};
        this.edges = [];
        this._saveNodes();
        this._saveEdges();
    }
}

export const graphRAGService = new GraphRAGService();
export default graphRAGService;