import { describe, expect, it } from 'vitest';
import {
  TOOLBAR_GROUPS,
  groupToolbarTools,
  toolbarGroupForTool,
  type ToolbarToolItem
} from '../src/ui/toolbarGrouping';

describe('top toolbar tool grouping', () => {
  const tools: ToolbarToolItem[] = [
    { id: 'select', label: 'Auswahl' },
    { id: 'line', label: 'Linie' },
    { id: 'rectangle', label: 'Rechteck' },
    { id: 'box', label: 'Körper' },
    { id: 'move', label: 'Verschieben' },
    { id: 'pushPull', label: 'Seite ziehen' },
    { id: 'rotate', label: 'Drehen' },
    { id: 'tape', label: 'Maßband' }
  ];

  it('assigns every current tool to a professional CAD workbar group', () => {
    expect(TOOLBAR_GROUPS.map((group) => group.label)).toEqual(['Auswahl', 'Zeichnen', 'Körperteile', 'Bearbeiten', 'Messen']);
    expect(toolbarGroupForTool('select')).toBe('selection');
    expect(toolbarGroupForTool('line')).toBe('drawing');
    expect(toolbarGroupForTool('rectangle')).toBe('drawing');
    expect(toolbarGroupForTool('box')).toBe('parts');
    expect(toolbarGroupForTool('pushPull')).toBe('parts');
    expect(toolbarGroupForTool('move')).toBe('modify');
    expect(toolbarGroupForTool('rotate')).toBe('modify');
    expect(toolbarGroupForTool('tape')).toBe('measure');
  });

  it('keeps user order inside each group without losing or duplicating tools', () => {
    const customOrder: ToolbarToolItem[] = [tools[3], tools[1], tools[4], tools[2], tools[0], tools[7], tools[5], tools[6]];

    const groups = groupToolbarTools(customOrder);

    expect(groups.map((group) => [group.label, group.tools.map((tool) => tool.id)])).toEqual([
      ['Auswahl', ['select']],
      ['Zeichnen', ['line', 'rectangle']],
      ['Körperteile', ['box', 'pushPull']],
      ['Bearbeiten', ['move', 'rotate']],
      ['Messen', ['tape']]
    ]);
    expect(groups.flatMap((group) => group.tools.map((tool) => tool.id))).toEqual(['select', 'line', 'rectangle', 'box', 'pushPull', 'move', 'rotate', 'tape']);
  });
});
