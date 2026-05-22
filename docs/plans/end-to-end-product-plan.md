# Hermes CAD Sketcher End-to-End Product Plan

> **For Hermes:** Implement this plan task-by-task. Keep using small verified slices, `npm run check`, and independent review gates before public updates.

**Goal:** Turn `MKI13/hermes-cad-sketcher` from a measured MVP into a usable Linux CAD sketcher that Marios/EF-Sinn can open in a browser, draw millimeter-safe shapes with the mouse, inspect dimensions, save/load local project files, and export honest supported formats.

**Architecture:** Keep the CAD truth in `src/core/*` as tested TypeScript model code. Treat React/Three.js as an interaction and rendering layer over that model. Add product maturity in thin verified slices: viewport, mouse tools, selection/transforms, persistence, import/export, then packaging.

**Tech Stack:** React + Vite + TypeScript + Three.js + Vitest. Optional later packaging: Tauri/AppImage only after browser product is stable.

---

## Current verified baseline

- Repository: `https://github.com/MKI13/hermes-cad-sketcher`
- Local path: `/home/neon/work/github/MKI13/hermes-cad-sketcher`
- Target integration branch: `dev/v0.2`
- Working branch used for the current product slice: `review/product-slices-on-dev`
- Product implementation commits before this documentation refresh end at `8d41a91 feat: add precise push pull controls`.
- The branch is intended to be compared against `dev/v0.2`; check live GitHub compare status before opening or merging a PR because commit counts change as documentation and fixes are added.
- Verification before documentation refresh:
  - `npm run check` passed.
  - 14 test files / 69 tests passed.
  - Production build passed.
  - Local Vite preview HTTP smoke passed.
  - Caveat: Vite warns bundle chunk > 500 kB because Three.js is bundled; not a functional blocker.

## Product contract

### Must be true before calling it a finished usable program

1. It runs locally on Linux with one documented command and no cloud dependency. **Met for browser prototype.**
2. User can draw lines and rectangles directly with the mouse on a millimeter grid. **Met.**
3. User can create boxes from dimensions or rectangle extrusion. **Partially met:** boxes can be created from configurable dimensions; arbitrary rectangle extrusion is still pending.
4. User can orbit/select reliably in the 3D viewport. **Partially met:** right-button orbit and picking/select are present; explicit pan/zoom polish remains future work.
5. User can move/rotate/delete selected entities with visible millimeter feedback. **Met for current model entities:** mouse move plus precise Move/Rotate panels and delete are present.
6. User can inspect element dimensions and model bounding boxes. **Partially met:** box creation dimensions and statusbar counts exist; a general selected-entity inspector remains pending.
7. User can save/load a local project file without losing IDs, units, components, or dimensions. **Met for `.hcad.json`.**
8. DXF/STL support is honest and tested; unsupported DWG/SKP remain documented as bridge-only. **Met for current limited support.**
9. `npm run check` passes and at least one smoke test verifies the built app is served. **Met by `npm run check` and HTTP preview smoke; richer browser automation of the full workflow remains pending.**
10. Public-facing README does not overclaim SketchUp, DWG, SKP, or plugin compatibility. **Met after docs refresh.**

### Non-goals for product v1

- No SketchUp `.rb`/`.rbz` plugin compatibility.
- No fake native DWG/SKP support.
- No cloud storage or account system.
- No manufacturing-grade STEP/IFC claims until real import/export validators exist.
- No destructive overwrite of imported user files.

---

## Completed verified slices on `review/product-slices-on-dev`

### Phase 1 — Viewport base

- Interactive Three.js viewport renders the `SketchModel` scene.
- Right-button dragging orbits the view.
- Viewport picking maps rendered objects back to entity IDs.
- Selected entities are visibly highlighted.
- Tests cover viewport controller/scene adapter behavior.

### Phase 2 — Mouse drawing tools

- Drawing helpers live in `src/ui/drawingController.ts`.
- Line and rectangle tools create entities from two snapped ground-plane clicks.
- Box tool creates a box from one snapped ground-plane click.
- Live preview exists while drawing lines/rectangles.
- Invalid zero-sized shapes are blocked.
- Tests cover drawing helper behavior.

### Phase 3 — Selection, transforms, and measurements

- Delete selected entity is available through UI button and Delete/Backspace.
- Component references are cleaned when entities are deleted.
- Move tool supports mouse start/target movement in millimeters.
- Tape tool measures two clicked points and formats millimeters.
- Box dimensions panel controls default box width/depth/height.
- Precise Move panel applies ΔX/ΔY/ΔZ in mm.
- Precise Rotate panel applies degrees around Z.
- Box-rotation regression fixed: rotating a box around Z keeps its visible center stable.
- Precise Push/Pull panel applies ΔH to selected box height and blocks invalid/no-op values.

### Phase 4 — Project persistence

- `.hcad.json` project export/import exists in `src/core/projectFile.ts`.
- Save/load buttons are wired in the app.
- Import validates format version, unit, entity structure, and component references.
- Round-trip tests cover project snapshots.

### Existing import/export support

- DXF export and simple DXF LINE import are present.
- ASCII-STL export for box bodies is present.
- README explicitly documents DWG/SKP as bridge-only and `.rb/.rbz` as unsupported.

---

## Remaining work before a stronger v0.2 release

### Task 1: Add general selected-entity inspector

**Objective:** Selected entity shows length/width/depth/height/bounding box in mm, not only creation dimensions and statusbar IDs.

**Files:**
- Create: `src/core/inspection.ts`
- Create: `tests/inspection.test.ts`
- Modify: `src/App.tsx`
- Optional create: `src/ui/InspectorPanel.tsx`

**TDD:**
1. RED test: line reports length in mm.
2. RED test: rectangle reports width/depth.
3. RED test: box reports width/depth/height and bounding box.
4. Implement inspection helper.
5. Render inspector for selected entity.
6. Run focused tests, then `npm run check`.

### Task 2: Extend Push/Pull beyond box height

**Objective:** Push/Pull should eventually extrude rectangles/faces into box bodies and later support selected box faces in width/depth/height.

**Files:**
- Modify: `src/core/model.ts`
- Modify/Create tests around rectangle-to-box extrusion.
- Modify: `src/App.tsx`
- Modify: `src/ui/PushPullPanel.tsx`

**TDD:**
1. RED test: rectangle plus positive extrusion creates a box with stable mm dimensions.
2. RED test: zero/negative final dimensions are rejected.
3. RED test: IDs and component membership stay consistent or are explicitly reset with a documented rule.
4. Implement the smallest controlled extrusion path.
5. Run `npm run check`.

### Task 3: Improve DXF import coverage

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

### Task 4: Add ASCII STL import as reference mesh

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

### Task 5: Add bridge-adapter stubs for DWG/SKP

**Objective:** Future DWG/SKP workflows fail cleanly when external tools are missing and never pretend native support exists.

**Files:**
- Create: `src/core/bridgeFormats.ts`
- Create: `tests/bridgeFormats.test.ts`
- Modify: `README.md`

**TDD:**
1. RED test: `checkDwgBridge()` returns unavailable with tool/install hint.
2. RED test: `checkSkpBridge()` returns unavailable with license/API caveat.
3. Implement pure detection interface; no shell execution in browser runtime.
4. Run `npm run check`.

### Task 6: Add richer browser workflow smoke test harness

**Objective:** Verify the main user journey in a real browser: load app, draw shape, select, transform, export.

**Files:**
- Add dependency if chosen: Playwright or Vitest browser mode.
- Create: `tests/e2e/basic-workflow.test.ts` or `scripts/smoke-browser.mjs`.
- Modify: `package.json`.

**Steps:**
1. Add smoke command separate from unit check if it requires browser deps.
2. Test homepage loads, viewport canvas appears, toolbar appears.
3. Simulate drawing a line/rectangle if stable; otherwise test helper-level click projection plus DOM presence.
4. Run smoke locally and document command.

### Task 7: Optional Tauri desktop packaging spike

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

1. `npm run check` passes after the final commit.
2. Browser smoke passes or is explicitly documented as HTTP/static-only.
3. README accurately states current support.
4. DXF/STL fixtures exist for every supported import/export claim.
5. Reviewer checks public claims and license/file-format boundaries.
6. No direct push to `main`; open PR from the reviewed branch into `dev/v0.2` or the maintainer-approved target.

## Suggested next immediate action

Before any PR or merge, check the live branch compare against `dev/v0.2` and rerun the verification gates after the latest commit. If more product work is requested before merge, start with the selected-entity inspector because it directly closes the biggest remaining usability gap without touching external file-format claims.
