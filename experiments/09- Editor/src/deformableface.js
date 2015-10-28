/* global THREE */
import {vec2, vec3} from 'gl-matrix'


const toTypedArray = (type, array) => {
  let typed = new type(array.length)
  array.forEach((v, i) => typed[i] = v)
  return typed
}


export default class extends THREE.Mesh {

  constructor() {
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({map: new THREE.Texture()}))

    // this.material.wireframe = true

    this.initGeometry()
  }


  initGeometry() {
    this.data = require('json!./face.json')
    console.log(this.data)

    let position = toTypedArray(Float32Array, this.data.face.position)
    // {
    //   let min = [0, 0]
    //   let max = [0, 0]
    //   for (let i = 0; i < position.length; i += 3) {
    //     vec2.min(min, min, [position[i], position[i + 1]])
    //     vec2.max(max, max, [position[i], position[i + 1]])
    //   }
    //   console.log(min, max)
    // }

    let index = new Uint16Array(this.data.face.index.length + this.data.rightEye.index.length + this.data.leftEye.index.length + this.data.mouth.index.length)
    this.data.face.index.forEach((i, j) => index[j] = i)
    let offset = this.data.face.index.length
    this.data.rightEye.index.forEach((i, j) => index[j + offset] = i)
    offset += this.data.rightEye.index.length
    this.data.leftEye.index.forEach((i, j) => index[j + offset] = i)
    offset += this.data.leftEye.index.length
    this.data.mouth.index.forEach((i, j) => index[j + offset] = i)

    let uv = new Float32Array(this.data.face.position.length / 3 * 2)

    this.geometry.dynamic = true
    this.geometry.setIndex(new THREE.BufferAttribute(index, 1))
    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2))
  }


  applyTexture(texture, coords) {
    let displacement = coords.map((c, i) => {
      let fp = this.getPosition(this.data.face.featurePoint[i])
      return vec2.sub([], c, fp)
    })

    let n = this.data.face.position.length / 3
    let attribute = this.geometry.getAttribute('uv')
    for (let i = 0; i < n; i++) {
      let p = vec2.create()
      let b = 0
      this.data.face.weight[i].forEach((w) => {
        vec2.add(p, p, vec2.scale([], displacement[w[0]], w[1]))
        b += w[1]
      })
      vec2.scale(p, p, 1 / b)
      vec2.add(p, p, this.getPosition(i))
      attribute.array[i * 2 + 0] = p[0]
      attribute.array[i * 2 + 1] = p[1]
    }
    attribute.needsUpdate = true

    let map = new THREE.Texture(texture)
    map.needsUpdate = true
    this.material.map = map

    displacement = coords.map((c, i) => {
      let fp = this.getPosition(this.data.face.featurePoint[i])
      let scale = (500 - fp[2] * 200) / 500
      let p = vec3.clone(fp)
      p[0] = (c[0] - 0.5) * scale
      p[1] = (c[1] - 0.5) * scale
      return vec3.sub(p, p, fp)
    })
    attribute = this.geometry.getAttribute('position')
    for (let i = 0; i < n; i++) {
      let p = vec3.create()
      let b = 0
      this.data.face.weight[i].forEach((w) => {
        vec3.add(p, p, vec3.scale(vec3.create(), displacement[w[0]], w[1]))
        b += w[1]
      })
      vec3.scale(p, p, 1 / b)
      vec3.add(p, p, this.getPosition(i))
      attribute.array[i * 3 + 0] = p[0]
      attribute.array[i * 3 + 1] = p[1]
      attribute.array[i * 3 + 2] = p[2]
    }
    attribute.needsUpdate = true
  }


  getPosition(index) {
    let i = index * 3
    let p = this.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }


  getFPCoord(index) {
    let i = this.data.face.featurePoint[index] * 3
    let p = this.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }

}
