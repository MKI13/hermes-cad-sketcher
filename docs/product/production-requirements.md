# Hermes CAD Sketcher Production Requirements

> Agent-decided defaults because Antonios is not deep into CAD implementation details. Revisit only when real user testing contradicts these assumptions.

## Product decision

Build a browser-first, local-first CAD sketcher for measured planning work, not a manufacturing-certified mechanical CAD replacement.

## Assumed primary user/job

- Primary user: Marios / EF-Sinn style measured design work.
- Primary jobs:
  - furniture, woodworking, fixtures, interior/measured layouts;
  - quick SketchUp-like conceptual modeling with exact millimeter values;
  - simple export for communication, fabrication planning, and downstream checking.
- Secondary jobs:
  - reference import/export experiments;
  - future desktop packaging for Linux.
- Non-primary for v1:
  - high-end parametric mechanical design;
  - BIM authoring;
  - certified manufacturing tolerances;
  - team/cloud collaboration.

## V1 scope

### Must have

1. Local browser app runs from source with documented commands.
2. No cloud account or server dependency for normal modeling.
3. Millimeter is explicit everywhere.
4. User can draw, select, inspect, move, rotate, delete, measure, save, load, and export the documented subsets.
5. User can see selected-entity dimensions and bounding box without guessing.
6. Undo/redo exists for destructive and transform operations.
7. Invalid inputs fail visibly and do not silently corrupt geometry.
8. Project files round-trip without losing IDs, units, components, dimensions, or future migration metadata.
9. File-format support is documented as a matrix of exact supported operations.
10. Browser workflow tests and preview smoke pass before release.

### Should have

1. Linux desktop packaging decision: browser-only vs Tauri/AppImage.
2. Pan/zoom/orbit polish with keyboard/mouse documentation.
3. Rectangle/face extrusion into solids after command/history and kernel decision.
4. Snapping beyond grid: endpoints, midpoints, axes.
5. Basic performance smoke with representative model size.

### Won't have in v1 unless separately proven

1. Native DWG support.
2. Native SKP support.
3. SketchUp `.rb`/`.rbz` plugin compatibility.
4. Certified STEP/IFC production export claims.
5. Cloud storage/accounts/collaboration.
6. Paid/commercial geometry libraries.

## Acceptance journeys

### Journey A — create measured model

1. Open local app.
2. Draw line, rectangle, and box on millimeter grid.
3. Select each entity.
4. Inspector shows type, dimensions, bounding box, and relevant values.
5. Save project.
6. Reload project.
7. Geometry and inspector values match before save.

### Journey B — edit safely

1. Select a box.
2. Move it by exact ΔX/ΔY/ΔZ.
3. Rotate it by exact degrees.
4. Push/Pull height by ΔH.
5. Undo each action.
6. Redo each action.
7. Invalid numeric inputs are blocked.

### Journey C — exchange honestly

1. Export documented DXF subset.
2. Export documented STL subset.
3. Import documented project file.
4. Invalid project file reports a clear error.
5. README states unsupported formats clearly.

## Production-readiness gates

A release may be called production-ready for the scoped v1 only when:

- `npm run check` passes after final commit.
- Browser workflow smoke passes for journeys A and B.
- HTTP preview smoke passes.
- Golden import/export fixtures pass.
- Independent review approves public claims.
- The release notes list unsupported formats and known limits.
- At least one user acceptance run is recorded, or a local proxy script reproduces the core journeys.

## Agent operating assumptions

- Continue current app rather than adopting another app immediately.
- Evaluate kernel options before implementing advanced solid modeling.
- Use OpenCascade/OpenCascade.js as the leading kernel candidate unless research produces a better low-risk option.
- Treat Chili3D as a reference/adoption candidate, not code to copy without license/architecture review.
- Keep current TypeScript model as document/app layer for now.
- Implement selected-entity inspector next because it is useful regardless of kernel decision.
