/*global THREE*/
import 'OBJLoader'
import {vec2, vec3, mat3} from 'gl-matrix'


let toTypedArray = (type, array) => {
  let typed = new type(array.length)
  array.forEach((v, i) => typed[i] = v)
  return typed
}


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
    // let geometry = new THREE.BufferGeometry()
    let material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide, wireframe: true, transparent: true, opacity: 0.3})
    // let material = new THREE.ShaderMaterial({
    //   uniforms: {
    //     map: { type: 't', value: null }
    //   },
    //   vertexShader: require('raw!./face.vert'),
    //   fragmentShader: require('raw!./face.frag'),
    //   side: THREE.DoubleSide
    // })
    super(geometry, material)

    this.tracker = tracker

    // this.initGeometry()
    this.initFeaturePoints()
    // this.initTexture()
    // this.initMesh()
    this.initEyeMouth()
    this.deformVertices()
  }


  initGeometry() {
    let obj = require('raw!./data/face.obj')
    let position = []
    let index = []
    obj.split(/\n|\r/).forEach((line) => {
      let tokens = line.split(' ')
      switch (tokens[0]) {
        case 'v':
          position.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]))
          break
        case 'f':
          index.push(parseInt(tokens[1]) - 1, parseInt(tokens[2]) - 1, parseInt(tokens[3]) - 1)
          break
      }
    })
    position = toTypedArray(Float32Array, position)
    index = toTypedArray(Uint16Array, index)
    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.setIndex(new THREE.BufferAttribute(index, 1))

    let vertexDistance = []
    let setDistance = (a, b) => {
      if (!vertexDistance[a]) {
        vertexDistance[a] = []
      }
      if (vertexDistance[a][b]) {
        return
      }
      let pa = [position[a * 3 + 0], position[a * 3 + 1], position[a * 3 + 2]]
      let pb = [position[b * 3 + 0], position[b * 3 + 1], position[b * 3 + 2]]
      vertexDistance[a][b] = vec3.dist(pa, pb)
    }
    for (let i = 0; i < index.length; i += 3) {
      setDistance(index[i + 0], index[i + 1])
      setDistance(index[i + 0], index[i + 2])
      setDistance(index[i + 1], index[i + 0])
      setDistance(index[i + 1], index[i + 2])
      setDistance(index[i + 2], index[i + 0])
      setDistance(index[i + 2], index[i + 1])
    }

    this.featurePoints = require('./data/fp.json').map((p, i) => {
      let index = -1
      if (i == 41 || vec3.length(p) > 0) {
        let distance = Number.MAX_VALUE
        for (let i = 0; i < position.length; i += 3) {
          let d = vec3.distance(p, [position[i], position[i + 1], position[i + 2]])
          if (d < distance) {
            distance = d
            index = i
          }
        }
      }
      return {vertexIndex: index}
    })
    // console.table(this.featurePoints)
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


  initTexture() {
    this.textureCanvas = document.createElement('canvas')
    this.textureCanvas.id = 'texture'
    this.textureCanvas.width = 512
    this.textureCanvas.height = 512
    this.textureContext = this.textureCanvas.getContext('2d')
    require('ctx-get-transform')(this.textureContext)
    this.textureContext.fillStyle = 'white'
    this.textureContext.fillRect(0, 0, this.textureCanvas.width, this.textureCanvas.height)
    // document.body.appendChild(this.textureCanvas);

    this.texture = new THREE.Texture(this.textureCanvas)
    this.texture.needsUpdate = true
    // this.material.map = this.texture;
    this.material.uniforms.map.value = this.texture


    if (this.tracker.currentPosition) {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      this.tracker.currentPosition.forEach((p) => {
        let x = p[0]
        let y = p[1]
        if (x < min[0]) min[0] = x
        if (x > max[0]) max[0] = x
        if (y < min[1]) min[1] = y
        if (y > max[1]) max[1] = y
      })
      let center = this.tracker.currentPosition[33]
      let size = Math.max(center[0] - min[0], max[0] - center[0], center[1] - min[1], max[1] - center[1])
      this.textureContext.save()
      let scale = 256 * 0.95 / size
      this.textureContext.translate(256, 256)
      this.textureContext.scale(scale, scale)
      this.textureContext.translate(-center[0], -center[1])
      this.textureContext.drawImage(this.tracker.target, 0, 0)
      let mtx = this.textureContext.getTransform()
      // this.textureContext.drawImage(this.tracker.debugCanvas, 0, 0);
      this.textureContext.restore()

      let fpuv = []

      this.textureContext.save()
      this.textureContext.fillStyle = 'rgba(128, 255, 0, 0.5)'
      this.tracker.currentPosition.forEach((p) => {
        let q = vec2.transformMat3(vec2.create(), p, mtx)
        fpuv.push([q[0] / 256 - 1, q[1] / 256 - 1])
      })

      {
        this.textureContext.fillStyle = 'red'
        let v1 = this.tracker.currentPosition[14]
        let v0 = this.tracker.currentPosition[0]
        let center = vec2.lerp(vec2.create(), v1, v0, 0.5)
        let xAxis = vec2.sub(vec2.create(), v1, center)
        let scale = vec2.len(xAxis)
        let rotation = mat3.create()
        mat3.rotate(rotation, rotation, Math.atan2(xAxis[1], xAxis[0]))
        for (let i = 71; i < this.featurePoints.length; i++) {
          let fp = this.featurePoints[i].initialPosition
          let p = vec2.scale(vec2.create(), [fp.x, -fp.y], scale)
          vec2.transformMat3(p, p, rotation)
          vec2.add(p, p, center)
          vec2.transformMat3(p, p, mtx)
          // this.textureContext.fillRect(p[0] - 3, p[1] - 3, 6, 6);
          fpuv.push([p[0] / 256 - 1, p[1] / 256 - 1])
        }
      }

      this.featurePointUV = fpuv

      this.textureContext.fillStyle = 'rgba(0, 0, 255, 0.5)'

      let displacement = this.featurePoints.map((mesh, i) => {
        if (!mesh) return
        let node = this.nodes[mesh.vertexIndex]
        return [fpuv[i][0] - node.position.x, -fpuv[i][1] - node.position.y]
      })

      let uvs = this.nodes.map((target) => {
        let p = vec2.create()
        if (target.weights.length == 1) {
          let w = target.weights[0]
          vec2.add(p, [target.position.x, target.position.y], vec2.scale([], displacement[w.i], w.w))
        } else {
          let a = vec2.create()
          let b = 0
          target.weights.forEach((w) => {
            let dp = vec2.scale([], displacement[w.i], w.w)
            let dist = 1.0 / (target.distanceToFP[w.i] * target.distanceToFP[w.i])
            vec2.add(a, a, vec2.scale(dp, dp, dist))
            b += w.w * dist
          })
          vec2.scale(a, a, 1 / b)
          vec2.add(p, [target.position.x, target.position.y], a)
        }
        return [(p[0] * 256 + 256) / 512, (p[1] * 256 + 256) / 512]
      })

      this.geometry.faces.forEach((face, i) => {
        let uv = this.geometry.faceVertexUvs[0][i]
        uv[0].x = uvs[face.a][0]
        uv[0].y = uvs[face.a][1]
        uv[1].x = uvs[face.b][0]
        uv[1].y = uvs[face.b][1]
        uv[2].x = uvs[face.c][0]
        uv[2].y = uvs[face.c][1]
      })
      this.geometry.uvsNeedUpdate = true

      this.textureContext.restore()
    }
  }


  initMesh() {
    if (this.tracker.normalizedPosition) {
      this.tracker.normalizedPosition.forEach((np, i) => {
        let fp = this.featurePoints[i]
        if (fp) {
          // let scale = (500 - fp.localToWorld(new THREE.Vector3()).z) / 500 * 0.5;
          let scale = (500 - fp.position.z * 150) / 500 * 0.5
          // scale = 0.3;
          // fp.position.x += (np[0] * scale - fp.position.x) * 0.3;
          // fp.position.y += (-np[1] * scale - fp.position.y) * 0.3;
          fp.position.x = np[0] * scale
          fp.position.y = -np[1] * scale
          // fp.position.z *= 2 * scale;
        }
      })

      // console.log(this.featurePoints);
      // [33, 41, 62, 34, 35, 36, 42, 37, 43, 38, 39, 40].forEach((i) => {
      //   let fp = this.featurePoints[i];
      //   fp.position.x += 0.2;
      // });

      let v1 = this.featurePoints[14].position.clone()
      let v0 = this.featurePoints[0].position.clone()
      let center = new THREE.Vector3().lerpVectors(v1, v0, 0.5)
      let rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), v1.clone().sub(center).normalize())
      let scale = v1.clone().sub(center).length()
      for (let i = 71; i < this.featurePoints.length; i++) {
        let fp = this.featurePoints[i]
        fp.position.copy(fp.initialPosition.clone().multiplyScalar(scale).applyQuaternion(rotation).add(center))
      }
    }
  }


  initEyeMouth() {
    // let faceUVs = []
    // this.geometry.faces.forEach((face, i) => {
    //   let uv = this.geometry.faceVertexUvs[0][i]
    //   faceUVs[face.a] = uv[0]
    //   faceUVs[face.b] = uv[1]
    //   faceUVs[face.c] = uv[2]
    // })

    let geometry = new THREE.JSONLoader().parse(require('./data/eyemouth.json')).geometry

    let vertexIndices = geometry.vertices.map((v) => {
      let dist = Number.MAX_VALUE
      let index = -1
      this.geometry.vertices.forEach((fv, i) => {
        let d = fv.distanceToSquared(v)
        if (d < dist) {
          dist = d
          index = i
        }
      })
      v.copy(this.geometry.vertices[index])
      v.followVertex = index
      return index
    })

    // geometry.faces.forEach((face, i) => {
    //   geometry.faceVertexUvs[0][i] = [
    //     faceUVs[vertexIndices[face.a]],
    //     faceUVs[vertexIndices[face.b]],
    //     faceUVs[vertexIndices[face.c]]
    //   ]
    // })
    this.eyemouth = new THREE.Mesh(geometry, this.material)
    this.add(this.eyemouth)
  }


  deformVertices() {
    let vertices = this.geometry.vertices

    let displacement = this.featurePoints.map((fp) => {
      if (!fp) return
      let node = this.nodes[fp.vertexIndex]
      return fp.position.clone().sub(node.position)
    })

    this.nodes.forEach((node, i) => {
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


  animate(t) {
    // [56, 57, 58, 51, 52, 53, 54, 55, 4, 5, 6, 7, 8, 9, 10].forEach((i) => {
    //   let p = this.featurePoints[i]
    //   if (p) {
    //     let node = this.nodes[p.vertexIndex]
    //     p.position.y = node.position.y - (Math.sin(t * 0.005) + 1) * 0.05
    //   }
    // })

    // [33, 41, 62, 34, 35, 36, 42, 37, 43, 38, 39, 40].forEach((i) => {
    //   let p = this.featurePoints[i]
    //   if (p) {
    //     let node = this.nodes[p.vertexIndex]
    //     p.position.x = node.position.x + Math.sin(t * 0.001) * 0.1
    //   }
    // })

    // this.featurePoints.forEach((p) => {
    //   if (p) {
    //     let node = this.nodes[p.vertexIndex]
    //     p.position.x = node.position.x + Math.sin(t * 0.001 + node.position.y * 3) * 0.2
    //   }
    // })

    let scale = (Math.sin(t * 0.002) + 1) *3 + 0.2
    this.featurePoints.forEach((p) => {
      if (p) {
        let node = this.nodes[p.vertexIndex]
        // p.position.x = node.position.x + Math.sin(t * 0.001 + node.position.y * 3) * 0.2
        p.position.copy(node.position)
        p.position.multiplyScalar(scale)
        p.scale.set(scale, scale, scale)
      }
    })
    scale = 1 / scale * 200
    this.scale.set(scale, scale, scale)

    this.deformVertices()
  }


  export() {
    return {
      face: this.exportFace(),
      rightEye: this.exportRightEye(),
      leftEye: this.exportLeftEye(),
      // mouth: this.exportMouth()
    }
  }


  exportFace() {
    let position = []
    this.geometry.vertices.forEach((v) => {
      position.push(parseFloat(v.x.toPrecision(4)), parseFloat(v.y.toPrecision(4)), parseFloat(v.z.toPrecision(4)))
    })

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
