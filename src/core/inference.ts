import { add, distance, dot, scale, sub, type Vec3, vec } from './geometry';
import { boxWorldPoints, entityBoundingBox, formatMillimeters, type Entity, type EntityId, type SketchModel } from './model';

export type AxisLock = 'x' | 'y' | 'z';
export type SnapInferenceKind = 'endpoint' | 'midpoint' | 'center' | 'onEdge' | 'onFace';
export type AxisInferenceKind = 'axisX' | 'axisY' | 'axisZ';
export type InferenceKind = SnapInferenceKind | AxisInferenceKind | 'free';

export type InferenceCandidate = Readonly<{
  kind: SnapInferenceKind;
  point: Vec3;
  entityId: EntityId;
  geometry?: InferenceGeometry;
}>;

type InferenceGeometry =
  | Readonly<{ type: 'segment'; start: Vec3; end: Vec3 }>
  | Readonly<{ type: 'face'; vertices: readonly Vec3[] }>;

export type AxisLine = Readonly<{ start: Vec3; end: Vec3; color: string }>;

export type Inference =
  | Readonly<{ kind: SnapInferenceKind; point: Vec3; entityId: EntityId }>
  | Readonly<{ kind: AxisInferenceKind; point: Vec3; axis: AxisLock; axisLine: AxisLine }>
  | Readonly<{ kind: 'free'; point: Vec3 }>;

const PRIORITY: Record<SnapInferenceKind, number> = {
  endpoint: 5,
  midpoint: 4,
  center: 3,
  onEdge: 2,
  onFace: 1
};

const AXIS_KIND: Record<AxisLock, AxisInferenceKind> = {
  x: 'axisX',
  y: 'axisY',
  z: 'axisZ'
};

const AXIS_COLOR: Record<AxisLock, string> = {
  x: '#dc2626',
  y: '#16a34a',
  z: '#2563eb'
};

export function collectInferenceCandidates(model: Pick<SketchModel, 'allEntities'>): InferenceCandidate[] {
  return model.allEntities().filter((entity) => !entity.hidden).flatMap((entity) => candidatesForEntity(entity));
}

export function resolveInference(point: Vec3, candidates: readonly InferenceCandidate[], options: { tolerance?: number } = {}): Inference {
  const tolerance = options.tolerance ?? 35;
  let best: { candidate: InferenceCandidate; point: Vec3; currentDistance: number } | undefined;
  for (const candidate of candidates) {
    const projectedPoint = projectedCandidatePoint(point, candidate);
    const currentDistance = distance(point, projectedPoint);
    if (currentDistance > tolerance) continue;
    if (!best) {
      best = { candidate, point: projectedPoint, currentDistance };
      continue;
    }
    const currentPriority = PRIORITY[candidate.kind];
    const bestPriority = PRIORITY[best.candidate.kind];
    if (currentPriority > bestPriority || (currentPriority === bestPriority && currentDistance < best.currentDistance)) {
      best = { candidate, point: projectedPoint, currentDistance };
    }
  }
  return best ? { kind: best.candidate.kind, point: best.point, entityId: best.candidate.entityId } : { kind: 'free', point };
}

export type AxisLockKeyboardContext = Readonly<{
  targetTagName?: string;
  targetIsContentEditable?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}>;

export function axisLockFromArrowKey(key: string, context: AxisLockKeyboardContext = {}): AxisLock | undefined {
  const targetTagName = context.targetTagName?.toUpperCase();
  if (targetTagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTagName)) return undefined;
  if (context.targetIsContentEditable) return undefined;
  if (context.ctrlKey || context.metaKey || context.altKey) return undefined;
  if (key === 'ArrowRight') return 'x';
  if (key === 'ArrowLeft') return 'y';
  if (key === 'ArrowUp') return 'z';
  return undefined;
}

export function applyAxisLock(point: Vec3, anchor: Vec3, axis: AxisLock): Vec3 {
  if (axis === 'x') return vec(point.x, anchor.y, anchor.z);
  if (axis === 'y') return vec(anchor.x, point.y, anchor.z);
  if (point.z !== anchor.z) return vec(anchor.x, anchor.y, point.z);
  const planarDistance = Math.hypot(point.x - anchor.x, point.y - anchor.y);
  const direction = point.y >= anchor.y || (point.y === anchor.y && point.x >= anchor.x) ? 1 : -1;
  return vec(anchor.x, anchor.y, anchor.z + planarDistance * direction);
}

export function createInference(
  point: Vec3,
  candidates: readonly InferenceCandidate[],
  options: { tolerance?: number; anchor?: Vec3; axisLock?: AxisLock } = {}
): Inference {
  if (options.anchor && options.axisLock) {
    const lockedPoint = applyAxisLock(point, options.anchor, options.axisLock);
    return {
      kind: AXIS_KIND[options.axisLock],
      point: lockedPoint,
      axis: options.axisLock,
      axisLine: { start: options.anchor, end: lockedPoint, color: AXIS_COLOR[options.axisLock] }
    };
  }
  return resolveInference(point, candidates, { tolerance: options.tolerance });
}

export function freezeInference(next: Inference, held: Inference | undefined, shiftHeld: boolean): Inference {
  return shiftHeld && held ? held : next;
}

export function inferenceLabel(kind: InferenceKind): string {
  const labels: Record<InferenceKind, string> = {
    endpoint: 'Endpunkt',
    midpoint: 'Mitte',
    center: 'Zentrum',
    onEdge: 'auf Kante',
    onFace: 'auf Fläche',
    axisX: 'Achse X',
    axisY: 'Achse Y',
    axisZ: 'Achse Z',
    free: ''
  };
  return labels[kind];
}

export function describeInference(inference: Inference): string {
  const label = inferenceLabel(inference.kind);
  if (inference.kind === 'axisX' || inference.kind === 'axisY' || inference.kind === 'axisZ') {
    const delta = sub(inference.axisLine.end, inference.axisLine.start);
    return `${label} · Δ ${formatMillimeters(delta.x)} / ${formatMillimeters(delta.y)} / ${formatMillimeters(delta.z)}`;
  }
  return label;
}

function candidatesForEntity(entity: Entity): InferenceCandidate[] {
  if (entity.type === 'edge') return segmentCandidates(entity.id, entity.start, entity.end);
  if (entity.type === 'face') return faceCandidates(entity);
  if (entity.type === 'box') return boxCandidates(entity);
  return [];
}

function faceCandidates(entity: Extract<Entity, { type: 'face' }>): InferenceCandidate[] {
  const edges = entity.vertices.flatMap((point, index) => segmentCandidates(entity.id, point, entity.vertices[(index + 1) % entity.vertices.length]));
  return dedupeCandidates([
    ...edges,
    { entityId: entity.id, kind: 'center', point: centerOf(entity.vertices) },
    { entityId: entity.id, kind: 'onFace', point: centerOf(entity.vertices), geometry: { type: 'face', vertices: entity.vertices } }
  ]);
}

function boxCandidates(entity: Extract<Entity, { type: 'box' }>): InferenceCandidate[] {
  const corners = boxWorldPoints(entity);
  const edgeIndexes: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];
  const faceIndexes: number[][] = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [3, 2, 6, 7],
    [0, 3, 7, 4],
    [1, 2, 6, 5]
  ];
  const edgeCandidates = edgeIndexes.flatMap(([start, end]) => segmentCandidates(entity.id, corners[start], corners[end]));
  const center = add(entity.origin, vec(entity.width / 2, entity.depth / 2, entity.height / 2));
  const box = entityBoundingBox(entity);
  const faceCenters = [
    vec(center.x, center.y, box.min.z),
    vec(center.x, center.y, box.max.z),
    vec(center.x, box.min.y, center.z),
    vec(center.x, box.max.y, center.z),
    vec(box.min.x, center.y, center.z),
    vec(box.max.x, center.y, center.z)
  ];
  return dedupeCandidates([
    ...edgeCandidates,
    { entityId: entity.id, kind: 'center', point: center },
    ...faceCenters.map((point, index): InferenceCandidate => ({
      entityId: entity.id,
      kind: 'onFace',
      point,
      geometry: { type: 'face', vertices: faceIndexes[index].map((cornerIndex) => corners[cornerIndex]) }
    }))
  ]);
}

function segmentCandidates(entityId: EntityId, start: Vec3, end: Vec3): InferenceCandidate[] {
  const midpoint = scale(add(start, end), 0.5);
  return [
    { entityId, kind: 'endpoint', point: start },
    { entityId, kind: 'endpoint', point: end },
    { entityId, kind: 'midpoint', point: midpoint },
    { entityId, kind: 'onEdge', point: midpoint, geometry: { type: 'segment', start, end } }
  ];
}

function projectedCandidatePoint(point: Vec3, candidate: InferenceCandidate): Vec3 {
  if (candidate.kind === 'onEdge' && candidate.geometry?.type === 'segment') {
    return closestPointOnSegment(point, candidate.geometry.start, candidate.geometry.end);
  }
  if (candidate.kind === 'onFace' && candidate.geometry?.type === 'face') {
    return closestPointOnFace(point, candidate.geometry.vertices);
  }
  return candidate.point;
}

function closestPointOnSegment(point: Vec3, start: Vec3, end: Vec3): Vec3 {
  const segment = sub(end, start);
  const denominator = dot(segment, segment);
  if (denominator === 0) return start;
  const t = clamp(dot(sub(point, start), segment) / denominator, 0, 1);
  return add(start, scale(segment, t));
}

function closestPointOnFace(point: Vec3, vertices: readonly Vec3[]): Vec3 {
  if (vertices.length < 3) return centerOf(vertices);
  const normal = faceNormal(vertices);
  if (!normal) return centerOf(vertices);
  const planePoint = vertices[0];
  const normalLengthSquared = dot(normal, normal);
  const projectedToPlane = sub(point, scale(normal, dot(sub(point, planePoint), normal) / normalLengthSquared));
  if (pointInPolygon3(pointedFinite(projectedToPlane), vertices, normal)) return pointedFinite(projectedToPlane);
  return closestPointOnFaceBoundary(point, vertices);
}

function faceNormal(vertices: readonly Vec3[]): Vec3 | undefined {
  const origin = vertices[0];
  for (let left = 1; left < vertices.length - 1; left += 1) {
    for (let right = left + 1; right < vertices.length; right += 1) {
      const normal = cross(sub(vertices[left], origin), sub(vertices[right], origin));
      if (dot(normal, normal) > 1e-12) return normal;
    }
  }
  return undefined;
}

function pointInPolygon3(point: Vec3, vertices: readonly Vec3[], normal: Vec3): boolean {
  const axes = projectionAxesForNormal(normal);
  const projectedPoint = pointTo2(point, axes);
  const projectedPolygon = vertices.map((vertex) => pointTo2(vertex, axes));
  return pointInPolygon2(projectedPoint, projectedPolygon);
}

function projectionAxesForNormal(normal: Vec3): { a: 'x' | 'y' | 'z'; b: 'x' | 'y' | 'z' } {
  const abs = { x: Math.abs(normal.x), y: Math.abs(normal.y), z: Math.abs(normal.z) };
  if (abs.x >= abs.y && abs.x >= abs.z) return { a: 'y', b: 'z' };
  if (abs.y >= abs.x && abs.y >= abs.z) return { a: 'x', b: 'z' };
  return { a: 'x', b: 'y' };
}

function pointTo2(point: Vec3, axes: { a: 'x' | 'y' | 'z'; b: 'x' | 'y' | 'z' }): { a: number; b: number } {
  return { a: point[axes.a], b: point[axes.b] };
}

function closestPointOnFaceBoundary(point: Vec3, vertices: readonly Vec3[]): Vec3 {
  let best = vertices[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < vertices.length; index += 1) {
    const projected = closestPointOnSegment(point, vertices[index], vertices[(index + 1) % vertices.length]);
    const currentDistance = distance(point, projected);
    if (currentDistance < bestDistance) {
      best = projected;
      bestDistance = currentDistance;
    }
  }
  return best;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return vec(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

function pointedFinite(point: Vec3): Vec3 {
  return vec(roundTiny(point.x), roundTiny(point.y), roundTiny(point.z));
}

function roundTiny(value: number): number {
  return Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(10));
}

function pointInPolygon2(point: { a: number; b: number }, polygon: Array<{ a: number; b: number }>): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects = currentPoint.b > point.b !== previousPoint.b > point.b &&
      point.a < ((previousPoint.a - currentPoint.a) * (point.b - currentPoint.b)) / (previousPoint.b - currentPoint.b) + currentPoint.a;
    if (intersects) inside = !inside;
  }
  return inside || polygon.some((vertex, index) => distance2ToSegment(point, vertex, polygon[(index + 1) % polygon.length]) <= 1e-12);
}

function closestPointOnSegment2(point: { a: number; b: number }, start: { a: number; b: number }, end: { a: number; b: number }): { a: number; b: number } {
  const ab = { a: end.a - start.a, b: end.b - start.b };
  const denominator = ab.a ** 2 + ab.b ** 2;
  if (denominator === 0) return start;
  const t = clamp(((point.a - start.a) * ab.a + (point.b - start.b) * ab.b) / denominator, 0, 1);
  return { a: start.a + ab.a * t, b: start.b + ab.b * t };
}

function distance2ToSegment(point: { a: number; b: number }, start: { a: number; b: number }, end: { a: number; b: number }): number {
  return distance2(point, closestPointOnSegment2(point, start, end));
}

function distance2(a: { a: number; b: number }, b: { a: number; b: number }): number {
  return (a.a - b.a) ** 2 + (a.b - b.b) ** 2;
}

function centerOf(points: readonly Vec3[]): Vec3 {
  if (points.length === 0) return vec(0, 0, 0);
  return scale(points.reduce((sum, point) => add(sum, point), vec(0, 0, 0)), 1 / points.length);
}

function dedupeCandidates(candidates: readonly InferenceCandidate[]): InferenceCandidate[] {
  const seen = new Set<string>();
  const result: InferenceCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.entityId}:${candidate.kind}:${candidate.point.x.toFixed(6)}:${candidate.point.y.toFixed(6)}:${candidate.point.z.toFixed(6)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
