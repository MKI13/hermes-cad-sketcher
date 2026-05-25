import { add, bbox, distance, rotateAroundZ, scale, sub, type Vec3, vec } from './geometry';

export function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function assertPositiveBoxDimensions(width: number, depth: number, height: number): void {
  if (!isPositiveFinite(width) || !isPositiveFinite(depth) || !isPositiveFinite(height)) {
    throw new Error('Ein Körper braucht positive Breite, Tiefe und Höhe.');
  }
}

export function isAxisAlignedRectangleFace(vertices: Vec3[]): boolean {
  return rectangleFacePlane(vertices) !== undefined;
}

export type EntityId = string;
export type ComponentId = string;
export type DrawingPlane = 'xy' | 'xz' | 'yz';
export type MaterialAssignment = { name: string; color: string; previewUrl?: string; textureDataUrl?: string; textureFileName?: string };

type CadMetadata = { layer?: string; hidden?: boolean; material?: MaterialAssignment };
export type ToolName = 'select' | 'line' | 'rectangle' | 'box' | 'move' | 'pushPull' | 'rotate' | 'tape';

export type EdgeEntity = CadMetadata & { id: EntityId; type: 'edge'; start: Vec3; end: Vec3; componentId?: ComponentId };
export type FaceEntity = CadMetadata & { id: EntityId; type: 'face'; vertices: Vec3[]; componentId?: ComponentId };
export type ReferenceMeshEntity = CadMetadata & {
  id: EntityId;
  type: 'referenceMesh';
  name: string;
  triangles: Array<{ vertices: [Vec3, Vec3, Vec3] }>;
  triangleCount: number;
  rotationZ?: never;
  componentId?: ComponentId;
};
export type BoxFaceName = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';
export type BoxEntity = CadMetadata & {
  id: EntityId;
  type: 'box';
  origin: Vec3;
  width: number;
  depth: number;
  height: number;
  rotationZ: number;
  componentId?: ComponentId;
};
export type BoxDimensions = Pick<BoxEntity, 'width' | 'depth' | 'height'>;
export type Entity = EdgeEntity | FaceEntity | ReferenceMeshEntity | BoxEntity;

export type Component = {
  id: ComponentId;
  name: string;
  entityIds: EntityId[];
};

export type SketchModelSnapshot = {
  unit: 'mm';
  entities: Entity[];
  components: Component[];
};

let nextNumber = 1;
function nextId(prefix: string): string {
  return `${prefix}_${nextNumber++}`;
}

function bumpNextNumberPastSnapshot(snapshot: SketchModelSnapshot): void {
  const ids = [...snapshot.entities.map((entity) => entity.id), ...snapshot.components.map((component) => component.id)];
  const highest = ids.reduce((max, id) => {
    const match = /_(\d+)$/.exec(id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  nextNumber = Math.max(nextNumber, highest + 1);
}

export class SketchModel {
  readonly unit = 'mm' as const;
  private entities = new Map<EntityId, Entity>();
  private components = new Map<ComponentId, Component>();

  static fromSnapshot(snapshot: SketchModelSnapshot): SketchModel {
    const model = new SketchModel();
    for (const entity of snapshot.entities) model.entities.set(entity.id, structuredClone(entity));
    for (const component of snapshot.components) model.components.set(component.id, structuredClone(component));
    bumpNextNumberPastSnapshot(snapshot);
    return model;
  }

  snapshot(): SketchModelSnapshot {
    return {
      unit: this.unit,
      entities: [...this.entities.values()].map((entity) => structuredClone(entity)),
      components: [...this.components.values()].map((component) => structuredClone(component))
    };
  }

  allEntities(): Entity[] {
    return [...this.entities.values()];
  }

  allComponents(): Component[] {
    return [...this.components.values()];
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  createLine(start: Vec3, end: Vec3, metadata: CadMetadata = {}): EdgeEntity {
    if (distance(start, end) <= 0) throw new Error('Eine Linie braucht zwei verschiedene Punkte.');
    const entity: EdgeEntity = { id: nextId('edge'), type: 'edge', start, end, ...metadata };
    this.entities.set(entity.id, entity);
    return entity;
  }

  resizeLineLength(id: EntityId, lengthMm: number): EdgeEntity {
    if (!isPositiveFinite(lengthMm)) throw new Error('Eine Linie braucht eine positive Länge.');
    const entity = this.requireEntity(id);
    if (entity.type !== 'edge') throw new Error('Längenmaß braucht eine ausgewählte Linie.');
    const currentLength = distance(entity.start, entity.end);
    if (currentLength <= 0) throw new Error('Eine Linie braucht zwei verschiedene Punkte.');
    const direction = scale(sub(entity.end, entity.start), 1 / currentLength);
    const updated: EdgeEntity = { ...entity, end: add(entity.start, scale(direction, lengthMm)) };
    this.entities.set(id, updated);
    return updated;
  }

  createRectangle(origin: Vec3, width: number, depth: number, metadata: CadMetadata = {}, plane: DrawingPlane = 'xy'): FaceEntity {
    if (!isPositiveFinite(Math.abs(width)) || !isPositiveFinite(Math.abs(depth))) throw new Error('Ein Rechteck braucht eine Breite und Tiefe ungleich null.');
    const vertices = rectangleVertices(origin, width, depth, plane);
    const entity: FaceEntity = { id: nextId('face'), type: 'face', vertices, ...metadata };
    this.entities.set(entity.id, entity);
    return entity;
  }

  resizeRectangleFace(id: EntityId, width: number, depth: number): FaceEntity {
    if (!isPositiveFinite(width) || !isPositiveFinite(depth)) throw new Error('Ein Rechteck braucht positive Breite und Tiefe.');
    const entity = this.requireEntity(id);
    if (entity.type !== 'face') throw new Error('Rechteckmaß braucht eine ausgewählte Fläche.');
    const plane = rectangleFacePlane(entity.vertices);
    if (!plane) throw new Error('Rechteckmaß unterstützt nur axis-aligned Rechteckflächen.');
    const updated: FaceEntity = { ...entity, vertices: rectangleVertices(entity.vertices[0], width, depth, plane) };
    this.entities.set(id, updated);
    return updated;
  }

  extrudeFaceToBox(id: EntityId, height: number): BoxEntity {
    if (!isPositiveFinite(height)) throw new Error('Extrusion braucht eine positive Höhe.');
    const entity = this.requireEntity(id);
    if (entity.type !== 'face') throw new Error('Extrusion braucht eine ausgewählte Fläche.');
    const plane = rectangleFacePlane(entity.vertices);
    if (!plane) throw new Error('Extrusion unterstützt nur axis-aligned Rechteckflächen auf X/Y, X/Z oder Y/Z.');
    const box = bbox(entity.vertices);
    let origin: Vec3;
    let width: number;
    let depth: number;
    let boxHeight: number;
    if (plane === 'xz') {
      origin = vec(box.min.x, box.min.y, box.min.z);
      width = box.size.x;
      depth = height;
      boxHeight = box.size.z;
    } else if (plane === 'yz') {
      origin = vec(box.min.x, box.min.y, box.min.z);
      width = height;
      depth = box.size.y;
      boxHeight = box.size.z;
    } else {
      origin = box.min;
      width = box.size.x;
      depth = box.size.y;
      boxHeight = height;
    }
    if (width <= 0 || depth <= 0 || boxHeight <= 0) throw new Error('Extrusion braucht eine rechteckige Fläche mit positiver Breite und Tiefe.');
    const extruded: BoxEntity = {
      id: nextId('box'),
      type: 'box',
      origin,
      width,
      depth,
      height: boxHeight,
      rotationZ: 0,
      componentId: entity.componentId
    };
    this.entities.delete(id);
    this.entities.set(extruded.id, extruded);
    for (const component of [...this.components.values()]) {
      if (component.entityIds.includes(id)) {
        this.components.set(component.id, { ...component, entityIds: component.entityIds.map((entityId) => (entityId === id ? extruded.id : entityId)) });
      }
    }
    return extruded;
  }

  createBox(origin: Vec3, width: number, depth: number, height: number): BoxEntity {
    assertPositiveBoxDimensions(width, depth, height);
    const entity: BoxEntity = { id: nextId('box'), type: 'box', origin, width, depth, height, rotationZ: 0 };
    this.entities.set(entity.id, entity);
    return entity;
  }

  addReferenceMesh(name: string, triangles: ReferenceMeshEntity['triangles']): ReferenceMeshEntity {
    const clonedTriangles = structuredClone(triangles);
    if (clonedTriangles.length === 0 || !hasOwnArrayEntries(clonedTriangles) || !clonedTriangles.every(isValidReferenceMeshTriangle)) {
      throw new Error('Ein Referenzmesh braucht mindestens ein gültiges Dreieck mit finiten Koordinaten.');
    }
    const entity: ReferenceMeshEntity = { id: nextId('mesh'), type: 'referenceMesh', name, triangles: clonedTriangles, triangleCount: clonedTriangles.length };
    this.entities.set(entity.id, entity);
    return entity;
  }

  resizeBox(id: EntityId, dimensions: Partial<BoxDimensions>): BoxEntity {
    const entity = this.requireBox(id);
    const next = {
      width: dimensions.width ?? entity.width,
      depth: dimensions.depth ?? entity.depth,
      height: dimensions.height ?? entity.height
    };
    assertPositiveBoxDimensions(next.width, next.depth, next.height);
    const updated = { ...entity, ...next };
    this.entities.set(id, updated);
    return updated;
  }

  pushPullBoxFace(id: EntityId, deltaHeight: number): BoxEntity;
  pushPullBoxFace(id: EntityId, face: BoxFaceName, delta: number): BoxEntity;
  pushPullBoxFace(id: EntityId, faceOrDelta: BoxFaceName | number, maybeDelta?: number): BoxEntity {
    const entity = this.requireBox(id);
    const face = typeof faceOrDelta === 'number' ? 'top' : faceOrDelta;
    const delta = typeof faceOrDelta === 'number' ? faceOrDelta : maybeDelta ?? 0;
    const updated = pushPullBoxFaceSnapshot(entity, face, delta);
    this.entities.set(id, updated);
    return updated;
  }

  moveEntity(id: EntityId, delta: Vec3): Entity {
    const entity = this.requireEntity(id);
    let moved: Entity;
    if (entity.type === 'edge') moved = { ...entity, start: add(entity.start, delta), end: add(entity.end, delta) };
    else if (entity.type === 'face') moved = { ...entity, vertices: entity.vertices.map((v) => add(v, delta)) };
    else if (entity.type === 'referenceMesh') moved = { ...entity, triangles: entity.triangles.map((triangle) => ({ vertices: translateVertices(triangle.vertices, delta) })) };
    else moved = { ...entity, origin: add(entity.origin, delta) };
    this.entities.set(id, moved);
    return moved;
  }

  private rotateEntity(id: EntityId, angleRadians: number, origin = this.entityCenter(id)): Entity {
    const entity = this.requireEntity(id);
    return rotateEntitySnapshot(entity, angleRadians, origin);
  }

  rotateEntityZ(id: EntityId, angleRadians: number, origin = this.entityCenter(id)): Entity {
    const rotated = this.rotateEntity(id, angleRadians, origin);
    this.entities.set(id, rotated);
    return rotated;
  }

  deleteEntity(id: EntityId): boolean {
    if (!this.entities.has(id)) return false;
    this.entities.delete(id);
    for (const component of [...this.components.values()]) {
      const entityIds = component.entityIds.filter((entityId) => entityId !== id);
      if (entityIds.length === 0) this.components.delete(component.id);
      else if (entityIds.length !== component.entityIds.length) this.components.set(component.id, { ...component, entityIds });
    }
    return true;
  }

  hideEntity(id: EntityId): Entity {
    const entity = this.requireEntity(id);
    const hidden = { ...entity, hidden: true } as Entity;
    this.entities.set(id, hidden);
    return hidden;
  }

  showAllEntities(): number {
    let changed = 0;
    for (const [id, entity] of this.entities.entries()) {
      if (entity.hidden) {
        this.entities.set(id, { ...entity, hidden: false } as Entity);
        changed += 1;
      }
    }
    return changed;
  }

  applyMaterial(id: EntityId, material: MaterialAssignment): Entity {
    if (!material.name.trim()) throw new Error('Material braucht einen Namen.');
    if (!/^#[0-9a-f]{6}$/i.test(material.color)) throw new Error('Materialfarbe muss als #RRGGBB angegeben werden.');
    const entity = this.requireEntity(id);
    const painted = { ...entity, material: { ...material, name: material.name.trim() } } as Entity;
    this.entities.set(id, painted);
    return painted;
  }

  createComponent(name: string, entityIds: EntityId[]): Component {
    if (entityIds.length === 0) throw new Error('Eine Komponente braucht mindestens ein Element.');
    for (const id of entityIds) this.requireEntity(id);
    const component: Component = { id: nextId('component'), name, entityIds: [...entityIds] };
    this.components.set(component.id, component);
    for (const id of entityIds) {
      for (const existing of [...this.components.values()]) {
        if (existing.id === component.id || !existing.entityIds.includes(id)) continue;
        const remainingIds = existing.entityIds.filter((entityId) => entityId !== id);
        if (remainingIds.length === 0) this.components.delete(existing.id);
        else this.components.set(existing.id, { ...existing, entityIds: remainingIds });
      }
      const entity = this.requireEntity(id);
      this.entities.set(id, { ...entity, componentId: component.id } as Entity);
    }
    return component;
  }

  duplicateComponent(id: ComponentId, name: string, offset: Vec3 = vec(0, 0, 0)): Component {
    const source = this.requireComponent(id);
    const copiedIds: EntityId[] = [];
    for (const entityId of source.entityIds) {
      const entity = this.requireEntity(entityId);
      let copy: Entity;
      if (entity.type === 'edge') {
        copy = { ...entity, id: nextId('edge'), start: add(entity.start, offset), end: add(entity.end, offset), componentId: undefined };
      } else if (entity.type === 'face') {
        copy = { ...entity, id: nextId('face'), vertices: entity.vertices.map((vertex) => add(vertex, offset)), componentId: undefined };
      } else if (entity.type === 'referenceMesh') {
        copy = { ...entity, id: nextId('mesh'), triangles: entity.triangles.map((triangle) => ({ vertices: translateVertices(triangle.vertices, offset) })), componentId: undefined };
      } else if (entity.type === 'box') {
        copy = { ...entity, id: nextId('box'), origin: add(entity.origin, offset), componentId: undefined };
      } else {
        const exhaustive: never = entity;
        throw new Error(`Elementtyp kann nicht dupliziert werden: ${String(exhaustive)}`);
      }
      copiedIds.push(copy.id);
      this.entities.set(copy.id, copy);
    }
    return this.createComponent(name, copiedIds);
  }

  measure(a: Vec3, b: Vec3): number {
    return distance(a, b);
  }

  entityCenter(id: EntityId): Vec3 {
    const entity = this.requireEntity(id);
    const points = entityPoints(entity);
    const box = bbox(points);
    return add(box.min, { x: box.size.x / 2, y: box.size.y / 2, z: box.size.z / 2 });
  }

  private requireEntity(id: EntityId): Entity {
    const entity = this.entities.get(id);
    if (!entity) throw new Error(`Element nicht gefunden: ${id}`);
    return entity;
  }

  private requireComponent(id: ComponentId): Component {
    const component = this.components.get(id);
    if (!component) throw new Error(`Komponente nicht gefunden: ${id}`);
    return component;
  }

  private requireBox(id: EntityId): BoxEntity {
    const entity = this.requireEntity(id);
    if (entity.type !== 'box') throw new Error('Push/Pull ist im MVP nur für Körper aktiv.');
    return entity;
  }
}

function rectangleFacePlane(vertices: Vec3[]): DrawingPlane | undefined {
  if (vertices.length !== 4) return undefined;
  if (vertices.some((vertex) => !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || !Number.isFinite(vertex.z))) return undefined;
  const box = bbox(vertices);
  const constantAxes = [
    { axis: 'x' as const, size: box.size.x },
    { axis: 'y' as const, size: box.size.y },
    { axis: 'z' as const, size: box.size.z }
  ].filter(({ size }) => Math.abs(size) <= 1e-6);
  if (constantAxes.length !== 1) return undefined;
  const constantAxis = constantAxes[0].axis;
  const plane: DrawingPlane = constantAxis === 'z' ? 'xy' : constantAxis === 'y' ? 'xz' : 'yz';
  const variableAxes = plane === 'xy' ? ['x', 'y'] as const : plane === 'xz' ? ['x', 'z'] as const : ['y', 'z'] as const;
  const minA = box.min[variableAxes[0]];
  const maxA = box.max[variableAxes[0]];
  const minB = box.min[variableAxes[1]];
  const maxB = box.max[variableAxes[1]];
  if (!isPositiveFinite(maxA - minA) || !isPositiveFinite(maxB - minB)) return undefined;

  const corners = new Set(vertices.map((vertex) => cornerKey(vertex[variableAxes[0]], vertex[variableAxes[1]])));
  if (corners.size !== 4) return undefined;
  const expected = [cornerKey(minA, minB), cornerKey(maxA, minB), cornerKey(maxA, maxB), cornerKey(minA, maxB)];
  if (!expected.every((corner) => corners.has(corner))) return undefined;

  const edgesAreAxisAligned = vertices.every((vertex, index) => {
    const next = vertices[(index + 1) % vertices.length];
    const sameA = Math.abs(vertex[variableAxes[0]] - next[variableAxes[0]]) <= 1e-6;
    const sameB = Math.abs(vertex[variableAxes[1]] - next[variableAxes[1]]) <= 1e-6;
    const changedA = Math.abs(vertex[variableAxes[0]] - next[variableAxes[0]]) > 1e-6;
    const changedB = Math.abs(vertex[variableAxes[1]] - next[variableAxes[1]]) > 1e-6;
    return (sameA && changedB) || (sameB && changedA);
  });
  return edgesAreAxisAligned ? plane : undefined;
}

function cornerKey(a: number, b: number): string {
  return `${a.toFixed(6)},${b.toFixed(6)}`;
}

function pushPullBoxFaceSnapshot(entity: BoxEntity, face: BoxFaceName, delta: number): BoxEntity {
  if (!Number.isFinite(delta)) throw new Error('Push/Pull braucht eine positive Höhe.');
  const previousCenter = boxLocalCenter(entity);
  const next = { ...entity };
  if (face === 'top') next.height += delta;
  if (face === 'bottom') {
    next.origin = add(next.origin, vec(0, 0, -delta));
    next.height += delta;
  }
  if (face === 'right' || face === 'left') next.width += delta;
  if (face === 'front' || face === 'back') next.depth += delta;
  assertPositiveBoxDimensions(next.width, next.depth, next.height);
  const centerShift = pushPullCenterShift(entity.rotationZ, face, delta);
  if (centerShift) {
    const nextCenter = add(previousCenter, centerShift);
    next.origin = vec(nextCenter.x - next.width / 2, nextCenter.y - next.depth / 2, next.origin.z);
  }
  return next;
}

function boxLocalCenter(entity: BoxEntity): Vec3 {
  return add(entity.origin, vec(entity.width / 2, entity.depth / 2, entity.height / 2));
}

function pushPullCenterShift(rotationZ: number, face: BoxFaceName, delta: number): Vec3 | undefined {
  if (face === 'right') return localOffset(rotationZ, delta / 2, 0);
  if (face === 'left') return localOffset(rotationZ, -delta / 2, 0);
  if (face === 'front') return localOffset(rotationZ, 0, delta / 2);
  if (face === 'back') return localOffset(rotationZ, 0, -delta / 2);
  return undefined;
}

function localOffset(rotationZ: number, x: number, y: number): Vec3 {
  return rotateAroundZ(vec(x, y, 0), rotationZ, vec(0, 0, 0));
}

function rectangleVertices(origin: Vec3, width: number, depth: number, plane: DrawingPlane): Vec3[] {
  if (plane === 'xz') {
    return [origin, add(origin, vec(width, 0, 0)), add(origin, vec(width, 0, depth)), add(origin, vec(0, 0, depth))];
  }
  if (plane === 'yz') {
    return [origin, add(origin, vec(0, width, 0)), add(origin, vec(0, width, depth)), add(origin, vec(0, 0, depth))];
  }
  return [origin, add(origin, vec(width, 0, 0)), add(origin, vec(width, depth, 0)), add(origin, vec(0, depth, 0))];
}

function translateVertices(vertices: [Vec3, Vec3, Vec3], delta: Vec3): [Vec3, Vec3, Vec3] {
  return [add(vertices[0], delta), add(vertices[1], delta), add(vertices[2], delta)];
}

function isValidReferenceMeshTriangle(triangle: ReferenceMeshEntity['triangles'][number]): boolean {
  return Boolean(triangle) && Array.isArray(triangle.vertices) && triangle.vertices.length === 3 &&
    [0, 1, 2].every((index) => Object.hasOwn(triangle.vertices, index) && isFiniteVec3(triangle.vertices[index])) &&
    triangleAreaMagnitude(triangle.vertices) > 1e-9;
}

function triangleAreaMagnitude(vertices: [Vec3, Vec3, Vec3]): number {
  return distance(vec(0, 0, 0), crossProduct(sub(vertices[1], vertices[0]), sub(vertices[2], vertices[0]))) / 2;
}

function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return vec(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

function hasOwnArrayEntries<T>(values: T[]): boolean {
  return Array.from({ length: values.length }, (_value, index) => Object.hasOwn(values, index)).every(Boolean);
}

function isFiniteVec3(point: Vec3 | undefined): boolean {
  if (point === undefined) return false;
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

function rotateEntitySnapshot(entity: Entity, angleRadians: number, origin: Vec3): Entity {
  if (entity.type === 'edge') return { ...entity, start: rotateAroundZ(entity.start, angleRadians, origin), end: rotateAroundZ(entity.end, angleRadians, origin) };
  if (entity.type === 'face') return { ...entity, vertices: entity.vertices.map((v) => rotateAroundZ(v, angleRadians, origin)) };
  if (entity.type === 'referenceMesh') return { ...entity, triangles: entity.triangles.map((triangle) => ({ vertices: rotateVertices(triangle.vertices, angleRadians, origin) })) };
  const rotatedOrigin = rotateAroundZ(entity.origin, angleRadians, origin);
  const centerOffset = rotateAroundZ(vec(entity.width / 2, entity.depth / 2, 0), angleRadians, vec(0, 0, 0));
  const nextCenter = add(rotatedOrigin, centerOffset);
  return { ...entity, origin: add(nextCenter, vec(-entity.width / 2, -entity.depth / 2, 0)), rotationZ: entity.rotationZ + angleRadians };
}

function rotateVertices(vertices: [Vec3, Vec3, Vec3], angleRadians: number, origin: Vec3): [Vec3, Vec3, Vec3] {
  return [
    rotateAroundZ(vertices[0], angleRadians, origin),
    rotateAroundZ(vertices[1], angleRadians, origin),
    rotateAroundZ(vertices[2], angleRadians, origin)
  ];
}

export function boxWorldPoints(entity: BoxEntity): Vec3[] {
  const localPoints = [
    vec(0, 0, 0),
    vec(entity.width, 0, 0),
    vec(entity.width, entity.depth, 0),
    vec(0, entity.depth, 0),
    vec(0, 0, entity.height),
    vec(entity.width, 0, entity.height),
    vec(entity.width, entity.depth, entity.height),
    vec(0, entity.depth, entity.height)
  ];
  const center = add(entity.origin, vec(entity.width / 2, entity.depth / 2, 0));
  return localPoints.map((point) => rotateAroundZ(add(entity.origin, point), entity.rotationZ, center));
}

export function entityPoints(entity: Entity): Vec3[] {
  if (entity.type === 'edge') return [entity.start, entity.end];
  if (entity.type === 'face') return entity.vertices;
  if (entity.type === 'referenceMesh') return entity.triangles.flatMap((triangle) => triangle.vertices);
  return boxWorldPoints(entity);
}

export function entityBoundingBox(entity: Entity) {
  return bbox(entityPoints(entity));
}

export function formatMillimeters(value: number): string {
  return `${Number(value.toFixed(2))} mm`;
}

export function deltaBetween(a: Vec3, b: Vec3): Vec3 {
  return sub(b, a);
}
