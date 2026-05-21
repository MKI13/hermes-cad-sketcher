import type { ToolName } from '../core/model';

const toolInstructions: Record<ToolName, string> = {
  select: 'Linksklick auf ein Element wählt es aus. Rechts ziehen dreht die Ansicht.',
  line: 'Linie: zwei Klicks auf das Millimeter-Raster setzen Start- und Endpunkt.',
  rectangle: 'Rechteck: zwei Klicks auf das Millimeter-Raster setzen die Diagonale.',
  box: 'Körper: ein Klick auf das Raster erstellt einen 600 × 600 × 600 mm Körper.',
  move: 'Verschieben: aktuell über Beispiel laden/Transformationsschritte; präzise Eingabe folgt.',
  pushPull: 'Seite ziehen: wähle einen Körper und nutze die vorhandene Höhenänderung als nächsten Ausbauschritt.',
  rotate: 'Drehen: wähle ein Element; präzise Winkel-Eingabe folgt.',
  tape: 'Maßband: Maße bleiben in Millimeter sichtbar und nachvollziehbar.'
};

export function getToolInstructions(tool: ToolName): string {
  return toolInstructions[tool];
}

export function getPrimaryActionLabel(): string {
  return 'Beispiel laden';
}
