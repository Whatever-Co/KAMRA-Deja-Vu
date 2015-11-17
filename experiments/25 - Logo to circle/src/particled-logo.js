/* global THREE */

import _ from 'lodash'
import Snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg'
import {Noise} from 'noisejs'
const noise = new Noise(Math.random())

import Config from './config'


class Node extends THREE.Vector3 {

  constructor() {
    super()

    this.linearVelocity = 3
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
      this.distanceTraveledOnPath += this.velocityOnPath
      this.positionOnPath = (this.positionOnPath + this.velocityOnPath) % this.path.totalLength
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

      this.linearVelocity += (Math.max(Math.abs(this.velocityOnPath) * 0.9, d * 0.04) - this.linearVelocity) * 0.9
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



const signedAngle = (v1, v2) => Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y)

const PLUS_Z = new THREE.Vector3(0, 0, 1)
let _v1 = new THREE.Vector3()

export default class ParticledLogo extends THREE.Line {

  constructor() {
    super(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms: {
        time: {type: 'f', value: 0}
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
        varying float vAlpha;
        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }
        void main() {
          if (vAlpha < 0.01) discard;
          gl_FragColor = vec4(1, 1, 1, vAlpha * rand(gl_FragCoord.xy + vec2(time * 100., 0.)));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      linewidth: 1
    }))
    // this.material = new THREE.LineBasicMaterial()

    this.mode = 'logo'

    this.logoPaths = Snap.parse(require('raw!./logo2.svg')).selectAll('path')
    this.circlePath = Snap.parse(require('raw!./face-circle.svg')).select('path')
    this.circlePath.totalLength = this.circlePath.getTotalLength()

    {
      let center = new THREE.Vector3(Config.RENDER_WIDTH / 2, Config.RENDER_HEIGHT / 2, 0)
      this.rectPath = new Polyline([
        new THREE.Vector3(200, 200, 0).add(center),
        new THREE.Vector3(200, -200, 0).add(center),
        new THREE.Vector3(-200, -200, 0).add(center),
        new THREE.Vector3(-200, 200, 0).add(center),
      ])
    }

    console.time('prepare')
    this.pathPoints = []
    this.logoPaths.forEach((path) => {
      path.totalLength = path.getTotalLength()
      let n = Math.round(path.totalLength / 10)
      let l = path.totalLength / n
      for (let i = 0; i < n; i++) {
        let p = path.getPointAtLength(i * l)
        p.path = path
        this.pathPoints.push(p)
      }
    })
    let preparePath = (path) => {
      let _points = []
      let n = Math.floor(path.totalLength / 3)
      for (let i = 0; i <= n; i++) {
        let l = i / n * path.totalLength
        let p = path.getPointAtLength(l)
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
    this.logoPaths.forEach((path) => preparePath(path))
    preparePath(this.circlePath)
    console.timeEnd('prepare')

    let numVertices = 0
    this.nodes = []
    let center = new THREE.Vector3(Config.RENDER_WIDTH / 2, Config.RENDER_HEIGHT / 2, 0)
    for (let i = 0; i < 200; i++) {
      let node = new Node()
      if (Math.random() < 0.5) {
        node.x = Math.random() < 0.5 ? -100 : Config.RENDER_WIDTH + 100
        node.y = THREE.Math.randFloat(-100, Config.RENDER_HEIGHT + 100)
      } else {
        node.x = THREE.Math.randFloat(-100, Config.RENDER_WIDTH + 100)
        node.y = Math.random() < 0.5 ? -100 : Config.RENDER_HEIGHT + 100
      }
      node.velocity.copy(node).sub(center).setLength(3)
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
        this.nodes.forEach((node) => {
          node.setPath(this.circlePath, THREE.Math.randFloat(10, 20) / 3)
        })
        break
      case 'tracker':
        this.nodes.forEach((node) => {
          node.setPath(this.rectPath, THREE.Math.randFloat(10, 20) / 3)
        })
        break
      default:
        return
    }
    this.mode = mode
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


  update(frame, time) {
    this._updateNodes(frame, time)
    this._updateNodes(frame, time)
    this._updateNodes(frame, time)
    this._updateGeometry()
    if (frame % 2 == 0) {
      this.material.uniforms.time.value = Math.random()
    }
  }

}
