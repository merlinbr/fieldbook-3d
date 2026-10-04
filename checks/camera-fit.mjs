import assert from 'node:assert/strict';
import { orthographicHalfHeight } from '../src/lib/viewer/camera-fit.ts';

for (const aspect of [1365 / 768, 1024 / 768, 390 / 844, 1]) {
  for (const [horizontalRadius, verticalRadius] of [[5, 1.5], [1.5, 5]]) {
    const halfHeight = orthographicHalfHeight(horizontalRadius, verticalRadius, aspect);
    assert.ok(halfHeight + 1e-9 >= verticalRadius * 1.15);
    assert.ok(halfHeight * aspect + 1e-9 >= horizontalRadius * 1.15);
  }
}

for (const invalid of [0, -1, NaN, Infinity]) {
  assert.throws(() => orthographicHalfHeight(invalid, 1, 1), RangeError);
  assert.throws(() => orthographicHalfHeight(1, invalid, 1), RangeError);
  assert.throws(() => orthographicHalfHeight(1, 1, invalid), RangeError);
}
for (const extents of [[Number.MAX_VALUE, 1, 1], [1, 1, Number.MIN_VALUE], [1, 1, Number.MAX_VALUE]]) {
  assert.throws(() => orthographicHalfHeight(...extents), RangeError);
}
