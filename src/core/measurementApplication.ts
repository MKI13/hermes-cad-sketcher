import { type Vec3 } from './geometry';
import { isPositiveFinite, SketchModel, type EntityId, type ToolName } from './model';

export type MeasurementApplicationResult =
  | { ok: true; action: 'created' | 'resized'; entityId: EntityId; entityType: 'face' | 'box' }
  | { ok: false; error: string };

export type MeasurementApplicationInput = {
  tool: Extract<ToolName, 'rectangle' | 'box'>;
  rawInput: string;
  selectedId?: EntityId;
  defaultOrigin: Vec3;
};

export function applyMeasurementInputTransaction(
  currentModel: SketchModel,
  input: MeasurementApplicationInput,
  commit: (nextModel: SketchModel, result: Extract<MeasurementApplicationResult, { ok: true }>) => void
): MeasurementApplicationResult {
  const nextModel = SketchModel.fromSnapshot(currentModel.snapshot());
  try {
    const result = applyMeasurementBoxInputToModel(nextModel, input);
    if (!result.ok) return result;
    commit(nextModel, result);
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Maße konnten nicht angewendet werden.' };
  }
}

export function applyMeasurementBoxInputToModel(model: SketchModel, input: MeasurementApplicationInput): MeasurementApplicationResult {
  const parsed = parseMeasurementValues(input.rawInput, input.tool === 'rectangle' ? 2 : 3);
  if (!parsed.ok) return parsed;

  if (input.tool === 'rectangle') {
    const [width, depth] = parsed.values;
    const selected = input.selectedId ? model.getEntity(input.selectedId) : undefined;
    if (selected?.type === 'face') {
      const resized = model.resizeRectangleFace(selected.id, width, depth);
      return { ok: true, action: 'resized', entityId: resized.id, entityType: 'face' };
    }
    const created = model.createRectangle(input.defaultOrigin, width, depth);
    return { ok: true, action: 'created', entityId: created.id, entityType: 'face' };
  }

  const [width, depth, height] = parsed.values;
  const selected = input.selectedId ? model.getEntity(input.selectedId) : undefined;
  if (selected?.type === 'box') {
    const resized = model.resizeBox(selected.id, { width, depth, height });
    return { ok: true, action: 'resized', entityId: resized.id, entityType: 'box' };
  }
  const created = model.createBox(input.defaultOrigin, width, depth, height);
  return { ok: true, action: 'created', entityId: created.id, entityType: 'box' };
}

function parseMeasurementValues(rawInput: string, expectedCount: 2 | 3): { ok: true; values: number[] } | { ok: false; error: string } {
  const parts = rawInput.split(',').map((part) => part.trim());
  if (parts.length !== expectedCount || parts.some((part) => part === '')) {
    return { ok: false, error: expectedCount === 2 ? 'Rechteckmaße brauchen Breite,Tiefe in Millimeter.' : 'Körpermaße brauchen Breite,Tiefe,Höhe in Millimeter.' };
  }
  const values = parts.map(Number);
  if (values.some((value) => !isPositiveFinite(value))) {
    return { ok: false, error: 'Maße müssen positive endliche Millimeterwerte sein.' };
  }
  return { ok: true, values };
}
