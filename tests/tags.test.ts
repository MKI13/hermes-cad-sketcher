import { describe, expect, it } from 'vitest';
import { defaultTagId, defaultTags, isTagVisible, normalizeTags, type EntityTagAssignment, type TagDefinition } from '../src/core/tags';

describe('CAD tags', () => {
  it('defines a safe default Untagged tag for raw geometry', () => {
    expect(defaultTagId).toBe('untagged');
    expect(defaultTags()).toEqual([{ id: 'untagged', name: 'Untagged', visible: true }]);
  });

  it('normalizes custom tags while preserving stable ids and visibility flags', () => {
    const tags = normalizeTags([
      { id: 'untagged', name: 'Untagged', visible: true },
      { id: 'casework', name: 'Casework', visible: false },
      { id: 'casework', name: 'Duplicate ignored', visible: true },
      { id: '', name: 'invalid', visible: true }
    ]);

    expect(tags).toEqual([
      { id: 'untagged', name: 'Untagged', visible: true },
      { id: 'casework', name: 'Casework', visible: false }
    ]);
  });

  it('uses Untagged visibility for raw entities without explicit tag assignments', () => {
    const tags: TagDefinition[] = [
      { id: 'untagged', name: 'Untagged', visible: false },
      { id: 'casework', name: 'Casework', visible: true }
    ];
    const assignments: EntityTagAssignment[] = [{ entityId: 'box_1', tagId: 'casework' }];

    expect(isTagVisible('box_1', assignments, tags)).toBe(true);
    expect(isTagVisible('edge_1', assignments, tags)).toBe(false);
  });

  it('does not normalize unsafe tag ids into entity-assignable catalog entries', () => {
    expect(normalizeTags([{ id: 'bad id', name: 'Bad', visible: true }])).toEqual([
      { id: 'untagged', name: 'Untagged', visible: true }
    ]);
  });
});
