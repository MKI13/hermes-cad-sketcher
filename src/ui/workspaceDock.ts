export type WorkspaceDock = 'left' | 'right';

export function sanitizeWorkspaceDock(value: unknown): WorkspaceDock {
  return value === 'right' || value === 'left' ? value : 'left';
}

export function nextWorkspaceDock(current: WorkspaceDock): WorkspaceDock {
  return current === 'left' ? 'right' : 'left';
}

export function workspaceDockClass(current: WorkspaceDock): string {
  return `app-shell dock-${current}`;
}
