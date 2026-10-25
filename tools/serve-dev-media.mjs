import { createServer } from 'node:http';
import { open } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const media = new Map([
  ['/ankylosaurus.glb', { file: 'ankylosaurus.glb', type: 'model/gltf-binary' }],
  ['/stegosaurus.glb', { file: 'stegosaurus.glb', type: 'model/gltf-binary' }],
  ['/ankylosaurus-en.mp3', { file: 'ankylosaurus-en.mp3', type: 'audio/mpeg' }],
  ['/ankylosaurus-de.mp3', { file: 'ankylosaurus-de.mp3', type: 'audio/mpeg' }],
  ['/ankylosaurus-poster.png', { file: 'ankylosaurus-poster.png', type: 'image/png' }],
  ['/stegosaurus-poster.png', { file: 'stegosaurus-poster.png', type: 'image/png' }]
]);

export function createDevMediaServer() {
  return createServer(serveMedia);
}

async function serveMedia(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length');
  const asset = media.get(request.url);
  if (!asset) {
    response.writeHead(404).end();
    return;
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range'
    }).end();
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD, OPTIONS' }).end();
    return;
  }

  let file;
  try {
    file = await open(new URL(`../media-dev/${asset.file}`, import.meta.url), 'r');
    const { size } = await file.stat();
    response.setHeader('Content-Type', asset.type);
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Accept-Ranges', 'bytes');
    let start = 0;
    let end = size - 1;
    // Range applies to GET only; HEAD describes the complete representation.
    const range = request.method === 'GET' ? request.headers.range : undefined;
    if (range !== undefined) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      let valid = !!match && !!(match[1] || match[2]) && size > 0;
      if (valid) {
        const length = BigInt(size);
        if (match[1]) {
          const first = BigInt(match[1]);
          const last = match[2] ? BigInt(match[2]) : length - 1n;
          valid = first < length && last >= first;
          if (valid) {
            start = Number(first);
            end = Number(last < length ? last : length - 1n);
          }
        } else {
          const suffix = BigInt(match[2]);
          valid = suffix > 0n;
          start = suffix < length ? Number(length - suffix) : 0;
        }
      }
      if (!valid) {
        response.writeHead(416, {
          'Content-Range': `bytes */${size}`,
          'Content-Length': 0
        }).end();
        return;
      }
      response.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    }
    response.writeHead(range === undefined ? 200 : 206, {
      'Content-Length': end - start + 1
    });
    if (request.method === 'HEAD' || size === 0) {
      response.end();
    } else {
      await pipeline(file.createReadStream({ start, end, autoClose: false }), response);
    }
  } catch {
    if (response.headersSent) {
      response.destroy();
    } else {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end(asset.type === 'image/png'
        ? 'Local specimen poster is unavailable.'
        : asset.type === 'model/gltf-binary'
          ? 'Local specimen asset is unavailable.'
          : 'Local narration asset is unavailable.');
    }
  } finally {
    await file?.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) createDevMediaServer().listen(5194, '127.0.0.1', () => {
  console.log('Local model: http://127.0.0.1:5194/ankylosaurus.glb');
  console.log('Local Stegosaurus model: http://127.0.0.1:5194/stegosaurus.glb');
  console.log('Optional local narration: http://127.0.0.1:5194/ankylosaurus-en.mp3');
  console.log('Optional German narration: http://127.0.0.1:5194/ankylosaurus-de.mp3');
  console.log('Local Ankylosaurus poster: http://127.0.0.1:5194/ankylosaurus-poster.png');
  console.log('Local Stegosaurus poster: http://127.0.0.1:5194/stegosaurus-poster.png');
});
