import type { Entity, SketchModel, ComponentId, EntityId } from './model';
import type { MaterialDefinition, MaterialId } from './materials';

export type RenderMaterialCategory = 'wood' | 'board' | 'veneer' | 'paint' | 'metal' | 'glass' | 'plastic' | 'generic';
export type RenderEngine = 'three-preview' | 'blender-eevee' | 'blender-cycles';
export type RenderQuality = 'draft' | 'preview' | 'final';
export type RenderObjectKind = 'box' | 'face' | 'edge' | 'referenceMesh' | 'generatedMesh';
export type RenderLightType = 'directional' | 'point' | 'area' | 'ambient';

export type RenderMaterialDefinition = Readonly<{
  id: MaterialId;
  name: string;
  category: RenderMaterialCategory;
  baseColor: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  transparent?: boolean;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  metalnessMapUrl?: string;
  aoMapUrl?: string;
  colorMapUrl?: string;
  textureScaleMm?: { x: number; y: number };
  grainDirection?: 'x' | 'y' | 'z' | 'auto-panel-long-edge';
  source?: { kind: 'builtin' | 'user-upload' | 'library'; license?: string; url?: string };
}>;

export type RenderTransform = Readonly<{
  position: [number, number, number];
  rotationEuler: [number, number, number];
  scale: [number, number, number];
}>;

export type RenderMeshRef = Readonly<{
  kind: 'box-primitive' | 'polyline' | 'polygon' | 'triangle-mesh';
  vertexCount?: number;
  triangleCount?: number;
}>;

export type RenderObject = Readonly<{
  id: string;
  sourceEntityId?: EntityId;
  sourceComponentId?: ComponentId;
  name: string;
  kind: RenderObjectKind;
  transform: RenderTransform;
  mesh?: RenderMeshRef;
  materialId?: MaterialId;
  visible: boolean;
  selectable: boolean;
}>;

export type RenderCamera = Readonly<{
  id: string;
  name: string;
  type: 'perspective' | 'orthographic';
  position: [number, number, number];
  target: [number, number, number];
  focalLengthMm?: number;
  fovDegrees?: number;
}>;

export type RenderLight = Readonly<{
  id: string;
  name: string;
  type: RenderLightType;
  position?: [number, number, number];
  direction?: [number, number, number];
  color: string;
  intensity: number;
  sizeMm?: number;
}>;

export type RenderEnvironment = Readonly<{
  id: string;
  name: string;
  backgroundColor: string;
  ambientColor: string;
  exposure: number;
}>;

export type RenderPreset = Readonly<{
  id: string;
  name: string;
  quality: RenderQuality;
  engine: RenderEngine;
  width: number;
  height: number;
  samples: number;
}>;

export type RenderSceneSnapshot = Readonly<{
  version: 1;
  unit: 'mm';
  sourceProjectId?: string;
  objects: RenderObject[];
  materials: RenderMaterialDefinition[];
  cameras: RenderCamera[];
  lights: RenderLight[];
  environment: RenderEnvironment;
  presets: RenderPreset[];
}>;

export type RenderJob = Readonly<{
  version: 1;
  engine: RenderEngine;
  quality: RenderQuality;
  width: number;
  height: number;
  samples: number;
  cameraId?: string;
  sceneSnapshot: RenderSceneSnapshot;
  outputName?: string;
}>;

const SAFE_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const SAFE_ASSET_URL_PATTERN = /^(\/|\.\/|\.\.\/|blob:|data:image\/(png|jpeg|jpg|webp|gif|bmp|svg\+xml);base64,)/i;

export function normalizeRenderMaterial(material: RenderMaterialDefinition): RenderMaterialDefinition {
  const id = material.id.trim();
  const name = material.name.trim();
  if (!id || !SAFE_ID_PATTERN.test(id)) throw new Error(`Material-ID ist unsicher: ${material.id}`);
  if (!name) throw new Error('Render-Material braucht einen Namen.');
  if (!isRenderMaterialCategory(material.category)) throw new Error(`Render-Material-Kategorie ist ungültig: ${String(material.category)}`);
  if (!HEX_COLOR_PATTERN.test(material.baseColor.trim())) throw new Error(`Render-Material-Farbe ist ungültig: ${material.baseColor}`);
  if (!isUnitInterval(material.roughness)) throw new Error('Roughness muss zwischen 0 und 1 liegen.');
  if (!isUnitInterval(material.metalness)) throw new Error('Metalness muss zwischen 0 und 1 liegen.');
  if (material.opacity !== undefined && !isUnitInterval(material.opacity)) throw new Error('Opacity muss zwischen 0 und 1 liegen.');
  if (material.textureScaleMm && (!isPositiveFinite(material.textureScaleMm.x) || !isPositiveFinite(material.textureScaleMm.y))) {
    throw new Error('Texturmaßstab muss positive Millimeterwerte haben.');
  }
  for (const url of [material.normalMapUrl, material.roughnessMapUrl, material.metalnessMapUrl, material.aoMapUrl, material.colorMapUrl, material.source?.url]) {
    if (url !== undefined && !SAFE_ASSET_URL_PATTERN.test(url)) throw new Error(`Render-Material-URL ist unsicher: ${url}`);
  }
  return {
    ...material,
    id,
    name,
    baseColor: material.baseColor.trim(),
    roughness: material.roughness,
    metalness: material.metalness,
    ...(material.opacity !== undefined ? { opacity: material.opacity } : {}),
    ...(material.transparent === true || material.opacity !== undefined && material.opacity < 1 ? { transparent: true } : material.transparent === false ? { transparent: false } : {})
  };
}

export function renderMaterialFromCadMaterial(material: MaterialDefinition): RenderMaterialDefinition {
  return normalizeRenderMaterial({
    id: material.id,
    name: material.name,
    category: inferRenderMaterialCategory(material),
    baseColor: material.color,
    roughness: inferRoughness(material),
    metalness: material.id.includes('metal') ? 0.78 : 0,
    ...(material.transparent ? { opacity: 0.38, transparent: true } : {}),
    ...(inferGrainDirection(material) ? { grainDirection: inferGrainDirection(material) } : {}),
    source: { kind: 'builtin', license: 'Hermes CAD starter material' }
  });
}

export function buildRenderSceneSnapshot(model: SketchModel, options: { sourceProjectId?: string } = {}): RenderSceneSnapshot {
  const componentsById = new Map(model.allComponents().map((component) => [component.id, component]));
  const objects = model.allEntities().filter((entity) => !entity.hidden).map((entity) => renderObjectFromEntity(entity, componentsById));
  return {
    version: 1,
    unit: 'mm',
    ...(options.sourceProjectId ? { sourceProjectId: options.sourceProjectId } : {}),
    objects,
    materials: model.allMaterials().map(renderMaterialFromCadMaterial),
    cameras: defaultRenderCameras(),
    lights: defaultRenderLights(),
    environment: defaultRenderEnvironment(),
    presets: defaultRenderPresets()
  };
}

export function buildRenderJob(input: {
  engine: RenderEngine;
  quality: RenderQuality;
  width: number;
  height: number;
  sceneSnapshot: RenderSceneSnapshot;
  samples?: number;
  cameraId?: string;
  outputName?: string;
}): RenderJob {
  assertRenderDimensions(input.width, input.height);
  const samples = input.samples ?? defaultSamplesForQuality(input.quality);
  if (!Number.isInteger(samples) || samples < 1 || samples > 4096) throw new Error('Render-Samples müssen zwischen 1 und 4096 liegen.');
  if (input.cameraId !== undefined && !SAFE_ID_PATTERN.test(input.cameraId)) throw new Error(`Kamera-ID ist unsicher: ${input.cameraId}`);
  if (input.outputName !== undefined && !SAFE_ID_PATTERN.test(input.outputName)) throw new Error(`Render-Ausgabename ist unsicher: ${input.outputName}`);
  return {
    version: 1,
    engine: input.engine,
    quality: input.quality,
    width: input.width,
    height: input.height,
    samples,
    ...(input.cameraId ? { cameraId: input.cameraId } : {}),
    sceneSnapshot: input.sceneSnapshot,
    ...(input.outputName ? { outputName: input.outputName } : {})
  };
}

export function defaultRenderPresets(): RenderPreset[] {
  return [
    { id: 'draft-work-preview', name: 'Arbeitsvorschau', quality: 'draft', engine: 'three-preview', width: 960, height: 540, samples: 8 },
    { id: 'customer-interior-preview', name: 'Kunden-Vorschau', quality: 'preview', engine: 'three-preview', width: 1280, height: 720, samples: 32 },
    { id: 'final-blender-cycles', name: 'Final über lokale Blender-Bridge', quality: 'final', engine: 'blender-cycles', width: 1920, height: 1080, samples: 256 }
  ];
}

function renderObjectFromEntity(entity: Entity, componentsById: ReadonlyMap<ComponentId, { name: string }>): RenderObject {
  const componentName = entity.componentId ? componentsById.get(entity.componentId)?.name : undefined;
  return {
    id: `render-${entity.id}`,
    sourceEntityId: entity.id,
    ...(entity.componentId ? { sourceComponentId: entity.componentId } : {}),
    name: `${componentName ? `${componentName} / ` : ''}${entity.type}`,
    kind: entity.type,
    transform: transformForEntity(entity),
    mesh: meshRefForEntity(entity),
    materialId: entity.materialId,
    visible: entity.hidden !== true,
    selectable: entity.type !== 'referenceMesh'
  };
}

function transformForEntity(entity: Entity): RenderTransform {
  if (entity.type === 'box') {
    return {
      position: [entity.origin.x, entity.origin.y, entity.origin.z],
      rotationEuler: [0, 0, entity.rotationZ],
      scale: [entity.width, entity.depth, entity.height]
    };
  }
  return { position: [0, 0, 0], rotationEuler: [0, 0, 0], scale: [1, 1, 1] };
}

function meshRefForEntity(entity: Entity): RenderMeshRef {
  if (entity.type === 'box') return { kind: 'box-primitive', vertexCount: 8 };
  if (entity.type === 'edge') return { kind: 'polyline', vertexCount: 2 };
  if (entity.type === 'face') return { kind: 'polygon', vertexCount: entity.vertices.length };
  return { kind: 'triangle-mesh', triangleCount: entity.triangleCount, vertexCount: entity.triangleCount * 3 };
}

function defaultRenderCameras(): RenderCamera[] {
  return [{ id: 'camera-main', name: 'Hauptkamera', type: 'perspective', position: [2200, -2600, 1800], target: [0, 0, 600], fovDegrees: 45, focalLengthMm: 35 }];
}

function defaultRenderLights(): RenderLight[] {
  return [
    { id: 'key-light', name: 'Key Light warm links', type: 'directional', direction: [-0.45, -0.6, -0.65], color: '#fff4dc', intensity: 2.2 },
    { id: 'ambient-fill', name: 'Weiches Umgebungslicht', type: 'ambient', color: '#dbeafe', intensity: 0.35 }
  ];
}

function defaultRenderEnvironment(): RenderEnvironment {
  return { id: 'studio-neutral', name: 'Neutrales Studio', backgroundColor: '#e5e7eb', ambientColor: '#ffffff', exposure: 1 };
}

function inferRenderMaterialCategory(material: MaterialDefinition): RenderMaterialCategory {
  const value = `${material.id} ${material.name}`.toLowerCase();
  if (value.includes('glas') || value.includes('glass')) return 'glass';
  if (value.includes('metal') || value.includes('metall')) return 'metal';
  if (value.includes('lack') || value.includes('ral')) return 'paint';
  if (value.includes('holz') || value.includes('wood') || value.includes('oak') || value.includes('eiche')) return 'wood';
  if (value.includes('mdf') || value.includes('multiplex') || value.includes('platte') || value.includes('board')) return 'board';
  return 'generic';
}

function inferRoughness(material: MaterialDefinition): number {
  const value = `${material.id} ${material.name}`.toLowerCase();
  if (value.includes('glass') || value.includes('glas')) return 0.08;
  if (value.includes('metal') || value.includes('metall')) return 0.34;
  if (value.includes('lack') || value.includes('ral')) return 0.42;
  if (value.includes('holz') || value.includes('wood') || value.includes('eiche')) return 0.68;
  return 0.74;
}

function inferGrainDirection(material: MaterialDefinition): RenderMaterialDefinition['grainDirection'] | undefined {
  const category = inferRenderMaterialCategory(material);
  return category === 'wood' || category === 'board' || category === 'veneer' ? 'auto-panel-long-edge' : undefined;
}

function isRenderMaterialCategory(value: unknown): value is RenderMaterialCategory {
  return typeof value === 'string' && ['wood', 'board', 'veneer', 'paint', 'metal', 'glass', 'plastic', 'generic'].includes(value);
}

function isUnitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function assertRenderDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || width > 7680 || height < 240 || height > 4320) {
    throw new Error('Render-Bildgröße muss zwischen 320×240 und 7680×4320 liegen.');
  }
}

function defaultSamplesForQuality(quality: RenderQuality): number {
  if (quality === 'draft') return 8;
  if (quality === 'preview') return 32;
  return 256;
}
