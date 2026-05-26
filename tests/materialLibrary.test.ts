import { describe, expect, it } from 'vitest';
import { buildDefaultMaterialSwatches, buildMaterialLibrary, categoryFromMaterialPath, isMaterialImageFile, materialAssignmentFromLibraryEntry } from '../src/ui/materialLibrary';

type TestFile = Readonly<{ name: string; type: string; webkitRelativePath?: string }>;

const file = (name: string, type: string, webkitRelativePath?: string): TestFile => ({ name, type, webkitRelativePath });

describe('material library folder import', () => {
  it('accepts common local texture image files and rejects non-material files', () => {
    expect(isMaterialImageFile(file('oak.jpg', 'image/jpeg'))).toBe(true);
    expect(isMaterialImageFile(file('stone.PNG', ''))).toBe(true);
    expect(isMaterialImageFile(file('preview.webp', 'image/webp'))).toBe(true);
    expect(isMaterialImageFile(file('notes.txt', 'text/plain'))).toBe(false);
    expect(isMaterialImageFile(file('model.skp', ''))).toBe(false);
  });

  it('uses the selected PC folder root and the parent folders as SketchUp-like material categories', () => {
    const library = buildMaterialLibrary([
      file('oak.jpg', 'image/jpeg', 'RAL/Woods Good/oak.jpg'),
      file('birch.png', 'image/png', 'RAL/Woods Good/birch.png'),
      file('grass.jpg', 'image/jpeg', 'RAL/Road&Grass/grass.jpg'),
      file('readme.txt', 'text/plain', 'RAL/Road&Grass/readme.txt')
    ]);

    expect(library.rootLabel).toBe('RAL');
    expect(library.categories).toEqual(['Road&Grass', 'Woods Good']);
    expect(library.entries.map((entry) => `${entry.category}/${entry.name}`)).toEqual([
      'Road&Grass/grass',
      'Woods Good/birch',
      'Woods Good/oak'
    ]);
  });

  it('falls back to the chosen folder name when images are directly inside the material folder', () => {
    expect(categoryFromMaterialPath('RAL/yellow.jpg')).toBe('RAL');
    expect(categoryFromMaterialPath('oak.jpg')).toBe('Eigener Ordner');
  });

  it('provides the stable starter material swatches that can be applied to a selection', () => {
    const swatches = buildDefaultMaterialSwatches();

    expect(swatches.map((swatch) => swatch.id)).toEqual([
      'default',
      'wood-light',
      'wood-dark',
      'mdf',
      'multiplex',
      'glass-transparent',
      'metal',
      'white-lacquered'
    ]);
    expect(swatches.map((swatch) => swatch.name)).toContain('Glas transparent');
    expect(swatches.map((swatch) => swatch.name)).toContain('Weiß lackiert');
    expect(swatches.every((swatch) => swatch.color.startsWith('#'))).toBe(true);
  });

  it('turns local texture entries into embedded project-safe material assignments', () => {
    const assignment = materialAssignmentFromLibraryEntry({
      name: 'oak',
      category: 'Woods',
      relativePath: 'RAL/Woods/oak.png',
      fileName: 'oak.png',
      previewUrl: 'blob:http://local/oak',
      textureDataUrl: 'data:image/png;base64,b2Fr'
    });

    expect(assignment).toEqual({
      name: 'oak',
      color: '#b45309',
      previewUrl: 'blob:http://local/oak',
      textureDataUrl: 'data:image/png;base64,b2Fr',
      textureFileName: 'oak.png'
    });
  });
});
