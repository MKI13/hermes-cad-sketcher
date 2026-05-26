import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';
import { HermesIcon, hermesIconPath } from '../src/ui/HermesIcon';

describe('Hermes CAD clear icons', () => {
  it('builds stable public paths for mono and color SVG variants', () => {
    expect(hermesIconPath('line-tool-clear')).toBe('/icons/hermes-cad-clear-icons/svg/mono/line-tool-clear.svg');
    expect(hermesIconPath('push-pull-clear', 'color')).toBe('/icons/hermes-cad-clear-icons/svg/color/push-pull-clear.svg');
  });

  it('renders an accessible decorative SVG image without pretending planned tools are ready', () => {
    const markup = renderToStaticMarkup(<HermesIcon id="rectangle-tool-clear" label="Rechteck" size={22} />);

    expect(markup).toContain('src="/icons/hermes-cad-clear-icons/svg/mono/rectangle-tool-clear.svg"');
    expect(markup).toContain('width="22"');
    expect(markup).toContain('height="22"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('alt=""');
    expect(markup).toContain('title="Rechteck"');
  });

  it('uses the clear icon set in the primary toolbars', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/select-pointer.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/line-tool-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/rectangle-tool-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/box-cube-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/push-pull-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/move-tool-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/rotate-tool-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/tape-measure-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/materials-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/tags-clear.svg');
    expect(markup).toContain('/icons/hermes-cad-clear-icons/svg/mono/outliner-clear.svg');
    expect(markup).not.toContain('lucide');
  });
});
