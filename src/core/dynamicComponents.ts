import { vec, type Vec3 } from './geometry';
import { SketchModel } from './model';

export type DynamicParameterValue = number | string | boolean;
export type FormulaContext = Record<string, DynamicParameterValue>;
export type ValidationSeverity = 'error' | 'warning' | 'info';

export type DynamicComponentType = 'DynamicComponent';
export type DynamicCabinetTemplateId = 'kitchen_base_cabinet' | 'wall_cabinet' | 'tall_cabinet' | 'wardrobe_cabinet' | 'drawer_base_cabinet';
export type DynamicCabinetCategory = 'Küche' | 'Kleiderschrank' | 'Korpusmöbel';
export type CabinetConstructionType = 'bottom_top_between_sides' | 'sides_between_bottom_top' | 'overlay_top';
export type BackPanelType = 'applied' | 'grooved' | 'none';
export type DoorType = 'none' | 'left_door' | 'right_door' | 'double_door' | 'drawers';
export type ShelfType = 'fixed' | 'adjustable';
export type EdgeName = 'front' | 'back' | 'left' | 'right';
export type PartType =
  | 'side_panel'
  | 'bottom_panel'
  | 'top_panel'
  | 'back_panel'
  | 'shelf'
  | 'door'
  | 'plinth'
  | 'drawer_front'
  | 'drawer_side'
  | 'drawer_bottom'
  | 'drawer_back'
  | 'drawer_runner';

export type KitchenBaseCabinetParameters = {
  W: number;
  H: number;
  D: number;
  T: number;
  BACK_T: number;
  DOOR_T: number;
  FRONT_GAP: number;
  SHELF_COUNT: number;
  SHELF_TYPE: ShelfType;
  SHELF_SETBACK_FRONT: number;
  SHELF_SETBACK_BACK: number;
  SHELF_CLEARANCE: number;
  DOOR_TYPE: DoorType;
  DRAWER_COUNT: number;
  DRAWER_GAP: number;
  DRAWER_SIDE_CLEARANCE: number;
  DRAWER_RUNNER_LENGTH: number;
  PLINTH: boolean;
  PLINTH_H: number;
  TOE_KICK_DEPTH: number;
  CONSTRUCTION_TYPE: CabinetConstructionType;
  BACK_TYPE: BackPanelType;
  LINE_BORE: boolean;
  HOLE_SPACING: number;
  HOLE_DIAMETER: number;
  HOLE_DEPTH: number;
  HOLE_FRONT_OFFSET: number;
  HOLE_START_Z: number;
  HINGE_TYPE: 'Blum' | 'Hettich' | 'Grass' | 'generisch';
  MATERIAL_BODY: string;
  MATERIAL_BACK: string;
  MATERIAL_FRONT: string;
};

export type EdgeBanding = Partial<Record<EdgeName, string | null>>;

export type DrillHole = {
  id: string;
  partId: string;
  partName: string;
  diameter: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  direction: 'inside' | 'front' | 'back' | 'top' | 'bottom';
  purpose: 'shelf_pin' | 'hinge_cup' | 'runner' | 'assembly';
};

export type MachiningOperation = {
  id: string;
  type: 'groove' | 'rebate' | 'drill';
  purpose: 'back_panel_groove' | 'shelf_pin_line' | 'hinge' | 'drawer_runner' | 'assembly';
  face: 'left' | 'right' | 'front' | 'back' | 'top' | 'bottom';
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  depth: number;
};

export type PartComponent = {
  id: string;
  name: string;
  partType: PartType;
  dimensions: {
    length: number;
    width: number;
    thickness: number;
  };
  size: {
    x: number;
    y: number;
    z: number;
  };
  position: Vec3;
  rotation: Vec3;
  material: string;
  grainDirection: 'vertical' | 'horizontal' | 'none';
  edgeBanding: EdgeBanding;
  machining: MachiningOperation[];
  holes: DrillHole[];
  quantity: number;
  visible: boolean;
  exportEnabled: boolean;
};

export type CutlistRow = {
  partId: string;
  name: string;
  quantity: number;
  length: number;
  width: number;
  thickness: number;
  material: string;
  grainDirection: PartComponent['grainDirection'];
};

export type EdgeListRow = {
  partId: string;
  partName: string;
  edge: EdgeName;
  banding: string;
  length: number;
};

export type HardwareRow = {
  id: string;
  type: 'hinge' | 'drawer_runner' | 'shelf_pin' | 'plinth';
  name: string;
  quantity: number;
  targetPartIds: string[];
};

export type ValidationIssue = {
  severity: ValidationSeverity;
  message: string;
  partId?: string;
};

export type DynamicComponentParameterDefinition = {
  label: string;
  type: 'number' | 'integer' | 'select' | 'boolean';
  unit?: 'mm';
  default: DynamicParameterValue;
  min?: number;
  max?: number;
  step?: number;
  allowed?: DynamicParameterValue[];
  options?: DynamicParameterValue[];
};

export type DynamicComponent = {
  id: string;
  templateId: DynamicCabinetTemplateId;
  type: DynamicComponentType;
  name: string;
  category: DynamicCabinetCategory;
  version: string;
  parameters: KitchenBaseCabinetParameters;
  parameterDefinitions: Record<keyof KitchenBaseCabinetParameters, DynamicComponentParameterDefinition>;
  formulas: Record<string, string>;
  parts: PartComponent[];
  cutlist: CutlistRow[];
  edgeList: EdgeListRow[];
  holeList: DrillHole[];
  hardwareList: HardwareRow[];
  validation: ValidationIssue[];
  metadata: {
    author: string;
    description: string;
    tags: string[];
  };
};

type FormulaToken =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: string }
  | { type: 'punctuation'; value: '(' | ')' | ',' };

type FormulaValue = number | string | boolean;

export function defaultKitchenBaseCabinetParameters(): KitchenBaseCabinetParameters {
  return {
    W: 600,
    H: 720,
    D: 560,
    T: 19,
    BACK_T: 8,
    DOOR_T: 19,
    FRONT_GAP: 2,
    SHELF_COUNT: 1,
    SHELF_TYPE: 'adjustable',
    SHELF_SETBACK_FRONT: 20,
    SHELF_SETBACK_BACK: 0,
    SHELF_CLEARANCE: 2,
    DOOR_TYPE: 'double_door',
    DRAWER_COUNT: 3,
    DRAWER_GAP: 2,
    DRAWER_SIDE_CLEARANCE: 13,
    DRAWER_RUNNER_LENGTH: 500,
    PLINTH: true,
    PLINTH_H: 100,
    TOE_KICK_DEPTH: 50,
    CONSTRUCTION_TYPE: 'bottom_top_between_sides',
    BACK_TYPE: 'applied',
    LINE_BORE: true,
    HOLE_SPACING: 32,
    HOLE_DIAMETER: 5,
    HOLE_DEPTH: 12,
    HOLE_FRONT_OFFSET: 37,
    HOLE_START_Z: 64,
    HINGE_TYPE: 'Blum',
    MATERIAL_BODY: 'Spanplatte weiß 19mm',
    MATERIAL_BACK: 'HDF weiß 8mm',
    MATERIAL_FRONT: 'MDF lackiert 19mm'
  };
}

export type DynamicCabinetTemplateSummary = {
  id: DynamicCabinetTemplateId;
  name: string;
  category: DynamicCabinetCategory;
  description: string;
  defaults: Partial<KitchenBaseCabinetParameters>;
};

const dynamicCabinetTemplates: DynamicCabinetTemplateSummary[] = [
  {
    id: 'kitchen_base_cabinet',
    name: 'Küchen-Unterschrank',
    category: 'Küche',
    description: 'Standard-Unterschrank mit Sockel, Fachboden, Fronten und Lochreihe.',
    defaults: {}
  },
  {
    id: 'wall_cabinet',
    name: 'Hängeschrank',
    category: 'Küche',
    description: 'Oberschrank ohne Sockel, mit geringerer Tiefe und zwei verstellbaren Fachböden.',
    defaults: { W: 600, H: 720, D: 330, PLINTH: false, SHELF_COUNT: 2, BACK_TYPE: 'grooved' }
  },
  {
    id: 'tall_cabinet',
    name: 'Hochschrank',
    category: 'Küche',
    description: 'Hoher Küchen- oder Vorratsschrank mit mehreren Fachböden.',
    defaults: { W: 600, H: 2100, D: 580, PLINTH: true, SHELF_COUNT: 5, DOOR_TYPE: 'double_door', BACK_TYPE: 'grooved' }
  },
  {
    id: 'wardrobe_cabinet',
    name: 'Kleiderschrank',
    category: 'Kleiderschrank',
    description: 'Kleiderschrank-Korpus mit hoher Front, tiefer Korpustiefe und Einlegeböden.',
    defaults: { W: 1000, H: 2200, D: 620, PLINTH: false, SHELF_COUNT: 4, DOOR_TYPE: 'double_door', BACK_TYPE: 'grooved', MATERIAL_FRONT: 'MDF lackiert 19mm' }
  },
  {
    id: 'drawer_base_cabinet',
    name: 'Schubladen-Unterschrank',
    category: 'Küche',
    description: 'Unterschrank mit Schubladenfronten, Auszügen und Auszugsbohrungen.',
    defaults: { W: 600, H: 720, D: 560, DOOR_TYPE: 'drawers', DRAWER_COUNT: 3, SHELF_COUNT: 0, PLINTH: true }
  }
];

export function listDynamicCabinetTemplates(): DynamicCabinetTemplateSummary[] {
  return dynamicCabinetTemplates.map((template) => ({ ...template, defaults: { ...template.defaults } }));
}

function findDynamicCabinetTemplate(templateId: DynamicCabinetTemplateId): DynamicCabinetTemplateSummary {
  const template = dynamicCabinetTemplates.find((entry) => entry.id === templateId);
  if (!template) throw new Error(`Unbekannte dynamische Schrankvorlage: ${templateId}`);
  return template;
}

export function kitchenBaseCabinetParameterDefinitions(): DynamicComponent['parameterDefinitions'] {
  return {
    W: { label: 'Breite', type: 'number', unit: 'mm', default: 600, min: 300, max: 1200, step: 1 },
    H: { label: 'Höhe', type: 'number', unit: 'mm', default: 720, min: 300, max: 2400, step: 1 },
    D: { label: 'Tiefe', type: 'number', unit: 'mm', default: 560, min: 250, max: 800, step: 1 },
    T: { label: 'Materialstärke', type: 'number', unit: 'mm', default: 19, allowed: [16, 18, 19, 22, 25] },
    BACK_T: { label: 'Rückwandstärke', type: 'number', unit: 'mm', default: 8, allowed: [3, 4, 5, 8, 10] },
    DOOR_T: { label: 'Frontstärke', type: 'number', unit: 'mm', default: 19, allowed: [16, 18, 19, 22] },
    FRONT_GAP: { label: 'Frontfuge', type: 'number', unit: 'mm', default: 2, min: 1, max: 6, step: 0.5 },
    SHELF_COUNT: { label: 'Fachbodenanzahl', type: 'integer', default: 1, min: 0, max: 10 },
    SHELF_TYPE: { label: 'Fachbodenart', type: 'select', default: 'adjustable', options: ['fixed', 'adjustable'] },
    SHELF_SETBACK_FRONT: { label: 'Fachboden-Rücksprung vorne', type: 'number', unit: 'mm', default: 20, min: 0, max: 80 },
    SHELF_SETBACK_BACK: { label: 'Fachboden-Rücksprung hinten', type: 'number', unit: 'mm', default: 0, min: 0, max: 80 },
    SHELF_CLEARANCE: { label: 'Fachbodenluft je Seite', type: 'number', unit: 'mm', default: 2, min: 0, max: 10 },
    DOOR_TYPE: { label: 'Fronttyp', type: 'select', default: 'double_door', options: ['none', 'left_door', 'right_door', 'double_door', 'drawers'] },
    DRAWER_COUNT: { label: 'Schubladenanzahl', type: 'integer', default: 3, min: 1, max: 8 },
    DRAWER_GAP: { label: 'Schubladenfuge', type: 'number', unit: 'mm', default: 2, min: 1, max: 6 },
    DRAWER_SIDE_CLEARANCE: { label: 'Auszugsluft je Seite', type: 'number', unit: 'mm', default: 13, min: 10, max: 20 },
    DRAWER_RUNNER_LENGTH: { label: 'Auszugslänge', type: 'number', unit: 'mm', default: 500, min: 250, max: 650 },
    PLINTH: { label: 'Sockel', type: 'boolean', default: true },
    PLINTH_H: { label: 'Sockelhöhe', type: 'number', unit: 'mm', default: 100, min: 60, max: 200 },
    TOE_KICK_DEPTH: { label: 'Sockelrücksprung', type: 'number', unit: 'mm', default: 50, min: 0, max: 120 },
    CONSTRUCTION_TYPE: { label: 'Bauart', type: 'select', default: 'bottom_top_between_sides', options: ['bottom_top_between_sides', 'sides_between_bottom_top', 'overlay_top'] },
    BACK_TYPE: { label: 'Rückwand', type: 'select', default: 'applied', options: ['applied', 'grooved', 'none'] },
    LINE_BORE: { label: 'Lochreihe', type: 'boolean', default: true },
    HOLE_SPACING: { label: 'Lochabstand', type: 'number', unit: 'mm', default: 32 },
    HOLE_DIAMETER: { label: 'Lochdurchmesser', type: 'number', unit: 'mm', default: 5 },
    HOLE_DEPTH: { label: 'Lochtiefe', type: 'number', unit: 'mm', default: 12 },
    HOLE_FRONT_OFFSET: { label: 'Lochreihe Frontabstand', type: 'number', unit: 'mm', default: 37 },
    HOLE_START_Z: { label: 'Lochreihe Start', type: 'number', unit: 'mm', default: 64 },
    HINGE_TYPE: { label: 'Scharnier', type: 'select', default: 'Blum', options: ['Blum', 'Hettich', 'Grass', 'generisch'] },
    MATERIAL_BODY: { label: 'Korpusmaterial', type: 'select', default: 'Spanplatte weiß 19mm', options: ['Spanplatte weiß 19mm', 'MDF 19mm', 'Multiplex 18mm'] },
    MATERIAL_BACK: { label: 'Rückwandmaterial', type: 'select', default: 'HDF weiß 8mm', options: ['HDF weiß 3mm', 'HDF weiß 5mm', 'HDF weiß 8mm'] },
    MATERIAL_FRONT: { label: 'Frontmaterial', type: 'select', default: 'MDF lackiert 19mm', options: ['MDF lackiert 19mm', 'Spanplatte weiß 19mm', 'Multiplex 18mm'] }
  };
}

export const kitchenBaseCabinetFormulas: DynamicComponent['formulas'] = {
  bottom_width: 'W - 2*T',
  back_width: 'W - 2*T',
  back_height: 'H - 2*T',
  shelf_width: 'W - 2*T - 2*SHELF_CLEARANCE',
  shelf_depth: 'D - SHELF_SETBACK_FRONT - SHELF_SETBACK_BACK',
  door_height: 'H - 2*FRONT_GAP',
  double_door_width: 'IF(DOOR_TYPE == "double_door", (W - 3*FRONT_GAP)/2, W - 2*FRONT_GAP)'
};

export function evaluateDynamicFormula(expression: string, context: FormulaContext): FormulaValue {
  const parser = new FormulaParser(tokenizeFormula(expression), context);
  return parser.parse();
}

export function rebuildKitchenBaseCabinet(overrides: Partial<KitchenBaseCabinetParameters> = {}): DynamicComponent {
  return rebuildDynamicCabinet('kitchen_base_cabinet', overrides);
}

export function rebuildDynamicCabinet(templateId: DynamicCabinetTemplateId, overrides: Partial<KitchenBaseCabinetParameters> = {}): DynamicComponent {
  const template = findDynamicCabinetTemplate(templateId);
  const parameters = sanitizeKitchenBaseCabinetParameters({ ...defaultKitchenBaseCabinetParameters(), ...template.defaults, ...overrides });
  const context: FormulaContext = parameters;
  const bottomWidth = numberResult(evaluateDynamicFormula(kitchenBaseCabinetFormulas.bottom_width, context));
  const backWidth = numberResult(evaluateDynamicFormula(kitchenBaseCabinetFormulas.back_width, context));
  const backHeight = numberResult(evaluateDynamicFormula(kitchenBaseCabinetFormulas.back_height, context));
  const shelfWidth = numberResult(evaluateDynamicFormula(kitchenBaseCabinetFormulas.shelf_width, context));
  const shelfDepth = numberResult(evaluateDynamicFormula(kitchenBaseCabinetFormulas.shelf_depth, context));
  const doorHeight = numberResult(evaluateDynamicFormula(kitchenBaseCabinetFormulas.door_height, context));
  const doorWidth = numberResult(evaluateDynamicFormula(kitchenBaseCabinetFormulas.double_door_width, context));

  const parts: PartComponent[] = [];
  const addPart = (part: Omit<PartComponent, 'id' | 'rotation' | 'holes' | 'machining' | 'quantity' | 'visible' | 'exportEnabled'> & Partial<Pick<PartComponent, 'id' | 'rotation' | 'holes' | 'machining' | 'quantity' | 'visible' | 'exportEnabled'>>) => {
    const completed: PartComponent = {
      id: part.id ?? stablePartId(part.name),
      rotation: part.rotation ?? vec(0, 0, 0),
      machining: part.machining ?? [],
      holes: part.holes ?? [],
      quantity: part.quantity ?? 1,
      visible: part.visible ?? true,
      exportEnabled: part.exportEnabled ?? true,
      ...part
    };
    parts.push(completed);
    return completed;
  };

  const sideEdges: EdgeBanding = { front: 'ABS 2 mm', back: null, left: 'ABS 0.8 mm', right: null };
  const grooveMachining = parameters.BACK_TYPE === 'grooved' ? backPanelGrooveMachining(parameters) : { side: [], horizontal: [] };
  addPart({ ...panelPart('Seitenwand_L', 'side_panel', parameters.H, parameters.D, parameters.T, vec(0, 0, 0), { x: parameters.T, y: parameters.D, z: parameters.H }, parameters.MATERIAL_BODY, 'vertical', sideEdges), machining: grooveMachining.side });
  addPart({ ...panelPart('Seitenwand_R', 'side_panel', parameters.H, parameters.D, parameters.T, vec(parameters.W - parameters.T, 0, 0), { x: parameters.T, y: parameters.D, z: parameters.H }, parameters.MATERIAL_BODY, 'vertical', sideEdges), machining: grooveMachining.side });

  addPart({ ...panelPart('Boden', 'bottom_panel', bottomWidth, parameters.D, parameters.T, vec(parameters.T, 0, 0), { x: bottomWidth, y: parameters.D, z: parameters.T }, parameters.MATERIAL_BODY, 'horizontal', { front: 'ABS 2 mm', back: null, left: null, right: null }), machining: grooveMachining.horizontal });
  addPart({ ...panelPart('Deckel', 'top_panel', bottomWidth, parameters.D, parameters.T, vec(parameters.T, 0, parameters.H - parameters.T), { x: bottomWidth, y: parameters.D, z: parameters.T }, parameters.MATERIAL_BODY, 'horizontal', { front: 'ABS 2 mm', back: null, left: null, right: null }), machining: grooveMachining.horizontal });

  if (parameters.BACK_TYPE !== 'none') {
    const grooved = parameters.BACK_TYPE === 'grooved';
    const grooveDepth = 8;
    const width = grooved ? backWidth + 2 * grooveDepth : backWidth;
    const height = grooved ? backHeight + 2 * grooveDepth : backHeight;
    const x = grooved ? parameters.T - grooveDepth : parameters.T;
    const z = grooved ? parameters.T - grooveDepth : parameters.T;
    addPart(panelPart('Rückwand', 'back_panel', height, width, parameters.BACK_T, vec(x, parameters.D - parameters.BACK_T, z), { x: width, y: parameters.BACK_T, z: height }, parameters.MATERIAL_BACK, 'none', { front: null, back: null, left: null, right: null }));
  }

  for (let index = 1; index <= parameters.SHELF_COUNT; index += 1) {
    const z = roundToOne(parameters.T + ((parameters.H - 2 * parameters.T) / (parameters.SHELF_COUNT + 1)) * index);
    addPart(panelPart(`Fachboden_${pad2(index)}`, 'shelf', shelfWidth, shelfDepth, parameters.T, vec(parameters.T + parameters.SHELF_CLEARANCE, parameters.SHELF_SETBACK_FRONT, z), { x: shelfWidth, y: shelfDepth, z: parameters.T }, parameters.MATERIAL_BODY, 'horizontal', { front: 'ABS 2 mm', back: null, left: null, right: null }));
  }

  addFrontSystem(parts, parameters, doorWidth, doorHeight, addPart);

  if (parameters.PLINTH) {
    addPart(panelPart('Sockel', 'plinth', parameters.W, parameters.PLINTH_H, parameters.T, vec(0, parameters.TOE_KICK_DEPTH, -parameters.PLINTH_H), { x: parameters.W, y: parameters.T, z: parameters.PLINTH_H }, parameters.MATERIAL_BODY, 'horizontal', { front: 'ABS 2 mm', back: null, left: null, right: null }));
  }

  const holeList = createHoleList(parts, parameters, doorHeight);
  const partsWithHoles = parts.map((part) => ({ ...part, holes: holeList.filter((hole) => hole.partId === part.id) }));
  const hardwareList = createHardwareList(partsWithHoles, parameters, doorHeight);
  const validation = validateKitchenBaseCabinet(parameters, partsWithHoles);

  return {
    id: `dynamic_${templateId}`,
    templateId,
    type: 'DynamicComponent',
    name: template.name,
    category: template.category,
    version: '1.1.0',
    parameters,
    parameterDefinitions: kitchenBaseCabinetParameterDefinitions(),
    formulas: kitchenBaseCabinetFormulas,
    parts: partsWithHoles,
    cutlist: createCutlist(partsWithHoles),
    edgeList: createEdgeList(partsWithHoles),
    holeList,
    hardwareList,
    validation,
    metadata: {
      author: 'EF-Sinn / Hermes CAD',
      description: 'Parametrischer Küchen-Unterschrank mit echten Bauteilen, Kanten, Bohrungen und Beschlägen.',
      tags: ['kitchen', 'cabinet', 'corpus', 'dynamic', 'furniture']
    }
  };
}

export function serializeDynamicComponentTemplate(component: DynamicComponent): string {
  const template = {
    id: component.id,
    templateId: component.templateId,
    type: component.type,
    name: component.name,
    version: component.version,
    category: component.category,
    parameters: component.parameters,
    parameterDefinitions: component.parameterDefinitions,
    formulas: component.formulas,
    parts: component.parts,
    rules: ['validate dimensions', 'rebuild parts instead of visual scaling', 'update cutlist edges holes hardware'],
    actions: {
      on_change: [
        { parameter: 'W', action: 'recalculate_component' },
        { parameter: 'DOOR_TYPE', action: 'regenerate_fronts' }
      ],
      on_export: [{ action: 'export_cutlist_edges_holes_hardware' }]
    },
    exportData: {
      cutlist: component.cutlist,
      edgeList: component.edgeList,
      holeList: component.holeList,
      hardwareList: component.hardwareList
    },
    metadata: component.metadata
  };
  return `${JSON.stringify(template, null, 2)}\n`;
}

export function parseDynamicComponentTemplate(source: string): DynamicComponent {
  const parsed = JSON.parse(source) as { templateId?: DynamicCabinetTemplateId; parameters?: Partial<KitchenBaseCabinetParameters> };
  return rebuildDynamicCabinet(parsed.templateId ?? 'kitchen_base_cabinet', parsed.parameters ?? {});
}

export type FormulaAnalysis =
  | { ok: true; value: FormulaValue; dependencies: string[] }
  | { ok: false; error: string; dependencies: string[] };

export function analyzeDynamicFormula(expression: string, context: FormulaContext): FormulaAnalysis {
  const dependencies = Array.from(new Set(tokenizeFormula(expression)
    .filter((token): token is Extract<FormulaToken, { type: 'identifier' }> => token.type === 'identifier')
    .map((token) => token.value)
    .filter((name) => name in context)))
    .sort();
  try {
    return { ok: true, value: evaluateDynamicFormula(expression, context), dependencies };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), dependencies };
  }
}

export function exportDynamicComponentCncCsv(component: DynamicComponent): string {
  const rows = ['part_id,part_name,operation,diameter,depth,x,y,z,direction,purpose'];
  for (const hole of component.holeList) {
    rows.push([
      hole.partId,
      hole.partName,
      'drill',
      hole.diameter,
      hole.depth,
      hole.x,
      hole.y,
      hole.z,
      hole.direction,
      hole.purpose
    ].map(csvCell).join(','));
  }
  return `${rows.join('\n')}\n`;
}

export function exportDynamicComponentManufacturingDxf(component: DynamicComponent): string {
  const lines: string[] = [
    '0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', '5',
    ...dxfLayer('CUT', 7),
    ...dxfLayer('DRILL', 1),
    ...dxfLayer('EDGE_FRONT', 3),
    ...dxfLayer('EDGE_OTHER', 5),
    ...dxfLayer('GROOVE', 2),
    '0', 'ENDTAB', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES'
  ];
  let xOffset = 0;
  for (const part of component.parts.filter((entry) => entry.exportEnabled && entry.visible)) {
    const x0 = xOffset;
    const y0 = 0;
    const x1 = x0 + part.dimensions.length;
    const y1 = y0 + part.dimensions.width;
    lines.push(...dxfPolyline('CUT', [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]));
    for (const edge of component.edgeList.filter((row) => row.partId === part.id)) {
      const layer = edge.edge === 'front' ? 'EDGE_FRONT' : 'EDGE_OTHER';
      if (edge.edge === 'front') lines.push(...dxfLine(layer, x0, y0, x1, y0));
      if (edge.edge === 'back') lines.push(...dxfLine(layer, x0, y1, x1, y1));
      if (edge.edge === 'left') lines.push(...dxfLine(layer, x0, y0, x0, y1));
      if (edge.edge === 'right') lines.push(...dxfLine(layer, x1, y0, x1, y1));
    }
    for (const hole of component.holeList.filter((row) => row.partId === part.id)) {
      lines.push(...dxfCircle('DRILL', x0 + hole.x, y0 + hole.y, hole.diameter / 2));
    }
    for (const operation of part.machining.filter((entry) => entry.type === 'groove')) {
      lines.push(...dxfLine('GROOVE', x0 + operation.x, y0 + operation.y, x0 + operation.x + operation.length, y0 + operation.y));
    }
    lines.push(...dxfText('CUT', x0, y1 + 20, part.name));
    xOffset += part.dimensions.length + 40;
  }
  lines.push('0', 'ENDSEC', '0', 'EOF');
  return `${lines.join('\n')}\n`;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function dxfLayer(name: string, color: number): string[] {
  return ['0', 'LAYER', '2', name, '70', '0', '62', String(color), '6', 'CONTINUOUS'];
}

function dxfLine(layer: string, x0: number, y0: number, x1: number, y1: number): string[] {
  return ['0', 'LINE', '8', layer, '10', String(roundToOne(x0)), '20', String(roundToOne(y0)), '30', '0', '11', String(roundToOne(x1)), '21', String(roundToOne(y1)), '31', '0'];
}

function dxfPolyline(layer: string, points: [number, number][]): string[] {
  return points.flatMap((point, index) => index === 0 ? [] : dxfLine(layer, points[index - 1][0], points[index - 1][1], point[0], point[1]));
}

function dxfCircle(layer: string, x: number, y: number, radius: number): string[] {
  return ['0', 'CIRCLE', '8', layer, '10', String(roundToOne(x)), '20', String(roundToOne(y)), '30', '0', '40', String(roundToOne(radius))];
}

function dxfText(layer: string, x: number, y: number, value: string): string[] {
  return ['0', 'TEXT', '8', layer, '10', String(roundToOne(x)), '20', String(roundToOne(y)), '30', '0', '40', '12', '1', value];
}

export function buildSketchModelFromDynamicComponent(component: DynamicComponent): SketchModel {
  const model = new SketchModel();
  const ids: string[] = [];
  for (const part of component.parts.filter((entry) => entry.visible)) {
    const box = model.createBox(part.position, Math.max(part.size.x, 0.1), Math.max(part.size.y, 0.1), Math.max(part.size.z, 0.1));
    model.applyMaterial(box.id, materialAssignmentForPart(part));
    ids.push(box.id);
  }
  if (ids.length > 0) model.createComponent(component.name, ids);
  return model;
}

function sanitizeKitchenBaseCabinetParameters(parameters: KitchenBaseCabinetParameters): KitchenBaseCabinetParameters {
  const D = finiteOrDefault(parameters.D, 560);
  const maxRunnerLength = Math.max(250, D - 30);
  return {
    ...parameters,
    W: finiteOrDefault(parameters.W, 600),
    H: finiteOrDefault(parameters.H, 720),
    D,
    T: finiteOrDefault(parameters.T, 19),
    BACK_T: finiteOrDefault(parameters.BACK_T, 8),
    DOOR_T: finiteOrDefault(parameters.DOOR_T, 19),
    FRONT_GAP: finiteOrDefault(parameters.FRONT_GAP, 2),
    SHELF_COUNT: Math.max(0, Math.floor(finiteOrDefault(parameters.SHELF_COUNT, 1))),
    DRAWER_COUNT: Math.max(1, Math.floor(finiteOrDefault(parameters.DRAWER_COUNT, 3))),
    DRAWER_RUNNER_LENGTH: Math.min(maxRunnerLength, finiteOrDefault(parameters.DRAWER_RUNNER_LENGTH, 500))
  };
}

function finiteOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function numberResult(value: FormulaValue): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Formel muss eine finite Zahl ergeben.');
  return value;
}

function panelPart(
  name: string,
  partType: PartType,
  length: number,
  width: number,
  thickness: number,
  position: Vec3,
  size: PartComponent['size'],
  material: string,
  grainDirection: PartComponent['grainDirection'],
  edgeBanding: EdgeBanding
): Omit<PartComponent, 'id' | 'rotation' | 'holes' | 'quantity' | 'visible' | 'exportEnabled'> {
  return {
    name,
    partType,
    dimensions: { length: roundToOne(length), width: roundToOne(width), thickness: roundToOne(thickness) },
    size: { x: roundToOne(size.x), y: roundToOne(size.y), z: roundToOne(size.z) },
    position,
    material,
    grainDirection,
    edgeBanding,
    machining: []
  };
}

function backPanelGrooveMachining(parameters: KitchenBaseCabinetParameters): { side: MachiningOperation[]; horizontal: MachiningOperation[] } {
  const grooveDepth = 8;
  const grooveWidth = parameters.BACK_T;
  const grooveY = roundToOne(parameters.D - grooveDepth - parameters.BACK_T);
  return {
    side: [{
      id: 'back_panel_groove_side',
      type: 'groove',
      purpose: 'back_panel_groove',
      face: 'back',
      x: 0,
      y: grooveY,
      z: parameters.T,
      length: roundToOne(parameters.H - 2 * parameters.T),
      width: grooveWidth,
      depth: grooveDepth
    } as MachiningOperation],
    horizontal: [{
      id: 'back_panel_groove_horizontal',
      type: 'groove',
      purpose: 'back_panel_groove',
      face: 'top',
      x: 0,
      y: grooveY,
      z: 0,
      length: roundToOne(parameters.W - 2 * parameters.T),
      width: grooveWidth,
      depth: grooveDepth
    }]
  };
}

function addFrontSystem(
  parts: PartComponent[],
  parameters: KitchenBaseCabinetParameters,
  doorWidth: number,
  doorHeight: number,
  addPart: (part: Omit<PartComponent, 'id' | 'rotation' | 'holes' | 'machining' | 'quantity' | 'visible' | 'exportEnabled'> & Partial<Pick<PartComponent, 'id' | 'rotation' | 'holes' | 'machining' | 'quantity' | 'visible' | 'exportEnabled'>>) => PartComponent
): void {
  const doorEdges: EdgeBanding = { front: 'ABS 2 mm', back: 'ABS 0.8 mm', left: 'ABS 0.8 mm', right: 'ABS 0.8 mm' };
  if (parameters.DOOR_TYPE === 'left_door' || parameters.DOOR_TYPE === 'double_door') {
    addPart(panelPart('Tür_L', 'door', doorWidth, doorHeight, parameters.DOOR_T, vec(parameters.FRONT_GAP, -parameters.DOOR_T, parameters.FRONT_GAP), { x: doorWidth, y: parameters.DOOR_T, z: doorHeight }, parameters.MATERIAL_FRONT, 'vertical', doorEdges));
  }
  if (parameters.DOOR_TYPE === 'right_door' || parameters.DOOR_TYPE === 'double_door') {
    const x = parameters.DOOR_TYPE === 'double_door' ? 2 * parameters.FRONT_GAP + doorWidth : parameters.FRONT_GAP;
    addPart(panelPart('Tür_R', 'door', doorWidth, doorHeight, parameters.DOOR_T, vec(x, -parameters.DOOR_T, parameters.FRONT_GAP), { x: doorWidth, y: parameters.DOOR_T, z: doorHeight }, parameters.MATERIAL_FRONT, 'vertical', doorEdges));
  }
  if (parameters.DOOR_TYPE !== 'drawers') return;

  const frontHeight = (parameters.H - (parameters.DRAWER_COUNT + 1) * parameters.DRAWER_GAP) / parameters.DRAWER_COUNT;
  const innerWidth = parameters.W - 2 * parameters.T - 2 * parameters.DRAWER_SIDE_CLEARANCE;
  for (let index = 1; index <= parameters.DRAWER_COUNT; index += 1) {
    const z = parameters.DRAWER_GAP + (index - 1) * (frontHeight + parameters.DRAWER_GAP);
    addPart(panelPart(`Schubladenfront_${pad2(index)}`, 'drawer_front', parameters.W - 2 * parameters.FRONT_GAP, frontHeight, parameters.DOOR_T, vec(parameters.FRONT_GAP, -parameters.DOOR_T, z), { x: parameters.W - 2 * parameters.FRONT_GAP, y: parameters.DOOR_T, z: frontHeight }, parameters.MATERIAL_FRONT, 'horizontal', { front: 'ABS 2 mm', back: null, left: 'ABS 0.8 mm', right: 'ABS 0.8 mm' }));
    addPart(panelPart(`Schubladenseite_L_${pad2(index)}`, 'drawer_side', parameters.DRAWER_RUNNER_LENGTH, 120, 16, vec(parameters.T + parameters.DRAWER_SIDE_CLEARANCE, 20, z), { x: 16, y: parameters.DRAWER_RUNNER_LENGTH, z: 120 }, parameters.MATERIAL_BODY, 'horizontal', { front: 'ABS 0.8 mm', back: null, left: null, right: null }));
    addPart(panelPart(`Schubladenseite_R_${pad2(index)}`, 'drawer_side', parameters.DRAWER_RUNNER_LENGTH, 120, 16, vec(parameters.W - parameters.T - parameters.DRAWER_SIDE_CLEARANCE - 16, 20, z), { x: 16, y: parameters.DRAWER_RUNNER_LENGTH, z: 120 }, parameters.MATERIAL_BODY, 'horizontal', { front: 'ABS 0.8 mm', back: null, left: null, right: null }));
    addPart(panelPart(`Schubladenboden_${pad2(index)}`, 'drawer_bottom', innerWidth, parameters.DRAWER_RUNNER_LENGTH, 8, vec(parameters.T + parameters.DRAWER_SIDE_CLEARANCE, 20, z), { x: innerWidth, y: parameters.DRAWER_RUNNER_LENGTH, z: 8 }, parameters.MATERIAL_BACK, 'none', { front: null, back: null, left: null, right: null }));
    addPart(panelPart(`Schubladenrückstück_${pad2(index)}`, 'drawer_back', innerWidth, 120, 16, vec(parameters.T + parameters.DRAWER_SIDE_CLEARANCE, parameters.DRAWER_RUNNER_LENGTH, z), { x: innerWidth, y: 16, z: 120 }, parameters.MATERIAL_BODY, 'horizontal', { front: null, back: null, left: null, right: null }));
    addPart(panelPart(`Auszug_L_${pad2(index)}`, 'drawer_runner', parameters.DRAWER_RUNNER_LENGTH, 45, 12, vec(parameters.T, 20, z), { x: 12, y: parameters.DRAWER_RUNNER_LENGTH, z: 45 }, 'Beschlag Auszug', 'none', { front: null, back: null, left: null, right: null }));
    addPart(panelPart(`Auszug_R_${pad2(index)}`, 'drawer_runner', parameters.DRAWER_RUNNER_LENGTH, 45, 12, vec(parameters.W - parameters.T - 12, 20, z), { x: 12, y: parameters.DRAWER_RUNNER_LENGTH, z: 45 }, 'Beschlag Auszug', 'none', { front: null, back: null, left: null, right: null }));
  }
  void parts;
}

function createHoleList(parts: PartComponent[], parameters: KitchenBaseCabinetParameters, doorHeight: number): DrillHole[] {
  const holes: DrillHole[] = [];
  if (parameters.LINE_BORE && parameters.SHELF_TYPE === 'adjustable') {
    const sideParts = parts.filter((part) => part.partType === 'side_panel');
    const count = Math.max(0, Math.floor((parameters.H - 2 * parameters.HOLE_START_Z) / parameters.HOLE_SPACING) + 1);
    for (const part of sideParts) {
      for (let index = 0; index < count; index += 1) {
        holes.push({
          id: `${part.id}_shelf_pin_${index + 1}`,
          partId: part.id,
          partName: part.name,
          diameter: parameters.HOLE_DIAMETER,
          depth: parameters.HOLE_DEPTH,
          x: parameters.HOLE_FRONT_OFFSET,
          y: 0,
          z: parameters.HOLE_START_Z + index * parameters.HOLE_SPACING,
          direction: 'inside',
          purpose: 'shelf_pin'
        });
      }
    }
  }

  const hingeCount = hingeCountForDoorHeight(doorHeight);
  for (const part of parts.filter((entry) => entry.partType === 'door')) {
    for (let index = 0; index < hingeCount; index += 1) {
      const z = hingeCount === 1 ? doorHeight / 2 : 100 + ((doorHeight - 200) / (hingeCount - 1)) * index;
      const cupX = part.name.endsWith('_R') ? part.dimensions.length - 22.5 : 22.5;
      holes.push({
        id: `${part.id}_hinge_${index + 1}`,
        partId: part.id,
        partName: part.name,
        diameter: 35,
        depth: 12.5,
        x: roundToOne(cupX),
        y: 0,
        z: roundToOne(z),
        direction: 'inside',
        purpose: 'hinge_cup'
      });
    }
  }
  for (const part of parts.filter((entry) => entry.partType === 'drawer_runner')) {
    for (const offset of [64, Math.max(96, part.dimensions.length - 64)]) {
      holes.push({
        id: `${part.id}_runner_${roundToOne(offset)}`,
        partId: part.id,
        partName: part.name,
        diameter: 4,
        depth: 10,
        x: 6,
        y: roundToOne(offset),
        z: 22.5,
        direction: 'inside',
        purpose: 'runner'
      });
    }
  }
  return holes;
}

function createHardwareList(parts: PartComponent[], parameters: KitchenBaseCabinetParameters, doorHeight: number): HardwareRow[] {
  const rows: HardwareRow[] = [];
  const doorIds = parts.filter((part) => part.partType === 'door').map((part) => part.id);
  if (doorIds.length > 0) {
    const hingeCount = hingeCountForDoorHeight(doorHeight);
    doorIds.forEach((doorId) => {
      for (let index = 1; index <= hingeCount; index += 1) {
        rows.push({ id: `hinge_${doorId}_${index}`, type: 'hinge', name: `${parameters.HINGE_TYPE} Scharnier 110°`, quantity: 1, targetPartIds: [doorId] });
      }
    });
  }
  const runnerIds = parts.filter((part) => part.partType === 'drawer_runner').map((part) => part.id);
  if (runnerIds.length > 0) {
    rows.push({ id: 'drawer_runners', type: 'drawer_runner', name: 'Schubladenauszug Paar', quantity: Math.ceil(runnerIds.length / 2), targetPartIds: runnerIds });
  }
  if (parameters.LINE_BORE && parameters.SHELF_TYPE === 'adjustable') {
    rows.push({ id: 'shelf_pins', type: 'shelf_pin', name: 'Fachbodenträger 5 mm', quantity: Math.max(0, parameters.SHELF_COUNT * 4), targetPartIds: parts.filter((part) => part.partType === 'shelf').map((part) => part.id) });
  }
  if (parameters.PLINTH) {
    rows.push({ id: 'plinth', type: 'plinth', name: 'Sockel-/Stellfuß-System', quantity: 1, targetPartIds: parts.filter((part) => part.partType === 'plinth').map((part) => part.id) });
  }
  return rows;
}

function createCutlist(parts: PartComponent[]): CutlistRow[] {
  return parts
    .filter((part) => part.visible && part.exportEnabled && !part.partType.includes('runner'))
    .map((part) => ({
      partId: part.id,
      name: part.name,
      quantity: part.quantity,
      length: part.dimensions.length,
      width: part.dimensions.width,
      thickness: part.dimensions.thickness,
      material: part.material,
      grainDirection: part.grainDirection
    }));
}

function createEdgeList(parts: PartComponent[]): EdgeListRow[] {
  const rows: EdgeListRow[] = [];
  for (const part of parts.filter((entry) => entry.visible && entry.exportEnabled)) {
    for (const edge of ['front', 'back', 'left', 'right'] as const) {
      const banding = part.edgeBanding[edge];
      if (!banding) continue;
      rows.push({ partId: part.id, partName: part.name, edge, banding, length: edge === 'front' || edge === 'back' ? part.dimensions.length : part.dimensions.width });
    }
  }
  return rows;
}

function validateKitchenBaseCabinet(parameters: KitchenBaseCabinetParameters, parts: PartComponent[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (parameters.W < 300) issues.push({ severity: 'error', message: 'Schrankbreite zu klein. Minimum für Küchen-Unterschrank: 300 mm.' });
  if (parameters.D < 250) issues.push({ severity: 'error', message: 'Schranktiefe zu klein. Minimum für Küchen-Unterschrank: 250 mm.' });
  if (parameters.DOOR_TYPE !== 'double_door' && parameters.DOOR_TYPE !== 'drawers' && parameters.W > 600) {
    issues.push({ severity: 'warning', message: 'Einzeltür über 600 mm kann instabil sein.' });
  }
  if (parameters.H > 900 && parameters.SHELF_COUNT === 0) issues.push({ severity: 'info', message: 'Bei hoher Korpus-Höhe ist mindestens ein Fachboden empfohlen.' });
  if (parameters.DOOR_TYPE === 'drawers' && parameters.DRAWER_RUNNER_LENGTH >= parameters.D - 30) {
    issues.push({ severity: 'warning', message: 'Auszugslänge wurde auf die nutzbare Korpustiefe begrenzt.' });
  }
  if (parameters.BACK_TYPE === 'grooved' && parameters.T < parameters.BACK_T + 8) {
    issues.push({ severity: 'warning', message: 'Genutete Rückwand braucht ausreichend Materialstärke für Nut und Reststeg.' });
  }
  for (const part of parts) {
    if (part.dimensions.length <= 0 || part.dimensions.width <= 0 || part.dimensions.thickness <= 0) {
      issues.push({ severity: 'error', message: `${part.name} hat ungültige oder negative Maße.`, partId: part.id });
    }
    const materialThickness = thicknessFromMaterialName(part.material);
    if (materialThickness !== undefined && Math.abs(materialThickness - part.dimensions.thickness) > 0.01 && !part.partType.includes('runner')) {
      issues.push({ severity: 'warning', message: `${part.name} hat ${part.dimensions.thickness} mm, aber Material ist ${materialThickness} mm.`, partId: part.id });
    }
  }
  return issues;
}

function hingeCountForDoorHeight(doorHeight: number): number {
  if (doorHeight <= 900) return 2;
  if (doorHeight <= 1600) return 3;
  if (doorHeight <= 2200) return 4;
  return 5;
}

function materialAssignmentForPart(part: PartComponent): { name: string; color: string } {
  if (part.material.includes('Front') || part.material.includes('MDF')) return { name: part.material, color: '#f8fafc' };
  if (part.material.includes('HDF')) return { name: part.material, color: '#e5e7eb' };
  if (part.material.includes('Beschlag')) return { name: part.material, color: '#94a3b8' };
  return { name: part.material, color: '#ffffff' };
}

function thicknessFromMaterialName(name: string): number | undefined {
  const match = /(\d+(?:[.,]\d+)?)\s*mm/i.exec(name);
  return match ? Number(match[1].replace(',', '.')) : undefined;
}

function stablePartId(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'part';
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function tokenizeFormula(expression: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let index = 0;
  while (index < expression.length) {
    const char = expression[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      let end = index + 1;
      let value = '';
      while (end < expression.length && expression[end] !== quote) {
        value += expression[end];
        end += 1;
      }
      if (expression[end] !== quote) throw new Error('String in Formel ist nicht geschlossen.');
      tokens.push({ type: 'string', value });
      index = end + 1;
      continue;
    }
    const numberMatch = /^\d+(?:\.\d+)?/.exec(expression.slice(index));
    if (numberMatch) {
      tokens.push({ type: 'number', value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }
    const identifierMatch = /^[A-Za-z_][A-Za-z0-9_]*/.exec(expression.slice(index));
    if (identifierMatch) {
      tokens.push({ type: 'identifier', value: identifierMatch[0] });
      index += identifierMatch[0].length;
      continue;
    }
    const twoChar = expression.slice(index, index + 2);
    if (['==', '!=', '<=', '>='].includes(twoChar)) {
      tokens.push({ type: 'operator', value: twoChar });
      index += 2;
      continue;
    }
    if (['+', '-', '*', '/', '<', '>'].includes(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }
    if (char === '(' || char === ')' || char === ',') {
      tokens.push({ type: 'punctuation', value: char });
      index += 1;
      continue;
    }
    throw new Error(`Ungültiges Zeichen in Formel: ${char}`);
  }
  return tokens;
}

class FormulaParser {
  private index = 0;

  constructor(private readonly tokens: FormulaToken[], private readonly context: FormulaContext) {}

  parse(): FormulaValue {
    const value = this.parseOr();
    if (!this.isAtEnd()) throw new Error('Formel enthält unerwartete Tokens.');
    return value;
  }

  private parseOr(): FormulaValue {
    let left = this.parseAnd();
    while (this.matchIdentifier('OR')) left = truthy(left) || truthy(this.parseAnd());
    return left;
  }

  private parseAnd(): FormulaValue {
    let left = this.parseEquality();
    while (this.matchIdentifier('AND')) left = truthy(left) && truthy(this.parseEquality());
    return left;
  }

  private parseEquality(): FormulaValue {
    let left = this.parseComparison();
    while (this.matchOperator('==') || this.matchOperator('!=')) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      left = operator === '==' ? left === right : left !== right;
    }
    return left;
  }

  private parseComparison(): FormulaValue {
    let left = this.parseTerm();
    while (this.matchOperator('<') || this.matchOperator('<=') || this.matchOperator('>') || this.matchOperator('>=')) {
      const operator = this.previous().value;
      const right = this.parseTerm();
      const a = numeric(left);
      const b = numeric(right);
      if (operator === '<') left = a < b;
      if (operator === '<=') left = a <= b;
      if (operator === '>') left = a > b;
      if (operator === '>=') left = a >= b;
    }
    return left;
  }

  private parseTerm(): FormulaValue {
    let left = this.parseFactor();
    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previous().value;
      const right = this.parseFactor();
      left = operator === '+' ? numeric(left) + numeric(right) : numeric(left) - numeric(right);
    }
    return left;
  }

  private parseFactor(): FormulaValue {
    let left = this.parseUnary();
    while (this.matchOperator('*') || this.matchOperator('/')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      left = operator === '*' ? numeric(left) * numeric(right) : numeric(left) / numeric(right);
    }
    return left;
  }

  private parseUnary(): FormulaValue {
    if (this.matchOperator('-')) return -numeric(this.parseUnary());
    if (this.matchIdentifier('NOT')) return !truthy(this.parseUnary());
    return this.parsePrimary();
  }

  private parsePrimary(): FormulaValue {
    if (this.match('number')) return this.previous().value;
    if (this.match('string')) return this.previous().value;
    if (this.matchPunctuation('(')) {
      const value = this.parseOr();
      this.consumePunctuation(')', 'Schließende Klammer fehlt.');
      return value;
    }
    if (this.match('identifier')) {
      const name = String(this.previous().value);
      if (this.matchPunctuation('(')) return this.finishFunction(name);
      if (name === 'true') return true;
      if (name === 'false') return false;
      if (!(name in this.context)) throw new Error(`Unbekannter Parameter in Formel: ${name}`);
      return this.context[name];
    }
    throw new Error('Formel konnte nicht gelesen werden.');
  }

  private finishFunction(name: string): FormulaValue {
    const args: FormulaValue[] = [];
    if (!this.checkPunctuation(')')) {
      do {
        args.push(this.parseOr());
      } while (this.matchPunctuation(','));
    }
    this.consumePunctuation(')', 'Funktionsklammer fehlt.');
    const upper = name.toUpperCase();
    if (upper === 'MIN') return Math.min(...args.map(numeric));
    if (upper === 'MAX') return Math.max(...args.map(numeric));
    if (upper === 'ROUND') return Math.round(numeric(args[0]));
    if (upper === 'FLOOR') return Math.floor(numeric(args[0]));
    if (upper === 'CEIL') return Math.ceil(numeric(args[0]));
    if (upper === 'ABS') return Math.abs(numeric(args[0]));
    if (upper === 'IF') return truthy(args[0]) ? args[1] : args[2];
    if (upper === 'AND') return args.every(truthy);
    if (upper === 'OR') return args.some(truthy);
    if (upper === 'NOT') return !truthy(args[0]);
    if (upper === 'CHOOSE') return args[Math.max(1, Math.floor(numeric(args[0])))];
    if (upper === 'CLAMP') return Math.min(Math.max(numeric(args[0]), numeric(args[1])), numeric(args[2]));
    throw new Error(`Unbekannte Formel-Funktion: ${name}`);
  }

  private match(type: FormulaToken['type']): boolean {
    if (this.check(type)) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private matchOperator(value: string): boolean {
    if (this.checkOperator(value)) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private matchIdentifier(value: string): boolean {
    const token = this.peek();
    if (token?.type === 'identifier' && token.value.toUpperCase() === value) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private matchPunctuation(value: '(' | ')' | ','): boolean {
    if (this.checkPunctuation(value)) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private consumePunctuation(value: '(' | ')' | ',', message: string): void {
    if (!this.matchPunctuation(value)) throw new Error(message);
  }

  private check(type: FormulaToken['type']): boolean {
    return this.peek()?.type === type;
  }

  private checkOperator(value: string): boolean {
    const token = this.peek();
    return token?.type === 'operator' && token.value === value;
  }

  private checkPunctuation(value: '(' | ')' | ','): boolean {
    const token = this.peek();
    return token?.type === 'punctuation' && token.value === value;
  }

  private peek(): FormulaToken | undefined {
    return this.tokens[this.index];
  }

  private previous(): FormulaToken {
    return this.tokens[this.index - 1];
  }

  private isAtEnd(): boolean {
    return this.index >= this.tokens.length;
  }
}

function numeric(value: FormulaValue | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  throw new Error(`Wert ist nicht numerisch: ${String(value)}`);
}

function truthy(value: FormulaValue | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}
