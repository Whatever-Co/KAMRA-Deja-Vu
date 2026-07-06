# Smooth Face Mesh (Loop Subdivision) — Design

Date: 2026-07-06
Status: Approved by Saqoosha (approach A)

## Goal

Hero faces (FaceController `main` and `alt` x2) render at
higher mesh resolution so silhouettes and projected-photo texture look
smooth, without touching any 2015 baked data (face2.json weights,
keyframes.bin morphs) or shaders.

The 342-vertex face stays as a control cage; a derived Loop-subdivided
mesh is what gets rendered.

## Non-goals

- `face1` / `face2` stay cage-resolution (learned during verification):
  FaceParticle reads `geometry.index` and mixes it with cage-sized
  weight tables and the 32x32 data texture, and FaceBlender binds
  `face1.geometry.index` against cage-sized position attributes. The
  mosaic/particle section is intentionally chunky anyway.
- FaceLibrary faces (`smalls`, falling children) ARE subdivided (added
  after the hero faces shipped) — at LEVEL 1, built lazily on first
  `getMesh()`. Building 100 level-2 meshes up front added enough heap
  that periodic GC pauses visibly disturbed clmtrackr tracking during
  the webcam outro (the composited face position jumped while frame
  rate stayed smooth). `applyMorph` also memoizes by weights reference:
  the keyframe player clamps to the last frame and re-applies the same
  array every tick. Two lessons encoded in the facade:
  face-library passes a legacy 5th constructor arg (always ignored by
  DeformableFaceGeometry), so the wrap marker must be shape-checked;
  and face-controller pokes cage `uvAttribute` directly around morph
  sections, so `applyMorph` re-derives UVs too.
- user-plane-base's working face stays cage-resolution: it overrides
  the geometry index (face+eyes+mouth) for the capture edge effect. If they pick up smoothing for free via
  shared operators (`main.geometry.clone()` particles), that is fine.
- No offline regeneration of face2.json / keyframes.bin.
- No shader or material changes.

## New component

`main/src/pc/subdivided-face-geometry.js` — `SubdividedFaceGeometry
extends THREE.BufferGeometry`.

- Owns an internal `DeformableFaceGeometry` (the cage). The cage is
  never added to the scene.
- Facade API delegates to the cage, then refreshes derived attributes:
  `init()`, `deform()`, `applyMorph()`, `fillMouth()`, `copy()`,
  `clone()`. Cage-owned properties used by callers
  (`normalizedFeaturePoints`, `matrixFeaturePoints`, `neutralPosition`)
  are exposed as getters.
- `positionAttribute` and `uvAttribute` getters return the CAGE's
  attributes, not the subdivided ones. Verified consumers that read
  these directly and require cage-sized buffers: face-controller mouth
  mesh (shares buffers, stays cage-resolution — acceptable, dark mouth
  interior), smalls' `uvAttribute.copy(main.geometry.uvAttribute)`,
  face-particle, particled-logo (places particles from cage positions,
  which stay deformed every frame), face-blender.
- Renderable attributes (`index`, `position`, `uv`, `uv2`) in the
  BufferGeometry attribute map are the subdivided ones.

## Subdivision operator

- Loop subdivision expressed as a precomputed sparse linear operator:
  each output vertex = weighted sum of cage vertices
  (`[[cageIndex, weight], ...]` per output vertex).
- Interior rules: even vertices use Loop beta weights; odd (edge)
  vertices use 3/8, 3/8, 1/8, 1/8.
- Boundary rules (jaw outline, eye holes, mouth slit — edges with one
  adjacent triangle): even vertices 1/8, 3/4, 1/8 along the boundary;
  odd vertices are edge midpoints. Boundary vertices never take weight
  from interior vertices, so outlines smooth without shrinking inward.
- Level 2 operator = compose(level1(level1 topology)). Level from
  `Config`: `LOW_SPEC ? 1 : 2`.
- Operators are cached in a module-level map keyed by
  (index set, levels) and shared across instances — clones cost no
  extra precomputation.
- `fillMouth()` swaps to the operator built from
  `mouthIncludedIndex` topology (built lazily on first use).
- Positions are re-derived on every delegated mutation (deform /
  applyMorph / init). UVs (`uv`, `uv2`) are re-derived only in `init()`
  (they are static afterwards). Vertex count changes (eyemouth concat)
  follow the cage's full position buffer.

## Integration

`face-controller.js`: replace `new DeformableFaceGeometry()` with
`new SubdividedFaceGeometry()` at the hero construction sites
(`main`, `alt` x2). No call-site changes anywhere else; `app.js` and
keyframe playback code keep calling the same methods. `copy()` MUST be
delegated by the facade — `captureWebcam()` does
`alt.geometry.copy(main.geometry)` and without delegation the cage
never receives `neutralPosition`, crashing `applyMorph` during the
user_alt section.

## Error handling

- If operator precomputation fails (unexpected topology), constructor
  logs a warning and falls back to pass-through (derived = cage), so
  the show still runs.
- Guard: `applyMorph` weight arrays are sized for cage vertex count;
  facade must always hand the cage the cage-sized buffers (delegation
  keeps this true by construction).

## Performance budget

Per frame worst case: ~6 hero meshes x ~5.5k output vertices x ~8
weights ≈ 260k multiply-adds — target < 2 ms total on a 2020+ machine.
If exceeded, drop to level 1 via Config.

## Verification

1. Photo flow end-to-end in Chrome (drive with DevTools MCP):
   silhouette before/after screenshots.
2. Morph sequence (MV second half, applyMorph path) plays without
   distortion; spot-check frames against master branch.
3. `console.time` around derived-position update; confirm < 2 ms.
4. Wireframe debug: `main` uses a wireframe material at opacity 0 —
   temporarily raise opacity to inspect subdivided topology, then
   restore.
