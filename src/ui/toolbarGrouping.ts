import type { ToolName } from '../core/model';

export type ToolbarGroupId = 'selection' | 'drawing' | 'parts' | 'modify' | 'measure';

export type ToolbarToolItem = Readonly<{
  id: ToolName;
  label: string;
}>;

export type ToolbarGroup = Readonly<{
  id: ToolbarGroupId;
  label: string;
  description: string;
  tools: ToolbarToolItem[];
}>;

export const TOOLBAR_GROUPS: ReadonlyArray<Omit<ToolbarGroup, 'tools'>> = [
  { id: 'selection', label: 'Auswahl', description: 'Objekte und Arbeitskontext wählen' },
  { id: 'drawing', label: 'Zeichnen', description: 'Kanten und Grundflächen zeichnen' },
  { id: 'parts', label: 'Körperteile', description: 'Möbelteile und Flächen modellieren' },
  { id: 'modify', label: 'Bearbeiten', description: 'Teile verschieben und drehen' },
  { id: 'measure', label: 'Messen', description: 'Maße prüfen und übertragen' }
];

const TOOL_TO_GROUP: Record<ToolName, ToolbarGroupId> = {
  select: 'selection',
  line: 'drawing',
  rectangle: 'drawing',
  box: 'parts',
  pushPull: 'parts',
  move: 'modify',
  rotate: 'modify',
  tape: 'measure'
};

export function toolbarGroupForTool(tool: ToolName): ToolbarGroupId {
  return TOOL_TO_GROUP[tool];
}

export function groupToolbarTools<T extends ToolbarToolItem>(tools: readonly T[]): Array<Omit<ToolbarGroup, 'tools'> & { tools: T[] }> {
  return TOOLBAR_GROUPS.map((group) => ({
    ...group,
    tools: tools.filter((tool) => toolbarGroupForTool(tool.id) === group.id)
  })).filter((group) => group.tools.length > 0);
}
