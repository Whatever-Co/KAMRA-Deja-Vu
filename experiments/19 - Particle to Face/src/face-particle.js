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
    super(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      vertexShader: require('./shaders/face-particle.vert'),
      fragmentShader: require('./shaders/face-particle.frag'),
      uniforms: {
        time: {type: 'f', value: 0},
        size: {type: 'f', value: 100},
        scale: {type: 'f', value: scale},
        faceMatrix: {type: 'm4', value: face.matrixWorld},
        facePosition: {type: 't', value: null},
        faceTexture: {type: 't', value: null}
      }
    }))

    this.face = face

    let data = new Float32Array(32 * 32 * 3)
    this.dataTexture = new THREE.DataTexture(new Float32Array(32 * 32 * 3), 32, 32, THREE.RGBFormat, THREE.FloatType)
    this.material.uniforms.facePosition.value = this.dataTexture

    let amount = 10000
    let position = new Float32Array(amount * 3)
    let triangleIndices = new Float32Array(amount * 3)
    let weight = new Float32Array(amount * 3)
    let radius = 3000
    let randomFaceSelector = new RandomFaceSelector(this.face.geometry)
    let faceIndices = this.face.geometry.index.array
    for (let i = 0; i < position.length; i += 3) {
      let z = Math.random() * 2 - 1
      let th = Math.random() * Math.PI * 2
      let r = Math.sqrt(1 - z * z)
      let x = r * Math.cos(th)
      let y = r * Math.sin(th)
      position[i] = x * radius
      position[i + 1] = y * radius
      position[i + 2] = z * radius
      
      let faceIndex = randomFaceSelector.get()
      let j0 = faceIndices[faceIndex * 3]
      let j1 = faceIndices[faceIndex * 3 + 1]
      let j2 = faceIndices[faceIndex * 3 + 2]
      triangleIndices[i] = j0
      triangleIndices[i + 1] = j1
      triangleIndices[i + 2] = j2

      let a = Math.random()
      let b = Math.random()
      if ((a + b) > 1) {
        a = 1 - a
        b = 1 - b
      }
      let c = 1 - a - b
      weight[i] = a
      weight[i + 1] = b
      weight[i + 2] = c
    }

    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.addAttribute('triangleIndices', new THREE.BufferAttribute(triangleIndices, 3))
    this.geometry.addAttribute('weight', new THREE.BufferAttribute(weight, 3))

    this._gui = new dat.GUI()
    this._guiTime = this._gui.add(this.material.uniforms.time, 'value', 0, 1).setValue(0).name('Time')
    this._guiSize = this._gui.add(this.material.uniforms.size, 'value', 1, 100).name('Size')
    this._gui.add(this, 'start').name('Start')
  }


  start() {
    let p = {t: 0, s: 100}
    new TWEEN.Tween(p).to({t: 1, s: 5}, 5000).easing(TWEEN.Easing.Cubic.Out).onUpdate(() => {
      this._guiTime.setValue(p.t)
      this._guiSize.setValue(p.s)
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
