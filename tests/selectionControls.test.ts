import { describe, expect, it } from 'vitest';
import { shouldDeleteSelectionFromKey } from '../src/ui/selectionControls';

describe('selection keyboard controls', () => {
  it('treats Delete and Backspace as delete-selection shortcuts', () => {
    expect(shouldDeleteSelectionFromKey({ key: 'Delete' })).toBe(true);
    expect(shouldDeleteSelectionFromKey({ key: 'Backspace' })).toBe(true);
  });

  it('does not delete the selection while the user edits text or number inputs', () => {
    expect(shouldDeleteSelectionFromKey({ key: 'Backspace', target: { tagName: 'INPUT' } })).toBe(false);
    expect(shouldDeleteSelectionFromKey({ key: 'Delete', target: { tagName: 'TEXTAREA' } })).toBe(false);
    expect(shouldDeleteSelectionFromKey({ key: 'Delete', target: { isContentEditable: true } })).toBe(false);
  });
});
