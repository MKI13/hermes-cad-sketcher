import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SketchModel } from '../src/core/model';
import { vec } from '../src/core/geometry';
import { ThreeViewport } from '../src/ui/ThreeViewport';

describe('ThreeViewport WebGL fallback', () => {
  it('renders an explicit unavailable-state message when WebGL cannot start', () => {
    try {
      const model = new SketchModel();
      model.createBox(vec(0, 0, 0), 2400, 900, 720);
      vi.stubGlobal('HTMLCanvasElement', undefined);
      vi.stubGlobal('WebGLRenderingContext', undefined);

      const markup = renderToStaticMarkup(<ThreeViewport model={model} activeTool="select" />);

      expect(markup).toContain('3D-Viewport nicht verfügbar');
      expect(markup).toContain('WebGL konnte in diesem Browser nicht gestartet werden.');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
