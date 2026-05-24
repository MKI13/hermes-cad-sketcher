import { distance, type Vec3, vec } from '../core/geometry';

export type DrawingDraftResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export type LineDraft = {
  start: Vec3;
  end: Vec3;
};

export type RectangleDraft = {
  origin: Vec3;
  width: number;
  depth: number;
};

export type BoxDraft = {
  origin: Vec3;
  width: number;
  depth: number;
  height: number;
};

export type BoxDimensions = {
  width: number;
  depth: number;
  height: number;
};

export const DEFAULT_BOX_DIMENSIONS: BoxDimensions = {
  width: 600,
  depth: 600,
  height: 600
};

export function createLineDraft(start: Vec3, end: Vec3): DrawingDraftResult<LineDraft> {
  if (distance(start, end) <= 0) {
    return { ok: false, error: 'Eine Linie braucht zwei verschiedene Punkte.' };
  }
  return { ok: true, start: cloneVec(start), end: cloneVec(end) };
}

export function createRectangleDraft(first: Vec3, second: Vec3): DrawingDraftResult<RectangleDraft> {
  const width = second.x - first.x;
  const depth = second.y - first.y;
  if (!Number.isFinite(width) || !Number.isFinite(depth) || width === 0 || depth === 0) {
    return { ok: false, error: 'Ein Rechteck braucht positive Breite und Tiefe.' };
  }
  return { ok: true, origin: cloneVec(first), width, depth };
}

export function createBoxDraft(
  origin: Vec3,
  dimensions: BoxDimensions = DEFAULT_BOX_DIMENSIONS
): DrawingDraftResult<BoxDraft> {
  const { width, depth, height } = dimensions;
  if (width <= 0 || depth <= 0 || height <= 0) {
    return { ok: false, error: 'Ein Körper braucht positive Maße.' };
  }
  return { ok: true, origin: cloneVec(origin), width, depth, height };
}

function cloneVec(input: Vec3): Vec3 {
  return vec(input.x, input.y, input.z);
}
