import type { ToolName } from '../core/model';

export type WorkbenchTool = {
  id: string;
  label: string;
  group: string;
  status: 'ready' | 'planned';
  tool?: ToolName;
};

export const WORKBENCH_MENUS = ['Datei', 'Bearbeiten', 'Ansicht', 'Kamera', 'Zeichnen', 'Werkzeuge', 'Fenster', 'Hilfe'] as const;
export type WorkbenchMenu = (typeof WORKBENCH_MENUS)[number];

export const WORKBENCH_TOOLS: WorkbenchTool[] = [
  { id: 'select', label: 'Auswahl', group: 'Basis', status: 'ready', tool: 'select' },
  { id: 'erase', label: 'Radierer', group: 'Basis', status: 'planned' },
  { id: 'line', label: 'Linie', group: 'Zeichnen', status: 'ready', tool: 'line' },
  { id: 'rectangle', label: 'Rechteck', group: 'Zeichnen', status: 'ready', tool: 'rectangle' },
  { id: 'arc', label: 'Bogen', group: 'Zeichnen', status: 'planned' },
  { id: 'circle', label: 'Kreis', group: 'Zeichnen', status: 'planned' },
  { id: 'polygon', label: 'Polygon', group: 'Zeichnen', status: 'planned' },
  { id: 'box', label: 'Körper', group: 'Modellieren', status: 'ready', tool: 'box' },
  { id: 'push-pull', label: 'Push/Pull-artig', group: 'Modellieren', status: 'ready', tool: 'pushPull' },
  { id: 'move', label: 'Verschieben/Kopieren', group: 'Modellieren', status: 'ready', tool: 'move' },
  { id: 'rotate', label: 'Drehen', group: 'Modellieren', status: 'ready', tool: 'rotate' },
  { id: 'scale', label: 'Skalieren', group: 'Modellieren', status: 'planned' },
  { id: 'offset', label: 'Versatz', group: 'Modellieren', status: 'planned' },
  { id: 'follow-path', label: 'Folgepfad', group: 'Modellieren', status: 'planned' },
  { id: 'tape', label: 'Maßband', group: 'Messen', status: 'ready', tool: 'tape' },
  { id: 'protractor', label: 'Winkelmesser', group: 'Messen', status: 'planned' },
  { id: 'orbit', label: 'Orbit', group: 'Kamera', status: 'planned' },
  { id: 'pan', label: 'Hand', group: 'Kamera', status: 'planned' },
  { id: 'zoom', label: 'Zoom', group: 'Kamera', status: 'planned' },
  { id: 'zoom-extents', label: 'Alles zeigen', group: 'Kamera', status: 'planned' },
  { id: 'component', label: 'Komponente', group: 'Struktur', status: 'ready' },
  { id: 'tags', label: 'Tags/Sichtbarkeit', group: 'Struktur', status: 'planned' },
  { id: 'scenes', label: 'Szenen', group: 'Struktur', status: 'planned' },
  { id: 'materials', label: 'Materialien', group: 'Visualisierung', status: 'planned' },
  { id: 'shadows', label: 'Schatten', group: 'Visualisierung', status: 'planned' },
  { id: 'environment', label: 'Umgebung', group: 'Visualisierung', status: 'planned' },
  { id: 'ai-concept', label: 'AI-Konzeptbild', group: 'Visualisierung', status: 'planned' }
];

export function workbenchGroups(tools = WORKBENCH_TOOLS): string[] {
  return [...new Set(tools.map((tool) => tool.group))];
}

export function toolStatusLabel(status: WorkbenchTool['status']): string {
  return status === 'ready' ? 'bereit' : 'geplant';
}
