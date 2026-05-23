import { describe, expect, it } from 'vitest';
import {
  floatingWindowMenuButtonLabel,
  floatingWindowTitle,
  menuButtonLabel,
  menuPanelTitle,
  windowControlLabels,
  windowIdsForMenu
} from '../src/ui/workspaceMenuRouting';

describe('classic workspace menu routing', () => {
  it('routes each classic menu button to its matching function area instead of one global expand button', () => {
    expect(menuButtonLabel('Datei')).toBe('Datei-Funktionen öffnen');
    expect(menuButtonLabel('Bearbeiten')).toBe('Bearbeiten & Maße öffnen');
    expect(menuButtonLabel('Fenster')).toBe('Fenster & Hermes öffnen');
    expect(menuPanelTitle('Datei')).toBe('Datei & Import/Export');
    expect(menuPanelTitle('Bearbeiten')).toBe('Bearbeiten & Maße');
  });

  it('keeps Bearbeiten as short button links before opening moveable external windows', () => {
    expect(windowIdsForMenu('Bearbeiten')).toEqual([
      'history',
      'move',
      'rotate',
      'pushPull',
      'dimensions',
      'extrude',
      'inspector',
      'boxDimensions'
    ]);
    expect(floatingWindowMenuButtonLabel('history')).toBe('Verlauf');
    expect(floatingWindowMenuButtonLabel('move')).toBe('Verschieben');
    expect(floatingWindowMenuButtonLabel('pushPull')).toBe('Seite ziehen');
    expect(floatingWindowMenuButtonLabel('boxDimensions')).toBe('Körper-Standardmaße');
    expect(floatingWindowMenuButtonLabel('history')).not.toContain('Fenster öffnen');
    expect(floatingWindowMenuButtonLabel('history')).not.toContain('als Fenster');
  });

  it('uses clean external window titles without repeating the Bearbeiten menu name', () => {
    expect(floatingWindowTitle('history')).toBe('Verlauf');
    expect(floatingWindowTitle('move')).toBe('Verschieben');
    expect(floatingWindowTitle('dimensions')).toBe('Maße');
    expect(floatingWindowTitle('history')).not.toContain('Bearbeiten:');
  });

  it('defines title-bar drag plus icon-only minimize, maximize and close controls without arrow nudging', () => {
    expect(windowControlLabels()).toEqual([
      'Fenster über Titelleiste ziehen',
      'Fenster minimieren',
      'Fenster maximieren',
      'Fenster schließen'
    ]);
    expect(windowControlLabels()).not.toEqual(expect.arrayContaining([
      'Fenster nach links verschieben',
      'Fenster nach rechts verschieben',
      'Fenster nach oben verschieben',
      'Fenster nach unten verschieben'
    ]));
  });
});
