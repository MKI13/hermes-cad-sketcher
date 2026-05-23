import { describe, expect, it } from 'vitest';
import { nextWorkspaceDock, sanitizeWorkspaceDock, workspaceDockClass } from '../src/ui/workspaceDock';

describe('workspace dock placement', () => {
  it('toggles the control workspace between left and right docking', () => {
    expect(nextWorkspaceDock('left')).toBe('right');
    expect(nextWorkspaceDock('right')).toBe('left');
  });

  it('repairs invalid saved dock values back to the left side', () => {
    expect(sanitizeWorkspaceDock('right')).toBe('right');
    expect(sanitizeWorkspaceDock('left')).toBe('left');
    expect(sanitizeWorkspaceDock('unten')).toBe('left');
    expect(sanitizeWorkspaceDock(undefined)).toBe('left');
  });

  it('returns a stable app-shell class for CSS grid placement', () => {
    expect(workspaceDockClass('left')).toBe('app-shell dock-left');
    expect(workspaceDockClass('right')).toBe('app-shell dock-right');
  });
});
