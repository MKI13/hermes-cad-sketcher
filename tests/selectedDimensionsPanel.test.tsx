import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SelectedDimensionsPanel, parseSelectedBoxDimensions } from '../src/ui/SelectedDimensionsPanel';

describe('SelectedDimensionsPanel', () => {
  it('parses positive finite selected-box dimensions in millimeters', () => {
    expect(parseSelectedBoxDimensions({ width: '1200', depth: '600', height: '720' })).toEqual({
      ok: true,
      dimensions: { width: 1200, depth: 600, height: 720 }
    });
  });

  it('rejects empty, non-finite and non-positive dimensions before model mutation', () => {
    expect(parseSelectedBoxDimensions({ width: '', depth: '600', height: '720' }).ok).toBe(false);
    expect(parseSelectedBoxDimensions({ width: 'NaN', depth: '600', height: '720' }).ok).toBe(false);
    expect(parseSelectedBoxDimensions({ width: '1200', depth: 'Infinity', height: '720' }).ok).toBe(false);
    expect(parseSelectedBoxDimensions({ width: '1200', depth: '0', height: '720' }).ok).toBe(false);
    expect(parseSelectedBoxDimensions({ width: '1200', depth: '600', height: '-1' }).ok).toBe(false);
  });

  it('renders editable millimeter inputs for selected boxes', () => {
    const markup = renderToStaticMarkup(
      <SelectedDimensionsPanel
        disabled={false}
        selectedType="box"
        dimensions={{ width: '2400', depth: '900', height: '720' }}
        onDimensionsChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('Auswahlmaße bearbeiten');
    expect(markup).toContain('Breite der Auswahl in Millimeter');
    expect(markup).toContain('Tiefe der Auswahl in Millimeter');
    expect(markup).toContain('Höhe der Auswahl in Millimeter');
    expect(markup).toContain('mm');
  });

  it('disables applying invalid selected-box dimensions and shows an inline error', () => {
    const markup = renderToStaticMarkup(
      <SelectedDimensionsPanel
        disabled={false}
        selectedType="box"
        dimensions={{ width: '2400', depth: '0', height: '720' }}
        onDimensionsChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Auswahlmaße müssen positive endliche Millimeterwerte sein.');
  });
});
