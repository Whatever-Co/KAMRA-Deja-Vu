/* global THREE */

import _ from 'lodash'
import {vec2, vec3} from 'gl-matrix'

let original = null

export default class StandardFaceData {

  constructor() {
    if (original == null) {
      this.init()
    }
    
    this.data = original.data // shared with all instances

    this.index = original.indexAttribute.clone()
    this.position = original.positionAttribute.clone()

    this.bounds = _.clone(original.bounds)
    this.size = _.clone(original.size)
  }


  init() {
    let data = require('./data/face2.json')
    console.log(data)

    let index = data.face.index.concat(data.rightEye.index, data.leftEye.index)
    let indexAttribute = new THREE.Uint16Attribute(index, 1)
    let positionAttribute = new THREE.Float32Attribute(data.face.position, 3)

    let min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
    let position = data.face.position
    let n = position.length
    for (let i = 0; i < n; i += 3) {
      let p = [position[i], position[i + 1], position[i + 2]]
      vec3.min(min, min, p)
      vec3.max(max, max, p)
    }
    let bounds = {min, max, size: vec3.sub([], max, min), center: vec3.lerp([], min, max, 0.5)}
    let size = vec2.len(bounds.size)

    original = {data, indexAttribute, positionAttribute, bounds, size}

    data.back.edgeIndex = _.uniq(data.back.index).map((index) => {
      let v = this.getVertex(index)
      v.push(Math.atan2(v[1], v[0]), index)
      return v
    }).sort((a, b) => a[3] - b[3]).map((v) => v[4])
  }


  getFeatureVertex(index) {
    let i = original.data.face.featurePoint[index] * 3
    let p = original.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }


  getVertex(index) {
    let i = index * 3
    let p = original.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }
 
}
