/* global THREE */

import {vec3} from 'gl-matrix'
import TWEEN from 'tween.js'
import dat from 'dat-gui'

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

  constructor(scale, face) {
    const DATA_WIDTH = 32
    const DATA_HEIGHT = 32

    super(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      vertexShader: require('./shaders/face-particle.vert'),
      fragmentShader: require('./shaders/face-particle.frag'),
      uniforms: {
        time: {type: 'f', value: 0},
        // size: {type: 'f', value: 0},
        scale: {type: 'f', value: scale},
        faceMatrix: {type: 'm4', value: face.matrixWorld},
        facePosition: {type: 't', value: null},
        faceTexture: {type: 't', value: null}
      },
      defines: {
        DATA_WIDTH: DATA_WIDTH.toFixed(1),
        DATA_HEIGHT: DATA_HEIGHT.toFixed(1)
      }
    }))

    this.face = face

    this.dataTexture = new THREE.DataTexture(new Float32Array(DATA_WIDTH * DATA_HEIGHT * 3), DATA_WIDTH, DATA_HEIGHT, THREE.RGBFormat, THREE.FloatType)
    this.material.uniforms.facePosition.value = this.dataTexture

    let fp = this.face.geometry.positionAttribute.array
    let getPosition = (index) => {
      let i = index * 3
      return new THREE.Vector3(fp[i], fp[i + 1], fp[i + 2]).applyMatrix4(face.matrixWorld)
    }

    let zero = new THREE.Vector3(0, 0, -0.5).applyMatrix4(face.matrixWorld)

    let amount = 10000
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

      let p = getPosition(j0).multiplyScalar(a)
      p.add(getPosition(j1).multiplyScalar(b))
      p.add(getPosition(j2).multiplyScalar(c))
      p.sub(zero)
      if (Math.random() < 0.5) {
        p.z *= -1
      }
      let r = 1000 + Math.random() * 2000
      p.setLength(r).add(zero)
      position[i] = p.x
      position[i + 1] = p.y
      position[i + 2] = p.z

      delay[i / 3] = Math.random() * 3
    }

    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.addAttribute('triangleIndices', new THREE.BufferAttribute(triangleIndices, 3))
    this.geometry.addAttribute('weight', new THREE.BufferAttribute(weight, 3))
    this.geometry.addAttribute('delay', new THREE.BufferAttribute(delay, 1))

    this._gui = new dat.GUI()
    this._guiTime = this._gui.add(this.material.uniforms.time, 'value', 0, 30).setValue(0).name('Time')
    this._guiSize = this._gui.add(this.material.uniforms.size, 'value', 0, 100).name('Size')
    this._gui.add(this, 'start').name('Start')
  }


  start() {
    let p = {t: 0}
    new TWEEN.Tween(p).to({t: 30}, 30000).onUpdate(() => {
      this._guiTime.setValue(p.t)
    }).start()
  }


  update() {
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
