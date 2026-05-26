import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PushPullPanel, parsePushPullDelta, validatePushPullHeight } from '../src/ui/PushPullPanel';

describe('PushPullPanel', () => {
  it('renders a visible millimeter height delta input for selected boxes', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel disabled={false} selectedType="box" deltaHeight="100" onDeltaHeightChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('Höhe ändern');
    expect(markup).toContain('ΔH');
    expect(markup).toContain('mm');
    expect(markup).toContain('aria-label="Höhenänderung in Millimeter"');
  });

  it('parses signed finite millimeter height deltas', () => {
    expect(parsePushPullDelta('150')).toEqual({ ok: true, deltaHeight: 150 });
    expect(parsePushPullDelta('-25.5')).toEqual({ ok: true, deltaHeight: -25.5 });
  });

  it('rejects empty, zero and non-finite height deltas before model mutation', () => {
    expect(parsePushPullDelta('').ok).toBe(false);
    expect(parsePushPullDelta('0').ok).toBe(false);
    expect(parsePushPullDelta('NaN').ok).toBe(false);
    expect(parsePushPullDelta('Infinity').ok).toBe(false);
  });

  it('rejects deltas that would make the selected box height zero or negative', () => {
    expect(validatePushPullHeight({ selectedBox: { width: 600, depth: 400, height: 720 } }, { ok: true, deltaHeight: -719 })).toEqual({ ok: true, deltaHeight: -719 });
    expect(validatePushPullHeight({ selectedBox: { width: 600, depth: 400, height: 720 } }, { ok: true, deltaHeight: -720 })).toEqual({
      ok: false,
      error: 'Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.'
    });
    expect(validatePushPullHeight({ selectedBox: { width: 600, depth: 400, height: 720 } }, { ok: true, deltaHeight: -900 })).toEqual({
      ok: false,
      error: 'Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.'
    });
  });

  it('disables the apply action and shows an error when the final height would be invalid', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel
        disabled={false}
        selectedType="box"
        selectedBox={{ width: 600, depth: 400, height: 720 }}
        deltaHeight="-720"
        onDeltaHeightChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.');
  });


  it('validates side-face Push/Pull against the affected width or depth', () => {
    const box = { width: 600, depth: 400, height: 720 };

    expect(validatePushPullHeight({ selectedBox: box, selectedBoxFace: 'right' }, { ok: true, deltaHeight: -599 })).toEqual({ ok: true, deltaHeight: -599 });
    expect(validatePushPullHeight({ selectedBox: box, selectedBoxFace: 'right' }, { ok: true, deltaHeight: -600 })).toEqual({
      ok: false,
      error: 'Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.'
    });
    expect(validatePushPullHeight({ selectedBox: box, selectedBoxFace: 'front' }, { ok: true, deltaHeight: -400 })).toEqual({
      ok: false,
      error: 'Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.'
    });
  });

  it('disables side-face Push/Pull when the affected final dimension would be invalid', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel
        disabled={false}
        selectedType="box"
        selectedBox={{ width: 600, depth: 400, height: 720 }}
        selectedBoxFace="right"
        deltaHeight="-600"
        onDeltaHeightChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Push/Pull darf das betroffene Maß nicht auf null oder negativ setzen.');
  });

  it('disables the apply action when the selected entity is not a box', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel disabled={true} selectedType="edge" deltaHeight="100" onDeltaHeightChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Körper oder Rechteckfläche auswählen');
  });

  it('enables Push/Pull for selected rectangle faces', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel
        disabled={false}
        selectedType="face"
        selectedFace={{ id: 'face_1', type: 'face', vertices: [{ x: 0, y: 0, z: 0 }, { x: 100, y: 0, z: 0 }, { x: 100, y: 50, z: 0 }, { x: 0, y: 50, z: 0 }] }}
        deltaHeight="100"
        onDeltaHeightChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('Push/Pull');
    expect(markup).toContain('Ausgewählte Rechteckfläche mit positiver Distanz zu einem Körper extrudieren.');
    expect(markup).not.toContain('disabled=""');
  });

  it('rejects unsupported selected faces before Push/Pull mutation', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel
        disabled={false}
        selectedType="face"
        selectedFace={{ id: 'face_skewed', type: 'face', vertices: [{ x: 0, y: 0, z: 0 }, { x: 100, y: 0, z: 0 }, { x: 80, y: 50, z: 0 }, { x: 0, y: 50, z: 0 }] }}
        deltaHeight="100"
        onDeltaHeightChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Push/Pull unterstützt im MVP nur axis-aligned Rechteckflächen oder Körperseiten.');
  });

  it('blocks negative Push/Pull distances for selected rectangle face extrusion', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel
        disabled={false}
        selectedType="face"
        selectedFace={{ id: 'face_1', type: 'face', vertices: [{ x: 0, y: 0, z: 0 }, { x: 100, y: 0, z: 0 }, { x: 100, y: 50, z: 0 }, { x: 0, y: 50, z: 0 }] }}
        deltaHeight="-1"
        onDeltaHeightChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Push/Pull-Flächenextrusion braucht eine positive Distanz.');
  });
});
