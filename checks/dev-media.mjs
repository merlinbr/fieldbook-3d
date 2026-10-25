import assert from 'node:assert/strict';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run the actual responder beside isolated fixtures; never move or overwrite
// the owner's ignored media, and never occupy their fixed development port.
const directory = await mkdtemp(join(tmpdir(), 'fieldbook-media-'));
let server;
try {
  await mkdir(join(directory, 'tools'));
  await mkdir(join(directory, 'media-dev'));
  const script = join(directory, 'tools', 'serve-dev-media.mjs');
  await copyFile(new URL('../tools/serve-dev-media.mjs', import.meta.url), script);
  const assets = new Map([
    ['stegosaurus.glb', 'stegosaurus-model'],
    ['ankylosaurus.glb', 'existing-model'],
    ['ankylosaurus-en.mp3', 'existing-english-audio'],
    ['ankylosaurus-de.mp3', 'existing-german-audio'],
    ['ankylosaurus-poster.png', 'existing-ankylosaurus-poster'],
    ['stegosaurus-poster.png', 'existing-stegosaurus-poster']
  ]);
  for (const [name, contents] of assets) await writeFile(join(directory, 'media-dev', name), contents);
  const { createDevMediaServer } = await import(pathToFileURL(script));
  server = createDevMediaServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, options) => fetch(`${base}${path}`, options);
  for (const [name, contents] of assets) {
    const response = await request(`/${name}`);
    assert.equal(response.status, 200, `${name} GET`);
    assert.equal(response.headers.get('content-type'), name.endsWith('.glb') ? 'model/gltf-binary' : name.endsWith('.png') ? 'image/png' : 'audio/mpeg');
    assert.equal(response.headers.get('content-length'), String(contents.length));
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.equal(response.headers.get('access-control-expose-headers'), 'Accept-Ranges, Content-Range, Content-Length');
    assert.equal(response.headers.get('accept-ranges'), 'bytes');
    assert.equal(await response.text(), contents);
    const head = await request(`/${name}`, { method: 'HEAD', headers: { Range: 'bytes=1-3' } });
    assert.equal(head.status, 200, 'HEAD describes the entire asset even with Range');
    assert.equal(head.headers.get('content-length'), String(contents.length));
    assert.equal(head.headers.get('content-range'), null);
    assert.equal(await head.text(), '');
    for (const [range, expected, start, end] of [
      ['bytes=1-3', contents.slice(1, 4), 1, 3],
      ['bytes=3-', contents.slice(3), 3, contents.length - 1],
      ['bytes=-4', contents.slice(-4), contents.length - 4, contents.length - 1],
      ['bytes=0-999999', contents, 0, contents.length - 1]
    ]) {
      const partial = await request(`/${name}`, { headers: { Range: range } });
      assert.equal(partial.status, 206);
      assert.equal(partial.headers.get('content-range'), `bytes ${start}-${end}/${contents.length}`);
      assert.equal(partial.headers.get('content-length'), String(expected.length));
      assert.equal(await partial.text(), expected);
    }
  }
  for (const range of ['bytes=999-', 'bytes=5-2', 'bytes=-0', 'bytes=', 'bytes=0-1,3-4', 'nonsense']) {
    const response = await request('/stegosaurus.glb', { headers: { Range: range } });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), 'bytes */17');
    assert.equal(await response.text(), '');
  }
  const preflight = await request('/stegosaurus.glb', { method: 'OPTIONS' });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'GET, HEAD, OPTIONS');
  assert.equal(preflight.headers.get('access-control-allow-headers'), 'Range');
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
  const post = await request('/stegosaurus.glb', { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD, OPTIONS');
  for (const path of ['/', '/package.json', '/.env', '/tools/serve-dev-media.mjs', '/%2e%2e%2f.env', '/stegosaurus.glb?file=.env']) {
    const response = await request(path);
    assert.equal(response.status, 404, `Fixed allowlist rejects ${path}`);
    await response.arrayBuffer();
  }
  for (const name of ['stegosaurus.glb', 'ankylosaurus.glb', 'ankylosaurus-en.mp3', 'ankylosaurus-poster.png', 'stegosaurus-poster.png']) {
    await rm(join(directory, 'media-dev', name));
    const response = await request(`/${name}`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.equal(await response.text(), name.endsWith('.png')
      ? 'Local specimen poster is unavailable.'
      : name.endsWith('.glb') ? 'Local specimen asset is unavailable.' : 'Local narration asset is unavailable.');
    const head = await request(`/${name}`, { method: 'HEAD' });
    assert.equal(head.status, 404);
    assert.equal(await head.text(), '');
  }
  console.log('PASS development media: model/audio/poster routes, GET/HEAD/ranges, CORS/preflight, missing-file errors and fixed filesystem allowlist.');
} finally {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await rm(directory, { recursive: true, force: true });
}
