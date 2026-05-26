import * as THREE from 'three';
import { distance, type Vec3, vec } from '../core/geometry';
import { findSnapPoint, type SnapResult as CoreSnapResult } from '../core/snapping';
import { entityBoundingBox, formatMillimeters, isAxisAlignedRectangleFace, isPositiveFinite, previewPushPullBoxFace, type BoxEntity, type BoxFaceName, type Entity, type EntityId, type FaceEntity, type SketchModel, type ToolName } from '../core/model';
import { type ToolState } from '../core/toolState';
import { type MouseAction } from './mouseBindings';
import { type OrbitCameraState } from './viewportController';
import { type FloatingWindowId } from './workspaceMenuRouting';

const MIN_ZOOM_RADIUS = 150;
const MAX_ZOOM_RADIUS = 100000;
const WHEEL_STEP_FACTOR = 0.85;

export type SnapPointKind = 'endpoint' | 'midpoint' | 'axis:x' | 'axis:y' | 'axis:z';
export type SnapPoint = Readonly<{ entityId: EntityId; kind: Exclude<SnapPointKind, `axis:${string}`>; point: Vec3 }>;
export type SnapResult = Readonly<({ point: Vec3; snapped: false } | { point: Vec3; snapped: true; entityId: EntityId; kind: Exclude<SnapPointKind, `axis:${string}`> })>;
export type FaceSelection = Readonly<{ entityId: EntityId; face: BoxFaceName }>;
export type ViewportEntityAction = 'entityInfo' | 'erase' | 'hide' | 'makeGroup' | 'makeComponent' | 'area';
export type ViewportContextMenuCommand =
  | Readonly<{ type: 'mouseAction'; action: MouseAction }>
  | Readonly<{ type: 'openWindow'; windowId: FloatingWindowId }>
  | Readonly<{ type: 'entityAction'; action: ViewportEntityAction }>;
export type ViewportContextMenuItem = Readonly<{ label: string; command: ViewportContextMenuCommand }>;
export type PushPullPreviewResult =
  | Readonly<{ ok: true; entity: BoxEntity; sourceEntityId: EntityId; delta: number }>
  | Readonly<{ ok: false; error: string }>;

export function createPushPullPreview(model: Pick<SketchModel, 'getEntity'>, selection: { entityId: EntityId; face?: BoxFaceName }, delta: number): PushPullPreviewResult {
  if (!Number.isFinite(delta) || delta === 0) return { ok: false, error: 'Push/Pull braucht eine Distanz ungleich 0 mm.' };
  const entity = model.getEntity(selection.entityId);
  if (!entity) return { ok: false, error: 'Push/Pull braucht eine ausgewählte Fläche oder einen Körper.' };

  try {
    if (entity.type === 'box') {
      return { ok: true, entity: previewPushPullBoxFace(entity, selection.face ?? 'top', delta), sourceEntityId: entity.id, delta };
    }
    if (entity.type === 'face') {
      if (delta <= 0) return { ok: false, error: 'Push/Pull-Flächenextrusion braucht eine positive Distanz.' };
      return { ok: true, entity: previewFaceExtrusion(entity, delta), sourceEntityId: entity.id, delta };
    }
  } catch (error) {
    const message = error instanceof Error && error.message.includes('positive Breite, Tiefe und Höhe')
      ? 'Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.'
      : error instanceof Error
        ? error.message
        : 'Push/Pull-Vorschau konnte nicht erstellt werden.';
    return { ok: false, error: message };
  }

  return { ok: false, error: 'Push/Pull braucht eine ausgewählte Fläche oder einen Körper.' };
}

export function pushPullPreviewMeasurement(entity: BoxEntity, delta: number): string {
  return `Push/Pull-Vorschau: ${formatMillimeters(delta)} · ${formatEntityMeasurement(entity)}`;
}

export function buildViewportContextMenuItems(input: { selectedEntityType?: Entity['type'] }): ViewportContextMenuItem[] {
  const items: ViewportContextMenuItem[] = [
    { label: 'Auswahl-Werkzeug', command: { type: 'mouseAction', action: 'tool:select' } },
    { label: 'Linie zeichnen', command: { type: 'mouseAction', action: 'tool:line' } },
    { label: 'Rechteck zeichnen', command: { type: 'mouseAction', action: 'tool:rectangle' } },
    { label: 'Körper setzen', command: { type: 'mouseAction', action: 'tool:box' } },
    { label: 'Maßband', command: { type: 'mouseAction', action: 'tool:tape' } },
    { label: 'Verlauf und Auswahl', command: { type: 'openWindow', windowId: 'history' } }
  ];

  if (!input.selectedEntityType) return items;

  items.push(
    { label: 'Entity Info', command: { type: 'entityAction', action: 'entityInfo' } },
    { label: 'Erase', command: { type: 'entityAction', action: 'erase' } },
    { label: 'Hide', command: { type: 'entityAction', action: 'hide' } },
    { label: 'Make Group', command: { type: 'entityAction', action: 'makeGroup' } },
    { label: 'Make Component', command: { type: 'entityAction', action: 'makeComponent' } },
    { label: 'Area', command: { type: 'entityAction', action: 'area' } },
    { label: 'Auswahl verschieben', command: { type: 'openWindow', windowId: 'move' } },
    { label: 'Auswahl drehen', command: { type: 'openWindow', windowId: 'rotate' } },
    { label: 'Inspektor öffnen', command: { type: 'openWindow', windowId: 'inspector' } }
  );

  if (input.selectedEntityType === 'box') {
    items.push(
      { label: 'Körperhöhe ziehen', command: { type: 'openWindow', windowId: 'pushPull' } },
      { label: 'Körpermaße bearbeiten', command: { type: 'openWindow', windowId: 'dimensions' } }
    );
  }

  if (input.selectedEntityType === 'face') {
    items.push({ label: 'Fläche extrudieren', command: { type: 'openWindow', windowId: 'extrude' } });
  }

  items.push({ label: 'Auswahl löschen', command: { type: 'mouseAction', action: 'delete' } });
  return items;
}

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

export function createWorkspaceGrid(size = 20000, divisions = 200): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, divisions, 0x64748b, 0xcbd5e1);
  grid.userData.size = size;
  grid.userData.divisions = divisions;
  return grid;
}

export function createOriginGuideGroup(length = 3000): THREE.Group {
  const group = new THREE.Group();
  group.name = 'origin-guides';
  group.add(createAxisLine('x-positive', [new THREE.Vector3(0, 2, 0), new THREE.Vector3(length, 2, 0)], 0xdc2626, 'solid'));
  group.add(createAxisLine('x-negative', [new THREE.Vector3(0, 2, 0), new THREE.Vector3(-length, 2, 0)], 0xdc2626, 'dashed'));
  group.add(createAxisLine('y-positive', [new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 2, length)], 0x16a34a, 'solid'));
  group.add(createAxisLine('y-negative', [new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 2, -length)], 0x16a34a, 'dashed'));
  group.add(createAxisLine('z-positive', [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0)], 0x2563eb, 'solid'));
  group.add(createAxisLine('z-negative', [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -length, 0)], 0x2563eb, 'dashed'));
  return group;
}

export function snapCueLabel(kind: SnapPointKind): 'Endpoint' | 'Midpoint' | 'Achse X' | 'Achse Y' | 'Achse Z' {
  if (kind === 'endpoint') return 'Endpoint';
  if (kind === 'midpoint') return 'Midpoint';
  if (kind === 'axis:x') return 'Achse X';
  if (kind === 'axis:y') return 'Achse Y';
  return 'Achse Z';
}

export function findViewportSnapPoint(input: {
  model: Pick<SketchModel, 'allEntities'>;
  pointer: Vec3;
  toolState: ToolState;
  activeTool: ToolName;
  gridSize?: number;
  tolerance?: number;
}): CoreSnapResult {
  const startPoint = input.toolState.mode === 'drawing' && input.toolState.tool === input.activeTool
    ? input.toolState.pendingPoint
    : undefined;
  return findSnapPoint({
    model: input.model,
    pointer: input.pointer,
    gridSize: input.gridSize,
    tolerance: input.tolerance,
    startPoint
  });
}

export function formatDraftMeasurement(state: ToolState, tool: ToolName, point: Vec3): string | undefined {
  if (state.mode === 'drawing' && state.tool === tool) {
    if (tool === 'line') return `Linie: ${formatMillimeters(distance(state.pendingPoint, point))}`;
    if (tool === 'tape') return `Maßband: ${formatMillimeters(distance(state.pendingPoint, point))}`;
    if (tool === 'rectangle') {
      const width = Math.abs(state.plane === 'yz' ? point.y - state.pendingPoint.y : point.x - state.pendingPoint.x);
      const depth = Math.abs(state.plane === 'xy' ? point.y - state.pendingPoint.y : point.z - state.pendingPoint.z);
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
    const area = polygonAreaMm2(entity.vertices);
    const width = entity.vertices.length >= 2 ? distance(entity.vertices[0], entity.vertices[1]) : 0;
    const depth = entity.vertices.length >= 3 ? distance(entity.vertices[1], entity.vertices[2]) : 0;
    return `Fläche: ${formatSquareMeters(area)} · ${formatMillimeters(width)} × ${formatMillimeters(depth)}`;
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

function previewFaceExtrusion(entity: FaceEntity, height: number): BoxEntity {
  if (!isAxisAlignedRectangleFace(entity.vertices)) throw new Error('Push/Pull unterstützt im MVP nur axis-aligned Rechteckflächen oder Körperseiten.');
  const box = entityBoundingBox(entity);
  const zSize = box.size.z;
  const xSize = box.size.x;
  const ySize = box.size.y;
  const width = zSize > 0 && xSize === 0 ? Math.abs(height) : xSize;
  const depth = zSize > 0 && ySize === 0 ? Math.abs(height) : ySize;
  const boxHeight = zSize > 0 ? zSize : Math.abs(height);

  if (!isPositiveFinite(width) || !isPositiveFinite(depth) || !isPositiveFinite(boxHeight)) {
    throw new Error('Extrusion braucht eine rechteckige Fläche mit positiver Breite und Tiefe.');
  }
  return { id: entity.id, type: 'box', origin: box.min, width, depth, height: boxHeight, rotationZ: 0, componentId: entity.componentId };
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

function createAxisLine(axis: string, points: [THREE.Vector3, THREE.Vector3], color: number, style: 'solid' | 'dashed'): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = style === 'solid'
    ? new THREE.LineBasicMaterial({ color, linewidth: 2 })
    : new THREE.LineDashedMaterial({ color, dashSize: 140, gapSize: 90, linewidth: 2 });
  const line = new THREE.Line(geometry, material);
  if (style === 'dashed') line.computeLineDistances();
  line.userData.axis = axis;
  return line;
}

function polygonAreaMm2(vertices: Vec3[]): number {
  if (vertices.length < 3) return 0;
  let areaVector = vec(0, 0, 0);
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    areaVector = vec(
      areaVector.x + current.y * next.z - current.z * next.y,
      areaVector.y + current.z * next.x - current.x * next.z,
      areaVector.z + current.x * next.y - current.y * next.x
    );
  }
  return Math.sqrt(areaVector.x ** 2 + areaVector.y ** 2 + areaVector.z ** 2) / 2;
}

function formatSquareMeters(squareMillimeters: number): string {
  return `${Number((squareMillimeters / 1_000_000).toFixed(3))} m²`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
