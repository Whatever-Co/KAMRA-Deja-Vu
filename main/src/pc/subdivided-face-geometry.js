/* global THREE */

import DeformableFaceGeometry from './deformable-face-geometry'
import {buildLoopOperator, applyOperator} from './subdivision-operator'

// operators are shared across instances: cache by topology + levels
let operatorCache = new Map()

function getOperator(indexArray, vertexCount, levels) {
  let key = indexArray.length + '/' + vertexCount + '/' + levels
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

  // wrap() takes an existing cage: used by clone() and unit tests
  static wrap(cage, levels) {
    return new SubdividedFaceGeometry(null, null, null, null, {cage: cage, levels: levels})
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
      this._allocateDerived()
      this._deriveAll()
    } catch (e) {
      console.warn('SubdividedFaceGeometry: operator build failed, pass-through', e)
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

  _passThrough() {
    this.operator = null
    this.setIndex(new THREE.BufferAttribute(new Uint16Array(this.cage.standardFace.index.array), 1))
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

  copy(geometry) {
    // accepts another facade or a bare DeformableFaceGeometry
    this.cage.copy(geometry.cage || geometry)
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
