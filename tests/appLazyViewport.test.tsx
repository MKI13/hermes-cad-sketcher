import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';


describe('App viewport loading boundary', () => {
  it('does not synchronously render the Three.js viewport during the initial app shell render', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('Interaktiver 3D-Viewport');
    expect(markup).toContain('3D-Viewport wird geladen');
    expect(markup).not.toContain('class="three-viewport"');
  });
});
