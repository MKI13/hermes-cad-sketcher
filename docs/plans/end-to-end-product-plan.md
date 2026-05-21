# Hermes CAD Sketcher End-to-End Product Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn `MKI13/hermes-cad-sketcher` from a measured MVP into a usable Linux CAD sketcher that Marios/EF-Sinn can open in a browser, draw millimeter-safe shapes with the mouse, inspect dimensions, and export honest supported formats.

**Architecture:** Keep the CAD truth in `src/core/*` as tested TypeScript model code. Treat React/Three.js as an interaction and rendering layer over that model. Add product maturity in thin verified slices: viewport, mouse tools, selection/transforms, persistence, import/export, then packaging.

**Tech Stack:** React + Vite + TypeScript + Three.js + Vitest. Optional later packaging: Tauri/AppImage only after browser product is stable.

---

## Current verified baseline

- Repository: `https://github.com/MKI13/hermes-cad-sketcher`
- Local path: `/home/neon/work/github/MKI13/hermes-cad-sketcher`
- Main branch: `main` at `4bff9fa feat: bootstrap hermes cad sketcher MVP`
- Active feature branch: `feat/interactive-three-viewport` at `01f3057 feat: add grid drawing interactions`
- License: MIT
- Baseline command on `main`: `npm install && npm run check`
  - Result: 10 tests passed, production build passed.
- Baseline command on `feat/interactive-three-viewport`: `npm run check`
  - Result: 16 tests passed, production build passed.
  - Caveat: Vite warns bundle chunk > 500 kB because Three.js is bundled; not a functional blocker.

## Product contract

### Must be true before calling it a finished usable program

1. It runs locally on Linux with one documented command and no cloud dependency.
2. User can draw lines and rectangles directly with the mouse on a millimeter grid.
3. User can create boxes from dimensions or rectangle extrusion.
4. User can orbit/pan/zoom/select reliably in the 3D viewport.
5. User can move/rotate/delete selected entities with visible millimeter feedback.
6. User can inspect element dimensions and model bounding boxes.
7. User can save/load a local project file without losing IDs, units, components, or dimensions.
8. DXF/STL support is honest and tested; unsupported DWG/SKP remain documented as bridge-only.
9. `npm run check` passes and at least one browser smoke test verifies the main workflow.
10. Public-facing README does not overclaim SketchUp, DWG, SKP, or plugin compatibility.

### Non-goals for product v1

- No SketchUp `.rb`/`.rbz` plugin compatibility.
- No fake native DWG/SKP support.
- No cloud storage or account system.
- No manufacturing-grade STEP/IFC claims until real import/export validators exist.
- No destructive overwrite of imported user files.

---

## Phase 1 — Make current viewport branch merge-ready

### Task 1.1: Review and polish `feat/interactive-three-viewport`

**Objective:** Ensure the existing interactive viewport branch is the correct base and does not regress core MVP behavior.

**Files:**
- Review: `src/ui/ThreeViewport.tsx`
- Review: `src/ui/viewportController.ts`
- Review: `src/App.tsx`
- Review: `tests/viewport.test.ts`
- Modify only if review finds defects.

**Steps:**
1. Run `npm run check`.
2. Inspect branch diff: `git diff origin/main...HEAD`.
3. Confirm UI still exposes DXF/STL export and tool status.
4. Confirm tests cover orbit, snapping, projection, and object entity IDs.
5. If defects are found, write failing tests first, then patch.
6. Run `npm run check` again.

**Done when:** Branch passes `npm run check` and no blocker exists for using it as base.

### Task 1.2: Add viewport selection highlight test + implementation

**Objective:** Selected entities must be visually distinguishable in the Three.js scene.

**Files:**
- Modify: `src/ui/viewportController.ts`
- Modify: `src/ui/ThreeViewport.tsx`
- Modify: `tests/viewport.test.ts`

**TDD:**
1. Add a failing test that `createModelGroup(model, selectedId)` marks the selected object's material or userData as selected while others are not.
2. Run: `npm run test -- tests/viewport.test.ts -t selected` and verify RED.
3. Update `createModelGroup` to accept optional `selectedId` and apply a selected material/flag.
4. Pass selectedId from `ThreeViewport`.
5. Run focused test, then `npm run check`.

**Done when:** Selected object has stable visual highlight and tests pass.

---

## Phase 2 — Real mouse drawing tools

### Task 2.1: Extract drawing geometry helpers

**Objective:** Convert two snapped ground points into valid line/rectangle/box inputs without UI code duplicating geometry rules.

**Files:**
- Create: `src/ui/drawingController.ts`
- Create/Modify: `tests/drawingController.test.ts`

**TDD:**
1. RED test: two distinct points produce line endpoints.
2. RED test: identical points return a validation error, not a zero-length line.
3. RED test: rectangle from diagonal points produces origin, positive width/depth, and preserves mm grid.
4. Implement minimal helpers.
5. Run `npm run test -- tests/drawingController.test.ts` then `npm run check`.

### Task 2.2: Replace demo button with direct drawing workflow

**Objective:** Line and rectangle tools should create entities through viewport clicks, not through `Demo-Aktion`.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/ui/ThreeViewport.tsx`
- Modify: `src/ui/drawingController.ts`
- Test: `tests/drawingController.test.ts`

**Steps:**
1. Keep a small sample model button only if explicitly labeled `Beispiel laden`; remove misleading demo action as primary workflow.
2. Wire `onCreateLine` and `onCreateRectangle` through drawing helpers.
3. Ensure selectedId updates to newly created entity.
4. Keep statusbar instructions in German and millimeter-specific.
5. Run `npm run check`.

### Task 2.3: Add box creation with dimension defaults and later editable values

**Objective:** Box tool should create a default mm-sized box at the clicked ground point and expose dimensions clearly.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/ui/drawingController.ts`
- Test: `tests/drawingController.test.ts`

**TDD:**
1. RED test: box input from clicked origin returns default `{width: 600, depth: 600, height: 600}`.
2. RED test: non-positive configured dimensions are rejected.
3. Implement helper and wire UI.
4. Run `npm run check`.

---

## Phase 3 — Selection, transforms, and measurements

### Task 3.1: Add delete selected entity

**Objective:** User can delete an accidental entity safely.

**Files:**
- Modify: `src/core/model.ts`
- Modify: `tests/model.test.ts`
- Modify: `src/App.tsx`

**TDD:**
1. RED test: `deleteEntity(id)` removes entity.
2. RED test: deleting component member updates component entityIds and removes empty component.
3. Implement minimal model method.
4. Add UI button/key handler.
5. Run `npm run check`.

### Task 3.2: Add precise move panel

**Objective:** User can move selected entity by exact millimeter deltas.

**Files:**
- Modify: `src/App.tsx`
- Optional create: `src/ui/InspectorPanel.tsx`
- Test: core behavior already exists; add UI helper tests if extracting parsing.

**Steps:**
1. Add inputs for ΔX, ΔY, ΔZ in mm.
2. Validate numeric input before mutating model.
3. Use `moveEntity`.
4. Display updated bounding box.
5. Run `npm run check`.

### Task 3.3: Add precise rotate panel

**Objective:** User can rotate selected entity by degrees around Z without thinking in radians.

**Files:**
- Modify: `src/App.tsx`
- Optional create: `src/ui/InspectorPanel.tsx`
- Test: add helper test for degree-to-radian conversion if extracted.

**Steps:**
1. Add degrees input.
2. Convert degrees to radians using helper.
3. Use `rotateEntityZ`.
4. Display current rotation for boxes.
5. Run `npm run check`.

### Task 3.4: Add dimension inspector

**Objective:** Selected entity shows length/width/depth/height/bounding box in mm.

**Files:**
- Modify: `src/core/model.ts` or create `src/core/inspection.ts`
- Create/Modify: `tests/inspection.test.ts`
- Modify: `src/App.tsx`

**TDD:**
1. RED test: line reports length in mm.
2. RED test: rectangle reports width/depth.
3. RED test: box reports width/depth/height and bounding box.
4. Implement inspection helper.
5. Render inspector.
6. Run `npm run check`.

---

## Phase 4 — Project persistence

### Task 4.1: Add `.hcsketch.json` project file schema

**Objective:** Save/load local project snapshots with version and unit metadata.

**Files:**
- Create: `src/core/projectFile.ts`
- Create: `tests/projectFile.test.ts`

**TDD:**
1. RED test: export project includes `formatVersion`, `unit: 'mm'`, snapshot.
2. RED test: import valid project round-trips IDs/entities/components.
3. RED test: import rejects non-mm or missing format version with clear error.
4. Implement helpers.
5. Run `npm run check`.

### Task 4.2: Wire save/load buttons

**Objective:** Browser app can download and load its own project file without server.

**Files:**
- Modify: `src/App.tsx`
- Modify: `README.md`

**Steps:**
1. Add `Projekt speichern` button using download helper.
2. Add file input for `.hcsketch.json`.
3. On load, parse via `projectFile.ts`, set model, clear invalid selection.
4. Display clear error if file invalid.
5. Run `npm run check`.

---

## Phase 5 — Import/export maturity

### Task 5.1: Improve DXF import coverage

**Objective:** Import common simple DXF LWPOLYLINE rectangle outlines without claiming full DXF support.

**Files:**
- Modify: `src/core/dxf.ts`
- Create: `tests/fixtures/simple-rectangle-lwpolyline.dxf`
- Modify: `tests/export.test.ts`

**TDD:**
1. RED fixture test imports one closed rectangle polyline into a face or edges.
2. RED test preserves millimeter interpretation.
3. Implement minimal parser.
4. Run `npm run check`.

### Task 5.2: Add ASCII STL import as reference mesh

**Objective:** User can import ASCII STL and see it as a non-editable reference mesh.

**Files:**
- Modify: `src/core/model.ts`
- Modify/Create: `src/core/stl.ts`
- Modify/Create: `tests/stlImport.test.ts`
- Modify: `src/ui/sceneAdapter.ts`

**TDD:**
1. RED test parses known ASCII STL with expected triangle count.
2. RED test creates reference mesh entity without editable box dimensions.
3. Implement model entity type and renderer.
4. Run `npm run check`.

### Task 5.3: Add bridge-adapter stubs for DWG/SKP

**Objective:** Future DWG/SKP workflows fail cleanly when external tools are missing and never pretend native support exists.

**Files:**
- Create: `src/core/bridgeFormats.ts`
- Create: `tests/bridgeFormats.test.ts`
- Modify: `README.md`

**TDD:**
1. RED test: `checkDwgBridge()` returns unavailable with tool/install hint.
2. RED test: `checkSkpBridge()` returns unavailable with license/API caveat.
3. Implement pure detection interface (no shell execution in browser runtime).
4. Run `npm run check`.

---

## Phase 6 — Product polish and Linux delivery

### Task 6.1: Add browser smoke test harness

**Objective:** Verify the main user journey in a real browser: load app, draw shape, select, export.

**Files:**
- Add dependency if chosen: Playwright or Vitest browser mode.
- Create: `tests/e2e/basic-workflow.test.ts` or `scripts/smoke-browser.mjs`
- Modify: `package.json`

**Steps:**
1. Add smoke command separate from unit check if it requires browser deps.
2. Test homepage loads, viewport canvas appears, toolbar appears.
3. Simulate drawing a line/rectangle if stable; otherwise test helper-level click projection plus DOM presence.
4. Run smoke locally and document command.

### Task 6.2: Improve README from MVP to usable beta instructions

**Objective:** Make install/run/check/export limits clear for Linux users and contributors.

**Files:**
- Modify: `README.md`

**Requirements:**
1. Add quick start.
2. Add supported workflows.
3. Add exact format limits.
4. Add screenshots section placeholder only after screenshot exists.
5. Keep `.rb/.rbz` non-support explicit.
6. Run `npm run check` after docs if code unchanged is optional but recommended.

### Task 6.3: Optional Tauri desktop packaging spike

**Objective:** Decide whether to package as a Linux desktop app or keep browser-first.

**Files:**
- Create: `docs/packaging-tauri-spike.md`
- Do not add Tauri runtime until decision is made.

**Steps:**
1. Compare Tauri/AppImage/browser PWA cost.
2. Check license and Linux build complexity.
3. Recommend one path.
4. Only implement packaging after explicit approval.

---

## Release gates

Before a `v0.2.0` release:

1. `npm run check` passes.
2. Browser smoke passes or documented as intentionally not yet present.
3. README accurately states current support.
4. DXF/STL fixtures exist for every supported import/export claim.
5. Reviewer checks public claims and license/file-format boundaries.
6. No direct push to `main`; open PR from feature branch.

## Suggested next immediate action

Start with Task 1.2 on `feat/interactive-three-viewport`: selected-entity visual highlighting. It is small, testable, directly improves usability, and builds on the already green viewport branch.
