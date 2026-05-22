import { SketchModel, type SketchModelSnapshot } from './model';

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

  if (!model.entities.every(isEntityPayload)) {
    throw new Error('Projektdatei enthält ungültige Elemente.');
  }

  const entityIds = new Set(model.entities.map((entity) => entity.id));
  if (!model.components.every((component) => isComponentPayload(component, entityIds))) {
    throw new Error('Projektdatei enthält ungültige Komponenten.');
  }

  return SketchModel.fromSnapshot(model);
}

function isEntityPayload(value: unknown): value is SketchModelSnapshot['entities'][number] {
  if (!isRecord(value) || typeof value.id !== 'string') return false;
  if ('componentId' in value && value.componentId !== undefined && typeof value.componentId !== 'string') return false;

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

function isReferenceMeshTriangle(value: unknown): value is { vertices: [{ x: number; y: number; z: number }, { x: number; y: number; z: number }, { x: number; y: number; z: number }] } {
  return isRecord(value) && Array.isArray(value.vertices) && value.vertices.length === 3 && value.vertices.every(isVec3);
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
