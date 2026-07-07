import './three-stub' // must precede the module under test (imports run in order)
import assert from 'assert'
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
      mouthIncludedIndex: {array: [0, 2, 3]},
      uv: new global.THREE.BufferAttribute(new Float32Array(8), 2),
    }
    this.normalizedFeaturePoints = 'NFP'
    this.deformed = 0
    this.inited = 0
  }
  deform() { this.deformed++; this.positionAttribute.array[0] = 9 }
  applyMorph() {}
  init() { this.inited++ }
  fillMouth() {}
  copy(src) { this.copiedFrom = src; this.positionAttribute.array[3] = 7 }
  clone() { let c = new StubCage(); c.isCloneOf = this; return c }
}

let cage = new StubCage()
let g = SubdividedFaceGeometry.wrap(cage, 1)

// derived sizes: V'=4+5=9 vertices, F'=8 triangles
assert.equal(g.attributes.position.array.length, 9 * 3)
assert.equal(g.indexAttr.array.length, 8 * 3)
assert.equal(g.passThrough, false)
// facade exposes CAGE attributes
assert.equal(g.positionAttribute, cage.positionAttribute)
assert.equal(g.normalizedFeaturePoints, 'NFP')
// deform delegates and re-derives
g.deform([])
assert.equal(cage.deformed, 1)
// vertex 0 is a boundary vertex: 0.75*v0.x + 0.125*v1.x + 0.125*v3.x
// = 0.75*9 + 0.125*1 + 0.125*0 = 6.875
assert.equal(g.attributes.position.array[0], 6.875)
assert(g.attributes.position.needsUpdate)

// init() delegates and re-derives
g.attributes.position.needsUpdate = false
g.init([], 320, 180, 400, 2435)
assert.equal(cage.inited, 1)
assert(g.attributes.position.needsUpdate)

// wrap() with levels omitted falls back to defaultLevels (not undefined)
{
  let gd = SubdividedFaceGeometry.wrap(new StubCage())
  assert.equal(gd.levels, SubdividedFaceGeometry.defaultLevels)
}

// applyMorph memoizes by weights reference: re-applying the same array
// (outro clamps to the last keyframe) must be a no-op, and any deform
// must invalidate the memo
{
  let c = new StubCage()
  c.applyMorphCount = 0
  c.applyMorph = function () { this.applyMorphCount++ }
  let gm = SubdividedFaceGeometry.wrap(c, 1)
  let weights = [0, 0, 0, 1, 0, 0, 0]
  gm.applyMorph(weights)
  gm.applyMorph(weights)
  gm.applyMorph(weights)
  assert.equal(c.applyMorphCount, 1) // repeats skipped
  gm.deform([])
  gm.applyMorph(weights)
  assert.equal(c.applyMorphCount, 2) // deform invalidates the memo
  gm.applyMorph([1, 2, 3]) // different array applies
  assert.equal(c.applyMorphCount, 3)
}

// refreshUVs(): consumers poke cage uvAttribute directly (face-controller
// smalls swap/restore) — derived UVs must follow without an applyMorph
{
  let c = new StubCage()
  let gu = SubdividedFaceGeometry.wrap(c, 1)
  c.uvAttribute.array[0] = 0.4 // poke, as face-controller does
  gu.attributes.uv.needsUpdate = false
  gu.refreshUVs()
  // boundary vertex 0: 0.75*0.4 + 0.125*uv1.x(1) + 0.125*uv3.x(0) = 0.425
  assert(Math.abs(gu.attributes.uv.array[0] - 0.425) < 1e-6)
  assert(gu.attributes.uv.needsUpdate)
  // and a memo-hit applyMorph afterwards must not clobber or crash
  let w = [0]
  gu.applyMorph(w)
  gu.applyMorph(w)
  assert(Math.abs(gu.attributes.uv.array[0] - 0.425) < 1e-6)
}

// clone(): cage is cloned (not shared), levels preserved, buffers independent
{
  let c = new StubCage()
  let g1 = SubdividedFaceGeometry.wrap(c, 1)
  let g2 = g1.clone()
  assert.equal(g2.cage.isCloneOf, c)
  assert.notEqual(g2.cage, c)
  assert.equal(g2.levels, 1)
  assert.notEqual(g2.attributes.position.array, g1.attributes.position.array)
}

// copy() unwraps a facade source, delegates to the cage, and re-derives
{
  let ga = SubdividedFaceGeometry.wrap(new StubCage(), 1)
  ga.attributes.position.needsUpdate = false
  ga.copy(g)
  assert.equal(ga.cage.copiedFrom, cage) // unwrapped to the source's cage
  assert(ga.attributes.position.needsUpdate) // re-derived after copy
  // copy() also accepts a bare cage
  let gb = SubdividedFaceGeometry.wrap(new StubCage(), 1)
  gb.copy(cage)
  assert.equal(gb.cage.copiedFrom, cage)
}

// pass-through fallback: a broken topology (out-of-range vertex) must not
// throw; the facade degrades to cage attributes and stays functional
{
  let c = new StubCage()
  c.standardFace.index.array = [0, 1, 99] // vertex 99 does not exist
  let gp = SubdividedFaceGeometry.wrap(c, 1)
  assert.equal(gp.passThrough, true)
  assert.equal(gp.operator, null)
  assert.equal(gp.attributes.position, c.positionAttribute) // cage passed through
  gp.deform([]) // derive is a no-op, must not crash
  assert.equal(c.deformed, 1)
  // fillMouth must switch the facade index even in pass-through mode
  gp.fillMouth()
  assert.deepEqual(Array.from(gp.indexAttr.array), [0, 2, 3])
}

// levels 0 = subdivision intentionally off (mobile): pass-through without
// an operator build, cage attributes rendered directly, wrap(cage, 0) must
// not fall back to defaultLevels (the old `levels ||` would have)
{
  let c = new StubCage()
  let g0 = SubdividedFaceGeometry.wrap(c, 0)
  assert.equal(g0.levels, 0)
  assert.equal(g0.passThrough, true)
  assert.equal(g0.operator, null)
  assert.equal(g0.attributes.position, c.positionAttribute)
  assert.deepEqual(Array.from(g0.indexAttr.array), [0, 1, 2, 0, 2, 3])
  g0.deform([]) // no derive, must not crash
  assert.equal(c.deformed, 1)
  g0.fillMouth() // topology switch must still work
  assert.deepEqual(Array.from(g0.indexAttr.array), [0, 2, 3])
  let g0c = g0.clone()
  assert.equal(g0c.levels, 0) // clone preserves levels 0
  assert.equal(g0c.passThrough, true)
}

// a numeric 5th positional arg (the historical face-library call) must NOT
// be mistaken for the wrap marker. Proof: the real-cage branch dies under
// babel-node at StandardFaceData's webpack `raw!` require — if the wrap
// branch had been taken instead, construction would "succeed" with an
// undefined cage and no such error
{
  let outcome
  try {
    outcome = new SubdividedFaceGeometry(null, 512, 400, 1200, 9999)
  } catch (e) {
    outcome = e.message
  }
  assert(typeof outcome === 'string' && outcome.indexOf('raw!') !== -1,
    'expected real-cage construction attempt, got: ' + outcome)
}

console.log('subdivided-face-geometry: all tests passed')
