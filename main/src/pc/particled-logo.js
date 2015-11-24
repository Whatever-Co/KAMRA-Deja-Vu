/* global THREE */

import _ from 'lodash'
import Snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg'
import {Noise} from 'noisejs'
const noise = new Noise(Math.random())
import TWEEN from 'tween.js'

const HALF_WIDTH = 1920 / 2
const HALF_HEIGHT = 1080 / 2

import StandardFaceData from './standard-face-data'


class Node extends THREE.Vector3 {

  constructor() {
    super()

    this.linearVelocity = 3
    this.linearVelocityEasing = 0.9
    this.velocity = new THREE.Vector3()
    this.history = []
    this.maxHistory = THREE.Math.randInt(50, 120)

    this.target = new THREE.Vector3()
    this.path = null
    this.positionOnPath = 0
    this.velocityOnPath = 3
    this.maxSteeringSensitivity = 0.7

    this.noiseStrength = 5
    if (Math.random() < 0.1) {
      this.noiseStrength = 30
    }
    if (Math.random() < 0.05) {
      this.maxSteeringSensitivity = 0.1
    }
    this.variation = Math.random()
  }


  setPath(path, velocity = 3) {
    if (path == this.path) {
      return
    }
    this.path = path
    this.positionOnPath = this.path.totalLength * Math.random()
    this.velocityOnPath = velocity * THREE.Math.randFloat(0.9, 1.5)
    this.distanceTraveledOnPath = 0
  }


  update(time) {
    if (this.path) {
      let vop = this.velocityOnPath / this.path.scale
      this.distanceTraveledOnPath += vop
      this.positionOnPath = (this.positionOnPath + vop) % this.path.totalLength
      if (this.positionOnPath < 0) {
        this.positionOnPath += this.path.totalLength
      }
      let p = this.path.getPointAtLength2(this.positionOnPath)
      this.target.x = p.x + noise.simplex2(this.x * 0.0001 + time + this.variation, this.y * 0.0001) * this.noiseStrength
      this.target.y = p.y + noise.simplex2(this.x * 0.0001, this.y * 0.0001 - time) * this.noiseStrength

      _v1.copy(this.target).sub(this)
      let d = _v1.length()
      let alpha = THREE.Math.mapLinear(THREE.Math.clamp(d, 0, 400), 0, 400, this.maxSteeringSensitivity, 0.05)
      let a = signedAngle(this.velocity, _v1) * alpha

      this.linearVelocity += (Math.max(Math.abs(this.velocityOnPath) * 0.98, d * 0.04) - this.linearVelocity) * this.linearVelocityEasing
      this.velocity.applyAxisAngle(PLUS_Z, a).setLength(this.linearVelocity)
    }
    this.add(this.velocity)

    this.history.push([this.x, this.y])
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

}



class Polyline {

  constructor(vertices) {
    this.vertices = vertices
    this.totalLength = 0
    this._length = [0]

    for (let i = 1; i <= vertices.length; i++) {
      this.totalLength += vertices[i % vertices.length].distanceTo(vertices[i - 1])
      this._length.push(this.totalLength)
    }
  }


  getTotalLength(vertices) {
    let total = 0
    for (let i = 1; i <= vertices.length; i++) {
      total += vertices[i % vertices.length].distanceTo(vertices[i - 1])
    }
    return total
  }


  getPointAtLength2(length) {
    if (length <= 0) {
      return this.vertices[0].clone()
    }
    if (length >= this.totalLength) {
      return _.last(this.vertices).clone()
    }
    let r = 0
    let l = this._length.length - 1
    let m = (l + r) >> 1
    while (l - r > 1) {
      if (this._length[m] < length) {
        r = m
      } else {
        l = m
      }
      m = (l + r) >> 1
    }
    let t = THREE.Math.mapLinear(length, this._length[m], this._length[m + 1], 0, 1)
    return new THREE.Vector3().copy(this.vertices[m]).lerp(this.vertices[(m + 1) % this.vertices.length], t)
  }

}



class ParticleMaterial extends THREE.ShaderMaterial {

  constructor() {
    super({
      uniforms: {
        time: {type: 'f', value: 0},
        globalAlpha: {type: 'f', value: 1}
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vAlpha = alpha;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float globalAlpha;
        varying float vAlpha;
        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }
        void main() {
          if (vAlpha < 0.01) discard;
          gl_FragColor = vec4(1, 1, 1, vAlpha * rand(gl_FragCoord.xy + vec2(time * 100., 0.)) * globalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      linewidth: 1
    })
  }

  set alpha(value) {
    this.uniforms.globalAlpha.value = value
  }

  get alpha() {
    return this.uniforms.globalAlpha.value
  }

}



const signedAngle = (v1, v2) => Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y)

const PLUS_Z = new THREE.Vector3(0, 0, 1)
let _v1 = new THREE.Vector3()
let _m1 = new THREE.Matrix4()

export default class ParticledLogo extends THREE.Line {

  constructor(keyframes) {
    super(new THREE.BufferGeometry(), new ParticleMaterial())
    this.renderOrder = 10000
    this.mode = 'logo'
    this.keyframes = keyframes
    this.init()
  }


  init() {
    console.time('logo data preparation')
    this.pathPoints = []
    this.logoPaths = Snap.parse(require('raw!./data/logo2.svg')).selectAll('path')
    this.logoPaths.forEach((path) => {
      path.scale = 1.0
      path.totalLength = path.getTotalLength()
      let n = Math.round(path.totalLength / 10)
      let l = path.totalLength / n
      for (let i = 0; i < n; i++) {
        let p = path.getPointAtLength(i * l)
        p.x -= HALF_WIDTH
        p.y = -(p.y - HALF_HEIGHT)
        p.path = path
        this.pathPoints.push(p)
      }
    })
    this.logoPaths.forEach(this.preparePath.bind(this))

    {
      let circle = Snap.parse(require('raw!./data/face-circle.svg')).select('path')
      this.circleBBox = circle.getBBox()
      let data = new StandardFaceData()
      this.edgeIndex = data.data.back.edgeIndex
      let vertices = this.edgeIndex.reverse().map((index) => {
        let v = data.getVertex(index)
        return new THREE.Vector3().fromArray(v).multiplyScalar(this.circleBBox.height / data.bounds.size[1])
      })
      this.trackerPath = new Polyline(vertices)
      this.trackerPath.scale = 1.0
      this.trackerPath._faceEdgeVertices = vertices
      this.trackerPath._faceEdgeLength = this.trackerPath.getTotalLength(vertices)

      let width = this.circleBBox.width * 0.5
      let height = this.circleBBox.height * 0.5
      this.trackerPath._circleVertices = vertices.map((v) => {
        let a = Math.atan2(v.y, v.x)
        return new THREE.Vector3(Math.cos(a) * width, Math.sin(a) * height)
      })

      let r = Math.sqrt(HALF_WIDTH * HALF_WIDTH + HALF_HEIGHT * HALF_HEIGHT) * 1.1
      this.trackerPath._largeCircleVertices = vertices.map((v) => {
        let a = Math.atan2(v.y, v.x)
        return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r)
      })

      this.trackerPath.vertices = this.trackerPath._circleVertices
    }

    console.timeEnd('logo data preparation')

    let numVertices = 0
    this.nodes = []
    for (let i = 0; i < 300; i++) {
      let node = new Node()
      if (Math.random() < 0.5) {
        node.x = HALF_WIDTH * (Math.random() < 0.5 ? -1 : 1)
        node.y = THREE.Math.randFloat(-(HALF_HEIGHT + 100), HALF_HEIGHT + 100)
      } else {
        node.x = THREE.Math.randFloat(-(HALF_WIDTH + 100), HALF_WIDTH + 100)
        node.y = HALF_HEIGHT * (Math.random() < 0.5 ? -1 : 1)
      }
      node.velocity.set(Math.random() - 0.5, Math.random() - 0.5, 0)
      node.startIndex = numVertices
      this.nodes.push(node)
      numVertices += node.maxHistory + 1
    }
    {
      let paths = _.sample(this.pathPoints, this.nodes.length - this.logoPaths.length).map((p) => p.path)
      paths.push(...this.logoPaths)
      paths = _.shuffle(paths)
      this.nodes.forEach((node, i) => {
        node.setPath(paths[i], Math.random() < 0.5 ? -3 : 3)
      })
    }

    this.positionAttribute = new THREE.BufferAttribute(new Float32Array(numVertices * 3), 3)
    this.positionAttribute.dynamic = true
    this.geometry.addAttribute('position', this.positionAttribute)
    this.alphaAttribute = new THREE.BufferAttribute(new Float32Array(numVertices), 1)
    this.alphaAttribute.dynamic = true
    this.geometry.addAttribute('alpha', this.alphaAttribute)
  }


  preparePath(path) {
    let _points = []
    let n = Math.floor(path.totalLength / 3)
    for (let i = 0; i <= n; i++) {
      let l = i / n * path.totalLength
      let p = path.getPointAtLength(l)
      p.x -= HALF_WIDTH
      p.y = -(p.y - HALF_HEIGHT)
      p.length = l
      _points.push(p)
    }
    path.getPointAtLength2 = (length) => {
      if (length <= 0) {
        return _points[0]
      }
      if (length >= path.totalLength) {
        return _.last(_points)
      }
      let r = 0
      let l = _points.length - 1
      let m = (l + r) >> 1
      while (l - r > 1) {
        if (_points[m].length < length) {
          r = m
        } else {
          l = m
        }
        m = (l + r) >> 1
      }
      return _points[m]
    }
  }


  setMode(mode) {
    if (mode == this.mode) {
      return
    }
    switch (mode) {
      case 'logo':
        let paths = _.sample(this.pathPoints, this.nodes.length - this.logoPaths.length).map((p) => p.path)
        paths.push(...this.logoPaths)
        paths = _.shuffle(paths)
        this.nodes.forEach((node, i) => {
          node.setPath(paths[i], Math.random() < 0.5 ? -3 : 3)
        })
        break
      case 'circle':
        this.trackerPath.vertices = this.trackerPath._circleVertices
        this.trackerPath.scale = 1.0
        this.nodes.forEach((node) => {
          node.setPath(this.trackerPath, THREE.Math.randFloat(3, 7))
        })
        break
      case 'tracker':
        this.trackerPath.vertices = this.trackerPath._faceEdgeVertices
        this.nodes.forEach((node) => {
          node.setPath(this.trackerPath, THREE.Math.randFloat(3, 7))
        })
        break
      case 'out':
        this.trackerPath.vertices = this.trackerPath._largeCircleVertices
        this.trackerPath.scale = 5.0
        this.nodes.forEach((node) => {
          node.setPath(this.trackerPath, THREE.Math.randFloat(3, 7))
          node.linearVelocityEasing = 0.005
        })
        break
      default:
        return
    }
    this.mode = mode
  }


  hide() {
    return new Promise((resolved) => {
      this.setMode('out')
      new TWEEN.Tween(this.material).to({alpha: 0}, 3000).delay(2000).easing(TWEEN.Easing.Cubic.Out).start().onComplete(resolved)
    })
  }


  updateVertices(face, cameraZ) {
    face.updateMatrixWorld()
    _m1.getInverse(this.matrixWorld)
    let position = face.main.geometry.positionAttribute.array
    this.edgeIndex.forEach((index, i) => {
      let v = this.trackerPath.vertices[i]
      v.fromArray(position, index * 3)
      v.applyMatrix4(face.main.matrixWorld)
      let s = cameraZ / (cameraZ - v[2])
      v[0] *= s
      v[1] *= s
      v[2] = 0
      v.applyMatrix4(_m1)
    })
    let length = this.trackerPath.getTotalLength(this.trackerPath.vertices)
    this.trackerPath.scale = length / this.trackerPath._faceEdgeLength * 0.9
    // console.log({length, scale: this.trackerPath.scale})
  }


  _updateNodes(frame, time) {
    time *= 0.001
    this.nodes.forEach((node) => {
      node.update(time)
      if (this.mode == 'logo' && Math.random() < (node.distanceTraveledOnPath - node.path.totalLength * 3) / 15000) {
        if (this.freePath) {
          let prev = node.path
          node.setPath(this.freePath)
          this.freePath = prev
        } else {
          this.freePath = node.path
          node.setPath(_.sample(this.logoPaths))
        }
      }
    })
  }


  _updateGeometry() {
    let position = this.positionAttribute.array
    let alpha = this.alphaAttribute.array
    let k = 0
    let l = 0
    for (let i = 0; i < this.nodes.length; i++) {
      let node = this.nodes[i]
      for (let j = 0; j < node.history.length; j++) {
        position[k++] = node.history[j][0]
        position[k++] = node.history[j][1]
        position[k++] = 0
        alpha[l++] = j / node.maxHistory
      }
      alpha[l - 1] = 0
    }
    this.positionAttribute.needsUpdate = true
    this.alphaAttribute.needsUpdate = true
  }


  update(currentFrame, time) {
    this._updateNodes(currentFrame, time)
    this._updateNodes(currentFrame, time)
    this._updateNodes(currentFrame, time)
    this._updateGeometry()
    if (currentFrame % 2 == 0) {
      this.material.uniforms.time.value = Math.random()
    }
  }

}
