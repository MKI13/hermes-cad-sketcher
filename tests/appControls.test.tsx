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
    expect(markup).not.toContain('Demo-Aktion mit Werkzeug');
    expect(markup).not.toContain('präzise Winkel-Eingabe folgt');
  });
});
