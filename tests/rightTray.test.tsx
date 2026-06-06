import React from 'react';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';
import { RightTray, RIGHT_TRAY_PANEL_DEFINITIONS, RIGHT_TRAY_STORAGE_KEY, sanitizeRightTrayState, type RightTrayPanelContent } from '../src/ui/RightTray';

describe('right Hermes tray', () => {
  it('defines the required Hermes tray panel list in product order', () => {
    expect(RIGHT_TRAY_PANEL_DEFINITIONS.map((panel) => panel.title)).toEqual([
      'Entity Info / Inspector',
      'Outliner',
      'Komponenten',
      'Dynamische Komponenten',
      'Tags',
      'Materialien',
      'Render-Workspace',
      'Szenen',
      'Anzeige / Styles',
      'Hermes Agent'
    ]);
  });

  it('sanitizes tray collapse state so the CAD viewport always keeps priority', () => {
    expect(RIGHT_TRAY_STORAGE_KEY).toBe('hermes-cad-right-tray');

    expect(sanitizeRightTrayState({ open: true, collapsedPanelIds: ['tags', 'unknown', 'tags'] })).toEqual({
      open: true,
      collapsedPanelIds: ['tags']
    });
    expect(sanitizeRightTrayState({ open: false, collapsedPanelIds: 'materials' })).toEqual({
      open: false,
      collapsedPanelIds: []
    });
    expect(sanitizeRightTrayState(null)).toEqual({
      open: true,
      collapsedPanelIds: []
    });
  });

  it('renders the right Hermes tray as independent collapsible panels beside the viewport', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('aria-label="Rechter Hermes Tray"');
    expect(markup).toContain('Hermes Tray');
    expect(markup).toContain('data-cad-surface-blocking="false"');
    expect(markup).toContain('data-tray-panel-id="entity-info"');
    expect(markup).toContain('Entity Info / Inspector');
    expect(markup).toContain('data-tray-panel-id="outliner"');
    expect(markup).toContain('Outliner');
    expect(markup).toContain('data-tray-panel-id="components"');
    expect(markup).toContain('Komponenten');
    expect(markup).toContain('data-tray-panel-id="tags"');
    expect(markup).toContain('Tags');
    expect(markup).toContain('data-tray-panel-id="materials"');
    expect(markup).toContain('Materialien');
    expect(markup).toContain('data-tray-panel-id="rendering"');
    expect(markup).toContain('Render-Workspace');
    expect(markup).toContain('PBR-Materialien');
    expect(markup).toContain('data-tray-panel-id="scenes"');
    expect(markup).toContain('Szenen');
    expect(markup).toContain('data-tray-panel-id="display-styles"');
    expect(markup).toContain('Anzeige / Styles');
    expect(markup).toContain('data-tray-panel-id="hermes-agent"');
    expect(markup).toContain('Hermes Agent');
    expect(markup).toContain('class="workspace viewport-priority"');
    expect(markup).toContain('class="right-tray-panel open"');
    expect(markup).toContain('aria-label="Panel Entity Info / Inspector einklappen"');
    expect(markup).not.toContain('Shadows');
    expect(markup).not.toContain('Instructor');
  });

  it('gives every open Hermes tray panel its own scrollable body so one long panel does not hide the next panels', async () => {
    const contents = Object.fromEntries(
      RIGHT_TRAY_PANEL_DEFINITIONS.map((panel) => [panel.id, <div key={panel.id}>Sehr langer Inhalt für {panel.title}</div>])
    ) as RightTrayPanelContent;
    const markup = renderToStaticMarkup(
      <RightTray
        state={{ open: true, collapsedPanelIds: [] }}
        contents={contents}
        onOpenChange={() => {}}
        onPanelToggle={() => {}}
      />
    );
    const styleSource = await readFile('src/styles.css', 'utf8');

    expect((markup.match(/data-tray-panel-scroll="true"/g) ?? [])).toHaveLength(RIGHT_TRAY_PANEL_DEFINITIONS.length);
    expect(styleSource).toContain('.right-tray-panel.open { display: flex; flex-direction: column; max-height:');
    expect(styleSource).toContain('.right-tray-panel-body { padding: 0; overflow-y: auto;');
    expect(styleSource).toContain('overscroll-behavior: contain');
    expect(styleSource).toContain('scrollbar-gutter: stable');
  });

  it('keeps floating windows optional instead of rendering inspector or agent windows by default', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Hermes Zeichnungsmodus-Fenster öffnen');
    expect(markup).toContain('Ruby-Konsole als Fenster öffnen');
    expect(markup).not.toContain('aria-label="Inspektor Fenster"');
    expect(markup).not.toContain('aria-label="Hermes Agent Fenster"');
  });

  it('keeps the dynamic component editor out of the narrow tray and offers a floating window launcher', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('aria-label="Dynamische Komponenten Kurzansicht"');
    expect(markup).toContain('data-dynamic-tray-mode="compact"');
    expect(markup).toContain('Dynamische Komponenten als Fenster öffnen');
    expect(markup).toContain('Live-Vorschau im Fenster ist aktiv');
    expect(markup).toContain('Bauteile');
    expect(markup).not.toContain('aria-label="Dynamic Component Options"');
  });

  it('implements the right tray in dedicated UI modules instead of leaving it embedded in App', async () => {
    const [rightTraySource, trayPanelSource] = await Promise.all([
      readFile('src/ui/RightTray.tsx', 'utf8'),
      readFile('src/ui/TrayPanel.tsx', 'utf8')
    ]);

    expect(rightTraySource).toContain('export function RightTray');
    expect(rightTraySource).toContain('export const RIGHT_TRAY_PANEL_DEFINITIONS');
    expect(trayPanelSource).toContain('export function TrayPanel');
  });

  it('styles the dedicated tray panel classes so the new modules are not visually unstyled details clones', async () => {
    const styleSource = await readFile('src/styles.css', 'utf8');

    expect(styleSource).toContain('.right-tray-panel {');
    expect(styleSource).toContain('.right-tray-panel-header');
    expect(styleSource).toContain('.right-tray-panel-body');
    expect(styleSource).toContain('.right-tray-panel.collapsed');
  });
});
