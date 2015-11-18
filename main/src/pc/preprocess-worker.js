self.THREE = {}
importScripts('libs/three.min.js')

import Delaunay from 'delaunay-fast'
// http://zufallsgenerator.github.io/assets/code/2014-01-26/spatialhash/spatialhash.js
import {SpatialHash} from 'spatialhash'

import StandardFaceData from './standard-face-data'


const convertData = (vertices) => {
  let standardFace = new StandardFaceData()

  let standardFacePoints = []
  let position = standardFace.data.face.position
  for (let i = 0; i < position.length; i += 3) {
    standardFacePoints.push([position[i], position[i + 1]])
  }
  standardFacePoints.push([2, 2])
  standardFacePoints.push([2, -2])
  standardFacePoints.push([-2, -2])
  standardFacePoints.push([-2, 2])

  let triangleIndices = Delaunay.triangulate(standardFacePoints)

  let spatialHash = new SpatialHash(5)
  const scale = 1000
  for (let i = 0; i < triangleIndices.length; i += 3) {
    let v0 = standardFacePoints[triangleIndices[i]]
    let v1 = standardFacePoints[triangleIndices[i + 1]]
    let v2 = standardFacePoints[triangleIndices[i + 2]]
    let minX = Math.min(v0[0], v1[0], v2[0])
    let minY = Math.min(v0[1], v1[1], v2[1])
    let maxX = Math.max(v0[0], v1[0], v2[0])
    let maxY = Math.max(v0[1], v1[1], v2[1])
    spatialHash.insert({
      x: minX * scale,
      y: minY * scale,
      width: (maxX - minX) * scale,
      height: (maxY - minY) * scale,
      index: i,
      v0,
      v1,
      v2      
    })
  }

  let coord = [0, 0, 0]
  const contains = (v0, v1, v2, x, y) => {
    let a = v1[0] - v0[0]
    let b = v2[0] - v0[0]
    let c = v1[1] - v0[1]
    let d = v2[1] - v0[1]
    let i = a * d - b * c

    /* Degenerate tri. */
    if (i === 0.0) {
      return null
    }

    let u = (d * (x - v0[0]) - b * (y - v0[1])) / i
    let v = (a * (y - v0[1]) - c * (x - v0[0])) / i

    /* If we're outside the tri, fail. */
    if (u < 0.0 || v < 0.0 || (u + v) > 1.0) {
      return null
    }

    // return [1 - u - v, u, v]
    coord[0] = 1 - u - v
    coord[1] = u
    coord[2] = v
    return coord
  }

  let index
  const getTriangleIndex = (x, y) => {
    let candidate = spatialHash.retrieve({x: x * scale, y: y * scale, width: 0, height: 0})
    for (let i = 0; i < candidate.length; i++) {
      let node = candidate[i]
      let uv = contains(node.v0, node.v1, node.v2, x, y)
      if (uv) {
        index = node.index
        coord = uv
        return
      }
    }
    console.warn('Triangle not found at', x, y)
    index = 0
    coord = [0, 0, 0]
  }

  return vertices.map((vertices) => {
    if (!vertices) {
      return null
    }

    let weights = new Float32Array(vertices.length * 7)
    for (let i = 0, j = 0; i < vertices.length; i += 3, j += 7) {
      getTriangleIndex(vertices[i], vertices[i + 1])
      weights[j + 0] = triangleIndices[index + 0]
      weights[j + 1] = triangleIndices[index + 1]
      weights[j + 2] = triangleIndices[index + 2]
      weights[j + 3] = coord[0]
      weights[j + 4] = coord[1]
      weights[j + 5] = coord[2]
      weights[j + 6] = vertices[i + 2]
    }
    return weights
  })
}


onmessage = (event) => {
  // console.log('start', performance.now())
  let transferList = []
  let result = event.data.map((vertices) => {
    let v = convertData(vertices)
    v.forEach((a) => {
      if (a) {
        transferList.push(a.buffer)
      }
    })
    return v
  })
  // console.log('done', performance.now())
  postMessage(result, transferList)
}
