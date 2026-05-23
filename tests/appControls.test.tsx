import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';

describe('App controls', () => {
  it('starts compact and routes workspace expansion through the matching classic menu buttons', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('class="top-toolbar workspace-collapsed"');
    expect(markup).not.toContain('Arbeitsplatz ausklappen');
    expect(markup).toContain('aria-label="Datei-Funktionen öffnen"');
    expect(markup).toContain('aria-label="Bearbeiten &amp; Maße öffnen"');
    expect(markup).toContain('aria-label="Fenster &amp; Hermes öffnen"');
    expect(markup).not.toContain('Auswahl löschen');
    expect(markup).not.toContain('Delta X in Millimeter');
    expect(markup).not.toContain('Ruby-Konsole');
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

  it('keeps the side rail icon-only and marks the selected tool', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('class="app-shell icon-rail-left"');
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

  it('documents left-click as the standard action for current tools', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Linke Maustaste: Standardaktion des aktiven Werkzeugs');
    expect(markup).toContain('Auswahl: klicken · Linie/Körper: Punkte setzen · Fläche: klicken zum Ziehen');
  });

  it('renders a bottom-right unit field and selected body-face status for measure/move/pull workflows', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('class="measurement-field"');
    expect(markup).toContain('Einheitenfeld');
    expect(markup).toContain('Aktuelles Maß');
    expect(markup).toContain('mm');
    expect(markup).toContain('Fläche: keine Körperfläche');
    expect(markup).toContain('Körperflächen können ausgewählt und anschließend verschoben oder gezogen werden.');
  });

  it('renders a viewport arrow cursor badge with the selected tool symbol', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Mauszeiger: normaler Pfeil ohne störendes Werkzeug-Symbol');
    expect(markup).toContain('class="cursor-arrow"');
    expect(markup).not.toContain('class="cursor-symbol"');
    expect(markup).not.toContain('Mauszeiger: Pfeil mit Auswahl Symbol');
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
});
