import { SketchModel, type SketchModelSnapshot } from './model';
import { distance, sub, vec, type Vec3 } from './geometry';

export const PROJECT_FILE_VERSION = 1;
export const PROJECT_FILE_FORMAT = 'hermes-cad-sketcher';

export type HermesCadProjectFile = Readonly<{
  format: typeof PROJECT_FILE_FORMAT;
  version: typeof PROJECT_FILE_VERSION;
  createdBy: 'Hermes CAD Sketcher';
  model: SketchModelSnapshot;
}>;

export function exportProjectFile(model: SketchModel): string {
  const document: HermesCadProjectFile = {
    format: PROJECT_FILE_FORMAT,
    version: PROJECT_FILE_VERSION,
    createdBy: 'Hermes CAD Sketcher',
    model: model.snapshot()
  };
  return JSON.stringify(document, null, 2) + '\n';
}

export function importProjectFile(text: string): SketchModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Projektdatei ist kein gültiges JSON.');
  }

  if (!isRecord(parsed) || parsed.format !== PROJECT_FILE_FORMAT) {
    throw new Error('Nicht unterstütztes Projektformat.');
  }

  if (parsed.version !== PROJECT_FILE_VERSION) {
    throw new Error('Nicht unterstützte Projektdatei-Version.');
  }

  if (!isRecord(parsed.model) || parsed.model.unit !== 'mm') {
    throw new Error('Nur Millimeter-Projekte werden unterstützt.');
  }

  const model = parsed.model as SketchModelSnapshot;
  if (!Array.isArray(model.entities) || !Array.isArray(model.components)) {
    throw new Error('Projektdatei enthält kein gültiges Modell.');
  }

  if (!hasValidTagCatalog(model.tags)) {
    throw new Error('Projektdatei enthält ungültige Tags.');
  }

  if (!hasValidMaterialCatalog(model.materials)) {
    throw new Error('Projektdatei enthält ungültige Materialien.');
  }

  const tagIds = idsFromOptionalCatalog(model.tags, 'untagged');
  const materialIds = idsFromOptionalCatalog(model.materials, 'default');
  if (!model.entities.every((entity) => isEntityPayload(entity, tagIds, materialIds))) {
    throw new Error('Projektdatei enthält ungültige Elemente.');
  }

  const entityIds = new Set(model.entities.map((entity) => entity.id));
  if (!model.components.every((component) => isComponentPayload(component, entityIds))) {
    throw new Error('Projektdatei enthält ungültige Komponenten.');
  }

  if (model.componentDefinitions !== undefined && !Array.isArray(model.componentDefinitions)) {
    throw new Error('Projektdatei enthält ungültige Komponenten-Definitionen.');
  }
  if (model.componentInstances !== undefined && !Array.isArray(model.componentInstances)) {
    throw new Error('Projektdatei enthält ungültige Komponenten-Instanzen.');
  }
  const definitionIds = new Set((model.componentDefinitions ?? []).map((definition) => definition.id));
  if (!(model.componentDefinitions ?? []).every((definition) => isComponentDefinitionPayload(definition, entityIds))) {
    throw new Error('Projektdatei enthält ungültige Komponenten-Definitionen.');
  }
  if (!(model.componentInstances ?? []).every((instance) => isComponentInstancePayload(instance, definitionIds))) {
    throw new Error('Projektdatei enthält ungültige Komponenten-Instanzen.');
  }

  return SketchModel.fromSnapshot(model);
}

function isEntityPayload(value: unknown, knownTagIds: ReadonlySet<string>, knownMaterialIds: ReadonlySet<string>): value is SketchModelSnapshot['entities'][number] {
  if (!isRecord(value) || typeof value.id !== 'string') return false;
  if ('componentId' in value && value.componentId !== undefined && typeof value.componentId !== 'string') return false;
  if (!hasValidLayerMetadata(value)) return false;
  if (!hasValidEntityTagAndMaterialMetadata(value, knownTagIds, knownMaterialIds)) return false;

  if (value.type === 'edge') {
    return isVec3(value.start) && isVec3(value.end);
  }

  if (value.type === 'face') {
    return Array.isArray(value.vertices) && value.vertices.length >= 3 && value.vertices.every(isVec3);
  }

  if (value.type === 'referenceMesh') {
    return typeof value.name === 'string' && Array.isArray(value.triangles) && value.triangles.length > 0 && value.triangles.every(isReferenceMeshTriangle) && value.triangleCount === value.triangles.length;
  }

  if (value.type === 'box') {
    return isVec3(value.origin) && isPositiveNumber(value.width) && isPositiveNumber(value.depth) && isPositiveNumber(value.height) && isFiniteNumber(value.rotationZ);
  }

  return false;
}

function isComponentPayload(value: unknown, knownEntityIds: ReadonlySet<string>): value is SketchModelSnapshot['components'][number] {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.entityIds) &&
    value.entityIds.length > 0 &&
    value.entityIds.every((entityId) => typeof entityId === 'string' && knownEntityIds.has(entityId))
  );
}

function isComponentDefinitionPayload(value: unknown, knownEntityIds: ReadonlySet<string>): value is NonNullable<SketchModelSnapshot['componentDefinitions']>[number] {
  if (!isComponentPayload(value, knownEntityIds)) return false;
  if (!('localAxes' in value) || value.localAxes === undefined) return true;
  if (!isRecord(value.localAxes)) return false;
  const axes = new Set(['x', 'y', 'z']);
  return axes.has(String(value.localAxes.length)) && axes.has(String(value.localAxes.width)) && axes.has(String(value.localAxes.thickness));
}

function isComponentInstancePayload(value: unknown, knownDefinitionIds: ReadonlySet<string>): value is NonNullable<SketchModelSnapshot['componentInstances']>[number] {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.definitionId === 'string' &&
    knownDefinitionIds.has(value.definitionId) &&
    hasValidComponentTransform(value.transform)
  );
}

function hasValidComponentTransform(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isVec3(value.translation) && isFiniteNumber(value.rotationZ) && isVec3(value.scale) &&
    Math.abs(value.scale.x - 1) <= 1e-9 && Math.abs(value.scale.y - 1) <= 1e-9 && Math.abs(value.scale.z - 1) <= 1e-9;
}

function hasValidLayerMetadata(value: Record<string, unknown>): boolean {
  if (!('layer' in value) || value.layer === undefined) return true;
  return typeof value.layer === 'string' && isSafeLayerName(value.layer);
}

function hasValidEntityTagAndMaterialMetadata(value: Record<string, unknown>, knownTagIds: ReadonlySet<string>, knownMaterialIds: ReadonlySet<string>): boolean {
  if ('tagId' in value && value.tagId !== undefined && (typeof value.tagId !== 'string' || !knownTagIds.has(value.tagId))) return false;
  if ('materialId' in value && value.materialId !== undefined && (typeof value.materialId !== 'string' || !knownMaterialIds.has(value.materialId))) return false;
  if ('material' in value && value.material !== undefined && !isValidLegacyMaterialAssignment(value.material, knownMaterialIds)) return false;
  return true;
}

function isValidLegacyMaterialAssignment(value: unknown, knownMaterialIds: ReadonlySet<string>): boolean {
  if (!isRecord(value)) return false;
  if ('materialId' in value && value.materialId !== undefined && (typeof value.materialId !== 'string' || !knownMaterialIds.has(value.materialId))) return false;
  if ('name' in value && value.name !== undefined && (typeof value.name !== 'string' || value.name.trim().length === 0)) return false;
  if ('color' in value && value.color !== undefined && (typeof value.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.color.trim()))) return false;
  if ('previewUrl' in value && value.previewUrl !== undefined && (typeof value.previewUrl !== 'string' || !isSafeLocalMaterialUrl(value.previewUrl))) return false;
  if ('textureDataUrl' in value && value.textureDataUrl !== undefined && (typeof value.textureDataUrl !== 'string' || !isSafeImageDataUrl(value.textureDataUrl))) return false;
  if ('textureFileName' in value && value.textureFileName !== undefined && (typeof value.textureFileName !== 'string' || value.textureFileName.trim().length === 0 || /[\\/]/.test(value.textureFileName))) return false;
  return Object.keys(value).every((key) => ['materialId', 'name', 'color', 'previewUrl', 'textureDataUrl', 'textureFileName'].includes(key));
}

function isSafeLocalMaterialUrl(value: string): boolean {
  return value.startsWith('blob:') || isSafeImageDataUrl(value);
}

function isSafeImageDataUrl(value: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp|gif|bmp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(value);
}

function hasValidTagCatalog(tags: unknown): boolean {
  if (tags === undefined) return true;
  if (!Array.isArray(tags)) return false;
  const seen = new Set<string>();
  for (const tag of tags) {
    if (!isRecord(tag) || typeof tag.id !== 'string' || typeof tag.name !== 'string' || typeof tag.visible !== 'boolean') return false;
    if (!isSafeCatalogId(tag.id) || tag.name.trim().length === 0 || seen.has(tag.id)) return false;
    seen.add(tag.id);
  }
  return true;
}

function hasValidMaterialCatalog(materials: unknown): boolean {
  if (materials === undefined) return true;
  if (!Array.isArray(materials)) return false;
  const seen = new Set<string>();
  for (const material of materials) {
    if (!isRecord(material) || typeof material.id !== 'string' || typeof material.name !== 'string' || typeof material.color !== 'string') return false;
    if (!isSafeCatalogId(material.id) || material.name.trim().length === 0 || !/^#[0-9a-f]{6}$/i.test(material.color.trim()) || seen.has(material.id)) return false;
    if ('transparent' in material && material.transparent !== undefined && typeof material.transparent !== 'boolean') return false;
    seen.add(material.id);
  }
  return true;
}

function idsFromOptionalCatalog(catalog: unknown, defaultId: string): Set<string> {
  if (!Array.isArray(catalog)) return new Set([defaultId]);
  return new Set([defaultId, ...catalog.map((entry) => isRecord(entry) && typeof entry.id === 'string' ? entry.id : '')]);
}

function isSafeCatalogId(value: string): boolean {
  return value.trim().length > 0 && /^[A-Za-z0-9_.-]+$/.test(value);
}

function isSafeLayerName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && /^[A-Za-z0-9_. -]+$/.test(trimmed);
}

function isReferenceMeshTriangle(value: unknown): value is { vertices: [{ x: number; y: number; z: number }, { x: number; y: number; z: number }, { x: number; y: number; z: number }] } {
  if (!isRecord(value) || !Array.isArray(value.vertices) || value.vertices.length !== 3) return false;
  const vertices = value.vertices;
  if (![0, 1, 2].every((index) => Object.hasOwn(vertices, index) && isVec3(vertices[index]))) return false;
  return triangleAreaMagnitude(vertices as [Vec3, Vec3, Vec3]) > 1e-9;
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

function isVec3(value: unknown): value is { x: number; y: number; z: number } {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFiniteNumber(value.z);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
