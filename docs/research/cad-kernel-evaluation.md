# CAD Kernel and Existing Project Evaluation

> Purpose: choose the professional path before implementing deeper production CAD geometry. This is a decision packet, not approval to install a large kernel dependency or fork another CAD app.

## Recommendation

Recommended path: keep Hermes CAD Sketcher as the product/UI/document application and prepare an isolated OpenCascade.js / Open CASCADE Technology adapter spike after the command/document seams are stable.

Why: OpenCascade is the most credible open-source B-Rep CAD kernel path with browser/WASM bindings, while the current TypeScript model is valuable as the local-first document/app layer. Chili3D and OpenGeometry are useful references, but neither should replace the app today: Chili3D is AGPL and app-shaped, OpenGeometry is promising but less proven for this specific product path.

Do not do yet:
- do not add OpenCascade.js, OpenGeometry, Chili3D, SolveSpace, or libfive as a dependency in this issue;
- do not fork or copy Chili3D/OpenGeometry UI/code;
- do not promise native DWG/SKP/STEP/IFC support;
- do not rewrite project files around kernel-native topology before a migration plan exists.

## Proof spike plan

1. Create an isolated kernel-spike branch and adapter module, e.g. `src/core/kernel/openCascadeAdapter.ts`, behind a tiny interface. No React imports and no project-file schema change in the first spike.
2. Prove one operation only: create a rectangle profile, extrude it to a solid, tessellate it for Three.js, and report dimensions/bounding box in millimeters.
3. Measure and record bundle/runtime impact with `npm run build` before/after.
4. Add structured failure tests: missing WASM, invalid profile, zero/negative height, failed tessellation.
5. Stop condition: if install/build/bundle complexity or LGPL/redistribution obligations cannot be made clear in one spike, keep current model for v1 and defer kernel adoption.

## Sources checked

- Open CASCADE Technology licensing page: OCCT 6.7.0+ is LGPL 2.1 with an additional exception.
- OpenCascade.js official project page / repository: OpenCascade CAD library ported to JavaScript/WebAssembly via Emscripten; GitHub API reports LGPL-2.1 license and last push 2023-08-15 for `donalffons/opencascade.js`.
- Chili3D repository: browser-based TypeScript CAD app using OpenCascade/WASM and Three.js; GitHub API reports AGPL-3.0, ~4554 stars, pushed 2026-05-19.
- OpenGeometry repository: browser-native Rust/WASM/Three.js CAD kernel; GitHub API reports MPL-2.0, ~376 stars, pushed 2026-05-05.
- libfive README: library/stdlib/Python bindings MPL-2.0, Guile/Studio GPL-2-or-later; implicit solid modeling approach.
- SolveSpace repository/site: parametric 2D/3D CAD and constraint solver reference; GitHub API reports GPL-3.0, ~3978 stars, pushed 2026-05-21.

## Candidate matrix

| Candidate | License / compatibility | Activity / maturity signal | Browser/Linux fit | Solids / booleans / constraints | Exchange fit | Testability / bundle risk | SketchUp-like direct modeling fit | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OpenCascade / OpenCascade.js | OCCT LGPL-2.1 with OCCT exception; OpenCascade.js LGPL-2.1. Needs redistribution notice review before shipping. | OCCT is mature CAD-kernel lineage. `donalffons/opencascade.js` appears less recently pushed, so package freshness must be checked. | Best browser route among mature B-Rep kernels via WASM; Linux-friendly for source builds. | Strong B-Rep solids, booleans, topology; constraints need separate sketch solver. | Best candidate for STEP/IGES-style future work; DXF/STL still need explicit adapters. | High complexity and bundle/WASM cost; adapter isolation required. | Good for robust push/pull-like solids if hidden behind app-specific commands. | Leading kernel dependency candidate; spike only. |
| Chili3D | AGPL-3.0. Strong copyleft makes code adoption/forking a major product/license decision. | Active browser CAD app; large community signal. | Excellent reference for React/TypeScript/Three.js + OCCT/WASM patterns. | Rich existing modeling tools including booleans/extrude/revolve and snapping. | Likely instructive but app-specific. | Very high adoption complexity; copying code/UI risks identity drift. | Product direction overlaps but should remain reference to avoid becoming a fork. | Reference only for architecture/UI/kernel integration ideas. |
| OpenGeometry | MPL-2.0, more permissive/file-level copyleft than GPL/AGPL. | Promising but smaller/newer ecosystem than OCCT/Chili3D. | Designed for browser-native Rust/WASM + Three.js CAD apps. | Claims CAD-kernel focus; depth of robust B-Rep/booleans/constraints needs direct spike proof. | Unknown until tested with fixtures. | Medium/high risk: newer kernel, docs/API maturity need validation. | Potentially good long-term if API is simpler than OCCT. | Secondary spike candidate after OpenCascade.js, or parallel research if OCCT blocks. |
| libfive | Core library MPL-2.0; Guile/Studio GPL-2-or-later. | Established research/procedural modeling project. | Linux-first; browser integration likely custom/expensive. | Strong implicit/F-rep modeling; not the direct B-Rep face-editing model. | Poor fit for standard CAD exchange and direct editable faces. | Integration complexity and different modeling paradigm. | Better for procedural/agent-generated solids than direct SketchUp-like face operations. | Reference only for future procedural/implicit modeling. |
| SolveSpace / constraint references | GPL-3.0 for the app. Constraint solver extraction has licensing/integration implications. | Mature parametric CAD and constraint reference. | Native app, not browser TypeScript stack. | Strong sketch constraints and parametric ideas, not a drop-in web kernel. | Not the primary exchange strategy. | GPL and native integration make direct adoption risky. | Useful for future constraint behavior, not immediate direct modeling. | Reference only for constraint design. |
| Current custom TypeScript model | Own project code; easiest to test and migrate. | Active in this repo and already covered by Vitest. | Perfect fit for current browser app. | Good for simple entities; not enough for robust production solids/booleans/topology. | Good for `.hcad.json`, limited DXF/STL subsets only. | Low bundle risk and high testability. | Good app/document layer, inadequate production kernel. | Keep as document/app layer; do not stretch into full CAD kernel. |

## Architecture recommendation

Introduce a geometry-kernel adapter boundary before adopting any large dependency:

```ts
export interface GeometryKernelAdapter {
  inspect(entity: Entity): InspectionResult;
  tessellate(snapshot: SketchModelSnapshot): RenderMesh[];
  extrudeFace(input: ExtrudeInput): KernelOperationResult;
  boolean?(input: BooleanInput): KernelOperationResult;
  exportStep?(snapshot: SketchModelSnapshot): KernelExportResult;
}
```

Rules for the adapter:
- React components and `.hcad.json` project files must not expose raw OpenCascade/OpenGeometry objects.
- Kernel-specific topology IDs need a migration strategy before persistence.
- Every operation returns structured `{ ok, value?, error? }` results; kernel exceptions must not reach UI event handlers.
- Current millimeter units remain the document truth; any kernel unit scaling must be explicit and tested.

## Immediate implementation decision

Keep implementing product-value slices that are useful with or without a kernel: command/history, inspection, file-format honesty, browser smoke, snapping, and precise dimensions. Do not start advanced freeform solids until the OpenCascade.js spike has proven install/build, bundle cost, tessellation, error handling, and license obligations.

## Kernel spike acceptance criteria

A future OpenCascade.js/OpenCascade spike must prove all of this before adoption:

1. Install/build works reproducibly on this repo with Node 20+.
2. Bundle/runtime cost is measured and documented.
3. A simple rectangle extrudes into a solid.
4. Solid tessellation renders in Three.js.
5. Dimensions/bounding box can be inspected in millimeters.
6. Save/load has a clear representation strategy.
7. Errors are structured and do not crash the app.
8. License and redistribution terms are documented.
9. The spike is isolated and removable.

## Stop conditions

Stop and ask before:
- adding any kernel dependency to `package.json`;
- copying code or UI from Chili3D/OpenGeometry;
- changing project-file persistence around kernel topology;
- claiming production STEP/DWG/SKP/IFC support;
- adding GPL/AGPL-derived code to the project.

## Current final call

Best professional path: keep Hermes CAD Sketcher, harden its app architecture, and run a small OpenCascade.js adapter spike only after the current command/document seams are stable. Use Chili3D, OpenGeometry, libfive, and SolveSpace as references, not as adoption targets today.
