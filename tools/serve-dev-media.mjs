import { createServer } from 'node:http';
import { open } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

const media = new Map([
  ['/ankylosaurus.glb', { file: 'ankylosaurus.glb', type: 'model/gltf-binary' }],
  ['/ankylosaurus-en.mp3', { file: 'ankylosaurus-en.mp3', type: 'audio/mpeg' }]
]);

createServer(async (request, response) => {
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
      response.end(asset.file === 'ankylosaurus.glb'
        ? 'Local specimen asset is unavailable.'
        : 'Local narration asset is unavailable.');
    }
  } finally {
    await file?.close();
  }
}).listen(5194, '127.0.0.1', () => {
  console.log('Local model: http://127.0.0.1:5194/ankylosaurus.glb');
  console.log('Optional local narration: http://127.0.0.1:5194/ankylosaurus-en.mp3');
});
