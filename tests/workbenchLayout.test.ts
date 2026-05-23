import { describe, expect, it } from 'vitest';
import { WORKBENCH_MENUS, WORKBENCH_TOOLS, toolStatusLabel, workbenchGroups } from '../src/ui/workbenchLayout';

describe('SketchUp-inspired workbench layout', () => {
  it('keeps a broad CAD menu bar without using SketchUp branding', () => {
    expect(WORKBENCH_MENUS).toEqual(['Datei', 'Bearbeiten', 'Ansicht', 'Kamera', 'Zeichnen', 'Werkzeuge', 'Fenster', 'Hilfe']);
  });

  it('groups drawing, modeling, camera, structure and visualization tools', () => {
    expect(workbenchGroups()).toEqual(['Basis', 'Zeichnen', 'Modellieren', 'Messen', 'Kamera', 'Struktur', 'Visualisierung']);
    expect(WORKBENCH_TOOLS.map((tool) => tool.label)).toContain('Push/Pull-artig');
    expect(WORKBENCH_TOOLS.map((tool) => tool.label)).toContain('AI-Konzeptbild');
    expect(WORKBENCH_TOOLS.find((tool) => tool.id === 'line')?.status).toBe('ready');
    expect(WORKBENCH_TOOLS.find((tool) => tool.id === 'environment')?.status).toBe('planned');
  });

  it('labels implemented tools honestly', () => {
    expect(toolStatusLabel('ready')).toBe('bereit');
    expect(toolStatusLabel('planned')).toBe('geplant');
  });
});
