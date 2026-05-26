import { vec, type Vec3 } from './geometry';
import { parseMeasurementBoxInput } from './measurementInput';
import type { BoxFaceName, DrawingPlane, EntityId, SketchModel, ToolName } from './model';

export type MeasurementApplicationResult =
  | { ok: true; action: 'created' | 'resized' | 'extruded'; entityId: EntityId; entityType: 'face' | 'box' }
  | { ok: false; error: string };

export type MeasurementApplicationOptions = {
  tool: ToolName;
  rawInput: string;
  drawingPlane: DrawingPlane;
  selectedId?: EntityId;
  selectedBoxFace?: BoxFaceName;
  defaultOrigin?: Vec3;
};

export function applyMeasurementBoxInputToModel(model: SketchModel, options: MeasurementApplicationOptions): MeasurementApplicationResult {
  const parsed = parseMeasurementBoxInput(options.tool, options.rawInput);
  if (!parsed.ok) return parsed;

  const origin = options.defaultOrigin ?? vec(0, 0, 0);
  const selected = options.selectedId ? model.getEntity(options.selectedId) : undefined;

  if (parsed.kind === 'rectangle') {
    if (selected?.type === 'face' && options.selectedId) {
      const entity = model.resizeRectangleFace(options.selectedId, parsed.width, parsed.depth);
      return { ok: true, action: 'resized', entityId: entity.id, entityType: 'face' };
    }
    const entity = model.createRectangle(origin, parsed.width, parsed.depth, {}, options.drawingPlane);
    return { ok: true, action: 'created', entityId: entity.id, entityType: 'face' };
  }

  if (parsed.kind === 'box') {
    if (selected?.type === 'box' && options.selectedId) {
      const entity = model.resizeBox(options.selectedId, { width: parsed.width, depth: parsed.depth, height: parsed.height });
      return { ok: true, action: 'resized', entityId: entity.id, entityType: 'box' };
    }
    const entity = model.createBox(origin, parsed.width, parsed.depth, parsed.height);
    return { ok: true, action: 'created', entityId: entity.id, entityType: 'box' };
  }

  if (parsed.kind === 'distance' && options.tool === 'pushPull') {
    if (selected?.type === 'face' && options.selectedId) {
      const entity = model.extrudeFaceToBox(options.selectedId, parsed.value);
      return { ok: true, action: 'extruded', entityId: entity.id, entityType: 'box' };
    }
    if (selected?.type === 'box' && options.selectedId) {
      const entity = model.pushPullBoxFace(options.selectedId, options.selectedBoxFace ?? 'top', parsed.value);
      return { ok: true, action: 'resized', entityId: entity.id, entityType: 'box' };
    }
    return { ok: false, error: 'Push/Pull braucht eine ausgewählte Fläche oder einen Körper.' };
  }

  return { ok: false, error: 'Diese Maßeingabe erzeugt keinen Körper oder kein Rechteck.' };
}
