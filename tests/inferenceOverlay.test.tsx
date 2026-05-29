import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { vec } from '../src/core/geometry';
import { InferenceOverlay } from '../src/ui/InferenceOverlay';

const axisLine = { start: vec(0, 0, 0), end: vec(1000, 0, 0), color: '#dc2626' };

describe('InferenceOverlay', () => {
  it('renders a projected marker at the snap point and keeps the German label beside the cursor', () => {
    const markup = renderToStaticMarkup(
      <InferenceOverlay
        cursor={{ x: 120, y: 64 }}
        inference={{ kind: 'endpoint', point: vec(10, 20, 0), entityId: 'edge_1' }}
        snapPoint={{ x: 300, y: 220 }}
      />
    );

    expect(markup).toContain('class="snap-marker"');
    expect(markup).toContain('left:300px');
    expect(markup).toContain('top:220px');
    expect(markup).toContain('class="snap-cue"');
    expect(markup).toContain('Fanghinweis Endpunkt');
    expect(markup).toContain('Endpunkt');
    expect(markup).toContain('left:134px');
    expect(markup).toContain('top:46px');
  });

  it('renders projected colored temporary axis line endpoints for locked axis inference', () => {
    const markup = renderToStaticMarkup(
      <InferenceOverlay
        cursor={{ x: 10, y: 20 }}
        inference={{ kind: 'axisX', point: vec(1000, 0, 0), axis: 'x', axisLine }}
        axisLine={{ start: { x: 25, y: 90 }, end: { x: 425, y: 130 } }}
      />
    );

    expect(markup).toContain('class="inference-axis-line inference-axis-line--x"');
    expect(markup).toContain('data-axis="x"');
    expect(markup).toContain('data-color="#dc2626"');
    expect(markup).toContain('left:25px');
    expect(markup).toContain('top:90px');
    expect(markup).toContain('width:401.995');
    expect(markup).toContain('rotate(0.099');
    expect(markup).toContain('Achse X');
  });

  it('renders nothing for free inference without an active snap or axis lock', () => {
    expect(renderToStaticMarkup(<InferenceOverlay cursor={{ x: 0, y: 0 }} inference={{ kind: 'free', point: vec(1, 2, 3) }} />)).toBe('');
  });
});
