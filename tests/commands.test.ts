import { describe, expect, it } from 'vitest';
import { vec } from '../src/core/geometry';
import { SketchModel } from '../src/core/model';
import {
  applyCadCommand,
  createBoxCommand,
  createDeleteEntityCommand,
  createMoveEntityCommand,
  undoCadCommand
} from '../src/core/commands';

describe('CAD commands', () => {
  it('applies and undoes a create box command by restoring the previous snapshot', () => {
    const model = new SketchModel();
    const command = createBoxCommand({ origin: vec(0, 0, 0), width: 600, depth: 400, height: 720 });

    const applied = applyCadCommand(model, command);

    expect(applied.command).toMatchObject({ type: 'createBox', label: 'Körper erstellen' });
    expect(applied.nextModel.allEntities()).toHaveLength(1);
    expect(applied.selectedId).toBe(applied.nextModel.allEntities()[0]?.id);
    const undone = undoCadCommand(applied);
    expect(undone.allEntities()).toEqual([]);
  });

  it('applies move and delete commands with metadata and undo snapshots', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 600, 400, 720);

    const moved = applyCadCommand(model, createMoveEntityCommand(box.id, vec(100, 0, 0)));
    expect(moved.command).toMatchObject({ type: 'moveEntity', selectedIdBefore: box.id, selectedIdAfter: box.id });
    expect(moved.nextModel.getEntity(box.id)).toMatchObject({ type: 'box', origin: vec(100, 0, 0) });
    expect(undoCadCommand(moved).getEntity(box.id)).toMatchObject({ type: 'box', origin: vec(0, 0, 0) });

    const deleted = applyCadCommand(moved.nextModel, createDeleteEntityCommand(box.id));
    expect(deleted.nextModel.getEntity(box.id)).toBeUndefined();
    expect(deleted.selectedId).toBeUndefined();
    expect(undoCadCommand(deleted).getEntity(box.id)).toMatchObject({ type: 'box' });
  });
});
