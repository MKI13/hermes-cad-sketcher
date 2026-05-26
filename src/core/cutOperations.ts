import type { Entity } from './model';
import { isBoardCutListKind } from './model';

export type CutOperationFace = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';
export type CutOperationPoint2 = Readonly<{ x: number; y: number }>;

export type DrillHoleOperation = Readonly<{
  id: string;
  type: 'drillHole';
  face: CutOperationFace;
  center: CutOperationPoint2;
  diameterMm: number;
  depthMm?: number;
}>;

export type DrillRowOperation = Readonly<{
  id: string;
  type: 'drillRow';
  face: CutOperationFace;
  start: CutOperationPoint2;
  spacingMm: number;
  count: number;
  diameterMm: number;
  depthMm?: number;
}>;

export type RectangularCutoutOperation = Readonly<{
  id: string;
  type: 'rectangularCutout';
  face: CutOperationFace;
  origin: CutOperationPoint2;
  widthMm: number;
  heightMm: number;
}>;

export type UnsupportedCutoutOperation = Readonly<{
  id: string;
  type: 'unsupportedCutout';
  reason: string;
}>;

export type CutOperation = DrillHoleOperation | DrillRowOperation | RectangularCutoutOperation | UnsupportedCutoutOperation;

export type CutOperationReadiness = Readonly<{
  ready: boolean;
  messages: string[];
}>;

const SAFE_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;
const FACES = new Set<CutOperationFace>(['top', 'bottom', 'front', 'back', 'left', 'right']);

export function normalizeCutOperation(operation: CutOperation): CutOperation {
  if (!isCutOperationPayload(operation)) throw new Error('Zuschnitt-Operation enthält ungültige Daten.');
  return structuredClone(operation);
}

export function isCutOperationPayload(value: unknown): value is CutOperation {
  if (!isRecord(value) || !isSafeId(value.id) || typeof value.type !== 'string') return false;
  if (value.type === 'unsupportedCutout') {
    return isNonEmptyString(value.reason) && Object.keys(value).every((key) => ['id', 'type', 'reason'].includes(key));
  }
  if (!isFace(value.face)) return false;
  if (value.type === 'drillHole') {
    return isPoint2(value.center) && isPositiveFinite(value.diameterMm) && optionalPositiveFinite(value.depthMm) &&
      Object.keys(value).every((key) => ['id', 'type', 'face', 'center', 'diameterMm', 'depthMm'].includes(key));
  }
  if (value.type === 'drillRow') {
    return isPoint2(value.start) && isPositiveFinite(value.spacingMm) && isPositiveInteger(value.count) && isPositiveFinite(value.diameterMm) && optionalPositiveFinite(value.depthMm) &&
      Object.keys(value).every((key) => ['id', 'type', 'face', 'start', 'spacingMm', 'count', 'diameterMm', 'depthMm'].includes(key));
  }
  if (value.type === 'rectangularCutout') {
    return isPoint2(value.origin) && isPositiveFinite(value.widthMm) && isPositiveFinite(value.heightMm) &&
      Object.keys(value).every((key) => ['id', 'type', 'face', 'origin', 'widthMm', 'heightMm'].includes(key));
  }
  return false;
}

export function hasValidCutOperations(value: unknown): value is CutOperation[] {
  return Array.isArray(value) && value.every(isCutOperationPayload);
}

export function cutOperationReadinessForEntity(entity: { cutOperations?: readonly CutOperation[] } | undefined): CutOperationReadiness {
  const messages: string[] = [];
  for (const operation of entity?.cutOperations ?? []) {
    if (operation.type === 'unsupportedCutout') {
      messages.push(`Nicht unterstützter Ausschnitt ${operation.id}: ${operation.reason}`);
    }
  }
  return { ready: messages.length === 0, messages };
}

export function boardEntitiesForCutList(entities: readonly Entity[]): Entity[] {
  return entities.filter((entity) => entity.woodworking ? isBoardCutListKind(entity.woodworking.kind) : false);
}

function isFace(value: unknown): value is CutOperationFace {
  return typeof value === 'string' && FACES.has(value as CutOperationFace);
}

function isPoint2(value: unknown): value is CutOperationPoint2 {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && Object.keys(value).every((key) => ['x', 'y'].includes(key));
}

function optionalPositiveFinite(value: unknown): boolean {
  return value === undefined || isPositiveFinite(value);
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && SAFE_ID_PATTERN.test(value.trim());
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
