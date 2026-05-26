import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import {
  SketchModel,
  isBoardCutListKind,
  suggestWoodworkingName,
  type WoodworkingKind
} from '../src/core/model';
import { exportProjectFile, importProjectFile } from '../src/core/projectFile';

describe('woodworking classification metadata', () => {
  it('persists woodworking classification on real parts and assemblies', () => {
    const model = new SketchModel();
    const side = model.createBox(vec(0, 0, 0), 720, 560, 19);
    const component = model.createComponent('Korpus', [side.id]);

    const classifiedPart = model.assignWoodworkingClassification(side.id, 'panel', 'Seitenwand links');
    const classifiedAssembly = model.assignComponentWoodworkingClassification(component.id, 'assembly', 'Korpus');

    expect(classifiedPart.woodworking).toEqual({ kind: 'panel', prefix: 'PLT', role: 'Seitenwand links' });
    expect(classifiedAssembly.woodworking).toEqual({ kind: 'assembly', prefix: 'ASM', role: 'Korpus' });

    const roundTrip = importProjectFile(exportProjectFile(model));

    expect(roundTrip.getEntity(side.id)?.woodworking).toEqual({ kind: 'panel', prefix: 'PLT', role: 'Seitenwand links' });
    expect(roundTrip.allComponents()[0]).toMatchObject({ id: component.id, woodworking: { kind: 'assembly', prefix: 'ASM', role: 'Korpus' } });
  });

  it('rejects malformed woodworking metadata during import', () => {
    const model = new SketchModel();
    model.createBox(vec(0, 0, 0), 600, 400, 19);
    const parsed = JSON.parse(exportProjectFile(model));
    parsed.model.entities[0] = {
      ...parsed.model.entities[0],
      woodworking: { kind: 'panel', prefix: 'ASM', role: 'wrong prefix' }
    };

    expect(() => importProjectFile(JSON.stringify(parsed))).toThrow('Projektdatei enthält ungültige Elemente.');
  });

  it('suggests stable OpenCutList-style woodworking names with category prefixes and dimensions', () => {
    expect(suggestWoodworkingName('panel', 'Seitenwand links', { length: 720, width: 560, thickness: 19 })).toBe('PLT_Seitenwand_links_720x560x19');
    expect(suggestWoodworkingName('bar', 'Leiste vorne', { length: 600, width: 40, thickness: 20 })).toBe('BAR_Leiste_vorne_600x40x20');
    expect(suggestWoodworkingName('hardware', 'Scharnier 110 Grad')).toBe('HW_Scharnier_110_Grad');
    expect(suggestWoodworkingName('cut', 'Ausschnitt Spuele')).toBe('CUT_Ausschnitt_Spuele');
    expect(suggestWoodworkingName('assembly', 'Korpus')).toBe('ASM_Korpus');
  });

  it('separates board-like parts from assemblies, hardware, cutouts and helpers', () => {
    const boardKinds: WoodworkingKind[] = ['panel', 'bar'];
    const nonBoardKinds: WoodworkingKind[] = ['assembly', 'hardware', 'cut', 'helper'];

    expect(boardKinds.every(isBoardCutListKind)).toBe(true);
    expect(nonBoardKinds.some(isBoardCutListKind)).toBe(false);
  });
});
