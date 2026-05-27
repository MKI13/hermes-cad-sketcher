import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MOUSE_BINDINGS,
  MOUSE_INPUTS,
  mouseActionLabel,
  sanitizeMouseBindings,
  resolveMouseInputAction,
  type MouseAction
} from '../src/ui/mouseBindings';

describe('user configurable mouse bindings', () => {
  it('starts with SketchUp-like defaults: left tool, middle orbit, right context menu and wheel zoom', () => {
    expect(DEFAULT_MOUSE_BINDINGS['button:0']).toBe('toolAction');
    expect(DEFAULT_MOUSE_BINDINGS['button:1']).toBe('orbit');
    expect(DEFAULT_MOUSE_BINDINGS['button:2']).toBe('contextMenu');
    expect(DEFAULT_MOUSE_BINDINGS.wheel).toBe('zoom');
    expect(DEFAULT_MOUSE_BINDINGS['button:3']).toBe('none');
    expect(DEFAULT_MOUSE_BINDINGS['button:11']).toBe('none');
  });

  it('exposes enough physical button slots for Logitech G604-style extra buttons', () => {
    expect(MOUSE_INPUTS.map((input) => input.id)).toContain('button:0');
    expect(MOUSE_INPUTS.map((input) => input.id)).toContain('button:11');
    expect(MOUSE_INPUTS.map((input) => input.id)).toContain('wheel');
    expect(mouseActionLabel('tool:move')).toBe('Werkzeug Verschieben wählen');
    expect(mouseActionLabel('contextMenu')).toBe('Arbeitsflächen-Kontextmenü');
    expect(mouseActionLabel('pan' as MouseAction)).toBe('Ansicht verschieben');
  });

  it('sanitizes per-user bindings while keeping unknown or unsafe values at defaults', () => {
    const sanitized = sanitizeMouseBindings({
      'button:3': 'tool:move',
      'button:4': 'undo',
      'button:5': 'pan',
      'button:9': 'delete',
      'button:99': 'tool:box',
      wheel: 'orbit',
      'button:2': 'not-real'
    });

    expect(sanitized['button:3']).toBe('tool:move');
    expect(sanitized['button:4']).toBe('undo');
    expect(sanitized['button:5']).toBe('pan');
    expect(sanitized['button:9']).toBe('delete');
    expect((sanitized as Record<string, MouseAction | undefined>)['button:99']).toBeUndefined();
    expect(sanitized.wheel).toBe('zoom');
    expect(sanitized['button:2']).toBe('contextMenu');
  });

  it('resolves pointer button numbers through the active user mapping', () => {
    const bindings = sanitizeMouseBindings({ 'button:4': 'tool:line', 'button:8': 'redo' });

    expect(resolveMouseInputAction(bindings, 0)).toBe('toolAction');
    expect(resolveMouseInputAction(bindings, 4)).toBe('tool:line');
    expect(resolveMouseInputAction(bindings, 8)).toBe('redo');
    expect(resolveMouseInputAction(bindings, 42)).toBe('none');
  });
});
