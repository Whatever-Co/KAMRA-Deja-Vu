/* global THREE */
import 'OBJLoader'


class Node {

  constructor(index, position) {
    this.index = index
    this.position = position
    this.connection = []
    this.distanceToFP = []
    this.weights = []
  }

  nearestFeaturePointIndex() {
    let index = 0
    let distance = this.distanceToFP[0]
    this.distanceToFP.forEach((d, i) => {
      if (d < distance) {
        distance = d
        index = i
      }
    })
    return index
  }

}


export default class extends THREE.Mesh {

  constructor(tracker) {
    let geometry = new THREE.JSONLoader().parse(require('./data/face.json')).geometry
    let material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.3})
    /*let material = new THREE.ShaderMaterial({
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }
      `,
      fragmentShader: `
        void main() {
          if (gl_FrontFacing) {
            gl_FragColor = vec4(1.000, 0.358, 0.529, 1.000);
          } else {
            gl_FragColor = vec4(0.216, 0.478, 0.741, 1.000);
          }
        }
      `,
      wireframe: true,
    })*/
    super(geometry, material)

    this.tracker = tracker

    this.initFeaturePoints()
    this.initEyeMouth()
    this.initBack()
    // this.deformVertices()
  }


  initFeaturePoints() {
    this.featurePointIndices = require('./data/fp.json').map((pa, i) => {
      const p = new THREE.Vector3(pa[0], pa[1], pa[2])
      return i == 41 || p.length() > 0 ? this.findNearestIndex(this.geometry.vertices, p) : -1
    })

    this.buildConnectionData(this.geometry)

    this.featurePointIndices.forEach((index, i) => {
      this.nodes.forEach((node) => node.distanceToFP[i] = Number.MAX_VALUE)
      if (index >= 0) {
        this.calcDistanceToFeaturePoint(i)
      }
    })

    this.nodes.forEach(this.calcWeightForNode.bind(this))
    // console.table(this.nodes)

    let cube = new THREE.BoxGeometry(0.01, 0.01, 0.01)
    this.featurePoints = this.featurePointIndices.map((i) => {
      if (i < 0) return
      let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.7, depthTest: false})
      // material.color.setHSL(Math.random(), 0.7, 0.5);
      let mesh = new THREE.Mesh(cube, material)
      // mesh.visible = false
      mesh.vertexIndex = i
      mesh.position.copy(this.geometry.vertices[i])
      this.add(mesh)
      return mesh
    })

    let v1 = this.featurePoints[14].position.clone()
    let v0 = this.featurePoints[0].position.clone()
    let center = new THREE.Vector3().lerpVectors(v1, v0, 0.5)
    let scale = v1.clone().sub(center).x
    for (let i = 71; i < this.featurePoints.length; i++) {
      let fp = this.featurePoints[i]
      let ip = fp.position.clone().sub(center)
      ip.multiplyScalar(1 / scale)
      fp.initialPosition = ip
    }
  }


  findNearestIndex(vertices, target) {
    let distance = Number.MAX_VALUE
    let index = 0
    vertices.forEach((v, i) => {
      let d = v.distanceToSquared(target)
      if (d < distance) {
        distance = d
        index = i
      }
    })
    return index
  }


  buildConnectionData(geometry) {
    this.nodes = geometry.vertices.map((v, i) => new Node(i, v.clone()))

    let connected = {}
    let connect = (a, b) => {
      let key = a << 16 | b
      if (connected[key]) return
      this.nodes[a].connection.push(this.nodes[b])
      connected[key] = true
      this.nodes[b].connection.push(this.nodes[a])
      connected[b << 16 | a] = true
    }
    geometry.faces.forEach((f) => {
      connect(f.a, f.b)
      connect(f.b, f.c)
      connect(f.c, f.a)
    })
  }


  calcDistanceToFeaturePoint(index) {
    // this.nodes.forEach((node) => node.distanceToFP[index] = Number.MAX_VALUE)
    let start = this.nodes[this.featurePointIndices[index]]
    start.distanceToFP[index] = 0
    let processing = [start]
    while (processing.length) {
      let next = []
      processing.forEach((node) => {
        node.connection.forEach((connected) => {
          let distance = node.distanceToFP[index] + node.position.distanceTo(connected.position)
          if (distance < connected.distanceToFP[index]) {
            connected.distanceToFP[index] = distance
            next.push(connected)
          }
        })
      })
      processing = next
    }
  }


  calcWeightForNode(node) {
    let nearest = node.nearestFeaturePointIndex()
    let fp1 = this.nodes[this.featurePointIndices[nearest]]
    let p = node.position.clone().sub(fp1.position)
    let angles = this.featurePointIndices.map((index, i) => {
      if (index < 0) return NaN
      let node = this.nodes[index].position.clone().sub(fp1.position)
      let angle = p.angleTo(node)
      return {index: i, angle}
    }).filter((a) => {
      return !isNaN(a.angle) && a.angle < Math.PI / 2
    }).sort((a, b) => a.angle - b.angle)

    let d = 0
    switch (angles.length) {
      case 0:
        break
      case 1:
        d = fp1.distanceToFP[angles[0].index] / Math.cos(angles[0].angle)
        break
      default:
        let d2 = fp1.distanceToFP[angles[0].index]
        let d3 = fp1.distanceToFP[angles[1].index]
        let cos2 = Math.cos(angles[0].angle)
        let cos3 = Math.cos(angles[1].angle)
        d = (d2 * cos2 + d3 * cos3) / (cos2 + cos3)
        break
    }

    if (d == 0) {
      node.weights = this.featurePointIndices.map((id, i) => i == nearest ? 1 : 0)
    } else {
      const HALF_PI = Math.PI / 2
      node.weights = this.featurePointIndices.map((index, i) => {
        if (node.distanceToFP[i] > d) return 0
        return Math.sin(HALF_PI * (1.0 - node.distanceToFP[i] / d))
      })
      // if (node.index == 0) {
      //   console.log(nearest, node.weights[nearest], node.distanceToFP[nearest], d, Math.sin(HALF_PI * (1.0 - node.distanceToFP[nearest] / d)))
      //   console.log(node.distanceToFP)
      //   console.log(node.weights)
      // }
    }

    node.weights = node.weights.map((w, i) => {
      return {i, w}
    }).sort((a, b) => b.w - a.w).filter((w) => w.w > 0).slice(0, 4)

    node.weights.forEach((w) => {
      let d = node.distanceToFP[w.i]
      w.f = d == 0 ? 1 : w.w / (d * d)
    })

    // if (node.index == 0) {
    //   console.table(node.weights)
    // }

    // if (node.weights.length == 2) {
    //   console.table(node.weights)
    //   console.log(this.nodes[this.featurePointIndices[node.weights[0].i]])
    // }
  }


  initEyeMouth() {
    let data = require('./data/eyemouth.json')
    let n = data.faces.length / data.metadata.faces
    let faces = []
    for (let i = 0; i < data.faces.length; i += n) {
      faces.push(...data.faces.slice(i, i + 4))
    }
    data.faces = faces

    let geometry = new THREE.JSONLoader().parse(data).geometry

    let indices = geometry.vertices.map((v) => {
      let index = this.findNearestIndex(this.geometry.vertices, v)
      v.copy(this.geometry.vertices[index])
      // v.z += 0.1
      v.followVertex = index
      return index
    })
    // console.log(indices)

    this.eyemouth = new THREE.Mesh(geometry, this.material)
    // this.eyemouth.position.z += 0.3
    this.add(this.eyemouth)
  }

  initEyeMouth_() {
    let geometry = new THREE.JSONLoader().parse(require('./data/eyemouth.json')).geometry

    let indices = geometry.vertices.map((v) => {
      let index = this.findNearestIndex(this.geometry.vertices, v)
      v.copy(this.geometry.vertices[index])
      // v.z += 0.1
      v.followVertex = index
      return index
    })
    // console.log(indices)

    this.eyemouth = new THREE.Mesh(geometry, this.material)
    this.add(this.eyemouth)
  }


  initBack() {
    let geometry = new THREE.JSONLoader().parse(require('./data/back.json')).geometry

    let indices = geometry.vertices.map((v) => {
      let index = this.findNearestIndex(this.geometry.vertices, v)
      v.copy(this.geometry.vertices[index])
      // v.z -= 0.1
      v.followVertex = index
      return index
    })
    // console.log(indices)

    this.back = new THREE.Mesh(geometry, this.material)
    this.add(this.back)
  }


  deformVertices() {
    let vertices = this.geometry.vertices

    let displacement = this.featurePoints.map((fp) => {
      if (!fp) return
      let node = this.nodes[fp.vertexIndex]
      return fp.position.clone().sub(node.position)
    })

    this.nodes.forEach((node) => {
      let a = new THREE.Vector3()
      let b = 0
      node.weights.forEach((w) => {
        a.add(displacement[w.i].clone().multiplyScalar(w.f))
        b += w.f
      })
      a.multiplyScalar(1 / b)
      vertices[node.index].copy(node.position).add(a)
    })

    this.geometry.verticesNeedUpdate = true

    this.eyemouth.geometry.vertices.forEach((v) => {
      v.copy(this.geometry.vertices[v.followVertex])
    })
    this.eyemouth.geometry.verticesNeedUpdate = true
  }


  export() {
    return {
      face: this.exportFace(),
      rightEye: this.exportRightEye(),
      leftEye: this.exportLeftEye(),
      mouth: this.exportMouth(),
      back: this.exportBack(),
    }
  }


  exportPosition(vertices) {
    let position = []
    const offset = 40 / 150
    vertices.forEach((v) => {
      position.push(parseFloat(v.x.toPrecision(4)), parseFloat(v.y.toPrecision(4)), parseFloat((v.z + offset).toPrecision(4)))
    })
    return position
  }


  exportFace() {
    let position = this.exportPosition(this.geometry.vertices)

    let index = []
    this.geometry.faces.forEach((f) => {
      index.push(f.a, f.b, f.c)
    })

    let featurePoint = this.featurePoints.map((fp) => fp ? fp.vertexIndex : -1)

    let weight = this.nodes.map((node) => {
      return node.weights.map((w) => [w.i, parseFloat(w.f.toPrecision(4))])
    })

    return {
      position,
      index,
      featurePoint,
      weight
    }
  }


  exportRightEye() {
    let index = []
    let add = (i) => {
      let v = this.eyemouth.geometry.vertices[i]
      if (v.x < 0 && v.y > 0) {
        index.push(v.followVertex)
      }
    }
    this.eyemouth.geometry.faces.forEach((f) => {
      add(f.a)
      add(f.b)
      add(f.c)
    })
    return {index}
  }


  exportLeftEye() {
    let index = []
    let add = (i) => {
      let v = this.eyemouth.geometry.vertices[i]
      if (v.x > 0 && v.y > 0) {
        index.push(v.followVertex)
      }
    }
    this.eyemouth.geometry.faces.forEach((f) => {
      add(f.a)
      add(f.b)
      add(f.c)
    })
    return {index}
  }


  exportBack() {
    let index = []
    let add = (i) => {
      index.push(this.back.geometry.vertices[i].followVertex)
    }
    this.back.geometry.faces.forEach((f) => {
      add(f.a)
      add(f.b)
      add(f.c)
    })
    return {index}
  }


  exportMouth() {
    let index = []
    let add = (i) => {
      let v = this.eyemouth.geometry.vertices[i]
      if (v.y < 0) {
        index.push(v.followVertex)
      }
    }
    this.eyemouth.geometry.faces.forEach((f) => {
      add(f.a)
      add(f.b)
      add(f.c)
    })
    return {index}
  }

}
