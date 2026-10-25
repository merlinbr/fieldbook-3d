import assert from 'node:assert/strict';
import { getSpecimen, specimens } from '../src/lib/specimens/catalog.ts';

assert.deepEqual(specimens.map(({ id }) => id), ['ankylosaurus', 'stegosaurus']);
assert.equal(new Set(specimens.map(({ id }) => id)).size, specimens.length);
assert.equal(getSpecimen('ankylosaurus'), specimens[0]);
assert.equal(getSpecimen('stegosaurus'), specimens[1]);
for (const unknown of [undefined, null, '', 'unknown']) {
  assert.equal(getSpecimen(unknown), specimens[0]);
}

const [ankylosaurus, stegosaurus] = specimens;
assert.equal(ankylosaurus.studyCapability, 'guided');
assert.equal(ankylosaurus.period, 'late-cretaceous');
assert.equal(stegosaurus.studyCapability, 'exploration');
assert.equal(stegosaurus.period, 'late-jurassic');
for (const specimen of specimens) {
  assert.equal(specimen.diet, 'herbivore');
}

console.log('Specimen catalog identity, fallback, capability, period, and diet assertions passed.');
