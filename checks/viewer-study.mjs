import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveStudyContext } from '../src/lib/viewer/viewer-study.ts';
import { parseStudyVersion } from '../src/lib/viewer/study-data.ts';
import { encodeStudyHandoff } from '../src/lib/viewer/study-handoff.ts';
import { createAnkylosaurusConfig } from '../src/lib/specimens/ankylosaurus-config.ts';
import { stegosaurusConfig } from './specimen-config-fixtures.mjs';

const en = parseStudyVersion(readFileSync(new URL('../docs/assets/ankylosaurus-narration.en.json', import.meta.url), 'utf8')).version;
const de = parseStudyVersion(readFileSync(new URL('../docs/assets/ankylosaurus-narration.de.json', import.meta.url), 'utf8')).version;
assert(en && de);
const config = createAnkylosaurusConfig('https://example.org/model.glb');
const guided = { kind: 'guided', recording: { version: en, error: null }, versions: [en, de] };
const raw = encodeStudyHandoff({ specimen: 'ankylosaurus', version: en.id, time: 0,
  chapter: 'meet', captions: true, view: { azimuth: 0, polar: 1, zoom: 1 } });
const none = { incoming: null, handoffFailed: false };
assert.deepEqual(resolveStudyContext(stegosaurusConfig, { kind: 'none' }, [raw]), none, 'exploration does not borrow a valid study');
assert.deepEqual(resolveStudyContext(stegosaurusConfig, { kind: 'none' }, [raw, raw]), none);
assert.deepEqual(resolveStudyContext(config, guided, []), none);
assert.equal(resolveStudyContext(config, guided, [raw]).incoming.version, en.id);
assert.equal(resolveStudyContext(config, { ...guided, recording: { version: de, error: null } }, [raw]).incoming.version, de.id);
for (const contexts of [[raw, raw], ['malformed']]) {
  assert.deepEqual(resolveStudyContext(config, guided, contexts), { incoming: null, handoffFailed: true });
}
for (const error of ['missing', 'data']) {
  assert.deepEqual(resolveStudyContext(config, { ...guided, recording: { version: null, error } }, [raw]), { incoming: null, handoffFailed: true });
}
assert.deepEqual(resolveStudyContext({ ...config, id: 'other' }, guided, [raw]), { incoming: null, handoffFailed: true }, 'protocol remains specimen-specific');
console.log('Explicit study capability and existing recording handoff assertions passed.');
