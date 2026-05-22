# Production CAD Roadmap

> **For Hermes:** Use this as the professional execution contract before claiming Hermes CAD Sketcher is production CAD. Do not skip discovery, verification, or review gates. Work in small PRs; never merge or publish unsupported claims without fresh verification.

**Goal:** Turn Hermes CAD Sketcher from a useful browser prototype into a production-grade Linux/browser CAD application for measured modeling work, while staying honest about supported formats and avoiding fake SketchUp/DWG/SKP compatibility.

**Core decision:** Production CAD cannot be reached by endlessly extending the current toy geometry model. The project needs a real geometry-kernel strategy, file-format strategy, QA strategy, and release/support strategy. Current TypeScript model code remains useful as the app/document/interaction layer, but serious solids, booleans, robust face operations, STEP/IGES-like exchange, and reliable import/export need a kernel or bridge.

**Tech stack today:** React, Vite, TypeScript, Three.js, Vitest.

**Likely production stack direction:** keep React/Three.js UI; evaluate OpenCascade/OpenCascade.js/Chili3D/OpenGeometry as kernel/reference options; keep the current model as an application/document abstraction until a tested kernel adapter replaces simple shape math.

---

## 0. Questions to answer before building blindly

These are not blockers for the next planning slice, but they decide what “production CAD” means.

1. Primary work type:
   - woodworking/furniture/interior measured sketches?
   - mechanical parts?
   - architectural/BIM-ish layouts?
   - general SketchUp-like conceptual modeling?
2. Required production formats for v1:
   - Is `.hcad.json` plus DXF/STL enough for first internal production use?
   - Is STEP export required?
   - Is DWG/SKP only import/export via external bridge acceptable?
3. Platform target:
   - Browser-first local app only?
   - Linux desktop package through Tauri/AppImage?
   - Both?
4. Accuracy target:
   - millimeter modeling for planning?
   - manufacturing-grade tolerances?
   - watertight solids required?
5. Collaboration/release target:
   - single-user local files only for v1?
   - no cloud/account system unless separately approved?
6. Existing-code strategy:
   - continue this app and add a real kernel adapter?
   - or fork/adapt an existing browser CAD such as Chili3D/OpenGeometry if license/architecture wins?

Default assumption until answered: browser-first, local-first, single-user, millimeter-safe modeling for furniture/interior/general measured sketches; no cloud; DWG/SKP bridge-only; no manufacturing-grade STEP/IFC claims until real validators pass.

---

## 1. Professional completion strategy

### Stage A — Intake, requirements, and reality check

**Objective:** Convert “production CAD” into measurable v1 acceptance criteria.

**Steps:**
1. Interview/product-contract pass using the questions above.
2. Define v1 user journeys:
   - create measured model from scratch;
   - edit dimensions precisely;
   - save/load without data loss;
   - export documented formats;
   - recover from invalid files/input;
   - package/run locally on Linux.
3. Define non-goals and claim boundaries.
4. Write acceptance tests as markdown and executable tests where possible.
5. Reviewer gate: “Would a CAD user understand what is and is not promised?”

**Deliverables:**
- `docs/product/production-requirements.md`
- updated `docs/plans/end-to-end-product-plan.md`
- issue/task list grouped by milestone

### Stage B — Existing-project/kernel evaluation before building

**Objective:** Decide whether to adopt, fork, reference, or build around a proven geometry kernel.

**Minimum candidates to evaluate:**
- OpenCascade Technology / OpenCascade.js
- Chili3D as browser-CAD reference/base candidate
- OpenGeometry as browser-native Rust/WASM CAD kernel candidate
- libfive as implicit modeling reference
- SolveSpace or similar constraint/parametric references
- Current custom TypeScript model as app/document layer only

**Scoring criteria:**
- license compatibility;
- maintenance/activity;
- browser/Linux fit;
- TypeScript/React/Three.js integration cost;
- solids/booleans/sketch constraints;
- STEP/IGES/DXF/STL capability;
- testability and bundle/runtime cost;
- security/supply-chain risk;
- whether it can support SketchUp-like direct modeling without copying SketchUp IP.

**Decision labels:**
- Adopt/fork
- Kernel dependency only
- Reference only
- Avoid
- Keep custom

**Deliverables:**
- `docs/research/cad-kernel-evaluation.md`
- recommendation: one path, not a menu
- proof spike plan for the recommended path

### Stage C — Architecture hardening

**Objective:** Separate the app into stable layers before more features pile up.

**Target layers:**
1. Document model: project, units, IDs, entities, components, history metadata.
2. Geometry kernel adapter: operations for sketch, face, solid, boolean, measure, tessellate.
3. View adapter: Three.js rendering from kernel/document state.
4. Command system: all user actions as undoable commands.
5. Persistence/import/export: versioned project files, safe import adapters.
6. UI shell: panels, viewport, keyboard, dialogs.

**Must-have architecture features:**
- deterministic IDs and migrations;
- undo/redo command stack;
- validation errors instead of silent no-ops;
- no geometry mutation outside commands;
- no unvalidated file import side effects;
- explicit units everywhere.

**Deliverables:**
- `docs/architecture/production-architecture.md`
- `src/core/commands/*`
- `src/core/history/*`
- `src/core/inspection.ts`
- tests for command/history/project migration

### Stage D — Modeling v1 feature completion

**Objective:** Complete the minimum CAD modeling loop professionally.

**Feature order:**
1. Undo/redo command stack. Basic snapshot-backed undo/redo is implemented; next hardening step is command metadata and deeper command isolation.
2. Dimension editing for selected entities, not only new boxes.
3. Pan/zoom/orbit polish and keyboard/mouse affordances.
4. Rectangle/face extrusion into boxes/solids.
5. Face/edge selection if kernel supports it.
6. Component instances with transforms rather than copied-only groups.
7. Snapping improvements: grid, endpoints, midpoints, axes.
8. Constraint sketching only after kernel/architecture decision.

**Verification:**
- TDD for every command and model operation.
- Browser/visual QA for viewport interactions.
- Regression tests for geometry invariants.

### Stage E — File format and interoperability hardening

**Objective:** Make file claims trustworthy.

**Rules:**
- `.hcad.json` is the canonical project format until a mature kernel format exists.
- DXF import/export must state supported entities and units.
- STL export/import must distinguish editable solids from reference meshes.
- DWG and SKP remain bridge-only unless a legal/technical integration proves otherwise.
- STEP/IGES/IFC claims require real kernel support and fixture validation.

**Deliverables:**
- fixtures under `tests/fixtures/`
- import/export matrix in README
- validator scripts where available
- golden-file tests for every supported claim

### Stage F — Product QA, packaging, and release management

**Objective:** Make it shippable, repeatable, and supportable.

**Required gates before “production” wording:**
1. Unit/integration tests pass.
2. Browser workflow tests pass for core flows.
3. Visual QA passes desktop and small viewport layouts.
4. File round-trip and invalid-file tests pass.
5. Performance smoke on representative model sizes.
6. Accessibility/keyboard basics checked.
7. Tauri/AppImage packaging spike completed if desktop release is claimed.
8. README/release notes reviewed for no overclaims.
9. Independent reviewer signs off.
10. User acceptance smoke by Antonios/Marios or a recorded local proxy workflow.

**Deliverables:**
- `tests/e2e/*` or `scripts/smoke-browser.mjs`
- `docs/release/v0.3.0-checklist.md`
- optional `docs/packaging-tauri-spike.md`

---

## 2. Immediate next implementation milestones

### Milestone 0 — Finish current PR lifecycle

**Objective:** Do not stack major production work on an unmerged public PR without a reason.

**Steps:**
1. Monitor PR #4.
2. If maintainer requests changes, fix them first.
3. If accepted/merged, rebase/sync local work onto the new `dev/v0.2`.
4. If work must continue before merge, branch from current reviewed branch and keep PR scope clear.

**Gate:** live PR state checked before new public action.

### Milestone 1 — Requirements + kernel decision packet

**Objective:** Prevent months of toy-feature drift.

**Files:**
- Create: `docs/product/production-requirements.md`
- Create: `docs/research/cad-kernel-evaluation.md`
- Modify: `docs/plans/end-to-end-product-plan.md`

**Verification:**
- source links for external candidates;
- reviewer gate for recommendation quality;
- no code adoption before license/architecture review.

### Milestone 2 — Selected-entity inspector

**Status:** implemented on `review/production-cad-inspector`.

**Objective:** Close the biggest current usability gap while kernel research runs.

**Files:**
- Created: `src/core/inspection.ts`
- Created: `tests/inspection.test.ts`
- Created: `src/ui/InspectorPanel.tsx`
- Created: `tests/inspectorPanel.test.tsx`
- Modified: `src/App.tsx`
- Modified: `src/styles.css`

**Verified behavior:**
1. line reports length and endpoints in mm;
2. rectangle reports width/depth and bounding box;
3. box reports width/depth/height, rotation, and bounding box;
4. app renders inspector for the current selection.

### Milestone 3 — Undo/redo command architecture

**Objective:** Production CAD needs reversible operations.

**Files:**
- Create: `src/core/commands.ts`
- Create: `src/core/history.ts`
- Create: `tests/history.test.ts`
- Modify app mutation paths to command dispatch.

**TDD:**
1. RED: command apply/undo restores snapshot.
2. RED: move/rotate/delete commands can undo/redo.
3. RED: history truncates redo stack after a new command.
4. Wire UI buttons and keyboard shortcuts.
5. Full verification.

### Milestone 4 — Real Push/Pull extrusion path

**Objective:** Move from box-height tweak toward CAD-like face/rectangle extrusion.

**Dependency:** At least basic inspector and command architecture should exist first.

**TDD:**
1. rectangle + positive height creates solid/box with stable dimensions;
2. invalid/zero/negative extrusion is blocked;
3. undo restores rectangle;
4. save/load preserves result.

---

## 3. Stop conditions

Stop and ask Antonios before:
- switching the project to a large external kernel dependency;
- forking/adopting a different upstream CAD app;
- adding paid/commercial libraries;
- claiming STEP/DWG/SKP/production-grade support publicly;
- merging PRs or deleting branches;
- changing license or project identity.

Proceed without asking for:
- read-only research;
- local plans/docs;
- local tests;
- private branches/commits in the approved repo/fork;
- small implementation slices that preserve existing scope and pass review gates.

---

## 4. Current recommendation

Do not claim “production CAD” after the current PR. The professional next move is:

1. finish/monitor PR #4;
2. keep the production requirements and kernel evaluation current as implementation evidence changes;
3. implement undo/redo command architecture next;
4. make the kernel decision before implementing deeper face/solid operations.

Rationale: the app is now a credible measured browser prototype, but production CAD depends more on kernel/architecture/QA/file-format discipline than on another UI button.
