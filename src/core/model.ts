import { add, bbox, distance, rotateAroundZ, scale, sub, type Vec3, vec } from './geometry';
import { defaultMaterialId, defaultMaterials, materialById, normalizeMaterialCatalog, type MaterialDefinition, type MaterialId } from './materials';
import { defaultTagId, defaultTags, normalizeTags, type TagDefinition, type TagId } from './tags';

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
export type ComponentDefinitionId = string;
export type ComponentInstanceId = string;
export type DrawingPlane = 'xy' | 'xz' | 'yz';
export type MaterialAssignment = { materialId?: MaterialId; name?: string; color?: string; previewUrl?: string; textureDataUrl?: string; textureFileName?: string };

type CadMetadata = { layer?: string; hidden?: boolean; tagId?: TagId; materialId?: MaterialId; material?: MaterialAssignment };
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
export type EditContext = Readonly<{ type: 'root' } | { type: 'component'; componentId: ComponentId }>;
export type SelectionTarget = Readonly<
  | { type: 'entity'; entityId: EntityId }
  | { type: 'component'; componentId: ComponentId; hitEntityId: EntityId }
>;

export type Component = {
  id: ComponentId;
  name: string;
  entityIds: EntityId[];
};

export type ComponentDefinitionMetadata = {
  localAxes?: { length: 'x' | 'y' | 'z'; width: 'x' | 'y' | 'z'; thickness: 'x' | 'y' | 'z' };
};

export type ComponentDefinition = ComponentDefinitionMetadata & {
  id: ComponentDefinitionId;
  name: string;
  entityIds: EntityId[];
};

export type ComponentTransform = {
  translation: Vec3;
  rotationZ: number;
  scale: Vec3;
};

export type ComponentInstance = {
  id: ComponentInstanceId;
  name: string;
  definitionId: ComponentDefinitionId;
  transform: ComponentTransform;
};

export type SketchModelSnapshot = {
  unit: 'mm';
  entities: Entity[];
  components: Component[];
  componentDefinitions?: ComponentDefinition[];
  componentInstances?: ComponentInstance[];
  tags?: TagDefinition[];
  materials?: MaterialDefinition[];
  activePath?: ComponentId[];
};

let nextNumber = 1;
function nextId(prefix: string): string {
  return `${prefix}_${nextNumber++}`;
}

function bumpNextNumberPastSnapshot(snapshot: SketchModelSnapshot): void {
  const ids = [
    ...snapshot.entities.map((entity) => entity.id),
    ...snapshot.components.map((component) => component.id),
    ...(snapshot.componentDefinitions ?? []).map((definition) => definition.id),
    ...(snapshot.componentInstances ?? []).map((instance) => instance.id)
  ];
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
  private activeContext: EditContext = { type: 'root' };
  private componentDefinitions = new Map<ComponentDefinitionId, ComponentDefinition>();
  private componentInstances = new Map<ComponentInstanceId, ComponentInstance>();
  private tags: TagDefinition[] = defaultTags();
  private materials: MaterialDefinition[] = defaultMaterials();

  static fromSnapshot(snapshot: SketchModelSnapshot): SketchModel {
    const model = new SketchModel();
    model.tags = normalizeTags(snapshot.tags);
    model.materials = normalizeMaterialCatalog(snapshot.materials, { preserveStarterMaterials: true });
    for (const entity of snapshot.entities) model.entities.set(entity.id, structuredClone(withDefaultEntityMetadata(entity)));
    for (const component of snapshot.components) model.components.set(component.id, structuredClone(component));
    for (const definition of snapshot.componentDefinitions ?? []) model.componentDefinitions.set(definition.id, structuredClone(definition));
    for (const instance of snapshot.componentInstances ?? []) model.componentInstances.set(instance.id, structuredClone({ ...instance, transform: normalizeComponentTransform(instance.transform) }));
    const activeComponentId = snapshot.activePath?.at(-1);
    if (activeComponentId && model.components.has(activeComponentId)) model.activeContext = { type: 'component', componentId: activeComponentId };
    bumpNextNumberPastSnapshot(snapshot);
    return model;
  }

  snapshot(): SketchModelSnapshot {
    const activePath = this.activePath();
    const snapshot: SketchModelSnapshot = {
      unit: this.unit,
      entities: [...this.entities.values()].map((entity) => structuredClone(withDefaultEntityMetadata(entity))),
      components: [...this.components.values()].map((component) => structuredClone(component)),
      componentDefinitions: [...this.componentDefinitions.values()].map((definition) => structuredClone(definition)),
      componentInstances: [...this.componentInstances.values()].map((instance) => structuredClone(instance)),
      tags: this.tags.map((tag) => ({ ...tag })),
      materials: this.materials.map((material) => ({ ...material }))
    };
    return activePath.length > 0 ? { ...snapshot, activePath } : snapshot;
  }

  allEntities(): Entity[] {
    return [...this.entities.values()];
  }

  allComponents(): Component[] {
    return [...this.components.values()];
  }

  allComponentDefinitions(): ComponentDefinition[] {
    return [...this.componentDefinitions.values()].map((definition) => structuredClone(definition));
  }

  allComponentInstances(): ComponentInstance[] {
    return [...this.componentInstances.values()].map((instance) => structuredClone(instance));
  }

  allTags(): TagDefinition[] {
    return this.tags.map((tag) => ({ ...tag }));
  }

  allMaterials(): MaterialDefinition[] {
    return this.materials.map((material) => ({ ...material }));
  }

  getEntity(id: EntityId): Entity | undefined {
    const entity = this.entities.get(id);
    return entity ? withDefaultEntityMetadata(entity) : undefined;
  }

  activeEditContext(): EditContext {
    return this.activeContext.type === 'root' ? { type: 'root' } : { ...this.activeContext };
  }

  activePath(): ComponentId[] {
    return this.activeContext.type === 'component' ? [this.activeContext.componentId] : [];
  }

  openComponent(id: ComponentId): Component {
    const component = this.requireComponent(id);
    this.activeContext = { type: 'component', componentId: id };
    return structuredClone(component);
  }

  closeActiveContext(): EditContext {
    this.activeContext = { type: 'root' };
    return this.activeEditContext();
  }

  selectionTargetForEntity(id: EntityId): SelectionTarget {
    const entity = this.requireEntity(id);
    if (entity.componentId && !this.isActiveComponentContext(entity.componentId)) {
      this.requireComponent(entity.componentId);
      return { type: 'component', componentId: entity.componentId, hitEntityId: id };
    }
    return { type: 'entity', entityId: id };
  }

  canEditEntity(id: EntityId): boolean {
    const entity = this.requireEntity(id);
    return !entity.componentId || this.isActiveComponentContext(entity.componentId);
  }

  createLine(start: Vec3, end: Vec3, metadata: CadMetadata = {}): EdgeEntity {
    if (distance(start, end) <= 0) throw new Error('Eine Linie braucht zwei verschiedene Punkte.');
    const entity: EdgeEntity = withDefaultEntityMetadata({ id: nextId('edge'), type: 'edge', start, end, ...metadata });
    this.entities.set(entity.id, entity);
    return entity;
  }

  resizeLineLength(id: EntityId, lengthMm: number): EdgeEntity {
    if (!isPositiveFinite(lengthMm)) throw new Error('Eine Linie braucht eine positive Länge.');
    const entity = this.requireEntityEditable(id);
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
    const entity: FaceEntity = withDefaultEntityMetadata({ id: nextId('face'), type: 'face', vertices, ...metadata });
    this.entities.set(entity.id, entity);
    return entity;
  }

  resizeRectangleFace(id: EntityId, width: number, depth: number): FaceEntity {
    if (!isPositiveFinite(width) || !isPositiveFinite(depth)) throw new Error('Ein Rechteck braucht positive Breite und Tiefe.');
    const entity = this.requireEntityEditable(id);
    if (entity.type !== 'face') throw new Error('Rechteckmaß braucht eine ausgewählte Fläche.');
    const plane = rectangleFacePlane(entity.vertices);
    if (!plane) throw new Error('Rechteckmaß unterstützt nur axis-aligned Rechteckflächen.');
    const updated: FaceEntity = { ...entity, vertices: rectangleVertices(entity.vertices[0], width, depth, plane) };
    this.entities.set(id, updated);
    return updated;
  }

  extrudeFaceToBox(id: EntityId, height: number): BoxEntity {
    if (!isPositiveFinite(height)) throw new Error('Extrusion braucht eine positive Höhe.');
    const entity = this.requireEntityEditable(id);
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
      componentId: entity.componentId,
      tagId: entity.tagId ?? defaultTagId,
      materialId: entity.materialId ?? defaultMaterialId,
      material: entity.material
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
    const entity: BoxEntity = withDefaultEntityMetadata({ id: nextId('box'), type: 'box', origin, width, depth, height, rotationZ: 0 });
    this.entities.set(entity.id, entity);
    return entity;
  }

  addReferenceMesh(name: string, triangles: ReferenceMeshEntity['triangles']): ReferenceMeshEntity {
    const clonedTriangles = structuredClone(triangles);
    if (clonedTriangles.length === 0 || !hasOwnArrayEntries(clonedTriangles) || !clonedTriangles.every(isValidReferenceMeshTriangle)) {
      throw new Error('Ein Referenzmesh braucht mindestens ein gültiges Dreieck mit finiten Koordinaten.');
    }
    const entity: ReferenceMeshEntity = withDefaultEntityMetadata({ id: nextId('mesh'), type: 'referenceMesh', name, triangles: clonedTriangles, triangleCount: clonedTriangles.length });
    this.entities.set(entity.id, entity);
    return entity;
  }

  resizeBox(id: EntityId, dimensions: Partial<BoxDimensions>): BoxEntity {
    this.requireEntityEditable(id);
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
    this.requireEntityEditable(id);
    const entity = this.requireBox(id);
    const face = typeof faceOrDelta === 'number' ? 'top' : faceOrDelta;
    const delta = typeof faceOrDelta === 'number' ? faceOrDelta : maybeDelta ?? 0;
    const updated = previewPushPullBoxFace(entity, face, delta);
    this.entities.set(id, updated);
    return updated;
  }

  moveEntity(id: EntityId, delta: Vec3): Entity {
    const entity = this.requireEntityEditable(id);
    let moved: Entity;
    if (entity.type === 'edge') moved = { ...entity, start: add(entity.start, delta), end: add(entity.end, delta) };
    else if (entity.type === 'face') moved = { ...entity, vertices: entity.vertices.map((v) => add(v, delta)) };
    else if (entity.type === 'referenceMesh') moved = { ...entity, triangles: entity.triangles.map((triangle) => ({ vertices: translateVertices(triangle.vertices, delta) })) };
    else moved = { ...entity, origin: add(entity.origin, delta) };
    this.entities.set(id, moved);
    return moved;
  }

  private rotateEntity(id: EntityId, angleRadians: number, origin = this.entityCenter(id)): Entity {
    const entity = this.requireEntityEditable(id);
    return rotateEntitySnapshot(entity, angleRadians, origin);
  }

  rotateEntityZ(id: EntityId, angleRadians: number, origin = this.entityCenter(id)): Entity {
    const rotated = this.rotateEntity(id, angleRadians, origin);
    this.entities.set(id, rotated);
    return rotated;
  }

  deleteEntity(id: EntityId): boolean {
    if (!this.entities.has(id)) return false;
    this.requireEntityEditable(id);
    this.entities.delete(id);
    for (const component of [...this.components.values()]) {
      const entityIds = component.entityIds.filter((entityId) => entityId !== id);
      if (entityIds.length === 0) {
        this.components.delete(component.id);
        if (this.isActiveComponentContext(component.id)) this.closeActiveContext();
      } else if (entityIds.length !== component.entityIds.length) this.components.set(component.id, { ...component, entityIds });
    }
    for (const definition of [...this.componentDefinitions.values()]) {
      const entityIds = definition.entityIds.filter((entityId) => entityId !== id);
      if (entityIds.length === 0) {
        this.componentDefinitions.delete(definition.id);
        for (const instance of [...this.componentInstances.values()]) {
          if (instance.definitionId === definition.id) this.componentInstances.delete(instance.id);
        }
      } else if (entityIds.length !== definition.entityIds.length) {
        this.componentDefinitions.set(definition.id, { ...definition, entityIds });
      }
    }
    return true;
  }

  hideEntity(id: EntityId): Entity {
    const entity = this.requireEntityEditable(id);
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
    const materialId = material.materialId ?? this.findOrCreateLegacyMaterial(material);
    if (!materialById(materialId, this.materials)) throw new Error(`Material nicht gefunden: ${materialId}`);
    const entity = this.requireEntityEditable(id);
    const painted = { ...entity, materialId, material: material.name || material.color || material.previewUrl || material.textureDataUrl ? { ...material, materialId } : undefined } as Entity;
    this.entities.set(id, painted);
    return painted;
  }

  upsertTag(tag: TagDefinition): TagDefinition {
    const normalized = normalizeTags([...this.tags.filter((existing) => existing.id !== tag.id), tag]);
    this.tags = normalized;
    return this.tags.find((existing) => existing.id === tag.id)!;
  }

  assignTag(id: EntityId, tagId: TagId): Entity {
    if (!this.tags.some((tag) => tag.id === tagId)) {
      const normalized = normalizeTags([...this.tags, { id: tagId, name: tagId, visible: true }]);
      if (!normalized.some((tag) => tag.id === tagId)) throw new Error(`Tag nicht gefunden oder ungültig: ${tagId}`);
      this.tags = normalized;
    }
    const entity = this.requireEntityEditable(id);
    const tagged = { ...entity, tagId } as Entity;
    this.entities.set(id, tagged);
    return tagged;
  }

  upsertMaterial(material: MaterialDefinition): MaterialDefinition {
    this.materials = normalizeMaterialCatalog([...this.materials.filter((existing) => existing.id !== material.id), material]);
    return this.materials.find((existing) => existing.id === material.id)!;
  }

  private findOrCreateLegacyMaterial(material: MaterialAssignment): MaterialId {
    if (material.materialId) return material.materialId;
    const name = material.name?.trim();
    const color = material.color?.trim();
    if (!name || !color) return defaultMaterialId;
    const existing = this.materials.find((entry) => entry.name === name && entry.color.toLowerCase() === color.toLowerCase());
    if (existing) return existing.id;
    const id = uniqueMaterialId(safeIdFromName(name, 'material'), this.materials);
    this.upsertMaterial({ id, name, color });
    return id;
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

  createComponentDefinition(name: string, entityIds: EntityId[], metadata: ComponentDefinitionMetadata = {}): ComponentDefinition {
    if (entityIds.length === 0) throw new Error('Eine Komponenten-Definition braucht mindestens ein Element.');
    for (const id of entityIds) this.requireEntity(id);
    const definition: ComponentDefinition = { id: nextId('definition'), name, entityIds: [...entityIds], ...(metadata.localAxes ? { localAxes: { ...metadata.localAxes } } : {}) };
    this.componentDefinitions.set(definition.id, definition);
    return structuredClone(definition);
  }

  createComponentInstance(definitionId: ComponentDefinitionId, name: string, transform: Partial<ComponentTransform> = {}): ComponentInstance {
    this.requireComponentDefinition(definitionId);
    const instance: ComponentInstance = { id: nextId('instance'), name, definitionId, transform: normalizeComponentTransform(transform) };
    this.componentInstances.set(instance.id, instance);
    return structuredClone(instance);
  }

  moveComponentInstance(id: ComponentInstanceId, delta: Vec3): ComponentInstance {
    const instance = this.requireComponentInstance(id);
    const updated = { ...instance, transform: { ...instance.transform, translation: add(instance.transform.translation, delta) } };
    this.componentInstances.set(id, updated);
    return structuredClone(updated);
  }

  rotateComponentInstanceZ(id: ComponentInstanceId, angleRadians: number): ComponentInstance {
    if (!Number.isFinite(angleRadians)) throw new Error('Instanz-Rotation braucht einen finiten Winkel.');
    const instance = this.requireComponentInstance(id);
    const updated = { ...instance, transform: { ...instance.transform, rotationZ: instance.transform.rotationZ + angleRadians } };
    this.componentInstances.set(id, updated);
    return structuredClone(updated);
  }

  duplicateComponentInstance(id: ComponentInstanceId, name: string, transform: Partial<ComponentTransform> = {}): ComponentInstance {
    const source = this.requireComponentInstance(id);
    return this.createComponentInstance(source.definitionId, name, { ...source.transform, ...transform });
  }

  makeComponentInstanceUnique(id: ComponentInstanceId, name: string): ComponentDefinition {
    const instance = this.requireComponentInstance(id);
    const source = this.requireComponentDefinition(instance.definitionId);
    const copiedIds: EntityId[] = [];
    for (const entityId of source.entityIds) {
      const copy = cloneEntityForComponentDefinition(this.requireEntity(entityId));
      copiedIds.push(copy.id);
      this.entities.set(copy.id, copy);
    }
    const definition: ComponentDefinition = { ...source, id: nextId('definition'), name, entityIds: copiedIds };
    this.componentDefinitions.set(definition.id, definition);
    this.componentInstances.set(id, { ...instance, definitionId: definition.id });
    return structuredClone(definition);
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

  private isActiveComponentContext(componentId: ComponentId): boolean {
    return this.activeContext.type === 'component' && this.activeContext.componentId === componentId;
  }

  private requireEntityEditable(id: EntityId): Entity {
    const entity = this.requireEntity(id);
    if (entity.componentId && !this.isActiveComponentContext(entity.componentId)) {
      throw new Error('Erst Gruppe oder Komponente bearbeiten, bevor innere Geometrie geändert wird.');
    }
    return entity;
  }

  private requireComponent(id: ComponentId): Component {
    const component = this.components.get(id);
    if (!component) throw new Error(`Komponente nicht gefunden: ${id}`);
    return component;
  }

  private requireComponentDefinition(id: ComponentDefinitionId): ComponentDefinition {
    const definition = this.componentDefinitions.get(id);
    if (!definition) throw new Error(`Komponenten-Definition nicht gefunden: ${id}`);
    return definition;
  }

  private requireComponentInstance(id: ComponentInstanceId): ComponentInstance {
    const instance = this.componentInstances.get(id);
    if (!instance) throw new Error(`Komponenten-Instanz nicht gefunden: ${id}`);
    return instance;
  }

  private requireBox(id: EntityId): BoxEntity {
    const entity = this.requireEntity(id);
    if (entity.type !== 'box') throw new Error('Push/Pull ist im MVP nur für Körper aktiv.');
    return entity;
  }
}

function normalizeComponentTransform(transform: Partial<ComponentTransform> = {}): ComponentTransform {
  const normalized = {
    translation: transform.translation ?? vec(0, 0, 0),
    rotationZ: transform.rotationZ ?? 0,
    scale: transform.scale ?? vec(1, 1, 1)
  };
  if (!isFiniteVec3(normalized.translation) || !Number.isFinite(normalized.rotationZ) || !isFiniteVec3(normalized.scale)) {
    throw new Error('Komponenten-Instanz braucht finite Transformationswerte.');
  }
  if (!isUnitScale(normalized.scale)) {
    throw new Error('Instanz-Skalierung ist für zuschnittsfähige Komponenten nicht erlaubt.');
  }
  return normalized;
}

function isUnitScale(value: Vec3): boolean {
  return Math.abs(value.x - 1) <= 1e-9 && Math.abs(value.y - 1) <= 1e-9 && Math.abs(value.z - 1) <= 1e-9;
}

function cloneEntityForComponentDefinition(entity: Entity): Entity {
  if (entity.type === 'edge') return { ...structuredClone(entity), id: nextId('edge'), componentId: undefined };
  if (entity.type === 'face') return { ...structuredClone(entity), id: nextId('face'), componentId: undefined };
  if (entity.type === 'referenceMesh') return { ...structuredClone(entity), id: nextId('mesh'), componentId: undefined };
  return { ...structuredClone(entity), id: nextId('box'), componentId: undefined };
}

function transformEntityForInstance(entity: Entity, instance: ComponentInstance): Entity {
  const id = `${instance.id}:${entity.id}`;
  const transform = instance.transform;
  if (entity.type === 'edge') {
    return { ...entity, id, start: transformPoint(entity.start, transform), end: transformPoint(entity.end, transform), componentId: undefined };
  }
  if (entity.type === 'face') {
    return { ...entity, id, vertices: entity.vertices.map((vertex) => transformPoint(vertex, transform)), componentId: undefined };
  }
  if (entity.type === 'referenceMesh') {
    return { ...entity, id, triangles: entity.triangles.map((triangle) => ({ vertices: transformVertices(triangle.vertices, transform) })), componentId: undefined };
  }
  const sourceCenter = boxLocalCenter(entity);
  const transformedCenter = transformPoint(sourceCenter, transform);
  return {
    ...entity,
    id,
    origin: vec(transformedCenter.x - entity.width / 2, transformedCenter.y - entity.depth / 2, transformedCenter.z - entity.height / 2),
    rotationZ: entity.rotationZ + transform.rotationZ,
    componentId: undefined
  };
}

function transformPoint(point: Vec3, transform: ComponentTransform): Vec3 {
  return add(rotateAroundZ(point, transform.rotationZ, vec(0, 0, 0)), transform.translation);
}

function transformVertices(vertices: [Vec3, Vec3, Vec3], transform: ComponentTransform): [Vec3, Vec3, Vec3] {
  return [transformPoint(vertices[0], transform), transformPoint(vertices[1], transform), transformPoint(vertices[2], transform)];
}

export function worldEntitiesForModel(model: SketchModel): Entity[] {
  const definitions = model.allComponentDefinitions();
  const instances = model.allComponentInstances();
  const instantiatedDefinitionIds = new Set(instances.map((instance) => instance.definitionId));
  const instancedSourceIds = new Set(definitions.filter((definition) => instantiatedDefinitionIds.has(definition.id)).flatMap((definition) => definition.entityIds));
  const entities = model.allEntities().filter((entity) => !instancedSourceIds.has(entity.id)).map((entity) => structuredClone(entity));
  for (const instance of instances) {
    const definition = definitions.find((candidate) => candidate.id === instance.definitionId);
    if (!definition) continue;
    for (const entityId of definition.entityIds) {
      const entity = model.getEntity(entityId);
      if (!entity) continue;
      entities.push(transformEntityForInstance(entity, instance));
    }
  }
  return entities;
}

function withDefaultEntityMetadata<T extends Entity>(entity: T): T {
  return { ...entity, tagId: entity.tagId ?? defaultTagId, materialId: entity.materialId ?? defaultMaterialId } as T;
}

function safeIdFromName(name: string, fallback: string): string {
  const id = name.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '');
  return id || fallback;
}

function uniqueMaterialId(baseId: string, materials: readonly MaterialDefinition[]): MaterialId {
  const existingIds = new Set(materials.map((material) => material.id));
  if (!existingIds.has(baseId)) return baseId;
  const prefixed = baseId.startsWith('material-') ? baseId : `material-${baseId}`;
  if (!existingIds.has(prefixed)) return prefixed;
  for (let index = 2; ; index += 1) {
    const candidate = `${prefixed}-${index}`;
    if (!existingIds.has(candidate)) return candidate;
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

export function previewPushPullBoxFace(entity: BoxEntity, face: BoxFaceName, delta: number): BoxEntity {
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
