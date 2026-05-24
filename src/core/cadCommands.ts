import { vec } from './geometry';
import { SketchModel, type EntityId } from './model';

export type CadCommandResult = Readonly<{
  ok: boolean;
  nextModel: SketchModel;
  selectedId?: EntityId;
  message: string;
  changed: boolean;
}>;

const selectedAliases = new Set(['selected', '@selected', 'auswahl', 'last', '@last']);
const commandAliases: Record<string, string> = {
  line: 'line',
  linie: 'line',
  rectangle: 'rectangle',
  rect: 'rectangle',
  rechteck: 'rectangle',
  box: 'box',
  körper: 'box',
  koerper: 'box',
  move: 'move',
  verschiebe: 'move',
  rotate_z: 'rotate_z',
  rotatez: 'rotate_z',
  drehe: 'rotate_z',
  resize: 'resize',
  masse: 'resize',
  maße: 'resize',
  push_pull: 'push_pull',
  pushpull: 'push_pull',
  extrude: 'extrude',
  extrudieren: 'extrude',
  delete: 'delete',
  löschen: 'delete',
  loeschen: 'delete',
  list: 'list',
  select: 'select',
  component: 'component',
  create_component: 'component',
  duplicate_component: 'duplicate_component'
};

export function runCadConsoleCommand(model: SketchModel, input: string, selectedId?: EntityId): CadCommandResult {
  const commandText = stripAgentPrefixes(input).trim();
  if (!commandText) return { ok: false, nextModel: model, selectedId, message: 'Leerer CAD-Befehl.', changed: false };

  const parsed = parseCommand(commandText);
  const command = commandAliases[parsed.name.toLowerCase()];
  if (!command) {
    return { ok: false, nextModel: model, selectedId, message: `Unbekannter CAD-Befehl: ${parsed.name}`, changed: false };
  }

  try {
    if (command === 'list') {
      return { ok: true, nextModel: model, selectedId, message: describeModel(model), changed: false };
    }

    if (command === 'select') {
      const id = resolveEntityId(parsed.tokens[0], selectedId);
      if (!model.getEntity(id)) throw new Error(`Element nicht gefunden: ${id}`);
      return { ok: true, nextModel: model, selectedId: id, message: `Auswahl gesetzt: ${id}`, changed: false };
    }

    const nextModel = SketchModel.fromSnapshot(model.snapshot());
    const result = applyMutatingCommand(nextModel, command, parsed.tokens, selectedId);
    return { ok: true, nextModel, selectedId: result.selectedId, message: result.message, changed: true };
  } catch (error) {
    return { ok: false, nextModel: model, selectedId, message: error instanceof Error ? error.message : 'CAD-Befehl fehlgeschlagen.', changed: false };
  }
}

export function runCadConsoleScript(model: SketchModel, script: string, selectedId?: EntityId): CadCommandResult {
  let currentModel = model;
  let currentSelected = selectedId;
  const messages: string[] = [];
  let changed = false;

  for (const rawLine of script.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const result = runCadConsoleCommand(currentModel, line, currentSelected);
    messages.push(result.message);
    if (!result.ok) return { ...result, message: messages.join('\n') };
    currentModel = result.nextModel;
    currentSelected = result.selectedId;
    changed ||= result.changed;
  }

  return { ok: true, nextModel: currentModel, selectedId: currentSelected, message: messages.join('\n') || 'Kein ausführbarer CAD-Befehl.', changed };
}

export function runAgentChatCommand(model: SketchModel, message: string, selectedId?: EntityId): CadCommandResult {
  const direct = stripAgentPrefixes(message).trim();
  if (/^(ruby|cad|console)\s*:/i.test(message) || looksLikeFunctionCommand(direct)) {
    return runCadConsoleScript(model, direct, selectedId);
  }

  const translated = translateNaturalChatToCommand(direct);
  if (!translated) {
    return {
      ok: false,
      nextModel: model,
      selectedId,
      message: 'Freier Chat wie in Telegram läuft über den lokalen Hermes Agent. Der Offline-Notmodus kann nur direkte sichere CAD-Befehle oder einfache Sätze wie „erstelle box …“, „verschiebe auswahl …“, „drehe auswahl …“ lokal ausführen.',
      changed: false
    };
  }
  return runCadConsoleCommand(model, translated, selectedId);
}

function applyMutatingCommand(model: SketchModel, command: string, tokens: string[], selectedId?: EntityId): { selectedId?: EntityId; message: string } {
  if (command === 'line') {
    const n = numbers(tokens, 6);
    const entity = model.createLine(vec(n[0], n[1], n[2]), vec(n[3], n[4], n[5]));
    return { selectedId: entity.id, message: `Linie erstellt: ${entity.id}` };
  }

  if (command === 'rectangle') {
    const n = numbers(tokens, 5);
    const entity = model.createRectangle(vec(n[0], n[1], n[2]), n[3], n[4]);
    return { selectedId: entity.id, message: `Rechteck erstellt: ${entity.id}` };
  }

  if (command === 'box') {
    const n = numbers(tokens, 6);
    const entity = model.createBox(vec(n[0], n[1], n[2]), n[3], n[4], n[5]);
    const component = model.createComponent(`Körper ${entity.id}`, [entity.id]);
    return { selectedId: entity.id, message: `Körper erstellt: ${entity.id}; Komponente erstellt: ${component.id}` };
  }

  if (command === 'move') {
    const id = resolveEntityId(tokens[0], selectedId);
    const n = numbers(tokens.slice(1), 3);
    model.moveEntity(id, vec(n[0], n[1], n[2]));
    return { selectedId: id, message: `Element verschoben: ${id}` };
  }

  if (command === 'rotate_z') {
    const id = resolveEntityId(tokens[0], selectedId);
    const degrees = numberToken(tokens[1], 'Drehwinkel');
    model.rotateEntityZ(id, (degrees * Math.PI) / 180);
    return { selectedId: id, message: `Element um Z gedreht: ${id}` };
  }

  if (command === 'resize') {
    const id = resolveEntityId(tokens[0], selectedId);
    const dimensions = parseResizeDimensions(tokens.slice(1));
    model.resizeBox(id, dimensions);
    return { selectedId: id, message: `Körpermaße geändert: ${id}` };
  }

  if (command === 'push_pull') {
    const id = resolveEntityId(tokens[0], selectedId);
    const delta = numberToken(tokens[1], 'Push/Pull-Höhe');
    model.pushPullBoxFace(id, delta);
    return { selectedId: id, message: `Körperhöhe per Push/Pull geändert: ${id}` };
  }

  if (command === 'extrude') {
    const id = resolveEntityId(tokens[0], selectedId);
    const height = numberToken(tokens[1], 'Extrusionshöhe');
    const entity = model.extrudeFaceToBox(id, height);
    const component = model.createComponent(`Körper ${entity.id}`, [entity.id]);
    return { selectedId: entity.id, message: `Fläche extrudiert: ${entity.id}; Komponente erstellt: ${component.id}` };
  }

  if (command === 'delete') {
    const id = resolveEntityId(tokens[0], selectedId);
    model.deleteEntity(id);
    return { selectedId: model.allEntities()[0]?.id, message: `Element gelöscht: ${id}` };
  }

  if (command === 'component') {
    const name = unquote(tokens[0] ?? 'Komponente');
    const ids = tokens.slice(1).map((token) => resolveEntityId(token, selectedId));
    const component = model.createComponent(name, ids);
    return { selectedId: component.entityIds[0], message: `Komponente erstellt: ${component.id}` };
  }

  if (command === 'duplicate_component') {
    const componentId = unquote(tokens[0] ?? '');
    const name = unquote(tokens[1] ?? 'Kopie der Komponente');
    const n = numbers(tokens.slice(2), 3);
    const component = model.duplicateComponent(componentId, name, vec(n[0], n[1], n[2]));
    return { selectedId: component.entityIds[0], message: `Komponente dupliziert: ${component.id}` };
  }

  throw new Error(`Unbekannter CAD-Befehl: ${command}`);
}

function parseCommand(input: string): { name: string; tokens: string[] } {
  const cleaned = input.trim().replace(/;$/, '');
  const match = /^([\p{L}_][\p{L}\p{N}_]*)\s*(?:\((.*)\)|(.*))$/u.exec(cleaned);
  if (!match) return { name: cleaned, tokens: [] };
  const args = match[2] ?? match[3] ?? '';
  return { name: match[1], tokens: tokenize(args) };
}

function tokenize(args: string): string[] {
  return [...args.matchAll(/"[^"]*"|'[^']*'|[^\s,()]+/g)].map((match) => match[0]).filter(Boolean);
}

function stripAgentPrefixes(input: string): string {
  return input
    .replace(/^\s*(agent|hermes|ai)\s*:\s*/i, '')
    .replace(/^\s*(ruby|cad|console)\s*:\s*/i, '')
    .replace(/^```(?:ruby|cad|text)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function looksLikeFunctionCommand(input: string): boolean {
  return /^[\p{L}_][\p{L}\p{N}_]*\s*(\(|\s)/u.test(input) && Boolean(commandAliases[input.split(/[\s(]/)[0].toLowerCase()]);
}

function translateNaturalChatToCommand(input: string): string | undefined {
  const lower = input.toLowerCase().replace(/[,;]/g, ' ');
  const nums = extractNumbers(lower);
  if (/\b(erstelle|zeichne|create|add)\b.*\b(box|körper|koerper)\b/.test(lower) && nums.length >= 6) return `box(${nums.slice(0, 6).join(', ')})`;
  if (/\b(erstelle|zeichne|create|add)\b.*\b(rechteck|rectangle)\b/.test(lower) && nums.length >= 5) return `rectangle(${nums.slice(0, 5).join(', ')})`;
  if (/\b(erstelle|zeichne|create|add)\b.*\b(linie|line)\b/.test(lower) && nums.length >= 6) return `line(${nums.slice(0, 6).join(', ')})`;
  if (/\b(verschiebe|move)\b.*\b(auswahl|selected)\b/.test(lower) && nums.length >= 3) return `move(selected, ${nums.slice(0, 3).join(', ')})`;
  if (/\b(drehe|rotate)\b.*\b(auswahl|selected)\b/.test(lower) && nums.length >= 1) return `rotate_z(selected, ${nums[0]})`;
  if (/\b(extrudiere|extrude)\b.*\b(auswahl|selected)\b/.test(lower) && nums.length >= 1) return `extrude(selected, ${nums[0]})`;
  if (/\b(lösche|loesche|delete)\b.*\b(auswahl|selected)\b/.test(lower)) return 'delete(selected)';
  return undefined;
}

function extractNumbers(input: string): number[] {
  return [...input.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
}

function numbers(tokens: string[], count: number): number[] {
  if (tokens.length < count) throw new Error(`Befehl braucht ${count} Zahlen.`);
  return tokens.slice(0, count).map((token, index) => numberToken(token, `Zahl ${index + 1}`));
}

function numberToken(token: string | undefined, label: string): number {
  const value = Number(token);
  if (!Number.isFinite(value)) throw new Error(`${label} muss eine endliche Zahl sein.`);
  return value;
}

function resolveEntityId(token: string | undefined, selectedId?: EntityId): EntityId {
  if (!token) {
    if (selectedId) return selectedId;
    throw new Error('Element-ID fehlt.');
  }
  const cleaned = unquote(token);
  if (selectedAliases.has(cleaned.toLowerCase())) {
    if (!selectedId) throw new Error('Keine Auswahl für selected/auswahl vorhanden.');
    return selectedId;
  }
  return cleaned;
}

function parseResizeDimensions(tokens: string[]): { width?: number; depth?: number; height?: number } {
  if (tokens.length === 3 && tokens.every((token) => Number.isFinite(Number(token)))) {
    return { width: Number(tokens[0]), depth: Number(tokens[1]), height: Number(tokens[2]) };
  }

  const result: { width?: number; depth?: number; height?: number } = {};
  for (let i = 0; i < tokens.length; i += 1) {
    const [rawKey, inlineValue] = tokens[i].split(/[:=]/);
    const key = rawKey.toLowerCase();
    const valueToken = inlineValue === '' || inlineValue === undefined ? tokens[i + 1] : inlineValue;
    if (inlineValue === '' || inlineValue === undefined) i += 1;
    const value = numberToken(valueToken, rawKey);
    if (['width', 'breite', 'w'].includes(key)) result.width = value;
    else if (['depth', 'tiefe', 'd'].includes(key)) result.depth = value;
    else if (['height', 'höhe', 'hoehe', 'h'].includes(key)) result.height = value;
    else throw new Error(`Unbekanntes Maß: ${rawKey}`);
  }
  if (result.width === undefined && result.depth === undefined && result.height === undefined) throw new Error('resize braucht width/depth/height Werte.');
  return result;
}

function unquote(token: string): string {
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) return token.slice(1, -1);
  return token;
}

function describeModel(model: SketchModel): string {
  return `Elemente: ${model.allEntities().length}; Komponenten: ${model.allComponents().length}; Einheit: mm`;
}
