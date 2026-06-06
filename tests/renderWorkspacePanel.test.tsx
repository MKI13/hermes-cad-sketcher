import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import { buildRenderSceneSnapshot } from '../src/core/rendering';
import { RenderWorkspacePanel } from '../src/ui/RenderWorkspacePanel';

describe('RenderWorkspacePanel', () => {
  it('renders a future-ready internal render workspace without claiming external bridge readiness', () => {
    const model = new SketchModel();
    model.createBox(vec(0, 0, 0), 600, 400, 200);
    const snapshot = buildRenderSceneSnapshot(model);

    const markup = renderToStaticMarkup(<RenderWorkspacePanel snapshot={snapshot} bridgeStatus="internal-preview-only" />);

    expect(markup).toContain('aria-label="Render-Workspace"');
    expect(markup).toContain('interne Vorschau');
    expect(markup).toContain('Objekte');
    expect(markup).toContain('PBR-Materialien');
    expect(markup).toContain('Materialübersicht');
    expect(markup).toContain('Default');
    expect(markup).toContain('Holz hell');
    expect(markup).toContain('RAL 9010 Reinweiß');
    expect(markup).toContain('Kunden-Vorschau');
    expect(markup).toContain('three-preview');
    expect(markup).toContain('externe Jobs bleiben fail-closed');
    expect(markup).toContain('RenderSceneSnapshot');
    expect(markup).not.toContain('SketchUp');
    expect(markup).not.toContain('Trimble');
  });
});
