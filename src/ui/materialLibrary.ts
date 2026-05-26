import type { MaterialAssignment } from '../core/model';
import { defaultMaterials } from '../core/materials';

export type MaterialFileLike = Readonly<{
  name: string;
  type?: string;
  webkitRelativePath?: string;
}>;

export type MaterialLibraryEntry = Readonly<{
  name: string;
  category: string;
  relativePath: string;
  fileName: string;
}>;

export type BrowserMaterialLibraryEntry = MaterialLibraryEntry & Readonly<{
  previewUrl?: string;
  textureDataUrl?: string;
}>;

export type MaterialLibrary = Readonly<{
  rootLabel: string;
  categories: string[];
  entries: MaterialLibraryEntry[];
}>;

export type MaterialSwatch = Readonly<{
  id: string;
  name: string;
  color: string;
  category: string;
}>;

const MATERIAL_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);

const DEFAULT_MATERIAL_SWATCHES: MaterialSwatch[] = defaultMaterials().map((material) => ({
  id: material.id,
  name: material.name,
  color: material.color,
  category: material.id === 'default' ? 'Standard' : 'Startmaterialien'
}));

export function buildDefaultMaterialSwatches(): MaterialSwatch[] {
  return DEFAULT_MATERIAL_SWATCHES.map((swatch) => ({ ...swatch }));
}

export function materialAssignmentFromLibraryEntry(entry: BrowserMaterialLibraryEntry): MaterialAssignment {
  return {
    name: entry.name,
    color: '#b45309',
    previewUrl: entry.previewUrl,
    textureDataUrl: entry.textureDataUrl,
    textureFileName: entry.textureDataUrl ? entry.fileName : undefined
  };
}

export function isMaterialImageFile(file: MaterialFileLike): boolean {
  if (file.type?.startsWith('image/')) return true;
  const extension = extensionFromName(file.name).toLowerCase();
  return MATERIAL_IMAGE_EXTENSIONS.has(extension);
}

export function categoryFromMaterialPath(relativePath: string, fallback = 'Eigener Ordner'): string {
  const normalized = relativePath.replaceAll('\\', '/');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length >= 3) return parts.at(-2) ?? fallback;
  if (parts.length === 2) return parts[0];
  return fallback;
}

export function buildMaterialLibrary(files: readonly MaterialFileLike[], fallbackRoot = 'Eigener Ordner'): MaterialLibrary {
  const entries = files
    .filter(isMaterialImageFile)
    .map((file) => {
      const relativePath = file.webkitRelativePath || file.name;
      return {
        name: stripExtension(file.name),
        category: categoryFromMaterialPath(relativePath, fallbackRoot),
        relativePath,
        fileName: file.name
      };
    })
    .sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name));

  const firstPath = files.find((file) => file.webkitRelativePath)?.webkitRelativePath;
  const rootLabel = firstPath?.replaceAll('\\', '/').split('/').filter(Boolean)[0] || fallbackRoot;
  const categories = [...new Set(entries.map((entry) => entry.category))].sort((left, right) => left.localeCompare(right));
  return { rootLabel, categories, entries };
}

function stripExtension(name: string): string {
  const extension = extensionFromName(name);
  return extension ? name.slice(0, -extension.length) : name;
}

function extensionFromName(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex) : '';
}
