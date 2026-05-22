import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InspectorPanel } from '../src/ui/InspectorPanel';
import type { EntityInspection } from '../src/core/inspection';

describe('InspectorPanel', () => {
  it('renders an empty selection state', () => {
    const markup = renderToStaticMarkup(<InspectorPanel />);

    expect(markup).toContain('Inspektor');
    expect(markup).toContain('Kein Element ausgewählt.');
  });

  it('renders inspection metrics with millimeter values', () => {
    const inspection: EntityInspection = {
      id: 'box_1',
      type: 'box',
      title: 'Körper',
      metrics: [
        { label: 'Breite', value: '2400 mm' },
        { label: 'Höhe', value: '720 mm' }
      ],
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 2400, y: 900, z: 720 },
        size: { x: 2400, y: 900, z: 720 }
      }
    };

    const markup = renderToStaticMarkup(<InspectorPanel inspection={inspection} />);

    expect(markup).toContain('Körper');
    expect(markup).toContain('box_1');
    expect(markup).toContain('Breite');
    expect(markup).toContain('2400 mm');
    expect(markup).toContain('Höhe');
    expect(markup).toContain('720 mm');
  });
});
