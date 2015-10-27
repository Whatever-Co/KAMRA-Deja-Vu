/* global THREE */
import {vec2, vec3, mat3} from 'gl-matrix'


const toTypedArray = (type, array) => {
  let typed = new type(array.length)
  array.forEach((v, i) => typed[i] = v)
  return typed
}


export default class extends THREE.Mesh {

  constructor() {
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial())

    this.material.wireframe = true

    this.initGeometry()
  }


  initGeometry() {
    let data = require('json!./face.json')

    let position = toTypedArray(Float32Array, data.face.position)
    let index = new Uint16Array(data.face.index.length + data.rightEye.index.length + data.leftEye.index.length + data.mouth.index.length)
    data.face.index.forEach((i, j) => index[j] = i)
    let offset = data.face.index.length
    data.rightEye.index.forEach((i, j) => index[j + offset] = i)
    offset += data.rightEye.index.length
    data.leftEye.index.forEach((i, j) => index[j + offset] = i)
    offset += data.leftEye.index.length
    data.mouth.index.forEach((i, j) => index[j + offset] = i)

    this.geometry.dynamic = true
    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.setIndex(new THREE.BufferAttribute(index, 1))
  }

}
