export type TagId = string;

export type TagDefinition = Readonly<{
  id: TagId;
  name: string;
  visible: boolean;
}>;

export type EntityTagAssignment = Readonly<{
  entityId: string;
  tagId: TagId;
}>;

export const defaultTagId = 'untagged';
const SAFE_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;

export function defaultTags(): TagDefinition[] {
  return [{ id: defaultTagId, name: 'Untagged', visible: true }];
}

export function normalizeTags(tags: readonly TagDefinition[] | undefined): TagDefinition[] {
  const normalized: TagDefinition[] = [];
  const seen = new Set<string>();
  for (const tag of tags ?? defaultTags()) {
    const id = typeof tag.id === 'string' ? tag.id.trim() : '';
    const name = typeof tag.name === 'string' ? tag.name.trim() : '';
    if (!id || !name || !SAFE_ID_PATTERN.test(id) || seen.has(id) || typeof tag.visible !== 'boolean') continue;
    normalized.push({ id, name, visible: tag.visible });
    seen.add(id);
  }
  if (!seen.has(defaultTagId)) return defaultTags().concat(normalized);
  return normalized;
}

export function isTagVisible(entityId: string, assignments: readonly EntityTagAssignment[], tags: readonly TagDefinition[]): boolean {
  const tagId = assignments.find((assignment) => assignment.entityId === entityId)?.tagId ?? defaultTagId;
  return tags.find((tag) => tag.id === tagId)?.visible ?? true;
}
