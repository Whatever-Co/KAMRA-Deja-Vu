self.THREE = {}
importScripts('libs/three.js')

import Delaunay from 'delaunay-fast'
import QuadTree from 'simple-quadtree'

import StandardFaceData from './standardfacedata'


const convertData = (vertices) => {
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

  let triangleIndices = Delaunay.triangulate(standardFacePoints)

  let tree = QuadTree(-1, -1, 2, 2)
  for (let i = 0; i < triangleIndices.length; i += 3) {
    let v0 = standardFacePoints[triangleIndices[i]]
    let v1 = standardFacePoints[triangleIndices[i + 1]]
    let v2 = standardFacePoints[triangleIndices[i + 2]]
    let minX = Math.min(v0[0], v1[0], v2[0])
    let minY = Math.min(v0[1], v1[1], v2[1])
    let maxX = Math.max(v0[0], v1[0], v2[0])
    let maxY = Math.max(v0[1], v1[1], v2[1])
    tree.put({
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      index: i,
      v0,
      v1,
      v2      
    })
  }

  const getTriangleIndex = (p) => {
    let candidate = tree.get({x: p[0], y: p[1], w: 0, h: 0})
    for (let i = 0; i < candidate.length; i++) {
      let node = candidate[i]
      let uv = Delaunay.contains([node.v0, node.v1, node.v2], p)
      if (uv) {
        uv.unshift(1 - uv[0] - uv[1])
        return [node.index, uv]
      }
    }
    console.error('not found')
  }

  return vertices.map((vertices) => {
    let weights = []
    for (let i = 0; i < vertices.length; i += 3) {
      let [index, coord] = getTriangleIndex([vertices[i], vertices[i + 1]], standardFacePoints)
      weights.push(triangleIndices[index + 0], triangleIndices[index + 1], triangleIndices[index + 2], coord[0], coord[1], coord[2], vertices[i + 2])
    }
    return new Float32Array(weights)
  })
}


onmessage = (event) => {
  console.log('start', performance.now())
  let result = convertData(event.data)
  console.log('done', performance.now())
  postMessage(result, result.map((a) => a.buffer))
}
