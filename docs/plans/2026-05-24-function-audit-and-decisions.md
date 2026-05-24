# Hermes CAD Function Audit and Decision Plan

> **For Hermes:** Work through this list item by item. Ask Marios for the intended behavior when marked `Needs Marios decision`. Use TDD for every code change. Do not push to `main`.

**Goal:** Control all documented existing Hermes CAD functions, decide the intended behavior with Marios, and then make each point behave exactly as intended.

**Architecture:** Keep the CAD core fail-closed and millimeter-stable. Fix data/model issues before UI polish. Every change gets a regression test, then `npm run check`.

**Tech Stack:** TypeScript, React, Vite, Vitest, Three.js.

---

## Audit evidence collected

- `npm run check`: passed — 32 test files, 206 tests, production build successful.
- Dev app reachability: `http://127.0.0.1:5173/` and `http://192.168.178.21:5173/` both returned HTTP 200.
- `npm run smoke:browser`: originally blocked by `/snap/bin/chromium`; current decision is Brave/Chromium only, with `/snap/bin/brave` available on this machine.
- Temporary audit probes confirmed several behavior gaps; the temporary probe file was removed afterward.

---

## Decision and repair list

### 1. Imported project IDs can collide with newly created IDs

**Current behavior:** `SketchModel.fromSnapshot()` restores existing IDs but does not advance the global ID counter. A new entity can reuse `edge_1` and overwrite the imported `edge_1`.

**Risk:** Data loss after project import, DXF import, or history restore.

**Recommended intended behavior:** Imported IDs must remain stable, and newly created IDs must always be unique.

**Status:** Fixed locally with regression test. `npm run check` passed afterward.

**Tests to add:** `tests/projectFile.test.ts` and/or `tests/model.test.ts` for import + create without collision.

---

### 2. Project file validation does not validate `hidden` and `material`

**Current behavior:** Project import accepts malformed metadata such as `hidden: "no"` or `material.color: "javascript:bad"`.

**Risk:** Invalid state can enter renderer/export/project files.

**Recommended intended behavior:** `hidden` must be boolean if present. `material.name` must be non-empty. `material.color` must be `#RRGGBB`. Ephemeral browser preview URLs must not be trusted as durable project data.

**Status:** Fixed locally for strict metadata validation and removal of `blob:` preview URLs from project export. A future durable texture-asset format still needs a product decision.

**Marios decision:** Texture images should be embedded into the project file.

**Status:** Fixed locally with regression tests. Local material images are read as `data:image/...;base64,...`, stored as embedded texture data in material metadata, and project export still strips transient `blob:` preview URLs.

---

### 3. CAD console `delete(missing_id)` reports success

**Current behavior:** `delete(missing_123)` returns `ok: true` and says the element was deleted although `model.deleteEntity()` returned false.

**Risk:** Agent or user scripts can think cleanup succeeded when nothing happened.

**Recommended intended behavior:** Missing IDs must fail closed with a clear error.

**Status:** Fixed locally with regression test. Missing IDs now fail closed.

---

### 4. Rotated boxes are shown rotated but DXF/STL export axis-aligned geometry

**Current behavior before fix:** Three.js viewport used `rotationZ`, but `exportDxf()` and `exportAsciiStl()` ignored `rotationZ`.

**Risk:** What the user sees is not what gets exported.

**Marios decision:** DXF/STL export must exactly use the visible rotated geometry.

**Status:** Fixed locally with regression test. DXF and STL now use rotated world points for box bodies, and `npm run check` passed afterward.

---

### 5. Material image `previewUrl` is persisted into `.hcad.json`

**Current behavior:** Applying an imported local image material stores `blob:http...` in the model and therefore in project export.

**Risk:** Blob URLs are temporary and useless after reload.

**Recommended intended behavior:** Do not persist `blob:` URLs in `.hcad.json`. Save only durable material name/color now; later add a real texture asset format.

**Status:** Fixed locally with embedded texture data URLs in `.hcad.json`; transient `blob:` preview URLs are still stripped from project export.

---

### 6. Multi-line CAD scripts are not atomic

**Current behavior before fix:** If line 1 succeeded and line 2 failed, the returned `nextModel` could contain line 1, while `ok:false` and `changed:false` were reported.

**Risk:** Ambiguous agent behavior and possible partial edits.

**Marios decision:** If an agent script has errors, Hermes should be able to correct the error; therefore failed scripts must not leave partial geometry behind.

**Status:** Fixed locally with regression test. Multi-line scripts are now atomic: a failed line returns the original model and clear error text.

---

### 7. Non-mm DXF load can replace the current UI model with an empty model

**Current behavior:** Core reports unsupported units and returns an empty model. `openDxfFile()` appears to set that empty model anyway.

**Risk:** Loading a wrong-unit DXF can wipe the current workspace state in the UI.

**Recommended intended behavior:** Unsupported DXF units must not replace the current model. Show an error/status only.

**Status:** Fixed locally through a pure DXF UI import policy and App integration. Unsupported units no longer apply the empty import model.

---

### 8. Vertical X/Z and Y/Z rectangles are drawable but not extrudable

**Current behavior before fix:** Vertical drawing planes existed. `extrudeFaceToBox()` only accepted horizontal XY axis-aligned rectangles because it required all `z` values to match.

**Risk:** User could draw a vertical face but could not turn it into a body.

**Marios decision:** Hermes CAD must support all directions. The active plane must also show matching axis colors so it is clear which axes are being used.

**Reference used:** SketchUp help describes drawing rectangles on ground and vertical planes, and axis alignment with red, green, and blue axes. Hermes CAD follows the same general color convention: X red, Y green, Z blue.

**Status:** Fixed locally with regression tests. X/Y, X/Z and Y/Z rectangle faces can extrude; active drawing plane now shows colored axis chips and an extrusion-axis hint.

---

### 9. `.rb` and `.rbz` marked as `planned` in code

**Current behavior:** `supportedCadFormats()` returns `rb: 'planned'` and `rbz: 'planned'`.

**Documentation:** README/AGENTS says not to promise SketchUp Ruby/RBZ compatibility.

**Recommended intended behavior:** Mark `.rb`/`.rbz` as unsupported or remove them from supported format claims. Later Hermes CAD can have its own `.hcad-ext` extension format.

**Status:** Fixed locally with regression test. `.rb` and `.rbz` are now explicit `unsupported` format claims.

---

### 10. UI integration and browser smoke tests are incomplete

**Current behavior before fix:** Many UI checks were static SSR markup tests. Real pointer/file/browser workflows were not fully tested. Existing `npm run smoke:browser` depended on `/snap/bin/chromium`, which is not installed.

**Risk:** Some UI regressions are not caught by `npm run check`.

**Marios decision:** Smoke script should use Brave/Chromium only, not Google Chrome.

**Status:** Fixed locally. The script now auto-detects `CHROMIUM_PATH`, Brave and Chromium paths, including `/snap/bin/brave`; Google Chrome fallback paths were removed. It uses a disposable browser profile under `SMOKE_BROWSER_TMPDIR` or `/tmp/hermes-cad-smoke-profiles`, waits/retries CDP page-target creation, and avoids Brave-Snap flags that prevented DevTools targets on this machine. During this session, `/tmp` was full from old temporary agent worktrees; after freeing temporary space, the Brave smoke ran green. DXF/STL entity-count checks now read the visible status spans instead of brittle full-page `innerText` matching.

---

### 11. Documentation plan list contains partially completed items

**Current behavior:** AGENTS planned list still mentions some things partly done, e.g. axis-aligned rectangle extrusion and some box-face push/pull logic.

**Risk:** Future agents may duplicate work or misunderstand what is already done.

**Recommended intended behavior:** Split planned items into: done, partial/core-only, and still missing UI/advanced geometry.

**Status:** Punkt 11 abgeschlossen. `AGENTS.md` now separates done, partial/core-only, and still missing work: axis-aligned X/Y X/Z Y/Z rectangle extrusion and basic box-face/push-pull foundations are documented as partially implemented with open expansion, while free/rotated face extrusion and advanced box-face pulling remain in planned work.

---

### 12. Cursor helper/test wording is stale

**Current behavior:** `cursorBadgeForTool()` returns arrow+symbol, but UI deliberately renders only the arrow. Some tests describe a small symbol even though README says no permanent symbol.

**Risk:** Confusing tests and future implementation drift.

**Decision:** Remove the symbol helper until a real temporary specialty hint is needed. The viewport should keep only the normal arrow and explicit snap/tool status text.

**Status:** Fixed locally. `cursorBadgeForTool()` and the stale symbol tests were removed; the viewport source now only renders the normal arrow badge and snap cues.

---

## Suggested repair order

1. Data safety fixes: ID collisions, project metadata validation, delete missing ID, non-mm DXF UI rejection.
2. Serialization/export fixes: remove blob URLs from project export, decide/fix rotated DXF/STL export, hidden export behavior.
3. Script semantics: decide atomic vs partial CAD scripts and test it.
4. Geometry scope: decide vertical rectangle extrusion scope.
5. Tooling: browser smoke availability.
6. Documentation cleanup and stale wording.

---

## Standard verification after each repair group

```bash
npm run check
curl -sS -o /tmp/hcad-local.html -w '%{http_code} %{content_type} %{size_download}\n' http://127.0.0.1:5173/
curl -sS --max-time 5 -o /tmp/hcad-lan.html -w '%{http_code} %{content_type} %{size_download}\n' http://192.168.178.21:5173/
```
