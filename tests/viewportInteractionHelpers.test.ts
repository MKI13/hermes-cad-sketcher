import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { createInitialToolState, handleGroundClick } from '../src/core/toolState';
import {
  createOriginGuideGroup,
  cursorBadgeForTool,
  formatActiveMeasurement,
  formatDraftMeasurement,
  formatEntityMeasurement,
  zoomOrbitTowardPoint
} from '../src/ui/viewportInteractionHelpers';
import { createOrbitCameraState } from '../src/ui/viewportController';

describe('SketchUp-like viewport interaction helpers', () => {
  it('zooms the orbit camera around the current mouse ground point instead of the screen center', () => {
    const state = createOrbitCameraState({ target: vec(0, 0, 0), radius: 4000, azimuth: 0, polar: Math.PI / 3 });
    const focus = vec(1200, -600, 0);

    const zoomed = zoomOrbitTowardPoint(state, focus, -120);

    expect(zoomed.radius).toBeLessThan(state.radius);
    expect(zoomed.target.x).toBeGreaterThan(state.target.x);
    expect(zoomed.target.y).toBeLessThan(state.target.y);
    expect(zoomed.target.z).toBe(0);
  });

  it('creates red, green and blue origin helper lines for the model zero point', () => {
    const guides = createOriginGuideGroup(2000);

    expect(guides.name).toBe('origin-guides');
    expect(guides.children).toHaveLength(4);
    expect(guides.children.map((child) => child.userData.axis)).toEqual(['x-red', 'y-green', 'z-blue', 'origin']);
    const [xAxis, yAxis, zAxis] = guides.children as THREE.Line[];
    expect((xAxis.material as THREE.LineBasicMaterial).color.getHex()).toBe(0xdc2626);
    expect((yAxis.material as THREE.LineBasicMaterial).color.getHex()).toBe(0x16a34a);
    expect((zAxis.material as THREE.LineBasicMaterial).color.getHex()).toBe(0x2563eb);
  });

  it('keeps the pointer as an arrow and adds a small function symbol for each active tool', () => {
    expect(cursorBadgeForTool('select')).toEqual({ arrow: '↖', symbol: 'V', label: 'Auswahl' });
    expect(cursorBadgeForTool('line')).toEqual({ arrow: '↖', symbol: '╱', label: 'Linie' });
    expect(cursorBadgeForTool('tape')).toEqual({ arrow: '↖', symbol: '↔', label: 'Maßband' });
  });

  it('formats live line and rectangle measurements while the user is drawing', () => {
    const firstLineStep = handleGroundClick(createInitialToolState(), 'line', vec(0, 0, 0));
    expect(formatDraftMeasurement(firstLineStep.state, 'line', vec(300, 400, 0))).toBe('Linie: 500 mm');

    const firstRectangleStep = handleGroundClick(createInitialToolState(), 'rectangle', vec(0, 0, 0));
    expect(formatDraftMeasurement(firstRectangleStep.state, 'rectangle', vec(2400, 900, 0))).toBe('Rechteck: 2400 mm × 900 mm · Fläche 2.16 m²');
  });

  it('shows exact edge length and face area for the bottom-right unit field', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(300, 400, 0));
    const face = model.createRectangle(vec(0, 0, 0), 2400, 900);

    expect(formatEntityMeasurement(edge)).toBe('Linie: 500 mm');
    expect(formatEntityMeasurement(face)).toBe('Fläche: 2.16 m² · 2400 mm × 900 mm');
    expect(formatActiveMeasurement({ hovered: formatEntityMeasurement(face), selected: formatEntityMeasurement(edge), last: 'noch keine Messung' })).toBe('Fläche: 2.16 m² · 2400 mm × 900 mm');
  });
});
