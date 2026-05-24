import { describe, expect, it } from 'vitest';
import { drawingPlaneAppearance } from '../src/ui/drawingPlaneAppearance';

describe('drawing plane appearance', () => {
  it('uses SketchUp-style red, green, and blue axis color pairs for drawing planes', () => {
    expect(drawingPlaneAppearance('xy')).toMatchObject({
      label: 'Grundfläche X/Y',
      axisNames: ['X rot', 'Y grün'],
      className: 'drawing-plane-xy'
    });
    expect(drawingPlaneAppearance('xz')).toMatchObject({
      label: 'Vertikal X/Z',
      axisNames: ['X rot', 'Z blau'],
      className: 'drawing-plane-xz'
    });
    expect(drawingPlaneAppearance('yz')).toMatchObject({
      label: 'Vertikal Y/Z',
      axisNames: ['Y grün', 'Z blau'],
      className: 'drawing-plane-yz'
    });
  });
});
