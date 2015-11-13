/* global THREE */

import {vec3} from 'gl-matrix'


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
      transparent: true
    }))

    this.face = face
    this.face.updateMatrix()

    this.dataTexture = new THREE.DataTexture(new Float32Array(DATA_WIDTH * DATA_HEIGHT * 3), DATA_WIDTH, DATA_HEIGHT, THREE.RGBFormat, THREE.FloatType)
    this.material.uniforms.facePosition.value = this.dataTexture

    let config = require('./data/config.json')

    let amount = 20000
    let position = new Float32Array(amount * 3)
    let triangleIndices = new Float32Array(amount * 3)
    let weight = new Float32Array(amount * 3)
    let delay = new Float32Array(amount)
    let randomFaceSelector = new RandomFaceSelector(this.face.geometry)
    let faceIndices = this.face.geometry.index.array
    for (let i = 0; i < position.length; i += 3) {
      let faceIndex = randomFaceSelector.get()
      let j0 = faceIndices[faceIndex * 3]
      let j1 = faceIndices[faceIndex * 3 + 1]
      let j2 = faceIndices[faceIndex * 3 + 2]
      triangleIndices[i] = j0
      triangleIndices[i + 1] = j1
      triangleIndices[i + 2] = j2

      let a = Math.random()
      let b = Math.random()
      if (a + b > 1) {
        a = 1 - a
        b = 1 - b
      }
      let c = 1 - a - b
      weight[i] = a
      weight[i + 1] = b
      weight[i + 2] = c

      position[i + 0] = THREE.Math.randFloat(config.mosaic_face.random_x_min, config.mosaic_face.random_x_max)
      position[i + 1] = THREE.Math.randFloat(config.mosaic_face.random_y_min, config.mosaic_face.random_y_max)
      position[i + 2] = -THREE.Math.randFloat(config.mosaic_face.random_z_min, config.mosaic_face.random_z_max)

      delay[i / 3] = Math.random() * 3
    }

    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.addAttribute('triangleIndices', new THREE.BufferAttribute(triangleIndices, 3))
    this.geometry.addAttribute('weight', new THREE.BufferAttribute(weight, 3))
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
