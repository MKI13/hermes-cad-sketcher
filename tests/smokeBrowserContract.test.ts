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
    expect(source).toContain('$INSUNITS');
    expect(source).toContain('DXF geladen: 2 importiert, 0 übersprungen');
    expect(source).toContain('DXF units: millimeters ($INSUNITS=4).');
    expect(source).toContain('waitForDxfImportStatus');
    expect(source).toContain('hasVisibleEntityCount(2)');
    expect(source).toContain('dxf load workflow imports supported synthetic fixture');
    expect(source).toContain('aboveTheFold');
    expect(source).toContain('documentVerticalOverflow');
    expect(source).toContain('isExpectedRenderingWarning');
    expect(source).toContain('GPU stall due to ReadPixels');
    expect(source).toContain('--disable-gpu');
    expect(source).not.toContain('--enable-unsafe-swiftshader');
    expect(source).not.toContain('--use-angle=swiftshader-webgl');
    expect(source).toContain('--password-store=basic');
    expect(source).toContain('--no-sandbox');
    expect(source).toContain('--disable-dev-shm-usage');
    expect(source).toContain('AbortSignal.timeout');
    expect(source).toContain('SMOKE_BROWSER_TMPDIR');
    expect(source).toContain('hermes-cad-smoke-profiles');
    expect(source).toContain('/json/new?');
    expect(source).toContain('45_000');
    expect(source).toContain('timed out waiting for a Chrome DevTools Protocol response');
    expect(source).not.toContain('--disable-software-rasterizer');
  });

  it('uses only Brave or Chromium browser paths and does not fall back to Google Chrome', async () => {
    const source = await readFile('scripts/smoke-browser.mjs', 'utf8');

    expect(source).toContain('resolveChromiumExecutable');
    expect(source).toContain('CHROMIUM_PATH');
    expect(source).toContain('brave-browser');
    expect(source).toContain('/snap/bin/brave');
    expect(source).toContain('chromium');
    expect(source).not.toContain('google-chrome');
    expect(source).not.toContain('/opt/google/chrome/chrome');
    expect(source).not.toContain("process.env.CHROMIUM_PATH ?? '/snap/bin/chromium'");
  });

  it('checks imported entity counts with whitespace-tolerant browser text matching', async () => {
    const source = await readFile('scripts/smoke-browser.mjs', 'utf8');

    expect(source).toContain('hasVisibleEntityCount');
    expect(source).toContain('hasVisibleEntityCount(2)');
    expect(source).toContain('hasVisibleEntityCount(3)');
    expect(source).not.toContain("settledText.includes('Aktuelle Elemente: 2')");
    expect(source).not.toContain("settledText.includes('Aktuelle Elemente: 3')");
  });
});
