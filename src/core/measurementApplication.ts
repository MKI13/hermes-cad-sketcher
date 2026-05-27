import { add, length, scale, sub, vec, type Vec3 } from './geometry';
import { parseMeasurementBoxInput } from './measurementInput';
import type { BoxFaceName, DrawingPlane, EntityId, SketchModel, ToolName } from './model';

export type MeasurementApplicationResult =
  | { ok: true; action: 'created' | 'resized' | 'extruded' | 'moved' | 'rotated'; entityId: EntityId; entityType: 'edge' | 'face' | 'box' | 'referenceMesh' }
  | { ok: false; error: string };

export type MeasurementApplicationOptions = {
  tool: ToolName;
  rawInput: string;
  drawingPlane: DrawingPlane;
  selectedId?: EntityId;
  selectedBoxFace?: BoxFaceName;
  defaultOrigin?: Vec3;
  pendingStartPoint?: Vec3;
  directionPoint?: Vec3;
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

  if (parsed.kind === 'distance' && options.tool === 'line') {
    const start = options.pendingStartPoint;
    const directionPoint = options.directionPoint;
    if (!start || !directionPoint) return { ok: false, error: 'Linienmaß braucht Startpunkt und Maus-Richtung.' };
    const delta = sub(directionPoint, start);
    const deltaLength = length(delta);
    if (deltaLength <= 0) return { ok: false, error: 'Linienmaß braucht eine eindeutige Maus-Richtung.' };
    const direction = scale(delta, 1 / deltaLength);
    const entity = model.createLine(start, add(start, scale(direction, parsed.value)));
    return { ok: true, action: 'created', entityId: entity.id, entityType: 'edge' };
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

  if (parsed.kind === 'vector' && options.tool === 'move') {
    if (!selected || !options.selectedId) return { ok: false, error: 'Verschieben braucht ein ausgewähltes Element.' };
    const entity = model.moveEntity(options.selectedId, vec(parsed.x, parsed.y, parsed.z));
    return { ok: true, action: 'moved', entityId: entity.id, entityType: entity.type };
  }

  if (parsed.kind === 'angle' && options.tool === 'rotate') {
    if (!selected || !options.selectedId) return { ok: false, error: 'Drehen braucht ein ausgewähltes Element.' };
    const entity = model.rotateEntityZ(options.selectedId, parsed.degrees * Math.PI / 180);
    return { ok: true, action: 'rotated', entityId: entity.id, entityType: entity.type };
  }

  return { ok: false, error: 'Diese Maßeingabe erzeugt keinen Körper oder kein Rechteck.' };
}
