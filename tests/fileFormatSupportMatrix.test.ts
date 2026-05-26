import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { importDxfWithReport, supportedCadFormats } from '../src/core/dxf';
import { importProjectFile } from '../src/core/projectFile';
import { importAsciiStl } from '../src/core/stl';

async function read(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

const expectedFixtures = [
  'tests/fixtures/dxf/simple-line-mm.dxf',
  'tests/fixtures/dxf/simple-rectangle-lwpolyline-mm.dxf',
  'tests/fixtures/dxf/unsupported-inch-file.dxf',
  'tests/fixtures/stl/simple-ascii-triangle.stl',
  'tests/fixtures/stl/simple-box-ascii.stl',
  'tests/fixtures/projects/simple-project.hcad.json'
];

describe('file-format support matrix and golden fixtures', () => {
  it('keeps golden fixtures for every currently supported file-format claim', () => {
    expect(expectedFixtures.filter((path) => !existsSync(path))).toEqual([]);
  });

  it('imports DXF golden fixtures only inside the documented millimeter MVP subset', async () => {
    const line = importDxfWithReport(await read('tests/fixtures/dxf/simple-line-mm.dxf'));
    expect(line.unitStatus).toMatchObject({ kind: 'millimeters', insunits: 4 });
    expect(line.importedEntities).toBe(1);
    expect(line.skippedEntities).toEqual([]);
    expect(line.model.allEntities()[0]).toMatchObject({ type: 'edge', layer: 'fixture-lines' });

    const rectangle = importDxfWithReport(await read('tests/fixtures/dxf/simple-rectangle-lwpolyline-mm.dxf'));
    expect(rectangle.unitStatus).toMatchObject({ kind: 'millimeters', insunits: 4 });
    expect(rectangle.importedEntities).toBe(1);
    expect(rectangle.skippedEntities).toEqual([]);
    expect(rectangle.model.allEntities()[0]).toMatchObject({ type: 'face', layer: 'fixture-rectangles' });

    const inch = importDxfWithReport(await read('tests/fixtures/dxf/unsupported-inch-file.dxf'));
    expect(inch.importedEntities).toBe(0);
    expect(inch.model.allEntities()).toEqual([]);
    expect(inch.unitStatus).toMatchObject({ kind: 'unsupported', insunits: 1 });
  });

  it('uses STL fixtures only for ASCII export/reference-mesh import claims', async () => {
    const triangle = importAsciiStl(await read('tests/fixtures/stl/simple-ascii-triangle.stl'), 'simple-ascii-triangle.stl');
    expect(triangle.type).toBe('referenceMesh');
    expect(triangle.triangleCount).toBe(1);

    const box = importAsciiStl(await read('tests/fixtures/stl/simple-box-ascii.stl'), 'simple-box-ascii.stl');
    expect(box.type).toBe('referenceMesh');
    expect(box.triangleCount).toBe(12);
  });

  it('round-trips the canonical editable .hcad.json project fixture', async () => {
    const project = importProjectFile(await read('tests/fixtures/projects/simple-project.hcad.json'));

    expect(project.snapshot()).toMatchObject({ unit: 'mm' });
    expect(project.allEntities().map((entity) => entity.type)).toEqual(['edge', 'box', 'referenceMesh']);
    expect(project.allComponents()).toHaveLength(1);
  });

  it('keeps the code-level support registry aligned with the README matrix categories', async () => {
    const formats = supportedCadFormats();
    const readme = await read('README.md');

    expect(formats).toMatchObject({
      dxf: 'mvp',
      stl: 'mvp',
      hcadJson: 'canonical',
      dwg: 'external-bridge',
      skp: 'external-bridge',
      rb: 'unsupported',
      rbz: 'unsupported',
      step: 'unsupported',
      ifc: 'unsupported',
      obj: 'unsupported',
      glb: 'unsupported'
    });
    expect(readme).toContain('| `.hcad.json` | Kanonisches editierbares Projektformat |');
    expect(readme).toContain('| `.step` / `.ifc` / `.obj` / `.glb` | Nicht unterstützt / nur nach Prüfung geplant |');
  });

  it('documents a README support matrix that is not broader than the tested code behavior', async () => {
    const readme = await read('README.md');

    expect(readme).toContain('## Datei-Format-Support-Matrix');
    expect(readme).toContain('| Format | Status | Getestete Unterstützung | Bewusste Grenzen | Golden Fixtures |');
    expect(readme).toContain('| `.hcad.json` | Kanonisches editierbares Projektformat |');
    expect(readme).toContain('| `.dxf` | Begrenzter MVP-Import/Export |');
    expect(readme).toContain('`LINE`, geschlossene vierpunktige axis-aligned `LWPOLYLINE`-Rechtecke');
    expect(readme).toContain('$INSUNITS=4');
    expect(readme).toContain('| `.stl` | Begrenzter ASCII-STL-Austausch |');
    expect(readme).toContain('nicht editierbares Referenzmesh');
    expect(readme).toContain('| `.dwg` | Nicht nativ unterstützt; nur Bridge-Plan |');
    expect(readme).toContain('| `.skp` | Nicht nativ unterstützt; nur Bridge-Plan |');
    expect(readme).toContain('| `.rb` / `.rbz` | Nicht unterstützt |');
    expect(readme).toContain('Kein Format wird breiter unterstützt als die Matrix und Golden Fixtures belegen.');

    expect(readme).not.toMatch(/native[rs]?\s+(DWG|SKP)-?(Import|Export|Support|Kompatibilität)/i);
    expect(readme).not.toMatch(/vollständige[rs]?\s+(DXF|STL|STEP|IFC)-?(Import|Export|Support)\s+(ist|wird|werden|unterstützt|vorhanden|implementiert|verfügbar|möglich)/i);
  });
});
