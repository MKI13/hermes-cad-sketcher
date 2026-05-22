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
    expect(validatePushPullHeight({ height: 720 }, { ok: true, deltaHeight: -719 })).toEqual({ ok: true, deltaHeight: -719 });
    expect(validatePushPullHeight({ height: 720 }, { ok: true, deltaHeight: -720 })).toEqual({
      ok: false,
      error: 'Push/Pull darf die Höhe nicht auf null oder negativ setzen.'
    });
    expect(validatePushPullHeight({ height: 720 }, { ok: true, deltaHeight: -900 })).toEqual({
      ok: false,
      error: 'Push/Pull darf die Höhe nicht auf null oder negativ setzen.'
    });
  });

  it('disables the apply action and shows an error when the final height would be invalid', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel
        disabled={false}
        selectedType="box"
        selectedBox={{ height: 720 }}
        deltaHeight="-720"
        onDeltaHeightChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Push/Pull darf die Höhe nicht auf null oder negativ setzen.');
  });

  it('disables the apply action when the selected entity is not a box', () => {
    const markup = renderToStaticMarkup(
      <PushPullPanel disabled={true} selectedType="edge" deltaHeight="100" onDeltaHeightChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Körper auswählen');
  });
});
