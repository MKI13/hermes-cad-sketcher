import type { RenderEngine, RenderQuality } from './rendering';

export type RenderCommand =
  | { type: 'render.applyPreset'; presetId: string }
  | { type: 'render.assignMaterial'; target: { selection?: boolean; entityId?: string; componentId?: string }; materialId: string }
  | { type: 'render.createMaterial'; material: unknown }
  | { type: 'render.setCameraFromCurrentView'; cameraId?: string }
  | { type: 'render.selectCamera'; cameraId: string }
  | { type: 'render.setEnvironment'; environmentId: string }
  | { type: 'render.addLight'; light: unknown }
  | { type: 'render.updateLight'; lightId: string; patch: unknown }
  | { type: 'render.startPreview' }
  | { type: 'render.startJob'; engine?: RenderEngine; quality: RenderQuality; width: number; height: number }
  | { type: 'render.cancelJob'; jobId?: string };

export type RenderCommandContext = Readonly<{
  knownMaterialIds: ReadonlySet<string>;
  hasSelection: boolean;
  bridgeAvailable: boolean;
}>;

export type RenderCommandValidationResult =
  | { ok: true; command: RenderCommand }
  | { ok: false; message: string };

const SAFE_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;
const ALLOWED_COMMANDS = new Set([
  'render.applyPreset',
  'render.assignMaterial',
  'render.createMaterial',
  'render.setCameraFromCurrentView',
  'render.selectCamera',
  'render.setEnvironment',
  'render.addLight',
  'render.updateLight',
  'render.startPreview',
  'render.startJob',
  'render.cancelJob'
]);

export function validateRenderCommand(value: unknown, context: RenderCommandContext): RenderCommandValidationResult {
  if (!isRecord(value) || typeof value.type !== 'string') return { ok: false, message: 'Render-Befehl ist kein gültiges JSON-Objekt.' };
  if (!ALLOWED_COMMANDS.has(value.type)) return { ok: false, message: `Render-Befehl nicht erlaubt: ${value.type}` };

  if (value.type === 'render.assignMaterial') return validateAssignMaterial(value, context);
  if (value.type === 'render.startJob') return validateStartJob(value, context);
  if (value.type === 'render.applyPreset') return validateIdCommand(value, 'presetId');
  if (value.type === 'render.selectCamera') return validateIdCommand(value, 'cameraId');
  if (value.type === 'render.setEnvironment') return validateIdCommand(value, 'environmentId');
  if (value.type === 'render.updateLight') return validateIdWithPayload(value, 'lightId', 'patch');
  if (value.type === 'render.setCameraFromCurrentView') {
    if ('cameraId' in value && value.cameraId !== undefined && (!isSafeId(value.cameraId))) return { ok: false, message: 'Kamera-ID ist ungültig.' };
    return { ok: true, command: value as RenderCommand };
  }
  if (value.type === 'render.addLight') {
    if (!('light' in value)) return { ok: false, message: 'Licht-Befehl braucht ein light-Objekt.' };
    return { ok: true, command: value as RenderCommand };
  }
  if (value.type === 'render.createMaterial') {
    if (!('material' in value)) return { ok: false, message: 'Material-Befehl braucht ein material-Objekt.' };
    return { ok: true, command: value as RenderCommand };
  }
  if (value.type === 'render.cancelJob') {
    if ('jobId' in value && value.jobId !== undefined && !isSafeId(value.jobId)) return { ok: false, message: 'Render-Job-ID ist ungültig.' };
    return { ok: true, command: value as RenderCommand };
  }
  return { ok: true, command: value as RenderCommand };
}

function validateAssignMaterial(value: Record<string, unknown>, context: RenderCommandContext): RenderCommandValidationResult {
  if (!isRecord(value.target)) return { ok: false, message: 'Render-Materialbefehl braucht ein Ziel.' };
  if (value.target.selection === true && !context.hasSelection) return { ok: false, message: 'Render-Material kann nicht zugewiesen werden: keine Auswahl vorhanden.' };
  if (value.target.entityId !== undefined && !isSafeId(value.target.entityId)) return { ok: false, message: 'Entity-ID im Render-Ziel ist ungültig.' };
  if (value.target.componentId !== undefined && !isSafeId(value.target.componentId)) return { ok: false, message: 'Component-ID im Render-Ziel ist ungültig.' };
  if (typeof value.materialId !== 'string' || !isSafeId(value.materialId)) return { ok: false, message: 'Render-Material-ID ist ungültig.' };
  if (!context.knownMaterialIds.has(value.materialId)) return { ok: false, message: `Material unbekannt: ${value.materialId}` };
  return { ok: true, command: value as RenderCommand };
}

function validateStartJob(value: Record<string, unknown>, context: RenderCommandContext): RenderCommandValidationResult {
  const engine = value.engine === undefined ? 'three-preview' : value.engine;
  if (engine !== 'three-preview' && engine !== 'blender-eevee' && engine !== 'blender-cycles') return { ok: false, message: 'Render-Engine ist unbekannt.' };
  if ((engine === 'blender-eevee' || engine === 'blender-cycles') && !context.bridgeAvailable) {
    return { ok: false, message: 'Lokale Render-Bridge läuft nicht. Externe Blender-Renderjobs bleiben fail-closed.' };
  }
  if (value.quality !== 'draft' && value.quality !== 'preview' && value.quality !== 'final') return { ok: false, message: 'Render-Qualität ist ungültig.' };
  if (!isSafeImageDimension(value.width, 320, 7680) || !isSafeImageDimension(value.height, 240, 4320)) {
    return { ok: false, message: 'Render-Bildgröße muss zwischen 320×240 und 7680×4320 liegen.' };
  }
  return { ok: true, command: { type: 'render.startJob', engine, quality: value.quality, width: value.width, height: value.height } as RenderCommand };
}

function validateIdCommand(value: Record<string, unknown>, field: string): RenderCommandValidationResult {
  if (!isSafeId(value[field])) return { ok: false, message: `${field} ist ungültig.` };
  return { ok: true, command: value as RenderCommand };
}

function validateIdWithPayload(value: Record<string, unknown>, idField: string, payloadField: string): RenderCommandValidationResult {
  if (!isSafeId(value[idField])) return { ok: false, message: `${idField} ist ungültig.` };
  if (!(payloadField in value)) return { ok: false, message: `${payloadField} fehlt.` };
  return { ok: true, command: value as RenderCommand };
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_PATTERN.test(value) && value.length > 0;
}

function isSafeImageDimension(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
