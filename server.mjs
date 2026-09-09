import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { Writable } from 'node:stream';
import app from './dist/server/server.js';

const root = fileURLToPath(new URL('./dist/client', import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveAsset(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
  const filePath = normalize(join(root, pathname));
  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) return false;

  response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
  if (request.method !== 'HEAD') createReadStream(filePath).pipe(response);
  else response.end();
  return true;
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    if (serveAsset(request, response)) return;
  }

  try {
    const headers = new Headers(request.headers);
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : request;
    const result = await app.fetch(new Request(`http://${request.headers.host}${request.url}`, {
      method: request.method,
      headers,
      body,
      duplex: body ? 'half' : undefined,
    }));

    response.writeHead(result.status, Object.fromEntries(result.headers));
    if (result.body) await result.body.pipeTo(Writable.toWeb(response));
    else response.end();
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`);
});
