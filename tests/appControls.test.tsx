import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';

describe('App selection controls', () => {
  it('renders a clear delete action for the selected entity', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Auswahl löschen');
    expect(markup).toContain('title="Ausgewähltes Element löschen"');
  });
});
