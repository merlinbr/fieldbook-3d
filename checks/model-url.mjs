import assert from 'node:assert/strict';
import { resolveModelUrl } from '../src/lib/specimens/model-url.ts';

for (const species of ['ankylosaurus', 'stegosaurus']) {
  const environmentVariable = `PUBLIC_${species.toUpperCase()}_MODEL_URL`;
  const developmentUrl = `http://127.0.0.1:5194/${species}.glb`;
  const options = { environmentVariable, developmentUrl, development: false };
  const rejects = value => assert.throws(() => resolveModelUrl(value, options), new RegExp(environmentVariable));
  rejects(undefined);
  assert.equal(resolveModelUrl(undefined, { ...options, development: true }), developmentUrl);
  for (const value of ['https://media.example/model.glb', 'http://media.example/model.glb']) {
    assert.equal(resolveModelUrl(value, options), value);
  }
  assert.equal(resolveModelUrl('https://MEDIA.example', options), 'https://media.example/');
  for (const value of ['', 'bad', '/model.glb', 'file:///model.glb', 'data:model',
    'https://user@media.example/model.glb', 'https://user:secret@media.example/model.glb']) {
    rejects(value);
    assert.throws(() => resolveModelUrl(value, { ...options, development: true }), new RegExp(environmentVariable));
  }
  for (const host of ['localhost', 'dev.localhost', 'LOCALHOST.', '127.0.0.1', '127.4.3.2',
    '[::1]', '[::ffff:127.0.0.1]', '[::ffff:7f00:1]', '2130706433', '0x7f000001']) {
    const value = `http://${host}/model.glb`;
    rejects(value);
    assert.equal(resolveModelUrl(value, { ...options, development: true }), new URL(value).href);
  }
}
console.log('Both-species model URL policy assertions passed.');
