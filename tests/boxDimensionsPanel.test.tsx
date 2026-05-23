import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoxDimensionsPanel, updateBoxDimension } from '../src/ui/BoxDimensionsPanel';
import { DEFAULT_BOX_DIMENSIONS } from '../src/ui/drawingController';

describe('BoxDimensionsPanel', () => {
  it('renders visible millimeter inputs for the default box dimensions', () => {
    const markup = renderToStaticMarkup(
      <BoxDimensionsPanel dimensions={DEFAULT_BOX_DIMENSIONS} onChange={() => undefined} />
    );

    expect(markup).toContain('Körpermaße');
    expect(markup).toContain('Breite');
    expect(markup).toContain('Tiefe');
    expect(markup).toContain('Höhe');
    expect(markup).toContain('600');
    expect(markup).toContain('mm');
  });

  it('exposes accessible numeric controls for width, depth and height', () => {
    const markup = renderToStaticMarkup(
      <BoxDimensionsPanel dimensions={{ width: 800, depth: 500, height: 300 }} onChange={() => undefined} />
    );

    expect(markup).toContain('aria-label="Breite in Millimeter"');
    expect(markup).toContain('aria-label="Tiefe in Millimeter"');
    expect(markup).toContain('aria-label="Höhe in Millimeter"');
    expect(markup).toContain('type="number"');
    expect(markup).toContain('min="1"');
  });

  it('rejects non-positive input before updating configured box dimensions', () => {
    const original = { width: 600, depth: 600, height: 600 };

    expect(updateBoxDimension(original, 'width', '0')).toEqual({ ok: false, dimensions: original });
    expect(updateBoxDimension(original, 'depth', '-25')).toEqual({ ok: false, dimensions: original });
    expect(updateBoxDimension(original, 'height', '')).toEqual({ ok: false, dimensions: original });
  });
});
