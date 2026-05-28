import { distance, type Vec3, vec } from './geometry';
import { type Entity, type EntityId, type SketchModel } from './model';

export type SnapPointKind = 'endpoint' | 'midpoint' | 'edge';
export type SnapPoint = Readonly<{ entityId: EntityId; kind: SnapPointKind; point: Vec3 }>;
type SnapSegment = Readonly<{ entityId: EntityId; start: Vec3; end: Vec3 }>;
export type SnapResult = Readonly<
  | { point: Vec3; kind: 'free' }
  | { point: Vec3; kind: 'axis'; axis: 'x' | 'y' | 'z' }
  | { point: Vec3; kind: SnapPointKind; entityId: EntityId }
>;
export type SnapOptions = Readonly<{
  model: Pick<SketchModel, 'allEntities'>;
  pointer: Vec3;
  gridSize?: number;
  tolerance?: number;
  startPoint?: Vec3;
  forceAxisLock?: boolean;
  axisLock?: 'x' | 'y' | 'z';
}>;

export function findSnapPoint({ model, pointer, gridSize = 50, tolerance = 35, startPoint, forceAxisLock = false, axisLock }: SnapOptions): SnapResult {
  const entitySnap = nearestModelSnapPoint(pointer, model, tolerance);
  if (entitySnap) return { point: entitySnap.point, kind: entitySnap.kind, entityId: entitySnap.entityId };

  const edgeSnap = nearestModelEdgeSnap(pointer, model, tolerance);
  if (edgeSnap) return { point: edgeSnap.point, kind: 'edge', entityId: edgeSnap.entityId };

  const axisSnap = startPoint ? snapAlongDominantAxis(pointer, startPoint, gridSize, tolerance, forceAxisLock, axisLock) : undefined;
  if (axisSnap) return axisSnap;

  return { point: pointer, kind: 'free' };
}

export function collectSnapPoints(model: Pick<SketchModel, 'allEntities'>): SnapPoint[] {
  return model.allEntities().flatMap((entity) => snapPointsForEntity(entity));
}

export function snapToGrid(point: Vec3, gridSize = 50): Vec3 {
  const safeGrid = Math.max(1, gridSize);
  return {
    x: Math.round(point.x / safeGrid) * safeGrid,
    y: Math.round(point.y / safeGrid) * safeGrid,
    z: Math.round(point.z / safeGrid) * safeGrid
  };
}

function nearestModelSnapPoint(pointer: Vec3, model: Pick<SketchModel, 'allEntities'>, tolerance: number): SnapPoint | undefined {
  let best: SnapPoint | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of collectSnapPoints(model)) {
    const currentDistance = distance(pointer, candidate.point);
    if (currentDistance < bestDistance) {
      best = candidate;
      bestDistance = currentDistance;
    }
  }
  return best && bestDistance <= tolerance ? best : undefined;
}

function nearestModelEdgeSnap(pointer: Vec3, model: Pick<SketchModel, 'allEntities'>, tolerance: number): SnapPoint | undefined {
  let best: SnapPoint | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const segment of collectSnapSegments(model)) {
    const point = closestPointOnSegment(pointer, segment.start, segment.end);
    const currentDistance = distance(pointer, point);
    if (currentDistance < bestDistance) {
      best = { entityId: segment.entityId, kind: 'edge', point };
      bestDistance = currentDistance;
    }
  }
  return best && bestDistance <= tolerance ? best : undefined;
}

function snapAlongDominantAxis(pointer: Vec3, startPoint: Vec3, _gridSize: number, tolerance: number, forceAxisLock = false, axisLock?: 'x' | 'y' | 'z'): Extract<SnapResult, { kind: 'axis' }> | undefined {
  const delta = {
    x: Math.abs(pointer.x - startPoint.x),
    y: Math.abs(pointer.y - startPoint.y),
    z: Math.abs(pointer.z - startPoint.z)
  };
  const axis = axisLock ?? dominantAxis(delta);
  if (!axis || delta[axis] <= tolerance) return undefined;

  const offAxisDistance = Math.sqrt(
    (axis === 'x' ? 0 : (pointer.x - startPoint.x) ** 2) +
    (axis === 'y' ? 0 : (pointer.y - startPoint.y) ** 2) +
    (axis === 'z' ? 0 : (pointer.z - startPoint.z) ** 2)
  );
  if (!axisLock && !forceAxisLock && offAxisDistance > tolerance) return undefined;

  return {
    kind: 'axis',
    axis,
    point: vec(
      axis === 'x' ? pointer.x : startPoint.x,
      axis === 'y' ? pointer.y : startPoint.y,
      axis === 'z' ? pointer.z : startPoint.z
    )
  };
}

function dominantAxis(delta: { x: number; y: number; z: number }): 'x' | 'y' | 'z' | undefined {
  const ordered = [
    { axis: 'x' as const, delta: delta.x },
    { axis: 'y' as const, delta: delta.y },
    { axis: 'z' as const, delta: delta.z }
  ].sort((a, b) => b.delta - a.delta);
  return ordered[0].delta > ordered[1].delta ? ordered[0].axis : undefined;
}

function collectSnapSegments(model: Pick<SketchModel, 'allEntities'>): SnapSegment[] {
  return model.allEntities().flatMap((entity) => snapSegmentsForEntity(entity));
}

function snapPointsForEntity(entity: Entity): SnapPoint[] {
  if (entity.type === 'edge') return segmentSnapPoints(entity.id, entity.start, entity.end);
  if (entity.type === 'face') {
    return entity.vertices.flatMap((point, index) => segmentSnapPoints(entity.id, point, entity.vertices[(index + 1) % entity.vertices.length]));
  }
  if (entity.type === 'box') {
    const unique = new Map<string, SnapPoint>();
    for (const segment of snapSegmentsForEntity(entity)) {
      for (const point of segmentSnapPoints(entity.id, segment.start, segment.end)) unique.set(`${point.kind}:${point.point.x}:${point.point.y}:${point.point.z}`, point);
    }
    return [...unique.values()];
  }
  return [];
}

function snapSegmentsForEntity(entity: Entity): SnapSegment[] {
  if (entity.type === 'edge') return [{ entityId: entity.id, start: entity.start, end: entity.end }];
  if (entity.type === 'face') {
    return entity.vertices.map((point, index) => ({ entityId: entity.id, start: point, end: entity.vertices[(index + 1) % entity.vertices.length] }));
  }
  if (entity.type === 'box') {
    const { origin, width, depth, height } = entity;
    const corners = [
      origin,
      vec(origin.x + width, origin.y, origin.z),
      vec(origin.x + width, origin.y + depth, origin.z),
      vec(origin.x, origin.y + depth, origin.z),
      vec(origin.x, origin.y, origin.z + height),
      vec(origin.x + width, origin.y, origin.z + height),
      vec(origin.x + width, origin.y + depth, origin.z + height),
      vec(origin.x, origin.y + depth, origin.z + height)
    ];
    const edges: Array<[Vec3, Vec3]> = [
      [corners[0], corners[1]], [corners[1], corners[2]], [corners[2], corners[3]], [corners[3], corners[0]],
      [corners[4], corners[5]], [corners[5], corners[6]], [corners[6], corners[7]], [corners[7], corners[4]],
      [corners[0], corners[4]], [corners[1], corners[5]], [corners[2], corners[6]], [corners[3], corners[7]]
    ];
    return edges.map(([start, end]) => ({ entityId: entity.id, start, end }));
  }
  return [];
}

function segmentSnapPoints(entityId: EntityId, start: Vec3, end: Vec3): SnapPoint[] {
  return [
    { entityId, kind: 'endpoint', point: start },
    { entityId, kind: 'endpoint', point: end },
    { entityId, kind: 'midpoint', point: vec((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2) }
  ];
}

function closestPointOnSegment(pointer: Vec3, start: Vec3, end: Vec3): Vec3 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dy * dy + dz * dz;
  if (lengthSquared <= Number.EPSILON) return start;
  const t = Math.max(0, Math.min(1, ((pointer.x - start.x) * dx + (pointer.y - start.y) * dy + (pointer.z - start.z) * dz) / lengthSquared));
  return vec(start.x + dx * t, start.y + dy * t, start.z + dz * t);
}
