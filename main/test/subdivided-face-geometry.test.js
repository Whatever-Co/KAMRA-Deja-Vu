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

console.log('subdivided-face-geometry: all tests passed')
