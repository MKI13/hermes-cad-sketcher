import { describe, expect, it } from 'vitest';
import { getPrimaryActionLabel, getToolInstructions } from '../src/ui/toolInstructions';

describe('tool workflow instructions', () => {
  it('keeps direct drawing tools as viewport-first workflows', () => {
    expect(getToolInstructions('line')).toContain('zwei Klicks');
    expect(getToolInstructions('rectangle')).toContain('zwei Klicks');
    expect(getToolInstructions('box')).toContain('ein Klick');
  });

  it('uses an explicit sample loading label instead of a generic demo action', () => {
    expect(getPrimaryActionLabel()).toBe('Beispiel laden');
    expect(getPrimaryActionLabel()).not.toContain('Demo-Aktion');
  });
});
