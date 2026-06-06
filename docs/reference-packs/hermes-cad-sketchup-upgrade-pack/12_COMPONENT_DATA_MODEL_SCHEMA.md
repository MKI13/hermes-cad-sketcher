# Component Data Model Schema Vorschlag

Dieses Schema dient als Startpunkt. Hermes soll es an die bestehende Architektur anpassen.

## TypeScript/Pseudocode

```ts
type UUID = string;
type Length = number; // internal unit, e.g. millimeters
type Angle = number;  // degrees or radians, but one standard internally

interface Entity {
  id: UUID;
  type: EntityType;
  name?: string;
  transform: Matrix4;
  hidden: boolean;
  locked: boolean;
  tags: string[];
  materialId?: UUID;
  metadata: Record<string, unknown>;
}

interface Group extends Entity {
  type: "group";
  children: UUID[];
}

interface ComponentDefinition {
  id: UUID;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  localAxes: Axes;
  insertionPoint: Vector3;
  childEntities: UUID[];
  dynamic?: DynamicComponentData;
  thumbnailPath?: string;
  libraryPath?: string;
  version: string;
  metadata: Record<string, unknown>;
}

interface ComponentInstance extends Entity {
  type: "component_instance";
  definitionId: UUID;
  instanceName?: string;
  dynamicOverrides?: Record<string, DynamicValue>;
}

interface DynamicComponentData {
  attributes: DynamicAttribute[];
  formulas: Formula[];
  optionsLayout: ParameterGroup[];
  actions: DynamicAction[];
  validationRules: ValidationRule[];
  recomputeGraph: DependencyGraph;
}

interface DynamicAttribute {
  key: string;
  label: string;
  type: "number" | "length" | "angle" | "boolean" | "enum" | "material" | "text";
  defaultValue: DynamicValue;
  currentValue?: DynamicValue;
  formula?: string;
  min?: DynamicValue;
  max?: DynamicValue;
  step?: DynamicValue;
  enumOptions?: string[];
  visibleInOptions: boolean;
  editableByUser: boolean;
  group?: string;
  order?: number;
  description?: string;
}

interface UndoOperation {
  id: UUID;
  label: string;
  before: ModelPatch;
  after: ModelPatch;
  timestamp: number;
}
```

## Speicherformat `.hcomp`

Vorschlag:

```json
{
  "schema": "hermes.component.v1",
  "definition": {},
  "entities": [],
  "materials": [],
  "metadata": {
    "createdBy": "Hermes CAD",
    "createdAt": "",
    "version": ""
  }
}
```

## Wichtige Architekturregeln

- Instanzen enthalten keine Geometriekopie, sondern verweisen auf Definition.
- Definition enthält Child Entities.
- Transform sitzt auf Instanz.
- Dynamic Overrides sitzen auf Instanz, wenn eine Instanz eigene Parameterwerte hat.
- Make Unique kopiert Definition und setzt instance.definitionId neu.
- Undo speichert Patches, nicht zwingend komplette Modelldumps.
