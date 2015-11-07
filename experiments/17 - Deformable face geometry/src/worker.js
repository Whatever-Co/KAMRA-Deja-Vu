self.THREE = {}
importScripts('libs/three.js')

import Delaunay from 'delaunay-fast'

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

  const getTriangleIndex = (p, vertices) => {
    for (let i = 0; i < triangleIndices.length; i += 3) {
      let uv = Delaunay.contains([vertices[triangleIndices[i]], vertices[triangleIndices[i + 1]], vertices[triangleIndices[i + 2]]], p)
      if (uv) {
        uv.unshift(1 - uv[0] - uv[1])
        return [i, uv]
      }
    }
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
