import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const file = new URL('../media-dev/ankylosaurus.glb', import.meta.url);
createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (request.url !== '/ankylosaurus.glb' || request.method !== 'GET') {
    response.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(file);
    response.writeHead(200, {
      'Content-Type': 'model/gltf-binary',
      'Content-Length': bytes.length,
      'Cache-Control': 'no-store'
    });
    response.end(bytes);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Local specimen asset is unavailable.');
  }
}).listen(5194, '127.0.0.1', () => console.log('Local media: http://127.0.0.1:5194/ankylosaurus.glb'));
