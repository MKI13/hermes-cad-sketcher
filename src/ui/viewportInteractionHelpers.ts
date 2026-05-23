import * as THREE from 'three';
import { distance, type Vec3, vec } from '../core/geometry';
import { entityBoundingBox, formatMillimeters, type BoxFaceName, type Entity, type EntityId, type SketchModel, type ToolName } from '../core/model';
import { type ToolState } from '../core/toolState';
import { type OrbitCameraState } from './viewportController';

const MIN_ZOOM_RADIUS = 150;
const MAX_ZOOM_RADIUS = 100000;
const WHEEL_STEP_FACTOR = 0.85;

export type CursorBadge = Readonly<{
  arrow: '↖';
  symbol: string;
  label: string;
}>;

export type SnapPointKind = 'endpoint' | 'midpoint';
export type SnapPoint = Readonly<{ entityId: EntityId; kind: SnapPointKind; point: Vec3 }>;
export type SnapResult = Readonly<({ point: Vec3; snapped: false } | { point: Vec3; snapped: true; entityId: EntityId; kind: SnapPointKind })>;
export type FaceSelection = Readonly<{ entityId: EntityId; face: BoxFaceName }>;

export function zoomOrbitTowardPoint(state: OrbitCameraState, focus: Vec3, wheelDeltaY: number): OrbitCameraState {
  const zoomSteps = Math.max(1, Math.min(6, Math.abs(wheelDeltaY) / 120));
  const ratio = wheelDeltaY < 0 ? WHEEL_STEP_FACTOR ** zoomSteps : (1 / WHEEL_STEP_FACTOR) ** zoomSteps;
  const nextRadius = clamp(state.radius * ratio, MIN_ZOOM_RADIUS, MAX_ZOOM_RADIUS);
  const appliedRatio = nextRadius / state.radius;
  return {
    ...state,
    radius: nextRadius,
    target: {
      x: focus.x + (state.target.x - focus.x) * appliedRatio,
      y: focus.y + (state.target.y - focus.y) * appliedRatio,
      z: focus.z + (state.target.z - focus.z) * appliedRatio
    }
  };
}

export function createOriginGuideGroup(length = 3000): THREE.Group {
  const group = new THREE.Group();
  group.name = 'origin-guides';
  group.add(createAxisLine('x-red', [new THREE.Vector3(-length, 2, 0), new THREE.Vector3(length, 2, 0)], 0xdc2626));
  group.add(createAxisLine('y-green', [new THREE.Vector3(0, 2, -length), new THREE.Vector3(0, 2, length)], 0x16a34a));
  group.add(createAxisLine('z-blue', [new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, length, 0)], 0x2563eb));
  const origin = new THREE.Mesh(new THREE.SphereGeometry(Math.max(18, length * 0.012), 16, 12), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
  origin.userData.axis = 'origin';
  group.add(origin);
  return group;
}

export function cursorBadgeForTool(tool: ToolName): CursorBadge {
  const badges: Record<ToolName, CursorBadge> = {
    select: { arrow: '↖', symbol: 'V', label: 'Auswahl' },
    line: { arrow: '↖', symbol: '╱', label: 'Linie' },
    rectangle: { arrow: '↖', symbol: '▭', label: 'Rechteck' },
    box: { arrow: '↖', symbol: '◻', label: 'Körper' },
    move: { arrow: '↖', symbol: '✥', label: 'Verschieben' },
    pushPull: { arrow: '↖', symbol: '↕', label: 'Push/Pull' },
    rotate: { arrow: '↖', symbol: '⟳', label: 'Drehen' },
    tape: { arrow: '↖', symbol: '↔', label: 'Maßband' }
  };
  return badges[tool];
}

export function formatDraftMeasurement(state: ToolState, tool: ToolName, point: Vec3): string | undefined {
  if (state.mode === 'drawing' && state.tool === tool) {
    if (tool === 'line') return `Linie: ${formatMillimeters(distance(state.pendingPoint, point))}`;
    if (tool === 'tape') return `Maßband: ${formatMillimeters(distance(state.pendingPoint, point))}`;
    if (tool === 'rectangle') {
      const width = Math.abs(point.x - state.pendingPoint.x);
      const depth = Math.abs(point.y - state.pendingPoint.y);
      return `Rechteck: ${formatMillimeters(width)} × ${formatMillimeters(depth)} · Fläche ${formatSquareMeters(width * depth)}`;
    }
  }

  if (state.mode === 'moving' && tool === 'move') {
    return `Verschieben: Δ ${formatMillimeters(point.x - state.pendingPoint.x)} / ${formatMillimeters(point.y - state.pendingPoint.y)} / ${formatMillimeters(point.z - state.pendingPoint.z)}`;
  }

  return undefined;
}

export function formatEntityMeasurement(entity: Entity): string {
  if (entity.type === 'edge') return `Linie: ${formatMillimeters(distance(entity.start, entity.end))}`;
  if (entity.type === 'face') {
    const box = entityBoundingBox(entity);
    const area = polygonAreaMm2(entity.vertices);
    return `Fläche: ${formatSquareMeters(area)} · ${formatMillimeters(box.size.x)} × ${formatMillimeters(box.size.y)}`;
  }
  if (entity.type === 'box') {
    return `Körper: ${formatMillimeters(entity.width)} × ${formatMillimeters(entity.depth)} × ${formatMillimeters(entity.height)}`;
  }
  const box = entityBoundingBox(entity);
  return `Referenzmesh: ${formatMillimeters(box.size.x)} × ${formatMillimeters(box.size.y)} × ${formatMillimeters(box.size.z)}`;
}

export function formatActiveMeasurement(input: { draft?: string; hovered?: string; selected?: string; last?: string }): string {
  return input.draft ?? input.hovered ?? input.selected ?? input.last ?? 'noch keine Messung';
}

export function collectSnapPoints(model: Pick<SketchModel, 'allEntities'>): SnapPoint[] {
  return model.allEntities().flatMap((entity) => snapPointsForEntity(entity));
}

export function snapPointToModel(point: Vec3, model: Pick<SketchModel, 'allEntities'>, tolerance = 35): SnapResult {
  let best: SnapPoint | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of collectSnapPoints(model)) {
    const currentDistance = distance(point, candidate.point);
    if (currentDistance < bestDistance) {
      best = candidate;
      bestDistance = currentDistance;
    }
  }
  if (!best || bestDistance > tolerance) return { point, snapped: false };
  return { point: best.point, snapped: true, entityId: best.entityId, kind: best.kind };
}

export function getFaceSelectionFromObject(object: THREE.Object3D | undefined): FaceSelection | undefined {
  let current: THREE.Object3D | null | undefined = object;
  let face: BoxFaceName | undefined;
  while (current) {
    if (!face && isBoxFaceName(current.userData.boxFace)) face = current.userData.boxFace;
    if (face && typeof current.userData.entityId === 'string') return { entityId: current.userData.entityId, face };
    current = current.parent;
  }
  return undefined;
}

export function faceSelectionLabel(selection?: FaceSelection): string {
  if (!selection) return 'Fläche: keine Körperfläche';
  const labels: Record<BoxFaceName, string> = {
    top: 'oben',
    bottom: 'unten',
    front: 'vorne',
    back: 'hinten',
    left: 'links',
    right: 'rechts'
  };
  return `Fläche ausgewählt: ${labels[selection.face]}`;
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

function isBoxFaceName(value: unknown): value is BoxFaceName {
  return value === 'top' || value === 'bottom' || value === 'front' || value === 'back' || value === 'left' || value === 'right';
}

function createAxisLine(axis: string, points: [THREE.Vector3, THREE.Vector3], color: number): THREE.Line {
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, linewidth: 2 }));
  line.userData.axis = axis;
  return line;
}

function polygonAreaMm2(vertices: Vec3[]): number {
  if (vertices.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum / 2);
}

function formatSquareMeters(squareMillimeters: number): string {
  return `${Number((squareMillimeters / 1_000_000).toFixed(3))} m²`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
