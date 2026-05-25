# Geometry Kernel Spike Plan

This is a future implementation packet, not approval to add a kernel dependency now.

## Recommended first spike

Target: OpenCascade.js / Open CASCADE Technology adapter proof.

Branch: `spike/opencascade-adapter-proof`

## Non-goals

- No production dependency adoption without follow-up approval.
- No React/UI rewrite.
- No project-file schema migration.
- No STEP/DWG/SKP/IFC support claim.
- No Chili3D/OpenGeometry code copy.

## Spike steps

1. Create a minimal adapter boundary under `src/core/kernel/`.
2. Load kernel in an isolated module or dynamic import so the main app can still build without leaking kernel types into React.
3. Implement one operation:
   - input: axis-aligned rectangle profile and positive height in millimeters;
   - output: structured result with tessellated triangles, bounding box, and diagnostics.
4. Add tests for:
   - successful rectangle extrusion;
   - zero/negative height fails closed;
   - invalid/non-closed profile fails closed;
   - missing/failed kernel load returns structured error.
5. Measure:
   - package-lock/package size delta;
   - `npm run build` output chunks before/after;
   - first-operation runtime rough timing.
6. Document license notes and redistribution obligations.

## Acceptance criteria

- `npm run check` passes.
- The spike can be removed by deleting the adapter/spike files and reverting package changes.
- The adapter does not expose kernel-native objects in `.hcad.json` snapshots or React component props.
- The evidence report includes exact bundle sizes and failure-mode output.

## Stop conditions

Stop the spike and report before continuing if:

- the dependency cannot install/build reproducibly on Node 20+;
- bundle size/runtime cost is unacceptable for the local browser app;
- license obligations are unclear;
- the adapter requires project-file migration before a one-operation proof;
- the kernel path tempts a broad rewrite instead of an isolated adapter.
