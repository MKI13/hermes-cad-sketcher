import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RotatePanel, parseRotateAngle } from '../src/ui/RotatePanel';

describe('RotatePanel', () => {
  it('renders a visible degree input for rotating the selected element', () => {
    const markup = renderToStaticMarkup(
      <RotatePanel disabled={false} angleDegrees="90" onAngleChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('Auswahl drehen');
    expect(markup).toContain('Winkel');
    expect(markup).toContain('Grad');
    expect(markup).toContain('aria-label="Drehwinkel in Grad"');
  });

  it('parses signed finite degree angles as radians', () => {
    expect(parseRotateAngle('90')).toEqual({ ok: true, radians: Math.PI / 2 });
    expect(parseRotateAngle('-45')).toEqual({ ok: true, radians: -Math.PI / 4 });
  });

  it('rejects empty and non-finite angles before model mutation', () => {
    expect(parseRotateAngle('').ok).toBe(false);
    expect(parseRotateAngle('NaN').ok).toBe(false);
    expect(parseRotateAngle('Infinity').ok).toBe(false);
  });

  it('disables the apply action when no element is selected', () => {
    const markup = renderToStaticMarkup(
      <RotatePanel disabled={true} angleDegrees="90" onAngleChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Erst ein Element auswählen');
  });
});
