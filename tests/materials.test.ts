import { describe, expect, it } from 'vitest';
import { defaultMaterialId, defaultMaterials, materialById, normalizeMaterialCatalog, type MaterialDefinition } from '../src/core/materials';

describe('CAD material catalog', () => {
  it('provides the required starter material palette with stable ids', () => {
    expect(defaultMaterialId).toBe('default');
    expect(defaultMaterials().map((material) => material.id)).toEqual([
      'default',
      'wood-light',
      'wood-dark',
      'mdf',
      'multiplex',
      'glass-transparent',
      'metal',
      'white-lacquered'
    ]);
    expect(materialById('glass-transparent')?.transparent).toBe(true);
  });

  it('normalizes custom material catalogs without losing known assignments', () => {
    const custom: MaterialDefinition[] = [
      { id: 'default', name: 'Default', color: '#d8dee9' },
      { id: 'oak', name: 'Oak', color: '#b45309' },
      { id: 'oak', name: 'Duplicate ignored', color: '#000000' },
      { id: '', name: 'invalid', color: '#ffffff' },
      { id: 'bad-color', name: 'Bad Color', color: 'red' }
    ];

    expect(normalizeMaterialCatalog(custom)).toEqual([
      { id: 'default', name: 'Default', color: '#d8dee9' },
      { id: 'oak', name: 'Oak', color: '#b45309' }
    ]);
  });

  it('adds a missing default material without duplicating starter ids from custom catalogs', () => {
    const normalized = normalizeMaterialCatalog([
      { id: 'wood-light', name: 'Custom Light Wood', color: '#abcdef' }
    ]);

    expect(normalized.filter((material) => material.id === 'wood-light')).toEqual([
      { id: 'wood-light', name: 'Custom Light Wood', color: '#abcdef' }
    ]);
    expect(normalized.map((material) => material.id)).toEqual(['default', 'wood-light']);
  });

  it('keeps starter catalog entries authoritative when custom material ids collide', () => {
    const normalized = normalizeMaterialCatalog([
      { id: 'wood-light', name: 'Imported Wood Light', color: '#111111' },
      { id: 'oak', name: 'Oak', color: '#b45309' }
    ], { preserveStarterMaterials: true });

    expect(materialById('wood-light', normalized)).toEqual({ id: 'wood-light', name: 'Holz hell', color: '#d97706' });
    expect(materialById('oak', normalized)).toEqual({ id: 'oak', name: 'Oak', color: '#b45309' });
  });
});
