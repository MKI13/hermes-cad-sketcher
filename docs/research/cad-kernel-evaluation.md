# CAD Kernel and Existing Project Evaluation

> Purpose: choose the professional path before implementing deeper production CAD geometry. This is a first-pass research packet based on current public search snippets and project fit. Do not adopt or copy code until license and architecture are verified directly from upstream source files.

## Recommendation

Use the current Hermes CAD Sketcher app as the product/UI/document base and evaluate OpenCascade/OpenCascade.js as the likely geometry-kernel adapter for advanced solids and future STEP-like exchange.

Do not immediately fork/adopt Chili3D or OpenGeometry as the main app. Treat them as reference implementations until a deeper license/API/build review proves adoption is better.

Short version:

1. Keep current app.
2. Add production architecture seams: inspection, commands/history, document migrations.
3. Spike an isolated kernel adapter around OpenCascade.js/OpenCascade after the command/document layer exists.
4. Use Chili3D/OpenGeometry for architectural comparison, not wholesale replacement yet.

## Why not keep custom geometry only?

The current custom TypeScript model is good for early entities, IDs, units, save/load, and UI workflows. It is not enough for production CAD solids because robust face operations, booleans, fillets/chamfers, watertight topology, STEP/IGES-like exchange, and exact B-Rep behavior are hard to implement correctly from scratch.

Keep it as the application/document layer, but do not pretend it is a production CAD kernel.

## Candidates

### 1. OpenCascade Technology / OpenCascade.js

**What it appears to offer:**
- Full-scale open-source 3D geometry/CAD kernel.
- Surface and solid modeling.
- CAD data exchange foundations.
- JavaScript/WebAssembly bindings through OpenCascade.js.
- Browser/cloud-capable CAD kernel path.

**Fit:** High.

**Pros:**
- Most credible path for serious solid modeling.
- Existing browser/WASM route.
- Known CAD-kernel lineage used by real CAD systems.
- Better future support for advanced operations and file exchange than custom TypeScript geometry.

**Cons / risks:**
- Large dependency and bundle/runtime complexity.
- API complexity.
- Requires careful adapter design.
- License/build details must be verified directly before adoption.
- Integrating B-Rep topology with current simple entity model is non-trivial.

**Decision:** Leading kernel-dependency candidate. Do an isolated spike, not an immediate app rewrite.

### 2. Chili3D

**What it appears to offer:**
- Open-source browser-based 3D CAD application built with TypeScript.
- Uses OpenCascade compiled to WebAssembly and Three.js.
- Existing commands/operations/UI architecture may be instructive.

**Fit:** Medium as reference; unknown as base.

**Pros:**
- Similar browser CAD direction.
- Likely useful architecture examples for command system, WASM kernel integration, and UI patterns.
- May already solve parts of the kernel integration problem.

**Cons / risks:**
- Adopting/forking would likely replace much of current app identity and architecture.
- License, maturity, build, and complexity must be verified.
- Could be overkill or mismatched for EF-Sinn/Marios measured-sketch workflow.
- Copying UI patterns too closely risks losing product identity.

**Decision:** Reference/adoption candidate only. Do not copy code without direct license review.

### 3. OpenGeometry

**What it appears to offer:**
- Browser-native CAD kernel direction, Rust/WASM plus TypeScript/Three.js-friendly layer according to search snippets.

**Fit:** Medium/unknown.

**Pros:**
- Browser-native focus may fit current stack.
- Rust/WASM could be attractive for performance and packaging.

**Cons / risks:**
- Maturity, license, API, and ecosystem are less clear from first-pass search.
- Need direct repository review before trusting it for production path.

**Decision:** Evaluate in kernel spike shortlist, but behind OpenCascade.js unless research proves stronger fit.

### 4. libfive

**What it appears to offer:**
- Solid modeling kernel for implicit/f-rep modeling.
- Useful for script/code-driven CAD concepts.

**Fit:** Low/medium.

**Pros:**
- Interesting modeling approach.
- Could inspire future procedural/agent-driven modeling.

**Cons / risks:**
- Less direct fit for SketchUp-like direct manipulation and standard B-Rep CAD exchange.
- Browser integration path likely more work.

**Decision:** Reference only for procedural modeling ideas.

### 5. SolveSpace / constraint references

**What it appears to offer:**
- Constraint/parametric CAD ideas and sketch solver references.

**Fit:** Reference only for now.

**Pros:**
- Useful inspiration for constraints, dimensions, sketches.

**Cons / risks:**
- Not a direct browser TypeScript kernel solution for this app.
- Constraint solving should come after document/command/kernel seams.

**Decision:** Reference only.

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

Do not expose OpenCascade types directly in React components or project files. Keep kernel-specific IDs/topology behind an adapter and migration layer.

## Immediate implementation decision

Implement selected-entity inspection using the current model first. This is useful immediately and gives a stable API shape for future kernel-backed inspection.

Then implement command/history. After those seams exist, run a separate kernel spike.

## Kernel spike acceptance criteria

A future OpenCascade.js/OpenCascade spike should prove all of this before adoption:

1. Install/build works reproducibly on this repo.
2. Bundle/runtime cost is measured.
3. A simple rectangle extrudes into a solid.
4. Solid tessellation renders in Three.js.
5. Dimensions/bounding box can be inspected.
6. Save/load has a clear representation strategy.
7. Errors are structured and do not crash the app.
8. License and redistribution terms are documented.
9. The spike is isolated and removable.

## Current final call

Best professional path: keep Hermes CAD Sketcher, harden its app architecture, and plan an OpenCascade.js kernel adapter spike after selected-entity inspector and command/history are in place.
