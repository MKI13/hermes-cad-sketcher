import type { WorkbenchMenu } from './workbenchLayout';

export type FloatingWindowId =
  | 'history'
  | 'move'
  | 'rotate'
  | 'pushPull'
  | 'dimensions'
  | 'extrude'
  | 'inspector'
  | 'boxDimensions'
  | 'rubyConsole'
  | 'hermesAgent';

const menuTitles: Record<WorkbenchMenu, string> = {
  Datei: 'Datei & Import/Export',
  Bearbeiten: 'Bearbeiten & Maße',
  Ansicht: 'Ansicht',
  Kamera: 'Kamera',
  Zeichnen: 'Zeichnen',
  Werkzeuge: 'Werkzeuge',
  Fenster: 'Fenster & Hermes',
  Hilfe: 'Hilfe'
};

const menuButtons: Record<WorkbenchMenu, string> = {
  Datei: 'Datei-Funktionen öffnen',
  Bearbeiten: 'Bearbeiten & Maße öffnen',
  Ansicht: 'Ansicht-Funktionen öffnen',
  Kamera: 'Kamera-Funktionen öffnen',
  Zeichnen: 'Zeichnen-Funktionen öffnen',
  Werkzeuge: 'Werkzeuge öffnen',
  Fenster: 'Fenster & Hermes öffnen',
  Hilfe: 'Hilfe öffnen'
};

const menuWindows: Partial<Record<WorkbenchMenu, FloatingWindowId[]>> = {
  Bearbeiten: ['history', 'move', 'rotate', 'pushPull', 'dimensions', 'extrude', 'inspector', 'boxDimensions'],
  Fenster: ['hermesAgent', 'rubyConsole']
};

const floatingWindowNames: Record<FloatingWindowId, string> = {
  history: 'Verlauf',
  move: 'Verschieben',
  rotate: 'Drehen',
  pushPull: 'Seite ziehen',
  dimensions: 'Maße',
  extrude: 'Fläche extrudieren',
  inspector: 'Inspektor',
  boxDimensions: 'Körper-Standardmaße',
  rubyConsole: 'Ruby-Konsole',
  hermesAgent: 'Hermes Zeichnungsmodus'
};

export function menuButtonLabel(menu: WorkbenchMenu): string {
  return menuButtons[menu];
}

export function menuPanelTitle(menu: WorkbenchMenu): string {
  return menuTitles[menu];
}

export function windowIdsForMenu(menu: WorkbenchMenu): FloatingWindowId[] {
  return [...(menuWindows[menu] ?? [])];
}

export function floatingWindowMenuButtonLabel(id: FloatingWindowId): string {
  return floatingWindowNames[id];
}

export function floatingWindowTitle(id: FloatingWindowId): string {
  return floatingWindowNames[id];
}

export function windowControlLabels(): string[] {
  return [
    'Fenster über Titelleiste ziehen',
    'Fenster minimieren',
    'Fenster maximieren',
    'Fenster schließen'
  ];
}
