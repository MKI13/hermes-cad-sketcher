import { add, bbox, distance, rotateAroundZ, sub, type Vec3, vec } from './geometry';

export type EntityId = string;
export type ComponentId = string;
export type ToolName = 'select' | 'line' | 'rectangle' | 'box' | 'move' | 'pushPull' | 'rotate' | 'tape';

export type EdgeEntity = { id: EntityId; type: 'edge'; start: Vec3; end: Vec3; componentId?: ComponentId };
export type FaceEntity = { id: EntityId; type: 'face'; vertices: Vec3[]; componentId?: ComponentId };
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
export type Entity = EdgeEntity | FaceEntity | BoxEntity;

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

  createLine(start: Vec3, end: Vec3): EdgeEntity {
    if (distance(start, end) <= 0) throw new Error('Eine Linie braucht zwei verschiedene Punkte.');
    const entity: EdgeEntity = { id: nextId('edge'), type: 'edge', start, end };
    this.entities.set(entity.id, entity);
    return entity;
  }

  createRectangle(origin: Vec3, width: number, depth: number): FaceEntity {
    if (width <= 0 || depth <= 0) throw new Error('Ein Rechteck braucht positive Breite und Tiefe.');
    const vertices = [origin, add(origin, vec(width, 0, 0)), add(origin, vec(width, depth, 0)), add(origin, vec(0, depth, 0))];
    const entity: FaceEntity = { id: nextId('face'), type: 'face', vertices };
    this.entities.set(entity.id, entity);
    return entity;
  }

  createBox(origin: Vec3, width: number, depth: number, height: number): BoxEntity {
    if (width <= 0 || depth <= 0 || height <= 0) throw new Error('Ein Körper braucht positive Breite, Tiefe und Höhe.');
    const entity: BoxEntity = { id: nextId('box'), type: 'box', origin, width, depth, height, rotationZ: 0 };
    this.entities.set(entity.id, entity);
    return entity;
  }

  pushPullBoxFace(id: EntityId, deltaHeight: number): BoxEntity {
    const entity = this.requireBox(id);
    const nextHeight = entity.height + deltaHeight;
    if (nextHeight <= 0) throw new Error('Push/Pull darf die Höhe nicht auf null oder negativ setzen.');
    const updated = { ...entity, height: nextHeight };
    this.entities.set(id, updated);
    return updated;
  }

  moveEntity(id: EntityId, delta: Vec3): Entity {
    const entity = this.requireEntity(id);
    let moved: Entity;
    if (entity.type === 'edge') moved = { ...entity, start: add(entity.start, delta), end: add(entity.end, delta) };
    else if (entity.type === 'face') moved = { ...entity, vertices: entity.vertices.map((v) => add(v, delta)) };
    else moved = { ...entity, origin: add(entity.origin, delta) };
    this.entities.set(id, moved);
    return moved;
  }

  rotateEntityZ(id: EntityId, angleRadians: number, origin = this.entityCenter(id)): Entity {
    const entity = this.requireEntity(id);
    let rotated: Entity;
    if (entity.type === 'edge') rotated = { ...entity, start: rotateAroundZ(entity.start, angleRadians, origin), end: rotateAroundZ(entity.end, angleRadians, origin) };
    else if (entity.type === 'face') rotated = { ...entity, vertices: entity.vertices.map((v) => rotateAroundZ(v, angleRadians, origin)) };
    else {
      const rotatedOrigin = rotateAroundZ(entity.origin, angleRadians, origin);
      const centerOffset = rotateAroundZ(vec(entity.width / 2, entity.depth / 2, 0), angleRadians, vec(0, 0, 0));
      const nextCenter = add(rotatedOrigin, centerOffset);
      rotated = { ...entity, origin: add(nextCenter, vec(-entity.width / 2, -entity.depth / 2, 0)), rotationZ: entity.rotationZ + angleRadians };
    }
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
      } else {
        copy = { ...entity, id: nextId('box'), origin: add(entity.origin, offset), componentId: undefined };
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

export function entityPoints(entity: Entity): Vec3[] {
  if (entity.type === 'edge') return [entity.start, entity.end];
  if (entity.type === 'face') return entity.vertices;
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
