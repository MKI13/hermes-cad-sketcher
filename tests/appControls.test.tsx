import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';

describe('App controls', () => {
  it('renders a delete button for the selected entity workflow', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Auswahl löschen');
    expect(markup).toContain('Ausgewähltes Element löschen');
  });

  it('renders precise transform controls instead of vague future-work actions', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Auswahl verschieben');
    expect(markup).toContain('Delta X in Millimeter');
    expect(markup).toContain('Delta Y in Millimeter');
    expect(markup).toContain('Delta Z in Millimeter');
    expect(markup).toContain('Auswahl drehen');
    expect(markup).toContain('Drehwinkel in Grad');
    expect(markup).toContain('Höhe ändern');
    expect(markup).toContain('Höhenänderung in Millimeter');
    expect(markup).not.toContain('Demo-Aktion mit Werkzeug');
    expect(markup).not.toContain('präzise Winkel-Eingabe folgt');
    expect(markup).not.toContain('nächsten Ausbauschritt');
  });

  it('tells users that Delete and Backspace are destructive selection shortcuts', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Auswahl löschen');
    expect(markup).toContain('Delete/Backspace');
  });

  it('renders a selected entity inspector with measured values', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Inspektor');
    expect(markup).toContain('Bounding Box Größe');
    expect(markup).toContain('Breite');
    expect(markup).toContain('Höhe');
  });

  it('renders undo and redo controls for reversible CAD edits', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Rückgängig');
    expect(markup).toContain('Wiederholen');
    expect(markup).toContain('Letzte Modelländerung rückgängig machen');
    expect(markup).toContain('Rückgängig gemachte Modelländerung wiederholen');
  });

  it('renders selected box dimension editing controls', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Auswahlmaße bearbeiten');
    expect(markup).toContain('Breite der Auswahl in Millimeter');
    expect(markup).toContain('Tiefe der Auswahl in Millimeter');
    expect(markup).toContain('Höhe der Auswahl in Millimeter');
    expect(markup).toContain('Maße übernehmen');
  });

  it('renders face extrusion controls for rectangle-to-body workflows', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Fläche extrudieren');
    expect(markup).toContain('Extrusionshöhe in Millimeter');
    expect(markup).toContain('Projekt: Projekt nicht gespeichert');
  });

  it('renders an honest limited DXF import control instead of claiming full DXF support', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('DXF laden');
    expect(markup).toContain('Importiert nur LINE und geschlossene, vierpunktige, achsenparallele Rechteck-LWPOLYLINE ohne Bulge/Breite/Dicke/Sonder-Extrusion.');
    expect(markup).toContain('DXF-Einheiten: $INSUNITS=4 wird als Millimeter importiert; fehlende Einheiten werden sichtbar als Millimeter angenommen, andere Einheiten werden abgelehnt.');
    expect(markup).not.toContain('vollständiger DXF-Import');
  });

  it('renders an honest ASCII STL reference import control without editable solid claims', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('STL-Referenz laden');
    expect(markup).toContain('Importiert ASCII-STL nur als nicht editierbares Referenzmesh.');
    expect(markup).toContain('STL-Import: ASCII-STL wird nur als Referenzmesh geladen, nicht als editierbarer Körper oder validiertes Fertigungsmesh.');
    expect(markup).not.toContain('editierbarer STL-Körper');
  });

  it('documents production CI in the repository workflow', async () => {
    const workflow = await import('node:fs/promises').then((fs) => fs.readFile('.github/workflows/check.yml', 'utf8'));

    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run check');
    expect(workflow).toContain('pull_request:');
  });
});
