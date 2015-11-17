/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import _ from 'lodash'
import 'OrbitControls'
import TWEEN from 'tween.js'
// import dat from 'dat-gui'
import Snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg'
import {SpatialHash} from 'spatialhash'
import {Noise} from 'noisejs'
const noise = new Noise(Math.random())

import Config from './config'
import Ticker from './ticker'

import './main.sass'



class Node extends THREE.Vector3 {

  constructor() {
    super()

    this.linearVelocity = 10
    this.velocity = new THREE.Vector3()
    this.history = []

    this.target = new THREE.Vector3()
    this.path = null
    this.positionOnPath = 0
    this.velocityOnPath = 10

    this.seed = Math.random()
  }


  setPath(path, velocity = 10) {
    if (path == this.path) {
      return
    }
    this.path = path
    this.positionOnPath = this.path.totalLength * Math.random()
    this.velocityOnPath = velocity
    this.distanceTraveledOnPath = 0
  }


  update(time) {
    if (this.path) {
      this.distanceTraveledOnPath += this.velocityOnPath
      this.positionOnPath = (this.positionOnPath + this.velocityOnPath) % this.path.totalLength
      if (this.positionOnPath < 0) {
        this.positionOnPath += this.path.totalLength
      }
      let p = this.path.getPointAtLength(this.positionOnPath)
      this.target.x = p.x + noise.simplex2(this.x * 0.005 + time, this.y * 0.004) * 5
      this.target.y = p.y + noise.simplex2(this.x * 0.004, this.y * 0.005) * 5

      _v1.copy(this.target).sub(this)
      let d = _v1.length()
      let alpha = THREE.Math.mapLinear(THREE.Math.clamp(d, 0, 400), 0, 400, 0.7, 0.05)
      let a = signedAngle(this.velocity, _v1) * alpha

      this.linearVelocity += (Math.max(Math.abs(this.velocityOnPath), d * 0.03) - this.linearVelocity) * 0.1
      this.velocity.applyAxisAngle(PLUS_Z, a).setLength(this.linearVelocity)
    }
    this.add(this.velocity)

    this.history.push([this.x, this.y])
    if (this.history.length > 30) {
      this.history.shift()
    }
  }

}


const signedAngle = (v1, v2) => Math.atan2(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y)

const PLUS_Z = new THREE.Vector3(0, 0, 1)
let _v1 = new THREE.Vector3()

class App {

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = Config.RENDER_WIDTH
    this.canvas.height = Config.RENDER_HEIGHT
    document.body.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.ctx.fillStyle = 'rgb(26, 43, 52)'
    this.ctx.fillRect(0, 0, Config.RENDER_WIDTH, Config.RENDER_HEIGHT)

    this.logoPaths = Snap.parse(require('raw!./logo.svg')).selectAll('path')
    this.circlePath = Snap.parse(require('raw!./face-circle.svg')).select('path')
    this.circlePath.totalLength = this.circlePath.getTotalLength()

    this.pathPoints = []
    this.logoPaths.forEach((path) => {
      path.totalLength = path.getTotalLength()
      let n = path.totalLength / 30
      let l = path.totalLength / n
      for (let i = 0; i < n; i++) {
        let p = path.getPointAtLength(i * l)
        p.path = path
        this.pathPoints.push(p)
      }
    })

    this.nodes = []
    let center = new THREE.Vector3(Config.RENDER_WIDTH / 2, Config.RENDER_HEIGHT / 2, 0)
    for (let i = 0; i < 50; i++) {
      let node = new Node()
      if (Math.random() < 0.5) {
        node.x = Math.random() < 0.5 ? -100 : Config.RENDER_WIDTH + 100
        node.y = THREE.Math.randFloat(-100, Config.RENDER_HEIGHT + 100)
      } else {
        node.x = THREE.Math.randFloat(-100, Config.RENDER_WIDTH + 100)
        node.y = Math.random() < 0.5 ? -100 : Config.RENDER_HEIGHT + 100
      }
      // node.x = Math.random() * Config.RENDER_WIDTH
      // node.y = Math.random() * Config.RENDER_HEIGHT
      // node.velocity.set(Math.random() - 0.5, Math.random() - 0.5, 0).setLength(10)
      node.velocity.copy(node).sub(center).setLength(10)
      node.visible = false
      this.nodes.push(node)
    }
    {
      let paths = _.shuffle(this.pathPoints).slice(0, this.nodes.length - this.logoPaths.length).map((p) => p.path)
      paths.push(...this.logoPaths)
      paths = _.shuffle(paths)
      this.nodes.forEach((node, i) => {
        node.setPath(paths[i], Math.random() < 0.5 ? -10 : 10)
      })
    }

    {
      let i = 0
      let interval = setInterval(() => {
        this.nodes[i].visible = true
        if (++i == this.nodes.length) {
          clearInterval(interval)
        }
      }, 50)
    }

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()

    this.circleMode = false
    window.addEventListener('keydown', (e) => {
      if (e.keyCode == 32) {
        this.circleMode = !this.circleMode
        if (this.circleMode) {
          this.nodes.forEach((node) => {
            node.setPath(this.circlePath, THREE.Math.randFloat(10, 20))
          })
        } else {
          let paths = _.shuffle(this.pathPoints).slice(0, this.nodes.length - this.logoPaths.length).map((p) => p.path)
          paths.push(...this.logoPaths)
          paths = _.shuffle(paths)
          this.nodes.forEach((node, i) => {
            node.setPath(paths[i], Math.random() < 0.5 ? -10 : 10)
          })
        }
      }
    })
    // window.addEventListener('keyup', (e) => {
    //   if (e.keyCode == 32) {
    //     _.shuffle(this.logoPaths).map((p, i) => {
    //       this.nodes[i].setPath(p)
    //     })
    //   }
    // })

    Ticker.on('update', this.animate.bind(this))
    Ticker.start()
  }


  animate(f, t) {
    TWEEN.update(t)
    this.update(f, t)
    this.draw(f, t)
  }


  lerp(p0, p1, a) {
    return p0 + (p1 - p0) * a
  }


  update(f, t) {
    t *= 0.001
    this.nodes.forEach((node) => {
      if (node.visible) {
        node.update(t)
        if (!this.circleMode && Math.random() < (node.distanceTraveledOnPath - node.path.totalLength * 3) / 5000) {
          node.setPath(this.pathPoints[~~(Math.random() * this.pathPoints.length)].path)
        }
      }
    })
  }


  draw() {
    let ctx = this.ctx

    ctx.save()
    // ctx.globalAlpha = 0.1
    ctx.fillStyle = 'rgb(26, 43, 52)'
    ctx.fillRect(0, 0, Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    ctx.restore()

    ctx.save()
    this.nodes.forEach((node) => {
      ctx.strokeStyle = '#ffffff'
      for (let i = 0; i < node.history.length - 1; i++) {
        ctx.globalAlpha = i / 30
        ctx.beginPath()
        ctx.moveTo(node.history[i][0], node.history[i][1])
        ctx.lineTo(node.history[i + 1][0], node.history[i + 1][1])
        ctx.stroke()
      }
      // ctx.strokeStyle = 'rgb(0, 255, 0)'
      // ctx.beginPath()
      // ctx.arc(node.x, node.y, 5, 0, Math.PI * 2, false)
      // ctx.stroke()
    })
    ctx.restore()

  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.canvas).css({
      transformOrigin: 'left top',
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }

}

new App()
