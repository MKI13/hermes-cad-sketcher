import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MeasurementBox } from '../src/ui/MeasurementBox';

describe('MeasurementBox', () => {
  it('renders the active measurement plus a SketchUp-like command input', () => {
    const markup = renderToStaticMarkup(
      <MeasurementBox
        activeMeasurement="Linie: 1200 mm"
        value="1200"
        status="Bereit"
        onValueChange={() => undefined}
        onApply={() => undefined}
      />
    );

    expect(markup).toContain('Aktive Maßeingabe');
    expect(markup).toContain('value="1200"');
    expect(markup).toContain('placeholder="1200 · 1200,600 · &lt;100,0,0&gt; · 45°"');
    expect(markup).toContain('Linie: 1200 mm');
    expect(markup).toContain('Bereit');
  });

  it('submits through onApply instead of reloading the page', () => {
    const apply = vi.fn();
    const markup = renderToStaticMarkup(
      <MeasurementBox
        activeMeasurement="noch keine Messung"
        value="300"
        onValueChange={() => undefined}
        onApply={apply}
      />
    );

    expect(markup).toContain('type="submit"');
    expect(markup).toContain('Übernehmen');
  });
});
