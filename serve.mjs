import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const PORT = 5193;
const ROOT = resolve('.');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
    try {
        let url = req.url.split('?')[0];
        if (url === '/') url = '/landing.html';
        const path = resolve(join(ROOT, url));
        if (!path.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
        const data = await readFile(path);
        const ext = extname(path);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
        console.log(`${req.method} ${url} → 200 (${data.length} bytes)`);
    } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('not found: ' + req.url);
        console.log(`${req.method} ${req.url} → 404`);
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Serving ${ROOT} on http://127.0.0.1:${PORT}`);
});
