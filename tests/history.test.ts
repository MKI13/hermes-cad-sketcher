import { describe, expect, it } from 'vitest';
import { SketchModel } from '../src/core/model';
import { createHistory, pushHistory, redoHistory, undoHistory } from '../src/core/history';
import { vec } from '../src/core/geometry';

describe('model history', () => {
  it('starts with no undo or redo actions', () => {
    const model = new SketchModel();
    const history = createHistory(model.snapshot());

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
    expect(history.past).toEqual([]);
    expect(history.future).toEqual([]);
  });

  it('undoes and redoes committed model snapshots', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 2400, 900, 720);
    const initial = model.snapshot();

    model.moveEntity(box.id, vec(100, 0, 0));
    const moved = model.snapshot();

    const committed = pushHistory(createHistory(initial), moved);
    const undone = undoHistory(committed);
    const redone = redoHistory(undone.history);

    expect(undone.snapshot.entities[0]).toMatchObject({ id: box.id, origin: vec(0, 0, 0) });
    expect(undone.history.canUndo).toBe(false);
    expect(undone.history.canRedo).toBe(true);
    expect(redone.snapshot.entities[0]).toMatchObject({ id: box.id, origin: vec(100, 0, 0) });
    expect(redone.history.canUndo).toBe(true);
    expect(redone.history.canRedo).toBe(false);
  });

  it('clears redo history when a new edit is committed after undo', () => {
    const model = new SketchModel();
    const box = model.createBox(vec(0, 0, 0), 2400, 900, 720);
    const initial = model.snapshot();

    model.moveEntity(box.id, vec(100, 0, 0));
    const moved = model.snapshot();
    model.pushPullBoxFace(box.id, 100);
    const taller = model.snapshot();

    const history = pushHistory(pushHistory(createHistory(initial), moved), taller);
    const undone = undoHistory(history);
    const replacement = SketchModel.fromSnapshot(undone.snapshot);
    replacement.moveEntity(box.id, vec(0, 50, 0));
    const branched = pushHistory(undone.history, replacement.snapshot());

    expect(branched.canRedo).toBe(false);
    expect(branched.future).toEqual([]);
  });

  it('undoes and redoes rectangle face extrusion snapshots', () => {
    const model = new SketchModel();
    const face = model.createRectangle(vec(10, 20, 0), 1200, 600);
    const initial = model.snapshot();

    const box = model.extrudeFaceToBox(face.id, 720);
    const extruded = model.snapshot();

    const history = pushHistory(createHistory(initial), extruded);
    const undone = undoHistory(history);
    const redone = redoHistory(undone.history);

    expect(undone.snapshot.entities).toEqual([face]);
    expect(redone.snapshot.entities).toEqual([box]);
  });
});
