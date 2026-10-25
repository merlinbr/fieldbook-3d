import assert from 'node:assert/strict';
import { readOverviewState, overviewHash, exhibitOverviewHash, returnToOverview } from '../src/lib/specimens/overview-state.ts';

const selected = { specimen: 'stegosaurus', view: 'spotlight', index: 312 };
assert.deepEqual(readOverviewState(overviewHash(selected)), selected);
assert.deepEqual(readOverviewState('#specimen=unknown&view=spotlight&index=NaN'), { specimen: 'ankylosaurus', view: 'spotlight', index: 0 });
assert.deepEqual(readOverviewState('#specimen=stegosaurus&view=invalid&index=-20'), { specimen: 'stegosaurus', view: 'results', index: 0 });
assert.equal(returnToOverview('stegosaurus', exhibitOverviewHash(selected)), overviewHash(selected));
assert.equal(returnToOverview('ankylosaurus', exhibitOverviewHash(selected)), overviewHash({ ...selected, specimen: 'ankylosaurus' }));
assert.equal(returnToOverview('stegosaurus', '#study=playing&time=42'), overviewHash({ ...selected, index: 0 }));
assert(!exhibitOverviewHash(selected).includes('study'));
console.log('Overview selection, unknown-state fallback, browsing return and cross-specimen isolation passed.');
