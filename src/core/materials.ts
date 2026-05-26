export type MaterialId = string;

export type MaterialDefinition = Readonly<{
  id: MaterialId;
  name: string;
  color: string;
  transparent?: boolean;
}>;

export const defaultMaterialId = 'default';
const SAFE_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const DEFAULT_MATERIALS: MaterialDefinition[] = [
  { id: 'default', name: 'Default', color: '#d8dee9' },
  { id: 'wood-light', name: 'Holz hell', color: '#d97706' },
  { id: 'wood-dark', name: 'Holz dunkel', color: '#78350f' },
  { id: 'mdf', name: 'MDF', color: '#b08968' },
  { id: 'multiplex', name: 'Multiplex', color: '#c08457' },
  { id: 'glass-transparent', name: 'Glas transparent', color: '#93c5fd', transparent: true },
  { id: 'metal', name: 'Metall', color: '#94a3b8' },
  { id: 'white-lacquered', name: 'Weiß lackiert', color: '#f8fafc' }
];

export function defaultMaterials(): MaterialDefinition[] {
  return DEFAULT_MATERIALS.map((material) => ({ ...material }));
}

export function materialById(id: MaterialId, catalog: readonly MaterialDefinition[] = defaultMaterials()): MaterialDefinition | undefined {
  return catalog.find((material) => material.id === id);
}

export type NormalizeMaterialCatalogOptions = Readonly<{
  preserveStarterMaterials?: boolean;
}>;

export function normalizeMaterialCatalog(materials: readonly MaterialDefinition[] | undefined, options: NormalizeMaterialCatalogOptions = {}): MaterialDefinition[] {
  const starterMaterials = defaultMaterials();
  const starterById = new Map(starterMaterials.map((material) => [material.id, material]));
  const source = materials ?? starterMaterials;
  const normalized: MaterialDefinition[] = [];
  const seen = new Set<string>();
  for (const material of source) {
    const id = typeof material.id === 'string' ? material.id.trim() : '';
    const name = typeof material.name === 'string' ? material.name.trim() : '';
    const color = typeof material.color === 'string' ? material.color.trim() : '';
    if (!id || !name || !SAFE_ID_PATTERN.test(id) || !HEX_COLOR_PATTERN.test(color) || seen.has(id)) continue;
    const canonicalStarter = options.preserveStarterMaterials ? starterById.get(id) : undefined;
    normalized.push(canonicalStarter ? { ...canonicalStarter } : { id, name, color, transparent: material.transparent === true ? true : undefined });
    seen.add(id);
  }
  if (!seen.has(defaultMaterialId)) return [starterMaterials[0], ...normalized];
  return normalized;
}
