import { describe, expect, it } from 'vitest';
import { DEFAULT_TOOLBAR_ORDER, getToolShortcut, reorderToolbar, sanitizeToolbarOrder, toolFromKeyboardEvent } from '../src/ui/toolbarCustomization';

describe('customizable toolbar workflow', () => {
  it('moves a tool icon to the dropped position while keeping every tool exactly once', () => {
    const nextOrder = reorderToolbar(DEFAULT_TOOLBAR_ORDER, 'tape', 'line');

    expect(nextOrder.slice(0, 3)).toEqual(['select', 'tape', 'line']);
    expect(new Set(nextOrder)).toEqual(new Set(DEFAULT_TOOLBAR_ORDER));
    expect(nextOrder).toHaveLength(DEFAULT_TOOLBAR_ORDER.length);
  });

  it('repairs saved toolbar preferences when tools are missing, duplicated or unknown', () => {
    const repaired = sanitizeToolbarOrder(['box', 'box', 'unknown', 'line']);

    expect(repaired.slice(0, 2)).toEqual(['box', 'line']);
    expect(new Set(repaired)).toEqual(new Set(DEFAULT_TOOLBAR_ORDER));
    expect(repaired).toHaveLength(DEFAULT_TOOLBAR_ORDER.length);
  });

  it('maps fast keyboard shortcuts to CAD tools without stealing text input typing', () => {
    expect(getToolShortcut('select')).toBe('V');
    expect(toolFromKeyboardEvent({ key: 'l' })).toBe('line');
    expect(toolFromKeyboardEvent({ key: 'R' })).toBe('rectangle');
    expect(toolFromKeyboardEvent({ key: 'b' })).toBe('box');
    expect(toolFromKeyboardEvent({ key: 'm' })).toBe('move');
    expect(toolFromKeyboardEvent({ key: 'p' })).toBe('pushPull');
    expect(toolFromKeyboardEvent({ key: 'o' })).toBe('rotate');
    expect(toolFromKeyboardEvent({ key: 't' })).toBe('tape');
    expect(toolFromKeyboardEvent({ key: 'l', targetTagName: 'INPUT' })).toBeUndefined();
    expect(toolFromKeyboardEvent({ key: 'l', ctrlKey: true })).toBeUndefined();
  });
});
