import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import App, { createInitialSketchModel, materialLabelForEntity } from '../src/App';

describe('App controls', () => {
  it('starts a new project with an empty model instead of sample furniture geometry', () => {
    const model = createInitialSketchModel();

    expect(model.allEntities()).toEqual([]);
  });

  it('starts compact and routes workspace expansion through the matching classic menu buttons', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('class="top-toolbar workspace-collapsed"');
    expect(markup).not.toContain('Arbeitsplatz ausklappen');
    expect(markup).toContain('aria-label="Datei-Funktionen öffnen"');
    expect(markup).toContain('aria-label="Bearbeiten &amp; Maße öffnen"');
    expect(markup).toContain('aria-label="Fenster &amp; Hermes öffnen"');
    expect(markup).not.toContain('Auswahl löschen');
    expect(markup).not.toContain('Delta X in Millimeter');
    expect(markup).not.toContain('class="top-function-workspace"');
    expect(markup).not.toContain('class="top-function-workspace"');
  });

  it('keeps the classic CAD workplace as the first top element for SketchUp-like browser use', () => {
    const markup = renderToStaticMarkup(<App />);
    const classicIndex = markup.indexOf('Klassischer CAD-Arbeitsplatz');
    const titleIndex = markup.indexOf('Hermes CAD Sketcher');

    expect(classicIndex).toBeGreaterThanOrEqual(0);
    expect(titleIndex).toBeGreaterThanOrEqual(0);
    expect(classicIndex).toBeLessThan(titleIndex);
    expect(markup).toContain('Datei');
    expect(markup).toContain('Kamera');
    expect(markup).toContain('Zeichnen');
  });

  it('keeps a SketchUp-like left icon rail and marks the selected tool', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('class="app-shell icon-rail-left sketchup-surface right-tray-open"');
    expect(markup).toContain('aria-label="Seitliche Icon-Werkzeugleiste"');
    expect(markup).toContain('class="icon-rail-button active"');
    expect(markup).toContain('title="Auswahl · Taste V"');
    expect(markup).not.toContain('Der linke Arbeitsplatz kann nach rechts oder zurück nach links geschoben werden.');
  });

  it('renders a customizable top icon toolbar with visible keyboard shortcuts', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Schnell-Werkzeugleiste');
    expect(markup).toContain('aria-label="Werkzeug Auswahl, Tastenkürzel V"');
    expect(markup).toContain('aria-label="Werkzeug Linie, Tastenkürzel L"');
    expect(markup).toContain('title="Linie · Taste L · Icon ziehen zum Verschieben"');
    expect(markup).toContain('Shortcuts: V Auswahl · L Linie · R Rechteck · B Körper · M Verschieben · P Push/Pull · O Drehen · T Maßband');
    expect(markup).toContain('Delete/Backspace löscht Auswahl nur außerhalb von Eingabefeldern.');
  });



  it('renders an active measurement input for exact SketchUp-like dimensions', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('aria-label="Aktive Maßeingabe"');
    expect(markup).toContain('placeholder="1200 · 1200,600 · 100,0,0"');
    expect(markup).toContain('Enter übernimmt das Maß für das aktive Werkzeug');
  });

  it('documents configurable per-user mouse bindings with left, middle, right and wheel defaults', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Linke Maustaste: Standardaktion des aktiven Werkzeugs');
    expect(markup).toContain('Auswahl: klicken · Linie/Körper: Punkte setzen · Fläche: klicken zum Ziehen');
    expect(markup).toContain('Mausbelegung pro Nutzer');
    expect(markup).toContain('Rechtsklick öffnet das Arbeitsflächen-Kontextmenü');
    expect(markup).toContain('Linke Taste');
    expect(markup).toContain('Mittlere Taste');
    expect(markup).toContain('Rechte Taste');
    expect(markup).toContain('Mausrad');
    expect(markup).toContain('Zusatzbutton 11');
    expect(markup).toContain('data-mouse-bindings="button:0=toolAction;button:1=orbit;button:2=contextMenu;wheel=zoom"');
  });

  it('renders a SketchUp-like default tray on the right with a collapse arrow and material swatches', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('aria-label="Rechter Hermes Tray"');
    expect(markup).toContain('Hermes Tray');
    expect(markup).toContain('aria-label="Rechten Hermes Tray zuklappen"');
    expect(markup).toContain('›');
    expect(markup).toContain('Entity Info');
    expect(markup).toContain('Komponenten');
    expect(markup).toContain('Anzeige / Styles');
    expect(markup).toContain('Tags');
    expect(markup).toContain('Szenen');
    expect(markup).toContain('Materialien');
    expect(markup).toContain('Ordner vom PC wählen');
    expect(markup).toContain('Auswahl mit Material belegen');
    expect(markup).toContain('Startmaterialien: 8');
    expect(markup).toContain('Holz hell');
    expect(markup).toContain('Glas transparent');
    expect(markup).toContain('Weiß lackiert');
    expect(markup).toContain('accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg"');
    expect(markup).toContain('Materialordner: Standard-Farbfelder');
    expect(markup).toContain('class="material-swatch"');
  });

  it('shows the selected entity material from the stable starter catalog when no legacy display name exists', () => {
    const model = createInitialSketchModel();
    const box = model.createBox({ x: 0, y: 0, z: 0 }, 600, 400, 200);
    model.applyMaterial(box.id, { materialId: 'wood-light' });
    const selected = model.getEntity(box.id);

    expect(selected ? materialLabelForEntity(selected, model.allMaterials()) : undefined).toBe('Holz hell');
  });

  it('shows prepared model tag metadata in the right tray without overclaiming visibility toggles', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Tags: 1 · sichtbar: 1');
    expect(markup).toContain('Untagged');
    expect(markup).toContain('Tag-Sichtbarkeit ist im Modell vorbereitet; UI-Umschalter folgen separat.');
    expect(markup).not.toContain('Tag-Verwaltung ist vorbereitet.');
  });

  it('shows the active drawing plane with SketchUp-style axis colors', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Zeichenebene');
    expect(markup).toContain('Grundfläche X/Y');
    expect(markup).toContain('Aktive Ebene: X rot und Y grün. Extrusion geht entlang Z blau.');
    expect(markup).toContain('class="drawing-plane-indicator drawing-plane-xy"');
    expect(markup).toContain('X rot');
    expect(markup).toContain('Y grün');
  });

  it('renders a bottom-right unit field and selected body-face status for measure/move/pull workflows', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('class="measurement-field measurement-box-active"');
    expect(markup).toContain('Aktive Maßeingabe');
    expect(markup).toContain('Aktuelles Maß');
    expect(markup).toContain('mm');
    expect(markup).toContain('Fläche: keine Körperfläche');
    expect(markup).toContain('Körperflächen können ausgewählt und anschließend verschoben oder gezogen werden.');
  });

  it('does not render a duplicate cursor arrow overlay beside the OS pointer', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).not.toContain('Mauszeiger: normaler Pfeil ohne störendes Werkzeug-Symbol');
    expect(markup).not.toContain('class="cursor-arrow"');
    expect(markup).not.toContain('cursor-arrow-only');
    expect(markup).not.toContain('class="cursor-symbol"');
    expect(markup).not.toContain('Mauszeiger: Pfeil mit Auswahl Symbol');
  });

  it('does not keep stale cursor symbol helper wiring in the viewport source', async () => {
    const [viewportSource, helperSource] = await Promise.all([
      readFile('src/ui/ThreeViewport.tsx', 'utf8'),
      readFile('src/ui/viewportInteractionHelpers.ts', 'utf8')
    ]);

    expect(viewportSource).not.toContain('cursorBadgeForTool');
    expect(viewportSource).not.toContain('cursor-arrow');
    expect(viewportSource).not.toContain('cursor-arrow-only');
    expect(helperSource).not.toContain('cursorBadgeForTool');
    expect(helperSource).not.toContain('type CursorBadge');
  });

  it('renders a research-backed classic CAD workbench bar without copying protected branding', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Klassischer CAD-Arbeitsplatz');
    expect(markup).not.toContain('Arbeitsplatz ausklappen');
    expect(markup).not.toContain('Push/Pull-artig');
    expect(markup).not.toContain('AI-Konzeptbild');
    expect(markup).toContain('SketchUp 2025 Recherche: Umgebungen, PBR-Materialien und Generate Textures sind als eigene Hermes-CAD-Ideen vorgemerkt.');
    expect(markup).not.toContain('Trimble');
    expect(markup).not.toContain('3D Warehouse');
  });

  it('keeps the AI chat window closed by default and exposes a compact open button', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Hermes Agent verbinden');
    expect(markup).toContain('Lokaler Hermes Agent des CAD-App-Hosts');
    expect(markup).toContain('Zeichnungsmodus');
    expect(markup).not.toContain('oder ein anderer AI Agent');
    expect(markup).not.toContain('class="ai-chat-window"');
  });

  it('documents production CI in the repository workflow', async () => {
    const workflow = await import('node:fs/promises').then((fs) => fs.readFile('.github/workflows/check.yml', 'utf8'));

    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run check');
    expect(workflow).toContain('pull_request:');
  });

  it('lets the CAD workspace use the full browser viewport without page-level dead space', async () => {
    const css = await readFile('src/styles.css', 'utf8');

    expect(css).toContain('height: 100dvh');
    expect(css).toContain('overflow: hidden');
    expect(css).toContain('.workspace { display: grid; grid-template-rows: minmax(0, 1fr) auto; min-width: 0; min-height: 0;');
    expect(css).toContain('.viewport-placeholder { position: relative; overflow: hidden; min-height: 0;');
  });


  it('shows cut-list material readiness in the entity info tray', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Zuschnittdaten');
    expect(markup).toContain('Materialdaten fehlen');
    expect(markup).toContain('Faserrichtung fehlt');
  });

});
