export function orthographicHalfHeight(horizontalRadius: number, verticalRadius: number, aspect: number): number {
  if (!Number.isFinite(horizontalRadius) || horizontalRadius <= 0 ||
      !Number.isFinite(verticalRadius) || verticalRadius <= 0 ||
      !Number.isFinite(aspect) || aspect <= 0) {
    throw new RangeError('Camera fit requires positive finite extents and aspect');
  }

  const halfHeight = 1.15 * Math.max(verticalRadius, horizontalRadius / aspect);
  const halfWidth = halfHeight * aspect;
  if (!Number.isFinite(halfHeight) || halfHeight <= 0 || !Number.isFinite(halfWidth) || halfWidth <= 0) {
    throw new RangeError('Camera fit exceeds finite projection bounds');
  }
  return halfHeight;
}
