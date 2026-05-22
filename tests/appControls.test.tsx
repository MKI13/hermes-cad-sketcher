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

  it('renders precise millimeter move controls instead of a vague move demo action', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Auswahl verschieben');
    expect(markup).toContain('Delta X in Millimeter');
    expect(markup).toContain('Delta Y in Millimeter');
    expect(markup).toContain('Delta Z in Millimeter');
    expect(markup).not.toContain('Demo-Aktion mit Werkzeug');
  });
});
