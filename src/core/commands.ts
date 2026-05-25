import { type Vec3 } from './geometry';
import { SketchModel, type BoxDimensions, type EntityId, type SketchModelSnapshot } from './model';

export type CadCommandType = 'createBox' | 'moveEntity' | 'deleteEntity';

export type CadCommand = {
  id: string;
  type: CadCommandType;
  label: string;
  timestamp: string;
  selectedIdBefore?: EntityId;
  selectedIdAfter?: EntityId;
} & (
  | { type: 'createBox'; origin: Vec3; width: number; depth: number; height: number }
  | { type: 'moveEntity'; entityId: EntityId; delta: Vec3 }
  | { type: 'deleteEntity'; entityId: EntityId }
);

export type CadCommandResult = {
  command: CadCommand;
  previousSnapshot: SketchModelSnapshot;
  nextModel: SketchModel;
  selectedId?: EntityId;
};

let nextCommandNumber = 1;

function baseCommand(type: CadCommandType, label: string, selectedIdBefore?: EntityId): Pick<CadCommand, 'id' | 'type' | 'label' | 'timestamp' | 'selectedIdBefore'> {
  return {
    id: `command_${nextCommandNumber++}`,
    type,
    label,
    timestamp: new Date().toISOString(),
    selectedIdBefore
  };
}

export function createBoxCommand(dimensions: { origin: Vec3 } & BoxDimensions): CadCommand {
  return {
    ...baseCommand('createBox', 'Körper erstellen'),
    ...dimensions,
    type: 'createBox'
  };
}

export function createMoveEntityCommand(entityId: EntityId, delta: Vec3): CadCommand {
  return {
    ...baseCommand('moveEntity', 'Element verschieben', entityId),
    type: 'moveEntity',
    entityId,
    delta
  };
}

export function createDeleteEntityCommand(entityId: EntityId): CadCommand {
  return {
    ...baseCommand('deleteEntity', 'Element löschen', entityId),
    type: 'deleteEntity',
    entityId
  };
}

export function applyCadCommand(model: SketchModel, command: CadCommand): CadCommandResult {
  const previousSnapshot = model.snapshot();
  const nextModel = SketchModel.fromSnapshot(previousSnapshot);
  let selectedId = command.selectedIdAfter;

  if (command.type === 'createBox') {
    const entity = nextModel.createBox(command.origin, command.width, command.depth, command.height);
    selectedId = entity.id;
  } else if (command.type === 'moveEntity') {
    nextModel.moveEntity(command.entityId, command.delta);
    selectedId = command.entityId;
  } else if (command.type === 'deleteEntity') {
    nextModel.deleteEntity(command.entityId);
    selectedId = undefined;
  } else {
    const exhaustive: never = command;
    throw new Error(`Unbekannter CAD-Befehl: ${String(exhaustive)}`);
  }

  const commandWithSelection = { ...command, selectedIdAfter: selectedId } as CadCommand;
  return { command: commandWithSelection, previousSnapshot, nextModel, selectedId };
}

export function undoCadCommand(result: CadCommandResult): SketchModel {
  return SketchModel.fromSnapshot(result.previousSnapshot);
}
