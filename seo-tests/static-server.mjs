// Minimal static server that mimics the current vercel.json behavior:
// every path that isn't a real file under dist/cremacuadrado/browser falls
// back to index.html. This is deliberately a plain SPA shell — it gives the
// harness its pre-SSR baseline (red). Once server.ts exists (Fase C), the
// harness should be pointed at that server instead via --base-url.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

export function startStaticServer(rootDir, port = 0) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let filePath = normalize(join(rootDir, decodeURIComponent(url.pathname)));
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(400).end('Bad request');
      return;
    }

    try {
      const s = await stat(filePath);
      if (s.isDirectory()) filePath = join(filePath, 'index.html');
    } catch {
      filePath = join(rootDir, 'index.html'); // SPA fallback — same as vercel.json
    }

    try {
      const body = await readFile(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}
