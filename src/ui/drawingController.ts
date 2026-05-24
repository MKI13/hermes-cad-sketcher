import { distance, type Vec3, vec } from '../core/geometry';
import { type DrawingPlane } from '../core/model';

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
  plane: DrawingPlane;
};

export type RectangleDimensionMask = {
  width: string;
  depth: string;
};

export type RectangleDimensions = {
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

export function createRectangleDraft(first: Vec3, second: Vec3, plane: DrawingPlane = 'xy'): DrawingDraftResult<RectangleDraft> {
  const { width, depth } = rectangleDeltas(first, second, plane);
  if (!Number.isFinite(width) || !Number.isFinite(depth) || width === 0 || depth === 0) {
    return { ok: false, error: 'Ein Rechteck braucht positive Breite und Tiefe.' };
  }
  return { ok: true, origin: cloneVec(first), width, depth, plane };
}

export function parseRectangleDimensionMask(mask: RectangleDimensionMask): DrawingDraftResult<RectangleDimensions> {
  const width = Number(mask.width.replace(',', '.'));
  const depth = Number(mask.depth.replace(',', '.'));
  if (!Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0) {
    return { ok: false, error: 'Die Maßmaske braucht positive Breite und Tiefe/Höhe in Millimeter.' };
  }
  return { ok: true, width, depth };
}

export function secondPointForRectangleDimensions(first: Vec3, pointer: Vec3, dimensions: RectangleDimensions, plane: DrawingPlane): Vec3 {
  const direction = rectangleDeltas(first, pointer, plane);
  const width = signedDimension(dimensions.width, direction.width);
  const depth = signedDimension(dimensions.depth, direction.depth);
  if (plane === 'xz') return vec(first.x + width, first.y, first.z + depth);
  if (plane === 'yz') return vec(first.x, first.y + width, first.z + depth);
  return vec(first.x + width, first.y + depth, first.z);
}

function rectangleDeltas(first: Vec3, second: Vec3, plane: DrawingPlane): RectangleDimensions {
  if (plane === 'xz') return { width: second.x - first.x, depth: second.z - first.z };
  if (plane === 'yz') return { width: second.y - first.y, depth: second.z - first.z };
  return { width: second.x - first.x, depth: second.y - first.y };
}

function signedDimension(size: number, direction: number): number {
  return direction < 0 ? -size : size;
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
