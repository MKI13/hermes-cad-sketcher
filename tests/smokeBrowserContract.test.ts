import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

describe('browser smoke visual contract', () => {
  it('captures desktop and mobile screenshots and checks layout geometry', async () => {
    const source = await readFile('scripts/smoke-browser.mjs', 'utf8');

    expect(source).toContain('findBrowserExecutable');
    expect(source).toContain('CHROMIUM_PATH');
    expect(source).toContain('/snap/bin/chromium');
    expect(source).toContain('brave-browser');
    expect(source).toContain('brave-browser-stable');
    expect(source).toContain('chromium-browser');
    expect(source).toContain('No Brave or Chromium browser found');
    expect(source).not.toContain('google-chrome');
    expect(source).not.toContain('Google Chrome');
    expect(source).toContain('scripts/smoke-browser.mjs');
    expect(source).toContain('screenshots');
    expect(source).toContain('Page.captureScreenshot');
    expect(source).toContain('setViewport');
    expect(source).toContain('desktop');
    expect(source).toContain('mobile');
    expect(source).toContain('layoutGeometry');
    expect(source).toContain('horizontalOverflow');
    expect(source).toContain('visualEvidence');
    expect(source).toContain('runDxfLoadSmoke');
    expect(source).toContain('await clickByText(\'button\', \'Datei\')');
    expect(source).toContain('DataTransfer');
    expect(source).toContain('synthetic-supported.dxf');
    expect(source).toContain('$INSUNITS');
    expect(source).toContain('DXF geladen: 2 importiert, 0 übersprungen');
    expect(source).toContain('DXF units: millimeters ($INSUNITS=4).');
    expect(source).toContain('waitForDxfImportStatus');
    expect(source).toContain('core file/import/export controls visible after opening the Datei menu');
    expect(source).toContain('Elemente: 2');
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
