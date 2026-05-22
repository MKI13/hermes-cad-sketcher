import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MovePanel, parseMoveDelta } from '../src/ui/MovePanel';
import { vec } from '../src/core/geometry';

describe('MovePanel', () => {
  it('renders visible millimeter delta inputs for the selected element', () => {
    const markup = renderToStaticMarkup(
      <MovePanel disabled={false} delta={{ x: '100', y: '-50', z: '0' }} onDeltaChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('Auswahl verschieben');
    expect(markup).toContain('ΔX');
    expect(markup).toContain('ΔY');
    expect(markup).toContain('ΔZ');
    expect(markup).toContain('mm');
    expect(markup).toContain('aria-label="Delta X in Millimeter"');
  });

  it('parses signed finite millimeter deltas', () => {
    expect(parseMoveDelta({ x: '100', y: '-25.5', z: '0' })).toEqual({ ok: true, delta: vec(100, -25.5, 0) });
  });

  it('rejects empty and non-finite move deltas before model mutation', () => {
    expect(parseMoveDelta({ x: '', y: '0', z: '0' }).ok).toBe(false);
    expect(parseMoveDelta({ x: 'NaN', y: '0', z: '0' }).ok).toBe(false);
    expect(parseMoveDelta({ x: 'Infinity', y: '0', z: '0' }).ok).toBe(false);
  });

  it('disables the apply action when no element is selected', () => {
    const markup = renderToStaticMarkup(
      <MovePanel disabled={true} delta={{ x: '0', y: '0', z: '0' }} onDeltaChange={() => undefined} onApply={() => undefined} />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Erst ein Element auswählen');
  });
});
