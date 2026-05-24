import { type ToolName } from '../core/model';

export type MouseButtonNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type MouseInputId =
  | 'button:0'
  | 'button:1'
  | 'button:2'
  | 'button:3'
  | 'button:4'
  | 'button:5'
  | 'button:6'
  | 'button:7'
  | 'button:8'
  | 'button:9'
  | 'button:10'
  | 'button:11'
  | 'wheel';
export type MouseToolAction =
  | 'tool:select'
  | 'tool:line'
  | 'tool:rectangle'
  | 'tool:box'
  | 'tool:move'
  | 'tool:pushPull'
  | 'tool:rotate'
  | 'tool:tape';
export type MouseAction = 'none' | 'toolAction' | 'contextMenu' | 'orbit' | 'zoom' | MouseToolAction | 'undo' | 'redo' | 'delete';
export type MouseBindings = Partial<Record<MouseInputId, MouseAction>>;

export type MouseInputOption = Readonly<{
  id: MouseInputId;
  label: string;
  browserHint: string;
}>;

export const MOUSE_INPUTS: MouseInputOption[] = [
  { id: 'button:0', label: 'Linke Taste', browserHint: 'Browser-Button 0' },
  { id: 'button:1', label: 'Mittlere Taste', browserHint: 'Browser-Button 1' },
  { id: 'button:2', label: 'Rechte Taste', browserHint: 'Browser-Button 2' },
  { id: 'button:3', label: 'Zusatzbutton 3', browserHint: 'oft Zurück' },
  { id: 'button:4', label: 'Zusatzbutton 4', browserHint: 'oft Vorwärts' },
  { id: 'button:5', label: 'Zusatzbutton 5', browserHint: 'G604/G-Taste' },
  { id: 'button:6', label: 'Zusatzbutton 6', browserHint: 'G604/G-Taste' },
  { id: 'button:7', label: 'Zusatzbutton 7', browserHint: 'G604/G-Taste' },
  { id: 'button:8', label: 'Zusatzbutton 8', browserHint: 'G604/G-Taste' },
  { id: 'button:9', label: 'Zusatzbutton 9', browserHint: 'G604/G-Taste' },
  { id: 'button:10', label: 'Zusatzbutton 10', browserHint: 'G604/G-Taste' },
  { id: 'button:11', label: 'Zusatzbutton 11', browserHint: 'G604/G-Taste' },
  { id: 'wheel', label: 'Mausrad', browserHint: 'Scrollrad' }
];

const MOUSE_INPUT_ID_SET = new Set<MouseInputId>(MOUSE_INPUTS.map((input) => input.id));

const ACTIONS: MouseAction[] = [
  'none',
  'toolAction',
  'contextMenu',
  'orbit',
  'zoom',
  'tool:select',
  'tool:line',
  'tool:rectangle',
  'tool:box',
  'tool:move',
  'tool:pushPull',
  'tool:rotate',
  'tool:tape',
  'undo',
  'redo',
  'delete'
];

export const MOUSE_ACTIONS = ACTIONS;

export const DEFAULT_MOUSE_BINDINGS: Record<MouseInputId, MouseAction> = Object.fromEntries(
  MOUSE_INPUTS.map((input) => [input.id, defaultActionForInput(input.id)])
) as Record<MouseInputId, MouseAction>;

export function sanitizeMouseBindings(raw: unknown): Record<MouseInputId, MouseAction> {
  const rawBindings = isPlainObject(raw) ? raw : {};
  return Object.fromEntries(
    MOUSE_INPUTS.map((input) => {
      const candidate = rawBindings[input.id];
      const fallback = DEFAULT_MOUSE_BINDINGS[input.id];
      return [input.id, isAllowedActionForInput(input.id, candidate) ? candidate : fallback];
    })
  ) as Record<MouseInputId, MouseAction>;
}

export function resolveMouseInputAction(bindings: MouseBindings, button: number): MouseAction {
  const inputId = `button:${button}` as MouseInputId;
  if (!MOUSE_INPUT_ID_SET.has(inputId)) return 'none';
  return sanitizeMouseBindings(bindings)[inputId] ?? 'none';
}

export function resolveWheelAction(bindings: MouseBindings): MouseAction {
  return sanitizeMouseBindings(bindings).wheel;
}

export function mouseActionLabel(action: MouseAction): string {
  const labels: Record<MouseAction, string> = {
    none: 'Keine Aktion',
    toolAction: 'Standardaktion des aktiven Werkzeugs',
    contextMenu: 'Arbeitsflächen-Kontextmenü',
    orbit: 'Ansicht drehen',
    zoom: 'Zoom',
    'tool:select': 'Werkzeug Auswahl wählen',
    'tool:line': 'Werkzeug Linie wählen',
    'tool:rectangle': 'Werkzeug Rechteck wählen',
    'tool:box': 'Werkzeug Körper wählen',
    'tool:move': 'Werkzeug Verschieben wählen',
    'tool:pushPull': 'Werkzeug Push/Pull wählen',
    'tool:rotate': 'Werkzeug Drehen wählen',
    'tool:tape': 'Werkzeug Maßband wählen',
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    delete: 'Löschen'
  };
  return labels[action];
}

export function summarizeMouseBindings(bindings: MouseBindings): string {
  const sanitized = sanitizeMouseBindings(bindings);
  return MOUSE_INPUTS
    .filter((input) => sanitized[input.id] !== 'none')
    .map((input) => `${input.id}=${sanitized[input.id]}`)
    .join(';');
}

export function toolFromMouseAction(action: MouseAction): ToolName | undefined {
  if (!action.startsWith('tool:')) return undefined;
  return action.slice('tool:'.length) as ToolName;
}

function defaultActionForInput(input: MouseInputId): MouseAction {
  if (input === 'button:0') return 'toolAction';
  if (input === 'button:1') return 'orbit';
  if (input === 'button:2') return 'contextMenu';
  if (input === 'wheel') return 'zoom';
  return 'none';
}

function isAllowedActionForInput(input: MouseInputId, value: unknown): value is MouseAction {
  if (typeof value !== 'string' || !ACTIONS.includes(value as MouseAction)) return false;
  if (input === 'wheel') return value === 'zoom' || value === 'none';
  return value !== 'zoom';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
