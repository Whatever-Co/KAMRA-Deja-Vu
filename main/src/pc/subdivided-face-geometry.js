/* global THREE */

import DeformableFaceGeometry from './deformable-face-geometry'
import {buildLoopOperator, applyOperator} from './subdivision-operator'

// operators are shared across instances. Every cage clones StandardFaceData's
// one topology, so index CONTENT repeats across instances while the array
// objects differ — a cheap content checksum in the key keeps sharing intact
// and makes a collision between genuinely different topologies impossible
// in practice (length AND vertexCount AND checksum would all have to match).
let operatorCache = new Map()

function indexChecksum(indexArray) {
  let sum = 0
  for (let i = 0; i < indexArray.length; i++) {
    sum = (sum * 31 + indexArray[i]) | 0
  }
  return sum
}

function getOperator(indexArray, vertexCount, levels) {
  let key = indexArray.length + '/' + vertexCount + '/' + levels + '/' + indexChecksum(indexArray)
  let op = operatorCache.get(key)
  if (!op) {
    op = buildLoopOperator(Array.from(indexArray), vertexCount, levels)
    operatorCache.set(key, op)
  }
  return op
}

// Renders the deformable face through a Loop-subdivided derived mesh.
// The cage (DeformableFaceGeometry) keeps its 2015 topology so feature
// point weights and keyframes.bin morph data stay valid; this geometry
// only re-derives its render attributes from the cage after every
// cage mutation.
export default class SubdividedFaceGeometry extends THREE.BufferGeometry {

  // wrap() takes an existing cage: used by clone(), face-library, and unit tests
  static wrap(cage, levels) {
    return new SubdividedFaceGeometry(null, null, null, null, {cage: cage, levels: levels})
  }

  constructor(featurePoint2D, image, planeHeight, cameraZ, _internal) {
    super()
    // callers may pass extra positional args (the historical face-library
    // call passed a 5th arg that DeformableFaceGeometry ignored) — only
    // treat _internal as the wrap marker when it carries a cage
    if (_internal && _internal.cage) {
      this.cage = _internal.cage
      this.levels = _internal.levels || SubdividedFaceGeometry.defaultLevels
    } else {
      this.cage = new DeformableFaceGeometry(featurePoint2D, image, planeHeight, cameraZ)
      this.levels = SubdividedFaceGeometry.defaultLevels
    }
    this._appliedMorph = null
    this.passThrough = false
    try {
      this._rebuildOperator(this.cage.standardFace.index.array)
      this._allocateDerived()
      this._deriveAll()
    } catch (e) {
      // degrade to cage resolution rather than losing the face mid-show,
      // but loudly and distinguishably (see this.passThrough)
      console.error('SubdividedFaceGeometry: operator build failed, falling back to cage resolution.',
        'verts=' + (this.cage.positionAttribute.array.length / 3),
        'index=' + this.cage.standardFace.index.array.length,
        'levels=' + this.levels, e)
      this._passThrough()
    }
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

  _passThrough(indexArray) {
    this.operator = null
    this.passThrough = true
    this.setIndex(new THREE.BufferAttribute(new Uint16Array(indexArray || this.cage.standardFace.index.array), 1))
    this.addAttribute('position', this.cage.positionAttribute)
    this.addAttribute('uv', this.cage.uvAttribute)
    if (this.cage.standardFace.uv) {
      this.addAttribute('uv2', this.cage.standardFace.uv)
    }
  }

  _derivePositions() {
    if (!this.operator) {
      return
    }
    applyOperator(this.operator.rows, this.cage.positionAttribute.array, 3, this.attributes.position.array)
    this.attributes.position.needsUpdate = true
  }

  _deriveUVs() {
    if (!this.operator) {
      return
    }
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

  // --- delegated DeformableFaceGeometry API ---

  init(featurePoint2D, imageWidth, imageHeight, planeHeight, cameraZ) {
    this.cage.init(featurePoint2D, imageWidth, imageHeight, planeHeight, cameraZ)
    this._appliedMorph = null
    this._deriveAll()
  }

  deform(featurePoints) {
    this.cage.deform(featurePoints)
    this._appliedMorph = null
    this._derivePositions()
  }

  applyMorph(weights) {
    // the keyframe player clamps to the last frame and re-applies the
    // same weights array every tick (the outro runs this on an invisible
    // main face while live tracking eats the frame budget) — skip
    // repeats so the derive cost is only paid when the morph changes.
    // NOTE: assumes callers never mutate a weights array in place
    // (keyframe data uses a distinct array per frame).
    if (this._appliedMorph === weights) {
      return
    }
    this._appliedMorph = weights
    this.cage.applyMorph(weights)
    // UV changes never come through applyMorph — consumers that poke
    // cage uvAttribute directly call refreshUVs() explicitly
    this._derivePositions()
  }

  fillMouth() {
    this.cage.fillMouth()
    this._appliedMorph = null
    if (this.operator) {
      this._rebuildOperator(this.cage.standardFace.mouthIncludedIndex.array)
      this._allocateDerived()
      this._deriveAll()
    } else {
      // pass-through mode must follow the topology switch too
      this._passThrough(this.cage.standardFace.mouthIncludedIndex.array)
    }
  }

  // for consumers that write cage.uvAttribute directly (face-controller's
  // smalls UV swap at capture and restore) — makes the "derived UVs follow
  // the cage" contract explicit instead of relying on the next applyMorph
  refreshUVs() {
    this._deriveUVs()
  }

  copy(geometry) {
    // accepts another facade or a bare DeformableFaceGeometry
    this.cage.copy(geometry.cage || geometry)
    this._appliedMorph = null
    this._deriveAll()
    return this
  }

  clone() {
    return SubdividedFaceGeometry.wrap(this.cage.clone(), this.levels)
  }

  // --- cage-sized attribute access for existing consumers
  //     (mouth mesh, smalls UV copy, face-particle, particled-logo,
  //      face-blender) ---

  get positionAttribute() { return this.cage.positionAttribute }
  get uvAttribute() { return this.cage.uvAttribute }
  get normalizedFeaturePoints() { return this.cage.normalizedFeaturePoints }
  get matrixFeaturePoints() { return this.cage.matrixFeaturePoints }
  get neutralPosition() { return this.cage.neutralPosition }
  get standardFace() { return this.cage.standardFace }

}

SubdividedFaceGeometry.defaultLevels = 2
