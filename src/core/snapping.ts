import { distance, type Vec3, vec } from './geometry';
import { type Entity, type EntityId, type SketchModel } from './model';

export type SnapPointKind = 'endpoint' | 'midpoint';
export type SnapPoint = Readonly<{ entityId: EntityId; kind: SnapPointKind; point: Vec3 }>;
export type SnapResult = Readonly<
  | { point: Vec3; kind: 'grid' }
  | { point: Vec3; kind: 'axis'; axis: 'x' | 'y' | 'z' }
  | { point: Vec3; kind: SnapPointKind; entityId: EntityId }
>;
export type SnapOptions = Readonly<{
  model: Pick<SketchModel, 'allEntities'>;
  pointer: Vec3;
  gridSize?: number;
  tolerance?: number;
  startPoint?: Vec3;
}>;

export function findSnapPoint({ model, pointer, gridSize = 50, tolerance = 35, startPoint }: SnapOptions): SnapResult {
  const entitySnap = nearestModelSnapPoint(pointer, model, tolerance);
  if (entitySnap) return { point: entitySnap.point, kind: entitySnap.kind, entityId: entitySnap.entityId };

  const axisSnap = startPoint ? snapAlongDominantAxis(pointer, startPoint, gridSize, tolerance) : undefined;
  if (axisSnap) return axisSnap;

  return { point: snapToGrid(pointer, gridSize), kind: 'grid' };
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

function snapAlongDominantAxis(pointer: Vec3, startPoint: Vec3, gridSize: number, tolerance: number): Extract<SnapResult, { kind: 'axis' }> | undefined {
  const delta = {
    x: Math.abs(pointer.x - startPoint.x),
    y: Math.abs(pointer.y - startPoint.y),
    z: Math.abs(pointer.z - startPoint.z)
  };
  const axis = dominantAxis(delta);
  if (!axis || delta[axis] <= tolerance) return undefined;

  const offAxisDistance = Math.sqrt(
    (axis === 'x' ? 0 : (pointer.x - startPoint.x) ** 2) +
    (axis === 'y' ? 0 : (pointer.y - startPoint.y) ** 2) +
    (axis === 'z' ? 0 : (pointer.z - startPoint.z) ** 2)
  );
  if (offAxisDistance > tolerance) return undefined;

  const snapped = snapToGrid(pointer, gridSize);
  return {
    kind: 'axis',
    axis,
    point: vec(
      axis === 'x' ? snapped.x : startPoint.x,
      axis === 'y' ? snapped.y : startPoint.y,
      axis === 'z' ? snapped.z : startPoint.z
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

function snapPointsForEntity(entity: Entity): SnapPoint[] {
  if (entity.type === 'edge') return segmentSnapPoints(entity.id, entity.start, entity.end);
  if (entity.type === 'face') {
    return entity.vertices.flatMap((point, index) => segmentSnapPoints(entity.id, point, entity.vertices[(index + 1) % entity.vertices.length]));
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
    const unique = new Map<string, SnapPoint>();
    for (const [start, end] of edges) {
      for (const point of segmentSnapPoints(entity.id, start, end)) unique.set(`${point.kind}:${point.point.x}:${point.point.y}:${point.point.z}`, point);
    }
    return [...unique.values()];
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
