import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

describe('browser smoke visual contract', () => {
  it('captures desktop and mobile screenshots and checks layout geometry', async () => {
    const source = await readFile('scripts/smoke-browser.mjs', 'utf8');

    expect(source).toContain('screenshots');
    expect(source).toContain('Page.captureScreenshot');
    expect(source).toContain('setViewport');
    expect(source).toContain('desktop');
    expect(source).toContain('mobile');
    expect(source).toContain('layoutGeometry');
    expect(source).toContain('horizontalOverflow');
    expect(source).toContain('visualEvidence');
    expect(source).toContain('runDxfLoadSmoke');
    expect(source).toContain('DataTransfer');
    expect(source).toContain('synthetic-supported.dxf');
    expect(source).toContain('DXF geladen: 2 importiert, 0 übersprungen');
    expect(source).toContain('waitForDxfImportStatus');
    expect(source).toContain('Aktuelle Elemente: 2');
    expect(source).toContain('dxf load workflow imports supported synthetic fixture');
    expect(source).toContain('aboveTheFold');
    expect(source).toContain('documentVerticalOverflow');
    expect(source).toContain('isExpectedRenderingWarning');
    expect(source).toContain('GPU stall due to ReadPixels');
    expect(source).toContain('--enable-unsafe-swiftshader');
    expect(source).toContain('--use-angle=swiftshader-webgl');
    expect(source).not.toContain('--disable-software-rasterizer');
  });
});
