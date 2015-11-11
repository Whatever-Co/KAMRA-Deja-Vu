/* global THREE */

import {vec2, vec3} from 'gl-matrix'


export default class StandardFaceData {

  constructor() {
    this.data = require('./data/face2.json')
    console.log(this.data)

    let index = this.data.face.index.concat(this.data.rightEye.index, this.data.leftEye.index)
    this.index = new THREE.Uint16Attribute(index, 1)
    this.position = new THREE.Float32Attribute(this.data.face.position, 3)
    console.log(this.position)

    this.bounds = this.getBounds()
    this.size = vec2.len(this.bounds.size)
  }


  getBounds() {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
    let position = this.data.face.position
    let n = position.length
    for (let i = 0; i < n; i += 3) {
      let p = [position[i], position[i + 1], position[i + 2]]
      vec3.min(min, min, p)
      vec3.max(max, max, p)
    }
    return {min, max, size: vec3.sub([], max, min), center: vec3.lerp([], min, max, 0.5)}
  }


  getFeatureVertex(index) {
    let i = this.data.face.featurePoint[index] * 3
    let p = this.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }


  getVertex(index) {
    let i = index * 3
    let p = this.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }
 
}
