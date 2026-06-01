import { describe, expect, it } from 'vitest';
import {
  analyzeDynamicFormula,
  buildSketchModelFromDynamicComponent,
  defaultKitchenBaseCabinetParameters,
  exportDynamicComponentCncCsv,
  exportDynamicComponentManufacturingDxf,
  evaluateDynamicFormula,
  listDynamicCabinetTemplates,
  parseDynamicComponentTemplate,
  rebuildDynamicCabinet,
  rebuildKitchenBaseCabinet,
  serializeDynamicComponentTemplate
} from '../src/core/dynamicComponents';

describe('dynamic furniture components', () => {
  it('evaluates cabinet formulas with arithmetic, comparison and IF support', () => {
    const context = { W: 600, T: 19, FRONT_GAP: 2, DOOR_TYPE: 'double_door' };

    expect(evaluateDynamicFormula('W - 2*T', context)).toBe(562);
    expect(evaluateDynamicFormula('IF(DOOR_TYPE == "double_door", (W - 3*FRONT_GAP)/2, W - 2*FRONT_GAP)', context)).toBe(297);
  });

  it('rebuilds a 600 x 720 x 560 kitchen base cabinet as real furniture parts', () => {
    const cabinet = rebuildKitchenBaseCabinet(defaultKitchenBaseCabinetParameters());

    expect(cabinet.type).toBe('DynamicComponent');
    expect(cabinet.name).toBe('Küchen-Unterschrank');
    expect(cabinet.parts.filter((part) => part.partType === 'side_panel')).toHaveLength(2);
    expect(cabinet.parts.filter((part) => part.partType === 'bottom_panel')).toHaveLength(1);
    expect(cabinet.parts.filter((part) => part.partType === 'top_panel')).toHaveLength(1);
    expect(cabinet.parts.filter((part) => part.partType === 'back_panel')).toHaveLength(1);
    expect(cabinet.parts.filter((part) => part.partType === 'shelf')).toHaveLength(1);
    expect(cabinet.parts.filter((part) => part.partType === 'door')).toHaveLength(2);
    expect(cabinet.parts.find((part) => part.name === 'Boden')?.dimensions.length).toBe(562);
    expect(cabinet.parts.find((part) => part.name === 'Tür_L')?.dimensions.length).toBe(297);
    expect(cabinet.cutlist).toContainEqual(expect.objectContaining({ name: 'Seitenwand_L', length: 720, width: 560, thickness: 19 }));
    expect(cabinet.edgeList.some((edge) => edge.partName === 'Fachboden_01' && edge.edge === 'front' && edge.length === 558)).toBe(true);
    expect(cabinet.holeList.filter((hole) => hole.purpose === 'shelf_pin')).toHaveLength(38);
    expect(cabinet.hardwareList.filter((item) => item.type === 'hinge')).toHaveLength(4);
    expect(cabinet.validation).toEqual([]);
  });

  it('recalculates dependent parts when width or material thickness changes without visual scaling', () => {
    const wider = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), W: 900 });
    const thinner = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), T: 18 });

    expect(wider.parts.find((part) => part.name === 'Seitenwand_L')?.dimensions.length).toBe(720);
    expect(wider.parts.find((part) => part.name === 'Seitenwand_L')?.dimensions.width).toBe(560);
    expect(wider.parts.find((part) => part.name === 'Boden')?.dimensions.length).toBe(862);
    expect(wider.parts.find((part) => part.name === 'Tür_L')?.dimensions.length).toBe(447);
    expect(thinner.parts.find((part) => part.name === 'Boden')?.dimensions.length).toBe(564);
  });

  it('switches the front system from double doors to drawer parts', () => {
    const cabinet = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), DOOR_TYPE: 'drawers', DRAWER_COUNT: 3 });

    expect(cabinet.parts.filter((part) => part.partType === 'door')).toHaveLength(0);
    expect(cabinet.parts.filter((part) => part.partType === 'drawer_front')).toHaveLength(3);
    expect(cabinet.parts.filter((part) => part.partType === 'drawer_side')).toHaveLength(6);
    expect(cabinet.parts.filter((part) => part.partType === 'drawer_runner')).toHaveLength(6);
  });

  it('places adjustable shelves evenly and validates impossible cabinet widths', () => {
    const shelves = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), SHELF_COUNT: 4 });
    const invalid = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), W: 120 });

    expect(shelves.parts.filter((part) => part.partType === 'shelf').map((part) => part.position.z)).toEqual([155.4, 291.8, 428.2, 564.6]);
    expect(invalid.validation).toContainEqual(expect.objectContaining({ severity: 'error', message: 'Schrankbreite zu klein. Minimum für Küchen-Unterschrank: 300 mm.' }));
  });

  it('serializes the dynamic component as a reusable JSON template and creates SketchModel boxes', () => {
    const cabinet = rebuildKitchenBaseCabinet(defaultKitchenBaseCabinetParameters());
    const template = serializeDynamicComponentTemplate(cabinet);
    const model = buildSketchModelFromDynamicComponent(cabinet);

    expect(JSON.parse(template)).toMatchObject({ type: 'DynamicComponent', templateId: 'kitchen_base_cabinet', name: 'Küchen-Unterschrank' });
    expect(model.allEntities()).toHaveLength(cabinet.parts.filter((part) => part.visible).length);
    expect(model.allComponents().at(0)?.name).toBe('Küchen-Unterschrank');
  });

  it('offers a furniture cabinet library beyond the kitchen base cabinet', () => {
    const templates = listDynamicCabinetTemplates();

    expect(templates.map((entry) => entry.id)).toEqual([
      'kitchen_base_cabinet',
      'wall_cabinet',
      'tall_cabinet',
      'wardrobe_cabinet',
      'drawer_base_cabinet'
    ]);
    expect(rebuildDynamicCabinet('wall_cabinet').name).toBe('Hängeschrank');
    expect(rebuildDynamicCabinet('wall_cabinet').parameters).toMatchObject({ D: 330, PLINTH: false, SHELF_COUNT: 2 });
    expect(rebuildDynamicCabinet('wardrobe_cabinet').parameters).toMatchObject({ H: 2200, D: 620, DOOR_TYPE: 'double_door' });
  });

  it('adds real groove machining for grooved backs instead of only resizing the back panel', () => {
    const cabinet = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), BACK_TYPE: 'grooved' });

    const side = cabinet.parts.find((part) => part.name === 'Seitenwand_L');
    const bottom = cabinet.parts.find((part) => part.name === 'Boden');
    const back = cabinet.parts.find((part) => part.name === 'Rückwand');

    expect(side?.machining).toContainEqual(expect.objectContaining({ type: 'groove', purpose: 'back_panel_groove', depth: 8, width: 8 }));
    expect(bottom?.machining).toContainEqual(expect.objectContaining({ type: 'groove', purpose: 'back_panel_groove', depth: 8, width: 8 }));
    expect(back?.dimensions.length).toBe(698);
    expect(back?.dimensions.width).toBe(578);
  });

  it('uses door-aware hinge cup positions and creates runner drilling for drawers', () => {
    const doors = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), DOOR_TYPE: 'double_door' });
    const leftDoor = doors.parts.find((part) => part.name === 'Tür_L');
    const rightDoor = doors.parts.find((part) => part.name === 'Tür_R');

    expect(leftDoor?.holes.filter((hole) => hole.purpose === 'hinge_cup').map((hole) => hole.x)).toEqual([22.5, 22.5]);
    expect(rightDoor?.holes.filter((hole) => hole.purpose === 'hinge_cup').map((hole) => hole.x)).toEqual([274.5, 274.5]);

    const drawers = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), DOOR_TYPE: 'drawers', DRAWER_COUNT: 2, DRAWER_RUNNER_LENGTH: 520 });
    expect(drawers.holeList.filter((hole) => hole.purpose === 'runner')).toHaveLength(8);
    expect(drawers.hardwareList).toContainEqual(expect.objectContaining({ type: 'drawer_runner', quantity: 2 }));
  });

  it('exports CNC drilling CSV and manufacturing DXF layers for cuts, edges and holes', () => {
    const cabinet = rebuildKitchenBaseCabinet({ ...defaultKitchenBaseCabinetParameters(), BACK_TYPE: 'grooved' });
    const csv = exportDynamicComponentCncCsv(cabinet);
    const dxf = exportDynamicComponentManufacturingDxf(cabinet);

    expect(csv.split('\n')[0]).toBe('part_id,part_name,operation,diameter,depth,x,y,z,direction,purpose');
    expect(csv).toContain('hinge_cup');
    expect(csv).toContain('shelf_pin');
    expect(dxf).toContain('LAYER\n2\nCUT');
    expect(dxf).toContain('LAYER\n2\nDRILL');
    expect(dxf).toContain('LAYER\n2\nEDGE_FRONT');
    expect(dxf).toContain('LAYER\n2\nGROOVE');
  });

  it('analyzes formula editor drafts and lists dependencies or readable errors', () => {
    const ok = analyzeDynamicFormula('ROUND((W - 2*T) / 3)', defaultKitchenBaseCabinetParameters());
    const broken = analyzeDynamicFormula('W - UNKNOWN', defaultKitchenBaseCabinetParameters());

    expect(ok).toMatchObject({ ok: true, value: 187, dependencies: ['T', 'W'] });
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.error).toContain('UNKNOWN');
  });

  it('loads edited dynamic templates and rebuilds them with sanitized furniture rules', () => {
    const source = rebuildDynamicCabinet('drawer_base_cabinet', { W: 850, DRAWER_RUNNER_LENGTH: 900 });
    const parsed = parseDynamicComponentTemplate(serializeDynamicComponentTemplate(source));

    expect(parsed.name).toBe('Schubladen-Unterschrank');
    expect(parsed.parameters.W).toBe(850);
    expect(parsed.parameters.DRAWER_RUNNER_LENGTH).toBe(530);
    expect(parsed.validation).toContainEqual(expect.objectContaining({ severity: 'warning', message: 'Auszugslänge wurde auf die nutzbare Korpustiefe begrenzt.' }));
  });
});
