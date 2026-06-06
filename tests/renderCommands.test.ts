import { describe, expect, it } from 'vitest';
import { validateRenderCommand } from '../src/core/renderCommands';

describe('safe render chat commands', () => {
  const context = { knownMaterialIds: new Set(['oak-natural-matte', 'white-lacquered']), hasSelection: true, bridgeAvailable: false };

  it('accepts known structured render commands without executing free code', () => {
    const result = validateRenderCommand({ type: 'render.assignMaterial', target: { selection: true }, materialId: 'oak-natural-matte' }, context);

    expect(result).toEqual({ ok: true, command: { type: 'render.assignMaterial', target: { selection: true }, materialId: 'oak-natural-matte' } });
  });

  it('fails closed for unknown commands, unknown material, and missing selection', () => {
    expect(validateRenderCommand({ type: 'eval', script: 'alert(1)' }, context)).toMatchObject({ ok: false, message: expect.stringContaining('nicht erlaubt') });
    expect(validateRenderCommand({ type: 'render.assignMaterial', target: { selection: true }, materialId: 'missing' }, context)).toMatchObject({ ok: false, message: expect.stringContaining('Material unbekannt') });
    expect(validateRenderCommand({ type: 'render.assignMaterial', target: { selection: true }, materialId: 'white-lacquered' }, { ...context, hasSelection: false })).toMatchObject({ ok: false, message: expect.stringContaining('keine Auswahl') });
  });

  it('requires a running bridge before external render jobs can start', () => {
    expect(validateRenderCommand({ type: 'render.startJob', engine: 'blender-cycles', quality: 'final', width: 1920, height: 1080 }, context)).toMatchObject({ ok: false, message: expect.stringContaining('Render-Bridge') });
    expect(validateRenderCommand({ type: 'render.startJob', engine: 'three-preview', quality: 'preview', width: 1280, height: 720 }, context)).toMatchObject({ ok: true });
  });

  it('rejects render jobs outside safe image dimensions', () => {
    expect(validateRenderCommand({ type: 'render.startJob', engine: 'three-preview', quality: 'preview', width: 120, height: 720 }, context)).toMatchObject({ ok: false, message: expect.stringContaining('Bildgröße') });
    expect(validateRenderCommand({ type: 'render.startJob', engine: 'three-preview', quality: 'preview', width: 1280, height: 9000 }, context)).toMatchObject({ ok: false, message: expect.stringContaining('Bildgröße') });
  });
});
