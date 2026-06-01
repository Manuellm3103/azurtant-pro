// AzurTant PRO - DeepResearch Service
// GitHub + Reddit research with learning capabilities

class DeepResearchService {
    constructor() {
        this.githubToken = localStorage.getItem('azurant_github_token') || '';
        this.redditClientId = localStorage.getItem('azurant_reddit_client_id') || '';
        this.redditClientSecret = localStorage.getItem('azurant_reddit_client_secret') || '';
    }

    setGithubToken(token) {
        this.githubToken = token;
        localStorage.setItem('azurant_github_token', token);
    }

    setRedditCredentials(clientId, clientSecret) {
        this.redditClientId = clientId;
        this.redditClientSecret = clientSecret;
        localStorage.setItem('azurant_reddit_client_id', clientId);
        localStorage.setItem('azurant_reddit_client_secret', clientSecret);
    }

    async searchGithub(query, language = null, perPage = 10) {
        try {
            let q = query;
            if (language) q += ` language:${language}`;

            const resp = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=${perPage}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    ...(this.githubToken ? { 'Authorization': `token ${this.githubToken}` } : {})
                }
            });

            if (resp.ok) {
                const data = await resp.json();
                return data.items?.map(item => ({
                    name: item.full_name,
                    description: item.description,
                    stars: item.stargazers_count,
                    forks: item.forks_count,
                    language: item.language,
                    url: item.html_url,
                    topics: item.topics || [],
                    license: item.license?.name,
                    updated: item.updated_at
                })) || [];
            }
        } catch (e) {
            console.error('GitHub search error:', e);
        }
        return [];
    }

    async getGithubRepoDetails(owner, repo) {
        try {
            const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    ...(this.githubToken ? { 'Authorization': `token ${this.githubToken}` } : {})
                }
            });
            if (resp.ok) return await resp.json();
        } catch (e) {}
        return null;
    }

    async getGithubReadme(owner, repo) {
        try {
            const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
                headers: {
                    'Accept': 'application/vnd.github.v3.raw',
                    ...(this.githubToken ? { 'Authorization': `token ${this.githubToken}` } : {})
                }
            });
            if (resp.ok) return await resp.text();
        } catch (e) {}
        return '';
    }

    async searchGithubCode(query, language = null, perPage = 10) {
        try {
            let q = query;
            if (language) q += ` language:${language}`;

            const resp = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(q)}&per_page=${perPage}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    ...(this.githubToken ? { 'Authorization': `token ${this.githubToken}` } : {})
                }
            });

            if (resp.ok) {
                const data = await resp.json();
                return data.items?.map(item => ({
                    name: item.name,
                    path: item.path,
                    repo: item.repository.full_name,
                    url: item.html_url
                })) || [];
            }
        } catch (e) {}
        return [];
    }

    async searchReddit(query, subreddit = null, limit = 10) {
        try {
            let url = 'https://www.reddit.com/search.json?q=' + encodeURIComponent(query);
            if (subreddit) url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}`;

            const resp = await fetch(`${url}&sort=relevance&limit=${limit}`, {
                headers: { 'User-Agent': 'AzurTantPRO/1.0' }
            });

            if (resp.ok) {
                const data = await resp.json();
                return data.data?.children?.map(child => ({
                    title: child.data.title,
                    content: child.data.selftext?.substring(0, 500) || '',
                    subreddit: child.data.subreddit,
                    score: child.data.score,
                    comments: child.data.num_comments,
                    url: 'https://reddit.com' + child.data.permalink,
                    author: child.data.author,
                    created: new Date(child.data.created_utc * 1000).toISOString()
                })) || [];
            }
        } catch (e) {
            console.error('Reddit search error:', e);
        }
        return [];
    }

    async getTrendingReddit(subreddit = 'all', limit = 10) {
        try {
            const resp = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
                headers: { 'User-Agent': 'AzurTantPRO/1.0' }
            });

            if (resp.ok) {
                const data = await resp.json();
                return data.data?.children?.map(child => ({
                    title: child.data.title,
                    subreddit: child.data.subreddit,
                    score: child.data.score,
                    comments: child.data.num_comments,
                    url: 'https://reddit.com' + child.data.permalink
                })) || [];
            }
        } catch (e) {}
        return [];
    }

    async research(query, options = { github: true, reddit: true, language: null, subreddit: null }) {
        const results = {
            query,
            timestamp: new Date().toISOString(),
            github: [],
            reddit: [],
            insights: []
        };

        const tasks = [];

        if (options.github) {
            tasks.push(this._researchGithub(query, options.language, results));
        }

        if (options.reddit) {
            tasks.push(this._researchReddit(query, options.subreddit, results));
        }

        await Promise.allSettled(tasks);

        // Generate insights
        results.insights = this._generateInsights(results);

        return results;
    }

    async _researchGithub(query, language, results) {
        const repos = await this.searchGithub(query, language, 10);
        results.github = repos;

        if (repos.length > 0) {
            const top = repos[0];
            results.insights.push(`📦 Proyecto más popular: ${top.name} (${top.stars} ⭐)`);

            const langs = {};
            repos.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
            if (Object.keys(langs).length > 0) {
                const topLang = Object.entries(langs).sort((a, b) => b[1] - a[1])[0];
                results.insights.push(`🔧 Tecnología dominante: ${topLang[0]}`);
            }
        }
    }

    async _researchReddit(query, subreddit, results) {
        const posts = await this.searchReddit(query, subreddit, 10);
        results.reddit = posts;

        if (posts.length > 0) {
            const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
            const avgScore = posts.reduce((sum, p) => sum + (p.score || 0), 0) / posts.length;
            results.insights.push(`💬 ${posts.length} discusiones en Reddit (promedio ${Math.round(avgScore)} puntos)`);
        }
    }

    _generateInsights(results) {
        const insights = [];

        if (results.github?.length > 0) {
            insights.push(`📦 ${results.github.length} repositorios encontrados en GitHub`);
        }

        if (results.reddit?.length > 0) {
            insights.push(`💬 ${results.reddit.length} posts encontrados en Reddit`);
        }

        return insights;
    }
}

export const deepResearchService = new DeepResearchService();
export default deepResearchService;