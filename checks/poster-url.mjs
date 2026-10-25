import assert from 'node:assert/strict';
import { resolvePosterUrl } from '../src/lib/specimens/poster-url.ts';

for (const species of ['ankylosaurus', 'stegosaurus']) {
  const environmentVariable = `PUBLIC_${species.toUpperCase()}_POSTER_URL`;
  const developmentUrl = `http://127.0.0.1:5194/${species}-poster.png`;
  const options = { environmentVariable, developmentUrl, development: false };
  assert.equal(resolvePosterUrl(undefined, options), null);
  assert.equal(resolvePosterUrl('', options), null);
  assert.equal(resolvePosterUrl(undefined, { ...options, development: true }), developmentUrl);
  assert.equal(resolvePosterUrl('', { ...options, development: true }), developmentUrl);
  for (const value of ['https://media.example/poster.png', 'http://media.example/poster.png']) {
    assert.equal(resolvePosterUrl(value, options), value);
  }
  for (const value of ['', 'bad', '/poster.png', 'file:///poster.png', 'data:image/png,',
    'https://user@media.example/poster.png', 'https://user:secret@media.example/poster.png']) {
    if (value) {
      assert.throws(() => resolvePosterUrl(value, options), new RegExp(environmentVariable));
      assert.throws(() => resolvePosterUrl(value, { ...options, development: true }), new RegExp(environmentVariable));
    }
  }
  for (const host of ['localhost', 'dev.localhost', '127.0.0.1', '[::1]']) {
    assert.throws(() => resolvePosterUrl(`http://${host}/poster.png`, options), new RegExp(environmentVariable));
    assert.match(resolvePosterUrl(`http://${host}/poster.png`, { ...options, development: true }), /^http:/);
  }
}
console.log('Both-species optional poster URL policy assertions passed.');
