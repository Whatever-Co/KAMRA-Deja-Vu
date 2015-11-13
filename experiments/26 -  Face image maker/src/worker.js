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

  // let tree = QuadTree(-1, -1, 2, 2)
  // tree.put({x: 0, y: 0, w: 0, h: 0, string: 'test'})
  // console.table(tree.get({x:0, y: 0, w: 0.01, h: 0.01}))

  //*
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
  // console.log(JSON.parse(tree.stringify()))
  console.log(tree.root)

  // tree.put({x: 0, y: 0, w: 0.001, h: 0.001, string: 'test'})
  // console.table(tree.get({x:-0.001, y: -0.001, w: 0.1, h: 0.1}))

  // console.log(tree.get({x: 0, y: 0, w: 0.1, h: 0.1}))
  //*/

  // console.table(tree.get({x: -0.25, y: -0.25, w: 0.5, h: 0.5}))
  // console.log(triangleIndices.length / 3)


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

  /*
  const getTriangleIndex_ = (p, vertices) => {
    for (let i = 0; i < triangleIndices.length; i += 3) {
      let uv = Delaunay.contains([vertices[triangleIndices[i]], vertices[triangleIndices[i + 1]], vertices[triangleIndices[i + 2]]], p)
      if (uv) {
        uv.unshift(1 - uv[0] - uv[1])
        return [i, uv]
      }
    }
  }
  */

  /**
  let p = [vertices[0][0], vertices[0][1]]
  console.table(p)
  {
    let [index, uvw] = getTriangleIndex(p, standardFacePoints)
    console.log(index, standardFacePoints[triangleIndices[index]], standardFacePoints[triangleIndices[index + 1]], standardFacePoints[triangleIndices[index + 2]], uvw)
  }
  {
    let [index, uvw] = getTriangleIndex_(p, standardFacePoints)
    console.log(index, standardFacePoints[triangleIndices[index]], standardFacePoints[triangleIndices[index + 1]], standardFacePoints[triangleIndices[index + 2]], uvw)
  }
  // return
  */

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

  // let loader = new self.THREE.XHRLoader()
  // loader.load('keyframes.json', (text) => {
  //   console.log('loaded', performance.now())
  //   let data = JSON.parse(text)
  //   console.log('parsed', performance.now())
  //   data.user.property.morph = convertData(data.user.property.face_vertices)
  //   console.log('done', performance.now())
  //   postMessage(data)
  // })
}
