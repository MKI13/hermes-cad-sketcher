import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { createInitialToolState, handleGroundClick } from '../src/core/toolState';
import {
  buildViewportContextMenuItems,
  createOriginGuideGroup,
  createWorkspaceGrid,
  formatActiveMeasurement,
  formatDraftMeasurement,
  formatEntityMeasurement,
  snapCueLabel,
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

  it('draws positive axes as solid directions and negative axes as dashed construction directions without an origin ball', () => {
    const guides = createOriginGuideGroup(2000);

    expect(guides.name).toBe('origin-guides');
    expect(guides.children).toHaveLength(6);
    expect(guides.children.map((child) => child.userData.axis)).toEqual([
      'x-positive',
      'x-negative',
      'y-positive',
      'y-negative',
      'z-positive',
      'z-negative'
    ]);
    const [xPositive, xNegative, yPositive, yNegative, zPositive, zNegative] = guides.children as THREE.Line[];
    expect((xPositive.material as THREE.LineBasicMaterial).color.getHex()).toBe(0xdc2626);
    expect((yPositive.material as THREE.LineBasicMaterial).color.getHex()).toBe(0x16a34a);
    expect((zPositive.material as THREE.LineBasicMaterial).color.getHex()).toBe(0x2563eb);
    expect(xPositive.material).toBeInstanceOf(THREE.LineBasicMaterial);
    expect(yPositive.material).toBeInstanceOf(THREE.LineBasicMaterial);
    expect(zPositive.material).toBeInstanceOf(THREE.LineBasicMaterial);
    expect(xNegative.material).toBeInstanceOf(THREE.LineDashedMaterial);
    expect(yNegative.material).toBeInstanceOf(THREE.LineDashedMaterial);
    expect(zNegative.material).toBeInstanceOf(THREE.LineDashedMaterial);
    expect(guides.children.some((child) => child.userData.axis === 'origin')).toBe(false);
  });

  it('creates a larger sketch grid so construction lines remain visible when zoomed out', () => {
    const grid = createWorkspaceGrid();

    expect(grid).toBeInstanceOf(THREE.GridHelper);
    expect(grid.userData.size).toBe(20000);
    expect(grid.userData.divisions).toBe(200);
  });

  it('formats live line and rectangle measurements while the user is drawing', () => {
    const firstLineStep = handleGroundClick(createInitialToolState(), 'line', vec(0, 0, 0));
    expect(formatDraftMeasurement(firstLineStep.state, 'line', vec(300, 400, 0))).toBe('Linie: 500 mm');

    const firstRectangleStep = handleGroundClick(createInitialToolState(), 'rectangle', vec(0, 0, 0));
    expect(formatDraftMeasurement(firstRectangleStep.state, 'rectangle', vec(2400, 900, 0))).toBe('Rechteck: 2400 mm × 900 mm · Fläche 2.16 m²');

    const verticalRectangleStep = handleGroundClick(createInitialToolState(), 'rectangle', vec(0, 0, 100), undefined, 'xz');
    expect(formatDraftMeasurement(verticalRectangleStep.state, 'rectangle', vec(2400, 0, 1000))).toBe('Rechteck: 2400 mm × 900 mm · Fläche 2.16 m²');
  });

  it('shows exact edge length and face area for the bottom-right unit field', () => {
    const model = new SketchModel();
    const edge = model.createLine(vec(0, 0, 0), vec(300, 400, 0));
    const face = model.createRectangle(vec(0, 0, 0), 2400, 900);
    const verticalFace = model.createRectangle(vec(0, 0, 0), 2400, 900, {}, 'xz');

    expect(formatEntityMeasurement(edge)).toBe('Linie: 500 mm');
    expect(formatEntityMeasurement(face)).toBe('Fläche: 2.16 m² · 2400 mm × 900 mm');
    expect(formatEntityMeasurement(verticalFace)).toBe('Fläche: 2.16 m² · 2400 mm × 900 mm');
    expect(formatActiveMeasurement({ hovered: formatEntityMeasurement(face), selected: formatEntityMeasurement(edge), last: 'noch keine Messung' })).toBe('Fläche: 2.16 m² · 2400 mm × 900 mm');
  });

  it('uses SketchUp-style inference labels for endpoint and midpoint cues without forcing snapping', () => {
    expect(snapCueLabel('endpoint')).toBe('Endpunkt');
    expect(snapCueLabel('midpoint')).toBe('Mitte');
  });

  it('builds a right-click workspace menu with general drawing tools and selected-model editing functions', () => {
    const emptyMenu = buildViewportContextMenuItems({ selectedEntityType: undefined });
    expect(emptyMenu.map((item) => item.label)).toEqual([
      'Auswahl-Werkzeug',
      'Linie zeichnen',
      'Rechteck zeichnen',
      'Körper setzen',
      'Maßband',
      'Verlauf und Auswahl'
    ]);

    const boxMenu = buildViewportContextMenuItems({ selectedEntityType: 'box' });
    expect(boxMenu.map((item) => item.label)).toContain('Entity Info');
    expect(boxMenu.map((item) => item.label)).toContain('Erase');
    expect(boxMenu.map((item) => item.label)).toContain('Hide');
    expect(boxMenu.map((item) => item.label)).toContain('Make Group');
    expect(boxMenu.map((item) => item.label)).toContain('Make Component');
    expect(boxMenu.map((item) => item.label)).toContain('Area');
    expect(boxMenu.map((item) => item.label)).toContain('Auswahl verschieben');
    expect(boxMenu.map((item) => item.label)).toContain('Auswahl drehen');
    expect(boxMenu.map((item) => item.label)).toContain('Körperhöhe ziehen');
    expect(boxMenu.map((item) => item.label)).toContain('Körpermaße bearbeiten');
    expect(boxMenu.map((item) => item.label)).toContain('Auswahl löschen');
  });
});
