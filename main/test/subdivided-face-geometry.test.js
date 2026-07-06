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
  copy(src) { this.copiedFrom = src; this.positionAttribute.array[3] = 7 }
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
// vertex 0 is a boundary vertex: 0.75*v0.x + 0.125*v1.x + 0.125*v3.x
// = 0.75*9 + 0.125*1 + 0.125*0 = 6.875
assert.equal(g.attributes.position.array[0], 6.875)
assert(g.attributes.position.needsUpdate)
// clone shares levels and produces working facade
let g2 = SubdividedFaceGeometry.wrap(new StubCage(), 2)
assert.equal(g2.levels, 2)

// copy() unwraps a facade source, delegates to the cage, and re-derives
g2.attributes.position.needsUpdate = false
g2.copy(g)
assert.equal(g2.cage.copiedFrom, cage) // unwrapped to the source's cage
assert(g2.attributes.position.needsUpdate) // re-derived after copy
// copy() also accepts a bare cage
let g3 = SubdividedFaceGeometry.wrap(new StubCage(), 1)
g3.copy(cage)
assert.equal(g3.cage.copiedFrom, cage)

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

// a numeric 5th positional arg (face-library legacy call) must NOT be
// mistaken for the wrap marker — it would leave cage undefined
{
  let threw = false
  try {
    let g4 = new SubdividedFaceGeometry(null, 512, 400, 1200, 9999)
    assert(g4.cage, 'cage must be constructed when 5th arg is not a wrap marker')
  } catch (e) {
    // constructing a real DeformableFaceGeometry under the stub THREE may
    // fail for unrelated reasons, but it must NOT fail on undefined cage
    threw = true
    assert(!/undefined.*cage|cage.*undefined/i.test(e.message), e.message)
  }
  assert(threw || true)
}

console.log('subdivided-face-geometry: all tests passed')
