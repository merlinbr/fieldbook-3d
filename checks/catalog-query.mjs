import assert from 'node:assert/strict';
import { specimens } from '../src/lib/specimens/catalog.ts';
import { discoverSpecimens, defaultOverviewState } from '../src/lib/specimens/catalog-query.ts';
import { discoveryFixtures } from './fixtures/discovery-catalog.ts';

const run = (change = {}, entries = discoveryFixtures, locale = 'en') => discoverSpecimens(entries, { ...defaultOverviewState, ...change }, locale);
assert.equal(run().count, 52);
assert.equal(run().pages, 7);
assert.equal(run().pageEntries.length, 8);
assert.equal(run({ page: 7 }).pageEntries.length, 4);
assert.equal(run({ page: 999 }).state.page, 7);
for (const page of [-1, 0, NaN, Infinity, 1.5]) assert.equal(run({ page }).state.page, 1);
for (const [query, expected] of [[' ANKYLOSAURUS ', 'ankylosaurus'], ['  MAGNIVENTRIS ', 'ankylosaurus'], ['sTeNoPs', 'stegosaurus']]) {
  const result = run({ query }, specimens);
  assert.deepEqual(result.entries.map(s => s.id), [expected]);
  assert.equal(result.state.specimen, expected);
}
assert.equal(run({ query: ' \t ' }).count, 52);
const combined = run({ query: 'sample', diet: 'carnivore', period: 'triassic', specimen: 'stegosaurus' });
assert.deepEqual(combined.entries.map(s => s.id), ['layout-sample-06', 'layout-sample-26', 'layout-sample-46']);
assert.equal(combined.state.specimen, 'layout-sample-06');
assert(run({ period: 'cretaceous' }).entries.some(s => s.id === 'layout-sample-04'), 'Multi-period membership matches');
assert(run().entries.some(s => s.diet === null && !s.periods.length), 'Unconstrained results retain unknown metadata');
assert(run({ diet: 'herbivore' }).entries.every(s => s.diet === 'herbivore'));
assert(run({ period: 'jurassic' }).entries.every(s => s.periods.includes('jurassic')));
assert.equal(run({ specimen: 'stegosaurus', diet: 'herbivore' }).state.specimen, 'stegosaurus');
assert.equal(run({ specimen: 'stegosaurus', query: 'nothing matches', view: 'spotlight' }).state.specimen, null);
assert.equal(run({ query: 'nothing matches', page: 6 }).state.page, 1);
assert.equal(run({ page: 7, specimen: 'layout-sample-50' }, specimens).state.page, 1);
assert.equal(run({ page: 7, specimen: 'layout-sample-50' }, specimens).state.specimen, 'ankylosaurus');
assert.deepEqual(run({ sort: 'name-desc' }).entries.map(s => s.id), run().entries.map(s => s.id).reverse());
const ties = ['b', 'a', 'c'].map(id => ({ ...specimens[0], id, text: { en: { name: 'Same' }, de: { name: 'Gleich' } } }));
assert.deepEqual(run({}, ties).entries.map(s => s.id), ['a', 'b', 'c']);
assert.deepEqual(run({}, ties.toReversed()).entries.map(s => s.id), ['a', 'b', 'c']);
assert.equal(run({}, discoveryFixtures, 'de').entries.at(-1).id, 'stegosaurus');
console.log('Catalog discovery: 52 entries, AND constraints, unknown/multiple periods, selection, empty/shrink, stable sorting and page bounds passed.');
