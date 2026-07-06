// minimal THREE stub for babel-node unit tests (imports are hoisted, so
// the stub must be installed by an import that precedes the module under test)
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
