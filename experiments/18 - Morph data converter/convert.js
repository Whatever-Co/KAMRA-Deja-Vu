global.THREE = require('three')

import fs from 'fs'
import path from 'path'

import {vec2, vec3, mat3} from 'gl-matrix'
import Delaunay from 'delaunay-fast'

import StandardFaceData from './standardfacedata'


const precision = (n, p = 3) => parseFloat(n.toPrecision(p))


class App {

  constructor() {
    console.log('start')
    let start = Date.now()

    let standardFace = new StandardFaceData()

    let standardFacePoints = []
    let position = standardFace.data.face.position
    for (let i = 0; i < position.length; i += 3) {
      standardFacePoints.push([position[i], position[i + 1]])
    }
    standardFacePoints.push([1, 1])
    standardFacePoints.push([1, -1])
    standardFacePoints.push([-1, -1])
    standardFacePoints.push([-1, 1])

    this.triangleIndices = Delaunay.triangulate(standardFacePoints)
    // console.log(JSON.stringify(this.triangleIndices))

    let keyframes = JSON.parse(fs.readFileSync('../../data/3 - JSON/keyframes.json', 'utf-8'))
    // console.log(keyframes)

    let morphWeights = keyframes.user.property.face_vertices.map((vertices) => {
      let weights = []
      for (let i = 0; i < vertices.length; i += 3) {
        let [index, coord] = this.getTriangleIndex([vertices[i], vertices[i + 1]], standardFacePoints)
        weights.push(this.triangleIndices[index + 0], this.triangleIndices[index + 1], this.triangleIndices[index + 2], precision(coord[0]), precision(coord[1]), precision(coord[2]), vertices[i + 2])
      }
      return weights
    })
    fs.writeFileSync('../17 - Deformable face geometry/public/morph.json', JSON.stringify(morphWeights))

    console.log(`done! (${Date.now() - start}ms)`)
  }


  getTriangleIndex(p, vertices) {
    for (let i = 0; i < this.triangleIndices.length; i += 3) {
      let uv = Delaunay.contains([vertices[this.triangleIndices[i]], vertices[this.triangleIndices[i + 1]], vertices[this.triangleIndices[i + 2]]], p)
      if (uv) {
        uv.unshift(1 - uv[0] - uv[1])
        return [i, uv]
      }
    }
  }

}


new App()
