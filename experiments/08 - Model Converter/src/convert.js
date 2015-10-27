'use strict'

let fs = require('fs')
let path = require('path')
// let THREE = require('three')
let glm = require('gl-matrix')


class Node {

  constructor(index, position) {
    this.index = index
    this.position = position
    this.connection = []
    this.distanceToFP = []
    this.weights = []
  }

}


let raw = fs.readFileSync(path.join(__dirname, '/data/face.obj'), 'utf-8')
let vertices = []
let indices = []
raw.split(/\n|\r/).forEach((line) => {
  let tokens = line.split(' ')
  switch (tokens[0]) {
    case 'v':
      vertices.push(new Node(vertices.length, [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])]))
      break
    case 'f':
      indices.push(parseInt(tokens[1]) - 1, parseInt(tokens[2]) - 1, parseInt(tokens[3]) - 1)
      break
  }
})


{
  let connected = {}
  let connect = (a, b) => {
    let key = a << 16 | b
    if (connected[key]) return
    vertices[a].connection.push(vertices[b])
    connected[key] = true
    vertices[b].connection.push(vertices[a])
    connected[b << 16 | a] = true
  }
  for (let i = 0; i < indices.length; i += 3) {
    connect(indices[i], indices[i + 1])
  }
}


let featurePoint = JSON.parse(fs.readFileSync(path.join(__dirname, '/data/fp.json'))).splice(0, 1).map((v) => {
  let distance = Number.MAX_VALUE
  let index = 0
  vertices.forEach((v2, i) => {
    let d = glm.vec3.distance(v, v2.position)
    if (d < distance) {
      distance = d
      index = i
    }
  })
  v.vertexIndex = index
  return v
})

console.log(featurePoint)


featurePoint.forEach((fp, index) => {
  vertices.forEach((node) => node.distanceToFP[index] = Number.MAX_VALUE)
  let start = vertices[fp.vertexIndex]
  start.distanceToFP[index] = 0
  let processing = [start]
  while (processing.length) {
    let next = []
    processing.forEach((node) => {
      node.connection.forEach((connected) => {
        let distance = node.distanceToFP[index] + glm.vec3.distance(node.position, connected.position)
        if (distance < connected.distanceToFP[index]) {
          connected.distanceToFP[index] = distance
          next.push(connected)
        }
      })
    })
    processing = next
  }
})

console.log(vertices[0])
