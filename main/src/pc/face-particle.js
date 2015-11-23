/* global THREE */

import {vec3} from 'gl-matrix'

import Config from './config'


class RandomFaceSelector {

  constructor(geometry) {
    this._v1 = vec3.create()
    this._v2 = vec3.create()

    let indices = geometry.index
    let position = geometry.getAttribute('position').array
    this.totalArea = 0
    this.cumulativeAreas = []

    for (let i = 0; i < indices.count; i += 3) {
      let j = indices.array[i] * 3
      let p0 = [position[j], position[j + 1], position[j + 2]]
      j = indices.array[i + 1] * 3
      let p1 = [position[j], position[j + 1], position[j + 2]]
      j = indices.array[i + 2] * 3
      let p2 = [position[j], position[j + 1], position[j + 2]]
      let area = this.triangleArea(p0, p1, p2)
      this.totalArea += area
      this.cumulativeAreas.push(this.totalArea)
    }
  }


  triangleArea(a, b, c) {
    vec3.sub(this._v1, b, a)
    vec3.sub(this._v2, c, a)
    vec3.cross(this._v1, this._v1, this._v2)
    return 0.5 * vec3.len(this._v1)
  }


  get() {
    let r = Math.random() * this.totalArea
    return this.binarySearch(r, 0, this.cumulativeAreas.length - 1)
  }


  binarySearch(value, start, end) {
    if (end < start) {
      return start
    }
    let mid = start + Math.floor((end - start) / 2)
    if (this.cumulativeAreas[mid] > value) {
      return this.binarySearch(value, start, mid - 1)
    } else if (this.cumulativeAreas[ mid ] < value) {
      return this.binarySearch(value, mid + 1, end)
    } else {
      return mid
    }
  }

}


export default class FaceParticle extends THREE.Points {

  constructor(scale, face, sprite, lut) {
    const DATA_WIDTH = 32
    const DATA_HEIGHT = 32

    super(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      vertexShader: require('./shaders/face-particle.vert'),
      fragmentShader: require('./shaders/face-particle.frag'),
      uniforms: {
        time: {type: 'f', value: 0},
        scale: {type: 'f', value: scale},
        faceMatrix: {type: 'm4', value: face.matrixWorld},
        facePosition: {type: 't', value: null},
        faceTexture: {type: 't', value: null},
        faceSprite: {type: 't', value: sprite},
        faceLUT: {type: 't', value: lut}
      },
      defines: {
        DATA_WIDTH: DATA_WIDTH.toFixed(1),
        DATA_HEIGHT: DATA_HEIGHT.toFixed(1)
      },
      transparent: true,
      depthTest: false,
    }))

    this.face = face
    this.face.updateMatrix()

    this.dataTexture = new THREE.DataTexture(new Float32Array(DATA_WIDTH * DATA_HEIGHT * 3), DATA_WIDTH, DATA_HEIGHT, THREE.RGBFormat, THREE.FloatType)
    this.material.uniforms.facePosition.value = this.dataTexture

    console.time('mosaic init')
    let amount = 20000
    let position = new Float32Array(amount * 3)
    let triangleIndices = new Float32Array(amount * 3)
    let weight = new Float32Array(amount * 3)
    let startZ = new Float32Array(amount)
    let delay = new Float32Array(amount)

    let randomFaceSelector = new RandomFaceSelector(this.face.geometry)
    let vertexIndices = this.face.geometry.index.array
    let vertexDelay = Config.DATA.mosaic_face.face_weight

    for (let i = 0; i < amount; i++) {
      let ii = i * 3
      let faceIndex = randomFaceSelector.get()
      let i0 = triangleIndices[ii + 0] = vertexIndices[faceIndex * 3 + 0]
      let i1 = triangleIndices[ii + 1] = vertexIndices[faceIndex * 3 + 1]
      let i2 = triangleIndices[ii + 2] = vertexIndices[faceIndex * 3 + 2]

      let a = Math.random()
      let b = Math.random()
      if (a + b > 1) {
        a = 1 - a
        b = 1 - b
      }
      let c = 1 - a - b
      weight[ii + 0] = a
      weight[ii + 1] = b
      weight[ii + 2] = c

      // startZ[i] = THREE.Math.randFloat(2000, -Config.DATA.mosaic_face.random_z_max)
      startZ[i] = THREE.Math.mapLinear(i, 0, amount, 2000, -Config.DATA.mosaic_face.random_z_max)
      delay[i] = 1 - (vertexDelay[i0] * a + vertexDelay[i1] * b + vertexDelay[i2] * c)
    }
    console.timeEnd('mosaic init')

    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3)) // start position
    this.geometry.addAttribute('triangleIndices', new THREE.BufferAttribute(triangleIndices, 3))
    this.geometry.addAttribute('weight', new THREE.BufferAttribute(weight, 3))
    this.geometry.addAttribute('startZ', new THREE.BufferAttribute(startZ, 1))
    this.geometry.addAttribute('delay', new THREE.BufferAttribute(delay, 1))
  }


  update(t) {
    this.material.uniforms.time.value = t
  }


  updateData() {
    if (!this.material.uniforms.faceTexture.value) {
      this.material.uniforms.faceTexture.value = this.face.material.map
    }

    let data = this.dataTexture.image.data
    data.set(this.face.geometry.positionAttribute.array)

    let uv = this.face.geometry.uvAttribute
    for (let i = 0; i < uv.count; i++) {
      let j = data.length * 0.5 + i * 3
      data[j] = uv.array[i * 2]
      data[j + 1] = uv.array[i * 2 + 1]
    }
    this.dataTexture.needsUpdate = true
  }

}
