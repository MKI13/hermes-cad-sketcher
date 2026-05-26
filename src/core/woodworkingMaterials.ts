import type { MaterialId } from './materials';

export type WoodworkingGrainDirection = 'length' | 'width' | 'none' | 'unknown';
export type WoodworkingEdgeName = 'front' | 'back' | 'left' | 'right';
export type WoodworkingFaceName = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';

export type EdgeBandingMetadata = Readonly<{
  materialId?: MaterialId;
  materialName?: string;
  thicknessMm: number;
}>;

export type PartFaceMaterialOverride = Readonly<{
  materialId: MaterialId;
  materialName?: string;
  reason: string;
}>;

export type PartMaterialMetadata = Readonly<{
  materialId: MaterialId;
  materialName: string;
  boardType?: string;
  thicknessMm: number;
  grainDirection: WoodworkingGrainDirection;
  edging?: Partial<Record<WoodworkingEdgeName, EdgeBandingMetadata>>;
  faceOverrides?: Partial<Record<WoodworkingFaceName, PartFaceMaterialOverride>>;
}>;

export type PartMaterialReadiness = Readonly<{
  ready: boolean;
  messages: string[];
}>;

export type PartMaterialCarrier = Readonly<{
  type?: string;
  partMaterial?: PartMaterialMetadata;
}> | undefined;

const SAFE_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;
const GRAIN_DIRECTIONS = new Set<WoodworkingGrainDirection>(['length', 'width', 'none', 'unknown']);
const EDGE_NAMES = new Set<WoodworkingEdgeName>(['front', 'back', 'left', 'right']);
const FACE_NAMES = new Set<WoodworkingFaceName>(['top', 'bottom', 'front', 'back', 'left', 'right']);

export function normalizePartMaterialMetadata(metadata: PartMaterialMetadata): PartMaterialMetadata {
  if (!isPartMaterialPayload(metadata)) throw new Error('Ungültige Zuschnitt-Materialdaten.');
  const normalized: PartMaterialMetadata = {
    materialId: metadata.materialId.trim(),
    materialName: metadata.materialName.trim(),
    thicknessMm: metadata.thicknessMm,
    grainDirection: metadata.grainDirection,
    ...(metadata.boardType ? { boardType: metadata.boardType.trim() } : {}),
    ...(metadata.edging ? { edging: normalizeEdging(metadata.edging) } : {}),
    ...(metadata.faceOverrides ? { faceOverrides: normalizeFaceOverrides(metadata.faceOverrides) } : {})
  };
  return structuredClone(normalized);
}

export function isPartMaterialPayload(value: unknown): value is PartMaterialMetadata {
  if (!isRecord(value)) return false;
  if (!isSafeId(value.materialId)) return false;
  if (!isNonEmptyString(value.materialName)) return false;
  if (!isPositiveFinite(value.thicknessMm)) return false;
  if (!isGrainDirection(value.grainDirection)) return false;
  if ('boardType' in value && value.boardType !== undefined && !isNonEmptyString(value.boardType)) return false;
  if ('edging' in value && value.edging !== undefined && !isEdgeBandingPayload(value.edging)) return false;
  if ('faceOverrides' in value && value.faceOverrides !== undefined && !isFaceOverridesPayload(value.faceOverrides)) return false;
  return Object.keys(value).every((key) => ['materialId', 'materialName', 'boardType', 'thicknessMm', 'grainDirection', 'edging', 'faceOverrides'].includes(key));
}

export function partMaterialReadinessForEntity(entity: PartMaterialCarrier): PartMaterialReadiness {
  const messages: string[] = [];
  const metadata = entity?.partMaterial;
  if (!metadata) {
    return { ready: false, messages: ['Materialdaten fehlen', 'Faserrichtung fehlt'] };
  }
  if (!isSafeId(metadata.materialId) || !isNonEmptyString(metadata.materialName) || !isPositiveFinite(metadata.thicknessMm)) {
    messages.push('Materialdaten fehlen');
  }
  if (metadata.grainDirection === 'unknown' || !isGrainDirection(metadata.grainDirection)) {
    messages.push('Faserrichtung fehlt');
  }
  return { ready: messages.length === 0, messages };
}

function normalizeEdging(edging: Partial<Record<WoodworkingEdgeName, EdgeBandingMetadata>>): Partial<Record<WoodworkingEdgeName, EdgeBandingMetadata>> {
  const normalized: Partial<Record<WoodworkingEdgeName, EdgeBandingMetadata>> = {};
  for (const [edge, banding] of Object.entries(edging)) {
    if (!EDGE_NAMES.has(edge as WoodworkingEdgeName) || !banding) continue;
    normalized[edge as WoodworkingEdgeName] = {
      ...(banding.materialId ? { materialId: banding.materialId.trim() } : {}),
      ...(banding.materialName ? { materialName: banding.materialName.trim() } : {}),
      thicknessMm: banding.thicknessMm
    };
  }
  return normalized;
}

function normalizeFaceOverrides(faceOverrides: Partial<Record<WoodworkingFaceName, PartFaceMaterialOverride>>): Partial<Record<WoodworkingFaceName, PartFaceMaterialOverride>> {
  const normalized: Partial<Record<WoodworkingFaceName, PartFaceMaterialOverride>> = {};
  for (const [face, override] of Object.entries(faceOverrides)) {
    if (!FACE_NAMES.has(face as WoodworkingFaceName) || !override) continue;
    normalized[face as WoodworkingFaceName] = {
      materialId: override.materialId.trim(),
      ...(override.materialName ? { materialName: override.materialName.trim() } : {}),
      reason: override.reason.trim()
    };
  }
  return normalized;
}

function isEdgeBandingPayload(value: unknown): value is Partial<Record<WoodworkingEdgeName, EdgeBandingMetadata>> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([edge, banding]) => {
    if (!EDGE_NAMES.has(edge as WoodworkingEdgeName) || !isRecord(banding)) return false;
    if ('materialId' in banding && banding.materialId !== undefined && !isSafeId(banding.materialId)) return false;
    if ('materialName' in banding && banding.materialName !== undefined && !isNonEmptyString(banding.materialName)) return false;
    if (!isPositiveFinite(banding.thicknessMm)) return false;
    return Object.keys(banding).every((key) => ['materialId', 'materialName', 'thicknessMm'].includes(key));
  });
}

function isFaceOverridesPayload(value: unknown): value is Partial<Record<WoodworkingFaceName, PartFaceMaterialOverride>> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([face, override]) => {
    if (!FACE_NAMES.has(face as WoodworkingFaceName) || !isRecord(override)) return false;
    if (!isSafeId(override.materialId)) return false;
    if ('materialName' in override && override.materialName !== undefined && !isNonEmptyString(override.materialName)) return false;
    if (!isNonEmptyString(override.reason)) return false;
    return Object.keys(override).every((key) => ['materialId', 'materialName', 'reason'].includes(key));
  });
}

function isGrainDirection(value: unknown): value is WoodworkingGrainDirection {
  return typeof value === 'string' && GRAIN_DIRECTIONS.has(value as WoodworkingGrainDirection);
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && SAFE_ID_PATTERN.test(value.trim());
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
