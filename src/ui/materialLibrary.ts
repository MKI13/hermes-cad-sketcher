import type { MaterialAssignment } from '../core/model';

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
  name: string;
  color: string;
  category: string;
}>;

const MATERIAL_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);

const DEFAULT_MATERIAL_SWATCHES: MaterialSwatch[] = [
  { name: 'Holz warm', color: '#b45309', category: 'Holz' },
  { name: 'Holz hell', color: '#d97706', category: 'Holz' },
  { name: 'Eiche hell', color: '#f59e0b', category: 'Holz' },
  { name: 'Birke', color: '#fde68a', category: 'Holz' },
  { name: 'Nussbaum', color: '#78350f', category: 'Holz' },
  { name: 'Kanten dunkel', color: '#92400e', category: 'Holz' },
  { name: 'Grau', color: '#a8a29e', category: 'Neutral' },
  { name: 'Dunkel', color: '#111827', category: 'Neutral' }
];

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
