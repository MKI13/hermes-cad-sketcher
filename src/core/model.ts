import { add, bbox, distance, rotateAroundZ, sub, type Vec3, vec } from './geometry';

export function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function assertPositiveBoxDimensions(width: number, depth: number, height: number): void {
  if (!isPositiveFinite(width) || !isPositiveFinite(depth) || !isPositiveFinite(height)) {
    throw new Error('Ein Körper braucht positive Breite, Tiefe und Höhe.');
  }
}

export function isAxisAlignedRectangleFace(vertices: Vec3[]): boolean {
  if (vertices.length !== 4) return false;
  if (vertices.some((vertex) => !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || !Number.isFinite(vertex.z))) return false;
  const z = vertices[0].z;
  if (vertices.some((vertex) => Math.abs(vertex.z - z) > 1e-6)) return false;
  const box = bbox(vertices);
  if (!isPositiveFinite(box.size.x) || !isPositiveFinite(box.size.y)) return false;
  const expectedCorners = [
    vec(box.min.x, box.min.y, z),
    vec(box.max.x, box.min.y, z),
    vec(box.max.x, box.max.y, z),
    vec(box.min.x, box.max.y, z)
  ];
  const corners = new Set(vertices.map((vertex) => `${vertex.x.toFixed(6)},${vertex.y.toFixed(6)}`));
  if (corners.size !== 4) return false;
  if (!expectedCorners.every((corner) => corners.has(`${corner.x.toFixed(6)},${corner.y.toFixed(6)}`))) return false;

  return vertices.every((vertex, index) => {
    const next = vertices[(index + 1) % vertices.length];
    return (Math.abs(vertex.x - next.x) <= 1e-6 && Math.abs(vertex.y - next.y) > 1e-6) || (Math.abs(vertex.y - next.y) <= 1e-6 && Math.abs(vertex.x - next.x) > 1e-6);
  });
}

export type EntityId = string;
export type ComponentId = string;

type CadMetadata = { layer?: string };
export type ToolName = 'select' | 'line' | 'rectangle' | 'box' | 'move' | 'pushPull' | 'rotate' | 'tape';

export type EdgeEntity = CadMetadata & { id: EntityId; type: 'edge'; start: Vec3; end: Vec3; componentId?: ComponentId };
export type FaceEntity = CadMetadata & { id: EntityId; type: 'face'; vertices: Vec3[]; componentId?: ComponentId };
export type ReferenceMeshEntity = {
  id: EntityId;
  type: 'referenceMesh';
  name: string;
  triangles: Array<{ vertices: [Vec3, Vec3, Vec3] }>;
  triangleCount: number;
  rotationZ?: never;
  componentId?: ComponentId;
};
export type BoxEntity = {
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

export class SketchModel {
  readonly unit = 'mm' as const;
  private entities = new Map<EntityId, Entity>();
  private components = new Map<ComponentId, Component>();

  static fromSnapshot(snapshot: SketchModelSnapshot): SketchModel {
    const model = new SketchModel();
    for (const entity of snapshot.entities) model.entities.set(entity.id, structuredClone(entity));
    for (const component of snapshot.components) model.components.set(component.id, structuredClone(component));
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

  createRectangle(origin: Vec3, width: number, depth: number, metadata: CadMetadata = {}): FaceEntity {
    if (width <= 0 || depth <= 0) throw new Error('Ein Rechteck braucht positive Breite und Tiefe.');
    const vertices = [origin, add(origin, vec(width, 0, 0)), add(origin, vec(width, depth, 0)), add(origin, vec(0, depth, 0))];
    const entity: FaceEntity = { id: nextId('face'), type: 'face', vertices, ...metadata };
    this.entities.set(entity.id, entity);
    return entity;
  }

  extrudeFaceToBox(id: EntityId, height: number): BoxEntity {
    if (!isPositiveFinite(height)) throw new Error('Extrusion braucht eine positive Höhe.');
    const entity = this.requireEntity(id);
    if (entity.type !== 'face') throw new Error('Extrusion braucht eine ausgewählte Fläche.');
    if (!isAxisAlignedRectangleFace(entity.vertices)) throw new Error('Extrusion unterstützt im MVP nur axis-aligned Rechteckflächen.');
    const box = bbox(entity.vertices);
    if (box.size.x <= 0 || box.size.y <= 0) throw new Error('Extrusion braucht eine rechteckige Fläche mit positiver Breite und Tiefe.');
    const extruded: BoxEntity = {
      id: nextId('box'),
      type: 'box',
      origin: box.min,
      width: box.size.x,
      depth: box.size.y,
      height,
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
    if (triangles.length === 0) throw new Error('Ein Referenzmesh braucht mindestens ein Dreieck.');
    const entity: ReferenceMeshEntity = { id: nextId('mesh'), type: 'referenceMesh', name, triangles: structuredClone(triangles), triangleCount: triangles.length };
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

  pushPullBoxFace(id: EntityId, deltaHeight: number): BoxEntity {
    const entity = this.requireBox(id);
    const nextHeight = entity.height + deltaHeight;
    if (!isPositiveFinite(nextHeight)) throw new Error('Push/Pull braucht eine positive Höhe.');
    const updated = { ...entity, height: nextHeight };
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

  createComponent(name: string, entityIds: EntityId[]): Component {
    if (entityIds.length === 0) throw new Error('Eine Komponente braucht mindestens ein Element.');
    for (const id of entityIds) this.requireEntity(id);
    const component: Component = { id: nextId('component'), name, entityIds: [...entityIds] };
    this.components.set(component.id, component);
    for (const id of entityIds) {
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

function translateVertices(vertices: [Vec3, Vec3, Vec3], delta: Vec3): [Vec3, Vec3, Vec3] {
  return [add(vertices[0], delta), add(vertices[1], delta), add(vertices[2], delta)];
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

export function entityPoints(entity: Entity): Vec3[] {
  if (entity.type === 'edge') return [entity.start, entity.end];
  if (entity.type === 'face') return entity.vertices;
  if (entity.type === 'referenceMesh') return entity.triangles.flatMap((triangle) => triangle.vertices);
  const { origin, width, depth, height } = entity;
  return [
    origin,
    add(origin, vec(width, 0, 0)),
    add(origin, vec(width, depth, 0)),
    add(origin, vec(0, depth, 0)),
    add(origin, vec(0, 0, height)),
    add(origin, vec(width, 0, height)),
    add(origin, vec(width, depth, height)),
    add(origin, vec(0, depth, height))
  ];
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
