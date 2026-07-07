# Smooth Face Mesh (Loop Subdivision) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hero faces render through a Loop-subdivided derived mesh while the 342-vertex 2015 cage keeps driving all deformation and baked morph data.

**Architecture:** A pure, dependency-free operator module precomputes Loop subdivision as sparse per-vertex weights over cage vertices. A facade geometry class owns a `DeformableFaceGeometry` cage, delegates its full API, and refreshes derived (rendered) attributes from the operator. Face-controller swaps constructors at 5 hero sites.

**Tech Stack:** three.js r73 (global `THREE`), webpack 1 + Babel 6 (ES2015 only), tests via `babel-node` inside the `kamra-dev` container.

## Global Constraints

- ES2015 syntax only (babel-preset-es2015); no Proxy, no optional chaining, no class fields.
- Do not modify: `face2.json`, `keyframes.bin`, shaders, `deformable-face-geometry.js`.
- `positionAttribute` / `uvAttribute` on the facade MUST return cage attributes (consumers: face-controller mouth mesh & smalls UV copy, face-particle, particled-logo, face-blender).
- Subdivided vertex count must stay < 65536 (Uint16 index).
- All commands that need node run inside the container: `container exec kamra-dev sh -c '...'`.
- Dev watch may be running; it only rebuilds bundles — tests run independently via babel-node.

---

### Task 1: Pure Loop-subdivision operator module

**Files:**
- Create: `main/src/pc/subdivision-operator.js`
- Test: `main/test/subdivision-operator.test.js`

**Interfaces:**
- Produces: `buildLoopOperator(index, vertexCount, levels)` →
  `{index: number[] (triangles of subdivided mesh), rows: Array<Array<[cageIndex, weight]>>}`.
  `rows[outVertex]` lists cage contributions; every row's weights sum to 1.
  Also `applyOperator(rows, src, srcItemSize, dst)` writes derived floats.

- [ ] **Step 1: Write the failing test**

```js
// main/test/subdivision-operator.test.js
import assert from 'assert'
import {buildLoopOperator, applyOperator} from '../src/pc/subdivision-operator'

function rowSum(row) {
  return row.reduce((s, iw) => s + iw[1], 0)
}

// --- two triangles sharing an edge (quad), all edges boundary except the shared one
{
  let index = [0, 1, 2, 0, 2, 3]
  let op = buildLoopOperator(index, 4, 1)
  // V' = V + E = 4 + 5 = 9, F' = 4F = 8
  assert.equal(op.rows.length, 9)
  assert.equal(op.index.length, 8 * 3)
  op.rows.forEach((row) => assert(Math.abs(rowSum(row) - 1) < 1e-6))
  // boundary odd vertex (edge 0-1) must be the midpoint: weights 1/2,1/2
  let mid01 = op.rows.find((row) =>
    row.length == 2 && row.every((iw) => Math.abs(iw[1] - 0.5) < 1e-6) &&
    row.map((iw) => iw[0]).sort().join() == '0,1')
  assert(mid01, 'boundary edge midpoint row missing')
}

// --- closed tetrahedron: no boundary, interior rules everywhere
{
  let index = [0, 1, 2, 0, 3, 1, 1, 3, 2, 2, 3, 0]
  let op = buildLoopOperator(index, 4, 1)
  assert.equal(op.rows.length, 4 + 6)
  op.rows.forEach((row) => assert(Math.abs(rowSum(row) - 1) < 1e-6))
  // interior odd vertex: 4 contributors (3/8,3/8,1/8,1/8)
  let odd = op.rows[4]
  assert.equal(odd.length, 4)
  let ws = odd.map((iw) => iw[1]).sort()
  assert(Math.abs(ws[0] - 0.125) < 1e-6 && Math.abs(ws[3] - 0.375) < 1e-6)
}

// --- level 2 composes: rows still reference ORIGINAL cage indices only
{
  let index = [0, 1, 2, 0, 2, 3]
  let op = buildLoopOperator(index, 4, 2)
  op.rows.forEach((row) => {
    assert(Math.abs(rowSum(row) - 1) < 1e-6)
    row.forEach((iw) => assert(iw[0] >= 0 && iw[0] < 4))
  })
}

// --- applyOperator: identity rows copy source
{
  let rows = [[[0, 1]], [[0, 0.5], [1, 0.5]]]
  let dst = new Float32Array(2 * 3)
  applyOperator(rows, new Float32Array([0, 0, 0, 2, 4, 6]), 3, dst)
  assert.deepEqual(Array.from(dst), [0, 0, 0, 1, 2, 3])
}

// --- unreferenced vertices keep identity rows
{
  let index = [0, 1, 2]
  let op = buildLoopOperator(index, 5, 1) // vertices 3,4 unreferenced
  assert.deepEqual(op.rows[3], [[3, 1]])
  assert.deepEqual(op.rows[4], [[4, 1]])
}

console.log('subdivision-operator: all tests passed')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `container exec kamra-dev sh -c 'node_modules/.bin/babel-node test/subdivision-operator.test.js'`
Expected: FAIL — cannot resolve `../src/pc/subdivision-operator`

- [ ] **Step 3: Write the implementation**

```js
// main/src/pc/subdivision-operator.js
// Loop subdivision precomputed as sparse linear weights over cage vertices.
// Pure arrays in/out - no THREE, no gl-matrix - so it is testable standalone.

function edgeKey(a, b) {
  return a < b ? a * 65536 + b : b * 65536 + a
}

// one level of Loop subdivision on (index, vertexCount)
// returns {index, rows} where rows reference THIS level's input vertices
function subdivideOnce(index, vertexCount) {
  let triCount = index.length / 3

  // adjacency
  let edges = new Map() // key -> {a, b, opposite: [c...], count}
  let vertexEdges = []  // vertex -> Set of neighbor vertices
  let vertexBoundary = new Array(vertexCount).fill(false)
  let referenced = new Array(vertexCount).fill(false)
  for (let v = 0; v < vertexCount; v++) {
    vertexEdges.push(new Set())
  }
  for (let t = 0; t < triCount; t++) {
    let i0 = index[t * 3], i1 = index[t * 3 + 1], i2 = index[t * 3 + 2]
    referenced[i0] = referenced[i1] = referenced[i2] = true
    let tri = [[i0, i1, i2], [i1, i2, i0], [i2, i0, i1]]
    tri.forEach((e) => {
      let key = edgeKey(e[0], e[1])
      let edge = edges.get(key)
      if (!edge) {
        edge = {a: Math.min(e[0], e[1]), b: Math.max(e[0], e[1]), opposite: [], count: 0}
        edges.set(key, edge)
      }
      edge.opposite.push(e[2])
      edge.count++
      vertexEdges[e[0]].add(e[1])
      vertexEdges[e[1]].add(e[0])
    })
  }
  edges.forEach((edge) => {
    if (edge.count == 1) {
      vertexBoundary[edge.a] = true
      vertexBoundary[edge.b] = true
    }
  })

  // even (original) vertex rows
  let rows = []
  for (let v = 0; v < vertexCount; v++) {
    if (!referenced[v]) {
      rows.push([[v, 1]])
      continue
    }
    if (vertexBoundary[v]) {
      // boundary rule: 1/8, 3/4, 1/8 along boundary neighbors only
      let bn = []
      vertexEdges[v].forEach((n) => {
        let e = edges.get(edgeKey(v, n))
        if (e.count == 1) {
          bn.push(n)
        }
      })
      if (bn.length == 2) {
        rows.push([[v, 0.75], [bn[0], 0.125], [bn[1], 0.125]])
      } else {
        rows.push([[v, 1]]) // corner / non-manifold: keep fixed
      }
    } else {
      let neighbors = Array.from(vertexEdges[v])
      let n = neighbors.length
      let beta = n == 3 ? 3 / 16 : 3 / (8 * n)
      let row = [[v, 1 - n * beta]]
      neighbors.forEach((nb) => row.push([nb, beta]))
      rows.push(row)
    }
  }

  // odd (edge) vertex rows
  let edgeVertexIndex = new Map()
  edges.forEach((edge, key) => {
    let row
    if (edge.count == 1) {
      row = [[edge.a, 0.5], [edge.b, 0.5]]
    } else {
      row = [[edge.a, 0.375], [edge.b, 0.375],
             [edge.opposite[0], 0.125], [edge.opposite[1], 0.125]]
    }
    edgeVertexIndex.set(key, rows.length)
    rows.push(row)
  })

  // new topology: each triangle -> 4
  let newIndex = []
  for (let t = 0; t < triCount; t++) {
    let i0 = index[t * 3], i1 = index[t * 3 + 1], i2 = index[t * 3 + 2]
    let m01 = edgeVertexIndex.get(edgeKey(i0, i1))
    let m12 = edgeVertexIndex.get(edgeKey(i1, i2))
    let m20 = edgeVertexIndex.get(edgeKey(i2, i0))
    newIndex.push(
      i0, m01, m20,
      m01, i1, m12,
      m20, m12, i2,
      m01, m12, m20
    )
  }
  return {index: newIndex, rows: rows}
}

// compose: outer rows reference inner's outputs; rewrite over inner's inputs
function composeRows(outerRows, innerRows) {
  return outerRows.map((outerRow) => {
    let acc = new Map()
    outerRow.forEach((ow) => {
      innerRows[ow[0]].forEach((iw) => {
        acc.set(iw[0], (acc.get(iw[0]) || 0) + ow[1] * iw[1])
      })
    })
    return Array.from(acc.entries())
  })
}

export function buildLoopOperator(index, vertexCount, levels) {
  let current = subdivideOnce(index, vertexCount)
  for (let l = 1; l < levels; l++) {
    let next = subdivideOnce(current.index, current.rows.length)
    current = {index: next.index, rows: composeRows(next.rows, current.rows)}
  }
  return current
}

export function applyOperator(rows, src, itemSize, dst) {
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i]
    for (let c = 0; c < itemSize; c++) {
      let v = 0
      for (let k = 0; k < row.length; k++) {
        v += src[row[k][0] * itemSize + c] * row[k][1]
      }
      dst[i * itemSize + c] = v
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `container exec kamra-dev sh -c 'node_modules/.bin/babel-node test/subdivision-operator.test.js'`
Expected: `subdivision-operator: all tests passed`

- [ ] **Step 5: Commit**

```bash
git add main/src/pc/subdivision-operator.js main/test/subdivision-operator.test.js
git commit -m "Add pure Loop subdivision operator with boundary rules"
```

---

### Task 2: SubdividedFaceGeometry facade

**Files:**
- Create: `main/src/pc/subdivided-face-geometry.js`
- Test: `main/test/subdivided-face-geometry.test.js`

**Interfaces:**
- Consumes: `buildLoopOperator`, `applyOperator` from Task 1;
  `DeformableFaceGeometry` (unchanged).
- Produces: `SubdividedFaceGeometry` class, drop-in constructor-compatible
  with `DeformableFaceGeometry`. Methods: `init(featurePoint2D, imageWidth,
  imageHeight, planeHeight, cameraZ)`, `deform(featurePoints)`,
  `applyMorph(weights)`, `fillMouth()`, `clone()`. Getters:
  `positionAttribute`, `uvAttribute`, `normalizedFeaturePoints`,
  `matrixFeaturePoints`, `neutralPosition`, `standardFace`, `cage`.

- [ ] **Step 1: Write the failing test (THREE stubbed, cage stubbed)**

```js
// main/test/subdivided-face-geometry.test.js
import assert from 'assert'

// minimal THREE stub so the module can be imported under babel-node
global.THREE = {
  BufferGeometry: class {
    constructor() { this.attributes = {} }
    setIndex(v) { this.indexAttr = v }
    addAttribute(name, attr) { this.attributes[name] = attr }
  },
  BufferAttribute: class {
    constructor(array, itemSize) {
      this.array = array
      this.itemSize = itemSize
      this.needsUpdate = false
    }
  },
}

import SubdividedFaceGeometry from '../src/pc/subdivided-face-geometry'

// stub cage: a quad (2 triangles), 4 vertices
class StubCage {
  constructor() {
    this.positionAttribute = new global.THREE.BufferAttribute(
      new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3)
    this.uvAttribute = new global.THREE.BufferAttribute(
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)
    this.standardFace = {
      index: {array: [0, 1, 2, 0, 2, 3]},
      mouthIncludedIndex: {array: [0, 1, 2, 0, 2, 3]},
      uv: new global.THREE.BufferAttribute(new Float32Array(8), 2),
    }
    this.normalizedFeaturePoints = 'NFP'
    this.deformed = 0
  }
  deform() { this.deformed++; this.positionAttribute.array[0] = 9 }
  applyMorph() {}
  init() {}
  fillMouth() {}
}

let cage = new StubCage()
let g = SubdividedFaceGeometry.wrap(cage, 1)

// derived sizes: V'=4+5=9 vertices, F'=8 triangles
assert.equal(g.attributes.position.array.length, 9 * 3)
assert.equal(g.indexAttr.array.length, 8 * 3)
// facade exposes CAGE attributes
assert.equal(g.positionAttribute, cage.positionAttribute)
assert.equal(g.normalizedFeaturePoints, 'NFP')
// deform delegates and re-derives
g.deform([])
assert.equal(cage.deformed, 1)
assert.equal(g.attributes.position.array[0], 9) // identity row on vertex 0
assert(g.attributes.position.needsUpdate)

console.log('subdivided-face-geometry: all tests passed')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `container exec kamra-dev sh -c 'node_modules/.bin/babel-node test/subdivided-face-geometry.test.js'`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Write the implementation**

```js
// main/src/pc/subdivided-face-geometry.js
/* global THREE */

import DeformableFaceGeometry from './deformable-face-geometry'
import {buildLoopOperator, applyOperator} from './subdivision-operator'

// operators are shared across instances: cache by index array + levels
let operatorCache = new Map()

function getOperator(indexArray, vertexCount, levels) {
  let key = indexArray.length + '/' + vertexCount + '/' + levels + '/' + indexArray[0]
  let op = operatorCache.get(key)
  if (!op) {
    op = buildLoopOperator(Array.from(indexArray), vertexCount, levels)
    operatorCache.set(key, op)
  }
  return op
}

export default class SubdividedFaceGeometry extends THREE.BufferGeometry {

  // wrap() exists so tests can inject a stub cage; the constructor
  // builds the real one.
  static wrap(cage, levels) {
    let geometry = new SubdividedFaceGeometry(null, null, null, null, {cage, levels})
    return geometry
  }

  constructor(featurePoint2D, image, planeHeight, cameraZ, _internal) {
    super()
    if (_internal) {
      this.cage = _internal.cage
      this.levels = _internal.levels
    } else {
      this.cage = new DeformableFaceGeometry(featurePoint2D, image, planeHeight, cameraZ)
      this.levels = SubdividedFaceGeometry.defaultLevels
    }
    try {
      this._rebuildOperator(this.cage.standardFace.index.array)
    } catch (e) {
      console.warn('SubdividedFaceGeometry: operator build failed, pass-through', e)
      this._passThrough()
      return
    }
    this._allocateDerived()
    this._deriveAll()
  }

  _rebuildOperator(indexArray) {
    let vertexCount = this.cage.positionAttribute.array.length / 3
    this.operator = getOperator(indexArray, vertexCount, this.levels)
  }

  _allocateDerived() {
    let n = this.operator.rows.length
    this.setIndex(new THREE.BufferAttribute(new Uint16Array(this.operator.index), 1))
    this.addAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    this.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
    this.addAttribute('uv2', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
  }

  _passThrough() {
    this.setIndex(this.cage.standardFace ? new THREE.BufferAttribute(new Uint16Array(this.cage.standardFace.index.array), 1) : null)
    this.addAttribute('position', this.cage.positionAttribute)
    this.addAttribute('uv', this.cage.uvAttribute)
    this.operator = null
  }

  _derivePositions() {
    if (!this.operator) return
    applyOperator(this.operator.rows, this.cage.positionAttribute.array, 3, this.attributes.position.array)
    this.attributes.position.needsUpdate = true
  }

  _deriveUVs() {
    if (!this.operator) return
    applyOperator(this.operator.rows, this.cage.uvAttribute.array, 2, this.attributes.uv.array)
    this.attributes.uv.needsUpdate = true
    if (this.cage.standardFace.uv) {
      applyOperator(this.operator.rows, this.cage.standardFace.uv.array, 2, this.attributes.uv2.array)
      this.attributes.uv2.needsUpdate = true
    }
  }

  _deriveAll() {
    this._derivePositions()
    this._deriveUVs()
  }

  // --- delegated API ---

  init(featurePoint2D, imageWidth, imageHeight, planeHeight, cameraZ) {
    this.cage.init(featurePoint2D, imageWidth, imageHeight, planeHeight, cameraZ)
    this._deriveAll()
  }

  deform(featurePoints) {
    this.cage.deform(featurePoints)
    this._derivePositions()
  }

  applyMorph(weights) {
    this.cage.applyMorph(weights)
    this._derivePositions()
  }

  fillMouth() {
    this.cage.fillMouth()
    if (this.operator) {
      this._rebuildOperator(this.cage.standardFace.mouthIncludedIndex.array)
      this._allocateDerived()
      this._deriveAll()
    }
  }

  clone() {
    let cage = this.cage.clone()
    let geometry = SubdividedFaceGeometry.wrap(cage, this.levels)
    return geometry
  }

  // --- cage-sized attribute access for existing consumers ---

  get positionAttribute() { return this.cage.positionAttribute }
  get uvAttribute() { return this.cage.uvAttribute }
  get normalizedFeaturePoints() { return this.cage.normalizedFeaturePoints }
  get matrixFeaturePoints() { return this.cage.matrixFeaturePoints }
  get neutralPosition() { return this.cage.neutralPosition }
  get standardFace() { return this.cage.standardFace }

}

SubdividedFaceGeometry.defaultLevels = 2
```

Note for implementer: `DeformableFaceGeometry.clone()` internally calls
`new DeformableFaceGeometry()` + `copy()` which copies position/uv
attributes and `neutralPosition` — exactly what the facade's `clone()`
needs for the cage. `wrap()` bypasses cage construction for tests and
clone.

- [ ] **Step 4: Run test to verify it passes**

Run: `container exec kamra-dev sh -c 'node_modules/.bin/babel-node test/subdivided-face-geometry.test.js'`
Expected: `subdivided-face-geometry: all tests passed`
Also rerun Task 1 test — must still pass.

- [ ] **Step 5: Commit**

```bash
git add main/src/pc/subdivided-face-geometry.js main/test/subdivided-face-geometry.test.js
git commit -m "Add SubdividedFaceGeometry facade over the deformable cage"
```

---

### Task 3: Integration + in-app verification

**Files:**
- Modify: `main/src/pc/config.js` (add level constant)
- Modify: `main/src/pc/face-controller.js:37,51,69,75` (5 constructor sites; line 51 covers both alts in its loop)

**Interfaces:**
- Consumes: `SubdividedFaceGeometry` from Task 2.

- [ ] **Step 1: Wire Config level**

In `main/src/pc/config.js` add inside the exported object:

```js
  FACE_SUBDIVISION: LOW_SPEC ? 1 : 2,
```

- [ ] **Step 2: Swap hero constructors in face-controller.js**

```js
import SubdividedFaceGeometry from './subdivided-face-geometry'
```

Set once near the import (before any construction):

```js
SubdividedFaceGeometry.defaultLevels = Config.FACE_SUBDIVISION
```

Replace ONLY these sites:
- line 37 `this.main = new THREE.Mesh(new DeformableFaceGeometry(), ...)` → `new SubdividedFaceGeometry()`
- line 51 `let alt = new THREE.Mesh(new DeformableFaceGeometry())` → `new SubdividedFaceGeometry()`
- line 69 `this.face1 = ...` → `new SubdividedFaceGeometry()`
- line 75 `this.face2 = ...` → `new SubdividedFaceGeometry()`

Leave `mouth` (line 43-44) untouched — it shares cage attributes by design.

- [ ] **Step 3: Verify webpack rebuild is clean**

Dev watch is already running. Run:
`until grep -qE 'webpack is watching' <task-output>; do sleep 2; done`
on the latest rebuild; check no `ERROR in` lines.

- [ ] **Step 4: In-app visual verification (verification-before-completion)**

1. Reload http://localhost:3000, run Photo flow with the padded
   `slice_face_44` image (canvas + DataTransfer trick from AGENTS.md).
2. Screenshot the confirm screen and the playing hero face; compare
   silhouette smoothness against the pre-change screenshots.
3. Let the MV play into the morph section (applyMorph path, ~30 s in)
   and screenshot — confirm no exploded/garbled geometry.
4. Console must be free of new errors.
5. Perf: in DevTools console run
   `console.time('d'); window.__djv_loader && 0; console.timeEnd('d')` —
   instead, measure via the Performance panel or wrap: temporary
   `console.time('subdiv')` around `_derivePositions` is acceptable
   during verification but MUST be removed before commit.
   Budget: < 2 ms per frame total.

- [ ] **Step 5: Commit**

```bash
git add main/src/pc/config.js main/src/pc/face-controller.js
git commit -m "Render hero faces through Loop-subdivided geometry"
```

---

## Self-Review Notes

- Spec coverage: operator w/ boundary rules (T1), facade + cage-attribute
  getters (T2), 5-site integration + Config level + fallback pass-through
  (T2 constructor try/catch), verification incl. morph + perf (T3). Gaps: none.
- `fillMouth()` on face1/face2 happens right after construction, before
  `init()` — facade handles it by rebuilding the operator (cached across
  the two meshes).
- Types consistent: `rows` = `Array<Array<[number, number]>>` everywhere;
  `applyOperator(rows, src, itemSize, dst)` used identically in T1 test
  and T2 implementation.
