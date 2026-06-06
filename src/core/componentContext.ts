import type { ComponentId, Entity } from './model';

export type ComponentEditContext = ComponentId | undefined;

export function isEntityEditableInContext(entity: Entity, activeComponentId: ComponentEditContext): boolean {
  if (!entity.componentId) return true;
  return entity.componentId === activeComponentId;
}

export function componentEditBlockMessage(entity: Entity, activeComponentId: ComponentEditContext): string | undefined {
  if (isEntityEditableInContext(entity, activeComponentId)) return undefined;
  return 'Komponente geschlossen: Doppelklick auf die Komponente öffnet den Bearbeitungskontext. Erst dann sind Push/Pull, Verschieben, Löschen und Materialänderungen an der Innengeometrie erlaubt.';
}

export function componentContextLabel(input: { activeComponentName?: string; activeComponentId?: ComponentId }): string {
  if (!input.activeComponentId) return 'Außerhalb einer Komponente';
  return `In Komponente: ${input.activeComponentName?.trim() || input.activeComponentId}`;
}

export function sketchUpClickDepthHint(clicks: 1 | 2 | 3): string {
  if (clicks === 1) return '1 Klick: einzelne Fläche oder einzelnes Element auswählen.';
  if (clicks === 2) return '2 Klicks: zusammengehörige Fläche mit Kanten beziehungsweise Komponentenkontext öffnen.';
  return '3 Klicks: zusammenhängende Geometrie als Bauteil/Komponente erfassen.';
}
