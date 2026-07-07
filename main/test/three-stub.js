// minimal THREE stub for babel-node unit tests (imports are hoisted, so
// the stub must be installed by an import that precedes the module under test).
// Rich enough that the real DeformableFaceGeometry / StandardFaceData can
// construct under it (Uint16Attribute / Float32Attribute / clone are used
// by standard-face-data.js).
class BufferAttribute {
  constructor(array, itemSize) {
    this.array = array
    this.itemSize = itemSize
    this.needsUpdate = false
  }
  get count() { return this.array.length / this.itemSize }
  clone() { return new BufferAttribute(this.array.slice(0), this.itemSize) }
  copy(src) { this.array.set(src.array); return this }
}

global.THREE = {
  BufferGeometry: class {
    constructor() { this.attributes = {} }
    setIndex(v) { this.indexAttr = v }
    addAttribute(name, attr) { this.attributes[name] = attr }
  },
  BufferAttribute: BufferAttribute,
  Uint16Attribute: function (array, itemSize) {
    return new BufferAttribute(new Uint16Array(array), itemSize)
  },
  Float32Attribute: function (array, itemSize) {
    return new BufferAttribute(new Float32Array(array), itemSize)
  },
}
