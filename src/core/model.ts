import { add, bbox, distance, rotateAroundZ, scale, sub, type Vec3, vec } from './geometry';
import { defaultMaterialId, defaultMaterials, materialById, normalizeMaterialCatalog, type MaterialDefinition, type MaterialId } from './materials';
import { defaultTagId, defaultTags, normalizeTags, type TagDefinition, type TagId } from './tags';
import { normalizePartMaterialMetadata } from './woodworkingMaterials';
import type { PartMaterialMetadata } from './woodworkingMaterials';
import { normalizeCutOperation } from './cutOperations';
import type { CutOperation } from './cutOperations';
export { partMaterialReadinessForEntity, type PartMaterialMetadata } from './woodworkingMaterials';
export { boardEntitiesForCutList, cutOperationReadinessForEntity, type CutOperation } from './cutOperations';

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
export type ComponentKind = 'group' | 'component';
export type DrawingPlane = 'xy' | 'xz' | 'yz';
export type MaterialAssignment = { materialId?: MaterialId; name?: string; color?: string; previewUrl?: string; textureDataUrl?: string; textureFileName?: string };
export type WoodworkingKind = 'assembly' | 'panel' | 'bar' | 'hardware' | 'cut' | 'helper';
export type WoodworkingPrefix = 'ASM' | 'PLT' | 'BAR' | 'HW' | 'CUT' | 'REF';
export type WoodworkingMetadata = Readonly<{ kind: WoodworkingKind; prefix: WoodworkingPrefix; role?: string }>;
export type WoodworkingDimensions = Readonly<{ length: number; width: number; thickness: number }>;

const woodworkingPrefixes: Record<WoodworkingKind, WoodworkingPrefix> = {
  assembly: 'ASM',
  panel: 'PLT',
  bar: 'BAR',
  hardware: 'HW',
  cut: 'CUT',
  helper: 'REF'
};

export function woodworkingPrefixFor(kind: WoodworkingKind): WoodworkingPrefix {
  return woodworkingPrefixes[kind];
}

export function createWoodworkingMetadata(kind: WoodworkingKind, role?: string): WoodworkingMetadata {
  const prefix = woodworkingPrefixFor(kind);
  if (!prefix) throw new Error(`Unbekannte Schreiner-Klassifizierung: ${String(kind)}`);
  const trimmedRole = role?.trim();
  return trimmedRole ? { kind, prefix, role: trimmedRole } : { kind, prefix };
}

export function isBoardCutListKind(kind: WoodworkingKind): boolean {
  return kind === 'panel' || kind === 'bar';
}

export function isValidWoodworkingMetadata(value: unknown): value is WoodworkingMetadata {
  if (!isRecord(value)) return false;
  if (!isWoodworkingKind(value.kind)) return false;
  if (value.prefix !== woodworkingPrefixFor(value.kind)) return false;
  if ('role' in value && value.role !== undefined && (typeof value.role !== 'string' || value.role.trim().length === 0)) return false;
  return true;
}

export function suggestWoodworkingName(kind: WoodworkingKind, label: string, dimensions?: WoodworkingDimensions): string {
  const prefix = woodworkingPrefixFor(kind);
  if (!prefix) throw new Error(`Unbekannte Schreiner-Klassifizierung: ${String(kind)}`);
  const safeLabel = safeWoodworkingNamePart(label);
  const dimensionSuffix = dimensions ? `_${formatWoodworkingDimension(dimensions.length)}x${formatWoodworkingDimension(dimensions.width)}x${formatWoodworkingDimension(dimensions.thickness)}` : '';
  return `${prefix}_${safeLabel}${dimensionSuffix}`;
}

function isWoodworkingKind(value: unknown): value is WoodworkingKind {
  return typeof value === 'string' && Object.hasOwn(woodworkingPrefixes, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeWoodworkingNamePart(value: string): string {
  const safe = value.trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!safe) throw new Error('Schreiner-Name braucht eine Bezeichnung.');
  return safe;
}

function formatWoodworkingDimension(value: number): string {
  if (!isPositiveFinite(value)) throw new Error('Schreiner-Maße müssen positiv sein.');
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

type CadMetadata = {
  layer?: string;
  hidden?: boolean;
  tagId?: TagId;
  materialId?: MaterialId;
  material?: MaterialAssignment;
  woodworking?: WoodworkingMetadata;
  partMaterial?: PartMaterialMetadata;
  cutOperations?: CutOperation[];
};
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

export type ComponentDefinition = {
  id: ComponentDefinitionId;
  name: string;
  kind: ComponentKind;
  description?: string;
  version: number;
};

export type Component = {
  id: ComponentId;
  definitionId: ComponentDefinitionId;
  name: string;
  entityIds: EntityId[];
  kind: ComponentKind;
  description?: string;
  woodworking?: WoodworkingMetadata;
};

export type ComponentCreationOptions = {
  kind?: ComponentKind;
  description?: string;
  definitionId?: ComponentDefinitionId;
};

export type SketchModelSnapshot = {
  unit: 'mm';
  entities: Entity[];
  components: Component[];
  componentDefinitions?: ComponentDefinition[];
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
    ...(snapshot.componentDefinitions ?? []).map((definition) => definition.id)
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
  private componentDefinitions = new Map<ComponentDefinitionId, ComponentDefinition>();
  private activeContext: EditContext = { type: 'root' };
  private tags: TagDefinition[] = defaultTags();
  private materials: MaterialDefinition[] = defaultMaterials();

  static fromSnapshot(snapshot: SketchModelSnapshot): SketchModel {
    const model = new SketchModel();
    model.tags = normalizeTags(snapshot.tags);
    model.materials = normalizeMaterialCatalog(snapshot.materials, { preserveStarterMaterials: true });
    for (const entity of snapshot.entities) model.entities.set(entity.id, structuredClone(withDefaultEntityMetadata(entity)));
    for (const definition of snapshot.componentDefinitions ?? []) model.componentDefinitions.set(definition.id, normalizeComponentDefinition(definition));
    for (const componentPayload of snapshot.components) {
      const component = normalizeComponent(componentPayload);
      model.components.set(component.id, component);
      if (!model.componentDefinitions.has(component.definitionId)) {
        model.componentDefinitions.set(component.definitionId, componentDefinitionFromComponent(component));
      }
    }
    model.purgeUnusedComponentDefinitions();
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

  getComponent(id: ComponentId): Component | undefined {
    const component = this.components.get(id);
    return component ? structuredClone(component) : undefined;
  }

  allComponentDefinitions(): ComponentDefinition[] {
    return [...this.componentDefinitions.values()].map((definition) => structuredClone(definition));
  }

  componentDefinition(id: ComponentDefinitionId): ComponentDefinition | undefined {
    const definition = this.componentDefinitions.get(id);
    return definition ? structuredClone(definition) : undefined;
  }

  componentInstanceCount(definitionId: ComponentDefinitionId): number {
    return [...this.components.values()].filter((component) => component.definitionId === definitionId).length;
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

  createFaceFromClosedLineLoop(closingEdgeId: EntityId): FaceEntity | undefined {
    const closing = this.entities.get(closingEdgeId);
    if (!closing || closing.type !== 'edge') return undefined;
    const edges = [...this.entities.values()].filter((entity): entity is EdgeEntity => entity.type === 'edge');
    const rectangle = findClosedRectangleLoop(edges, closing);
    if (!rectangle) return undefined;
    const vertices = rectangleVertices(rectangle.origin, rectangle.width, rectangle.depth, rectangle.plane);
    if ([...this.entities.values()].some((entity) => entity.type === 'face' && sameVertexSet(entity.vertices, vertices))) return undefined;
    return this.createRectangle(rectangle.origin, rectangle.width, rectangle.depth, {}, rectangle.plane);
  }

  resizeLineLength(id: EntityId, lengthMm: number): EdgeEntity {
    if (!isPositiveFinite(lengthMm)) throw new Error('Eine Linie braucht eine positive Länge.');
    const entity = this.requireEntityEditable(id);
    if (entity.type !== 'edge') throw new Error('Längenmaß braucht eine ausgewählte Linie.');
    const currentLength = distance(entity.start, entity.end);
    if (currentLength <= 0) throw new Error('Eine Linie braucht zwei verschiedene Punkte.');
    const direction = scale(sub(entity.end, entity.start), 1 / currentLength);
    const updated: EdgeEntity = { ...entity, end: add(entity.start, scale(direction, lengthMm)) };
    return this.storeEditedEntity(id, entity, updated);
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
    return this.storeEditedEntity(id, entity, updated);
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
      material: entity.material,
      partMaterial: entity.partMaterial,
      cutOperations: entity.cutOperations
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
    const updated: BoxEntity = { ...entity, ...next };
    return this.storeEditedEntity(id, entity, updated);
  }

  pushPullBoxFace(id: EntityId, deltaHeight: number): BoxEntity;
  pushPullBoxFace(id: EntityId, face: BoxFaceName, delta: number): BoxEntity;
  pushPullBoxFace(id: EntityId, faceOrDelta: BoxFaceName | number, maybeDelta?: number): BoxEntity {
    this.requireEntityEditable(id);
    const entity = this.requireBox(id);
    const face = typeof faceOrDelta === 'number' ? 'top' : faceOrDelta;
    const delta = typeof faceOrDelta === 'number' ? faceOrDelta : maybeDelta ?? 0;
    const updated = previewPushPullBoxFace(entity, face, delta);
    return this.storeEditedEntity(id, entity, updated);
  }

  moveEntity(id: EntityId, delta: Vec3): Entity {
    const entity = this.requireEntityEditable(id);
    let moved: Entity;
    if (entity.type === 'edge') moved = { ...entity, start: add(entity.start, delta), end: add(entity.end, delta) };
    else if (entity.type === 'face') moved = { ...entity, vertices: entity.vertices.map((v) => add(v, delta)) };
    else if (entity.type === 'referenceMesh') moved = { ...entity, triangles: entity.triangles.map((triangle) => ({ vertices: translateVertices(triangle.vertices, delta) })) };
    else moved = { ...entity, origin: add(entity.origin, delta) };
    return this.storeEditedEntity(id, entity, moved);
  }

  private rotateEntity(id: EntityId, angleRadians: number, origin = this.entityCenter(id)): Entity {
    const entity = this.requireEntityEditable(id);
    return rotateEntitySnapshot(entity, angleRadians, origin);
  }

  rotateEntityZ(id: EntityId, angleRadians: number, origin = this.entityCenter(id)): Entity {
    const rotated = this.rotateEntity(id, angleRadians, origin);
    const before = this.requireEntity(id);
    this.entities.set(id, rotated);
    this.syncSharedComponentEntity(id, before, rotated);
    return rotated;
  }

  deleteEntity(id: EntityId): boolean {
    if (!this.entities.has(id)) return false;
    const entity = this.requireEntityEditable(id);
    const linkedIds = this.linkedSharedDefinitionEntityIds(id, entity);
    const idsToDelete = new Set([id, ...linkedIds]);
    for (const entityId of idsToDelete) this.entities.delete(entityId);
    for (const component of [...this.components.values()]) {
      const entityIds = component.entityIds.filter((entityId) => !idsToDelete.has(entityId));
      if (entityIds.length === 0) {
        this.components.delete(component.id);
        if (this.isActiveComponentContext(component.id)) this.closeActiveContext();
      } else if (entityIds.length !== component.entityIds.length) this.components.set(component.id, { ...component, entityIds });
    }
    this.purgeUnusedComponentDefinitions();
    return true;
  }

  hideEntity(id: EntityId): Entity {
    const entity = this.requireEntityEditable(id);
    const hidden = { ...entity, hidden: true } as Entity;
    return this.storeEditedEntity(id, entity, hidden);
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
    return this.storeEditedEntity(id, entity, painted);
  }

  assignPartMaterial(id: EntityId, metadata: PartMaterialMetadata): Entity {
    const entity = this.requireEntity(id);
    const updated = { ...entity, partMaterial: normalizePartMaterialMetadata(metadata) } as Entity;
    this.entities.set(id, updated);
    return updated;
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
    return this.storeEditedEntity(id, entity, tagged);
  }

  assignWoodworkingClassification(id: EntityId, kind: WoodworkingKind, role?: string): Entity {
    const entity = this.requireEntity(id);
    const classified = { ...entity, woodworking: createWoodworkingMetadata(kind, role) } as Entity;
    this.entities.set(id, classified);
    return classified;
  }

  assignCutOperation(id: EntityId, operation: CutOperation): Entity {
    const entity = this.requireEntity(id);
    const cutOperations = [...(entity.cutOperations ?? []), normalizeCutOperation(operation)];
    const updated = { ...entity, cutOperations } as Entity;
    this.entities.set(id, updated);
    return updated;
  }

  assignComponentWoodworkingClassification(id: ComponentId, kind: WoodworkingKind, role?: string): Component {
    const component = this.requireComponent(id);
    const classified = { ...component, woodworking: createWoodworkingMetadata(kind, role) };
    this.components.set(id, classified);
    return classified;
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

  createComponent(name: string, entityIds: EntityId[], options: ComponentCreationOptions = {}): Component {
    if (entityIds.length === 0) throw new Error('Eine Komponente braucht mindestens ein Element.');
    for (const id of entityIds) this.requireEntity(id);
    const cleanDescription = options.description?.trim();
    const kind = options.kind ?? 'component';
    const existingDefinition = options.definitionId ? this.componentDefinitions.get(options.definitionId) : undefined;
    const definition: ComponentDefinition = existingDefinition ?? {
      id: options.definitionId ?? nextId('definition'),
      name,
      kind,
      version: 1,
      ...(cleanDescription ? { description: cleanDescription } : {})
    };
    this.componentDefinitions.set(definition.id, definition);
    const component: Component = {
      id: nextId('component'),
      definitionId: definition.id,
      name,
      entityIds: [...entityIds],
      kind,
      ...(cleanDescription ? { description: cleanDescription } : existingDefinition?.description ? { description: existingDefinition.description } : {})
    };
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
    this.purgeUnusedComponentDefinitions();
    return component;
  }

  duplicateEntity(id: EntityId, offset: Vec3 = vec(800, 0, 0)): Entity {
    const entity = this.requireEntityEditable(id);
    const copy = cloneEntityWithOffset(entity, offset);
    this.entities.set(copy.id, copy);
    return copy;
  }

  duplicateComponent(id: ComponentId, name: string, offset: Vec3 = vec(0, 0, 0)): Component {
    const source = this.requireComponent(id);
    const copiedIds: EntityId[] = [];
    for (const entityId of source.entityIds) {
      const entity = this.requireEntity(entityId);
      const copy = cloneEntityWithOffset(entity, offset);
      copiedIds.push(copy.id);
      this.entities.set(copy.id, copy);
    }
    return this.createComponent(name, copiedIds, {
      kind: source.kind,
      description: source.description,
      ...(source.kind === 'component' ? { definitionId: source.definitionId } : {})
    });
  }

  makeComponentUnique(id: ComponentId, name?: string): Component {
    const source = this.requireComponent(id);
    const sourceDefinition = this.componentDefinitions.get(source.definitionId);
    const cleanName = name?.trim() || `${sourceDefinition?.name ?? source.name} Unique`;
    const cleanDescription = source.description?.trim() || sourceDefinition?.description?.trim();
    const definition: ComponentDefinition = {
      id: nextId('definition'),
      name: cleanName,
      kind: source.kind,
      version: (sourceDefinition?.version ?? 1) + 1,
      ...(cleanDescription ? { description: cleanDescription } : {})
    };
    this.componentDefinitions.set(definition.id, definition);
    const updated: Component = {
      ...source,
      definitionId: definition.id,
      name: cleanName,
      ...(cleanDescription ? { description: cleanDescription } : {})
    };
    this.components.set(id, updated);
    this.purgeUnusedComponentDefinitions();
    return structuredClone(updated);
  }

  replaceComponentDefinition(id: ComponentId, replacementDefinitionId: ComponentDefinitionId): Component {
    const component = this.requireComponent(id);
    const replacement = this.componentDefinitions.get(replacementDefinitionId);
    if (!replacement) throw new Error(`Komponentendefinition nicht gefunden: ${replacementDefinitionId}`);
    const updated: Component = {
      ...component,
      definitionId: replacement.id,
      kind: replacement.kind,
      name: replacement.name,
      ...(replacement.description ? { description: replacement.description } : {})
    };
    this.components.set(id, updated);
    this.purgeUnusedComponentDefinitions();
    return structuredClone(updated);
  }

  explodeComponent(id: ComponentId): EntityId[] {
    const component = this.requireComponent(id);
    const releasedIds = [...component.entityIds];
    for (const entityId of releasedIds) {
      const entity = this.entities.get(entityId);
      if (entity) this.entities.set(entityId, withoutComponentId(entity));
    }
    this.components.delete(id);
    if (this.isActiveComponentContext(id)) this.closeActiveContext();
    this.purgeUnusedComponentDefinitions();
    return releasedIds;
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

  private storeEditedEntity<T extends Entity>(id: EntityId, before: Entity, updated: T): T {
    this.entities.set(id, updated);
    this.syncSharedComponentEntity(id, before, updated);
    return updated;
  }

  private syncSharedComponentEntity(sourceEntityId: EntityId, before: Entity, after: Entity): void {
    if (!before.componentId || !this.isActiveComponentContext(before.componentId)) return;
    const sourceComponent = this.components.get(before.componentId);
    if (!sourceComponent || sourceComponent.kind !== 'component') return;
    const sourceIndex = sourceComponent.entityIds.indexOf(sourceEntityId);
    if (sourceIndex < 0) return;
    for (const component of this.components.values()) {
      if (component.id === sourceComponent.id || component.definitionId !== sourceComponent.definitionId) continue;
      const targetEntityId = component.entityIds[sourceIndex];
      if (!targetEntityId) continue;
      const target = this.entities.get(targetEntityId);
      if (!target || target.type !== before.type || target.type !== after.type) continue;
      this.entities.set(targetEntityId, applySharedDefinitionEdit(before, after, target));
    }
  }

  private linkedSharedDefinitionEntityIds(sourceEntityId: EntityId, before: Entity): EntityId[] {
    if (!before.componentId || !this.isActiveComponentContext(before.componentId)) return [];
    const sourceComponent = this.components.get(before.componentId);
    if (!sourceComponent || sourceComponent.kind !== 'component') return [];
    const sourceIndex = sourceComponent.entityIds.indexOf(sourceEntityId);
    if (sourceIndex < 0) return [];
    return [...this.components.values()]
      .filter((component) => component.id !== sourceComponent.id && component.definitionId === sourceComponent.definitionId)
      .map((component) => component.entityIds[sourceIndex])
      .filter((entityId): entityId is EntityId => typeof entityId === 'string');
  }

  private purgeUnusedComponentDefinitions(): void {
    const used = new Set([...this.components.values()].map((component) => component.definitionId));
    for (const definitionId of this.componentDefinitions.keys()) {
      if (!used.has(definitionId)) this.componentDefinitions.delete(definitionId);
    }
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

  private requireBox(id: EntityId): BoxEntity {
    const entity = this.requireEntity(id);
    if (entity.type !== 'box') throw new Error('Push/Pull ist im MVP nur für Körper aktiv.');
    return entity;
  }
}

function withDefaultEntityMetadata<T extends Entity>(entity: T): T {
  return { ...entity, tagId: entity.tagId ?? defaultTagId, materialId: entity.materialId ?? defaultMaterialId } as T;
}

function normalizeComponent(component: Component): Component {
  const cleanDescription = component.description?.trim();
  return structuredClone({
    ...component,
    definitionId: component.definitionId ?? legacyDefinitionIdForComponent(component.id),
    kind: component.kind ?? 'component',
    ...(cleanDescription ? { description: cleanDescription } : {})
  });
}

function normalizeComponentDefinition(definition: ComponentDefinition): ComponentDefinition {
  const cleanDescription = definition.description?.trim();
  return structuredClone({
    ...definition,
    kind: definition.kind ?? 'component',
    version: Number.isFinite(definition.version) && definition.version > 0 ? definition.version : 1,
    ...(cleanDescription ? { description: cleanDescription } : {})
  });
}

function componentDefinitionFromComponent(component: Component): ComponentDefinition {
  return {
    id: component.definitionId,
    name: component.name,
    kind: component.kind,
    version: 1,
    ...(component.description ? { description: component.description } : {})
  };
}

function legacyDefinitionIdForComponent(componentId: ComponentId): ComponentDefinitionId {
  return `definition-${componentId}`;
}

function withoutComponentId<T extends Entity>(entity: T): T {
  const copy = { ...entity } as T & { componentId?: ComponentId };
  delete copy.componentId;
  return copy as T;
}

function applySharedDefinitionEdit(before: Entity, after: Entity, target: Entity): Entity {
  const metadata = sharedEditableMetadata(after);
  if (before.type === 'box' && after.type === 'box' && target.type === 'box') {
    return {
      ...target,
      ...metadata,
      origin: add(target.origin, sub(after.origin, before.origin)),
      width: after.width,
      depth: after.depth,
      height: after.height,
      rotationZ: after.rotationZ
    } as Entity;
  }
  if (before.type === 'edge' && after.type === 'edge' && target.type === 'edge') {
    return {
      ...target,
      ...metadata,
      start: add(target.start, sub(after.start, before.start)),
      end: add(target.end, sub(after.end, before.end))
    } as Entity;
  }
  if (before.type === 'face' && after.type === 'face' && target.type === 'face' && before.vertices.length === after.vertices.length && after.vertices.length === target.vertices.length) {
    return {
      ...target,
      ...metadata,
      vertices: target.vertices.map((vertex, index) => add(vertex, sub(after.vertices[index], before.vertices[index])))
    } as Entity;
  }
  if (before.type === 'referenceMesh' && after.type === 'referenceMesh' && target.type === 'referenceMesh') {
    return {
      ...target,
      ...metadata,
      triangles: target.triangles.map((triangle, triangleIndex) => ({
        vertices: triangle.vertices.map((vertex, vertexIndex) => {
          const beforeVertex = before.triangles[triangleIndex]?.vertices[vertexIndex];
          const afterVertex = after.triangles[triangleIndex]?.vertices[vertexIndex];
          return beforeVertex && afterVertex ? add(vertex, sub(afterVertex, beforeVertex)) : vertex;
        }) as [Vec3, Vec3, Vec3]
      }))
    } as Entity;
  }
  return target;
}

function sharedEditableMetadata(entity: Entity): Partial<Entity> {
  return {
    hidden: entity.hidden,
    tagId: entity.tagId,
    materialId: entity.materialId,
    material: entity.material,
    woodworking: entity.woodworking,
    partMaterial: entity.partMaterial,
    cutOperations: entity.cutOperations
  } as Partial<Entity>;
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

type RectangleLoop = Readonly<{ origin: Vec3; width: number; depth: number; plane: DrawingPlane }>;
type PlaneSpec = Readonly<{ plane: DrawingPlane; a: 'x' | 'y' | 'z'; b: 'x' | 'y' | 'z'; c: 'x' | 'y' | 'z' }>;

const POINT_EPSILON = 1e-6;
const rectanglePlaneSpecs: readonly PlaneSpec[] = [
  { plane: 'xy', a: 'x', b: 'y', c: 'z' },
  { plane: 'xz', a: 'x', b: 'z', c: 'y' },
  { plane: 'yz', a: 'y', b: 'z', c: 'x' }
];

function findClosedRectangleLoop(edges: readonly EdgeEntity[], closing: EdgeEntity): RectangleLoop | undefined {
  for (const spec of rectanglePlaneSpecs) {
    const loop = findClosedRectangleLoopOnPlane(edges, closing, spec);
    if (loop) return loop;
  }
  return undefined;
}

function findClosedRectangleLoopOnPlane(edges: readonly EdgeEntity[], closing: EdgeEntity, spec: PlaneSpec): RectangleLoop | undefined {
  if (!nearlyEqual(closing.start[spec.c], closing.end[spec.c])) return undefined;
  const constant = closing.start[spec.c];
  const planeEdges = edges.filter((edge) => isEdgeOnPlane(edge, spec, constant) && isPlaneAxisAlignedEdge(edge, spec));
  if (!planeEdges.some((edge) => edge.id === closing.id)) return undefined;
  const aValues = uniqueSorted(planeEdges.flatMap((edge) => [edge.start[spec.a], edge.end[spec.a]]));
  const bValues = uniqueSorted(planeEdges.flatMap((edge) => [edge.start[spec.b], edge.end[spec.b]]));

  for (const minA of aValues) {
    for (const maxA of aValues.filter((value) => value > minA + POINT_EPSILON)) {
      for (const minB of bValues) {
        for (const maxB of bValues.filter((value) => value > minB + POINT_EPSILON)) {
          const corners = [
            pointForPlane(spec, minA, minB, constant),
            pointForPlane(spec, maxA, minB, constant),
            pointForPlane(spec, maxA, maxB, constant),
            pointForPlane(spec, minA, maxB, constant)
          ];
          if (!edgeMatchesAnySide(closing, corners)) continue;
          if (!allRectangleSidesExist(planeEdges, corners)) continue;
          return { origin: corners[0], width: maxA - minA, depth: maxB - minB, plane: spec.plane };
        }
      }
    }
  }
  return undefined;
}

function isEdgeOnPlane(edge: EdgeEntity, spec: PlaneSpec, constant: number): boolean {
  return nearlyEqual(edge.start[spec.c], constant) && nearlyEqual(edge.end[spec.c], constant);
}

function isPlaneAxisAlignedEdge(edge: EdgeEntity, spec: PlaneSpec): boolean {
  const sameA = nearlyEqual(edge.start[spec.a], edge.end[spec.a]);
  const sameB = nearlyEqual(edge.start[spec.b], edge.end[spec.b]);
  return sameA !== sameB;
}

function allRectangleSidesExist(edges: readonly EdgeEntity[], corners: readonly Vec3[]): boolean {
  return corners.every((corner, index) => edgeExists(edges, corner, corners[(index + 1) % corners.length]));
}

function edgeExists(edges: readonly EdgeEntity[], first: Vec3, second: Vec3): boolean {
  return edges.some((edge) => sameSegment(edge.start, edge.end, first, second));
}

function edgeMatchesAnySide(edge: EdgeEntity, corners: readonly Vec3[]): boolean {
  return corners.some((corner, index) => sameSegment(edge.start, edge.end, corner, corners[(index + 1) % corners.length]));
}

function sameSegment(a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): boolean {
  return (samePoint(a1, b1) && samePoint(a2, b2)) || (samePoint(a1, b2) && samePoint(a2, b1));
}

function sameVertexSet(first: readonly Vec3[], second: readonly Vec3[]): boolean {
  if (first.length !== second.length) return false;
  const remaining = [...second];
  for (const point of first) {
    const index = remaining.findIndex((candidate) => samePoint(point, candidate));
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return remaining.length === 0;
}

function samePoint(first: Vec3, second: Vec3): boolean {
  return nearlyEqual(first.x, second.x) && nearlyEqual(first.y, second.y) && nearlyEqual(first.z, second.z);
}

function nearlyEqual(first: number, second: number): boolean {
  return Math.abs(first - second) <= POINT_EPSILON;
}

function uniqueSorted(values: readonly number[]): number[] {
  const unique: number[] = [];
  for (const value of [...values].sort((a, b) => a - b)) {
    if (!unique.some((existing) => nearlyEqual(existing, value))) unique.push(value);
  }
  return unique;
}

function pointForPlane(spec: PlaneSpec, a: number, b: number, c: number): Vec3 {
  if (spec.plane === 'xy') return vec(a, b, c);
  if (spec.plane === 'xz') return vec(a, c, b);
  return vec(c, a, b);
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

function cloneEntityWithOffset(entity: Entity, offset: Vec3): Entity {
  if (entity.type === 'edge') {
    return { ...entity, id: nextId('edge'), start: add(entity.start, offset), end: add(entity.end, offset), componentId: undefined };
  }
  if (entity.type === 'face') {
    return { ...entity, id: nextId('face'), vertices: entity.vertices.map((vertex) => add(vertex, offset)), componentId: undefined };
  }
  if (entity.type === 'referenceMesh') {
    return { ...entity, id: nextId('mesh'), triangles: entity.triangles.map((triangle) => ({ vertices: translateVertices(triangle.vertices, offset) })), componentId: undefined };
  }
  if (entity.type === 'box') {
    return { ...entity, id: nextId('box'), origin: add(entity.origin, offset), componentId: undefined };
  }
  const exhaustive: never = entity;
  throw new Error(`Elementtyp kann nicht kopiert werden: ${String(exhaustive)}`);
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
