import type { ToolName } from '../core/model';

export const DEFAULT_TOOLBAR_ORDER: ToolName[] = ['select', 'line', 'rectangle', 'box', 'move', 'pushPull', 'rotate', 'tape'];

const toolSet = new Set<ToolName>(DEFAULT_TOOLBAR_ORDER);

export const TOOL_SHORTCUTS: Record<ToolName, string> = {
  select: 'V',
  line: 'L',
  rectangle: 'R',
  box: 'B',
  move: 'M',
  pushPull: 'P',
  rotate: 'O',
  tape: 'T'
};

const shortcutToTool = new Map<string, ToolName>(
  Object.entries(TOOL_SHORTCUTS).map(([tool, shortcut]) => [shortcut.toLowerCase(), tool as ToolName])
);

export type KeyboardShortcutEvent = {
  key: string;
  targetTagName?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
};

export function isToolName(value: unknown): value is ToolName {
  return typeof value === 'string' && toolSet.has(value as ToolName);
}

export function sanitizeToolbarOrder(savedOrder: unknown): ToolName[] {
  const candidates = Array.isArray(savedOrder) ? savedOrder : [];
  const order: ToolName[] = [];
  for (const candidate of candidates) {
    if (isToolName(candidate) && !order.includes(candidate)) order.push(candidate);
  }
  for (const tool of DEFAULT_TOOLBAR_ORDER) {
    if (!order.includes(tool)) order.push(tool);
  }
  return order;
}

export function reorderToolbar(currentOrder: ToolName[], draggedTool: ToolName, targetTool: ToolName): ToolName[] {
  if (draggedTool === targetTool) return sanitizeToolbarOrder(currentOrder);
  const order = sanitizeToolbarOrder(currentOrder).filter((tool) => tool !== draggedTool);
  const targetIndex = order.indexOf(targetTool);
  if (targetIndex === -1) return sanitizeToolbarOrder(currentOrder);
  order.splice(targetIndex, 0, draggedTool);
  return sanitizeToolbarOrder(order);
}

export function getToolShortcut(tool: ToolName): string {
  return TOOL_SHORTCUTS[tool];
}

export function toolFromKeyboardEvent(event: KeyboardShortcutEvent): ToolName | undefined {
  const targetTagName = event.targetTagName?.toUpperCase();
  if (targetTagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTagName)) return undefined;
  if (event.ctrlKey || event.metaKey || event.altKey) return undefined;
  if (event.key.length !== 1) return undefined;
  return shortcutToTool.get(event.key.toLowerCase());
}
