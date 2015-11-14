/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
// import TWEEN from 'tween.js'
// import dat from 'dat-gui'
import Snap from 'imports-loader?this=>window,fix=>module.exports=0!snapsvg'
import {SpatialHash} from 'spatialhash'
import {Noise} from 'noisejs'
const noise = new Noise(Math.random())

import Config from './config'
import Ticker from './ticker'

import './main.sass'



class Node extends THREE.Vector3 {

  constructor(x = 0, y = 0, z = 0) {
    super(x, y, z)
    this.width = this.height = 1
    this.prev = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    this.connection = []
    this.history = []
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

    this.spatialHash = new SpatialHash()

    this.waypoints = []
    Snap.parse(require('raw!./logo.svg')).selectAll('path').forEach((el) => {
      let total = el.getTotalLength()
      let interval = 20
      let n = Math.round(total / interval)
      interval = total / n
      let offset = this.waypoints.length
      for (let i = 0; i < n; i++) {
        let p = el.getPointAtLength(i * interval)
        let node = new Node(p.x, p.y)
        node.id = this.waypoints.length
        this.waypoints.push(node)
        this.spatialHash.insert(node)
      }
      for (let i = 0; i < n; i++) {
        let node = this.waypoints[offset + i]
        node.connection.push(this.waypoints[offset + (i + 1) % n])     // next
        node.connection.push(this.waypoints[offset + (i + n - 1) % n]) // prev
      }
    })

    this.nodes = []
    for (let i = 0; i < 100; i++) {
      let node = new Node(Config.RENDER_WIDTH * Math.random(), Config.RENDER_HEIGHT * Math.random())
      node.velocity.set(Math.random() - 0.5, Math.random() - 0.5, 0).setLength(3)
      this.nodes.push(node)
    }

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()

    this.mouseX = 0
    this.mouseY = 0
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseX = e.offsetX
      this.mouseY = e.offsetY
    })

    Ticker.on('update', this.animate.bind(this))
    Ticker.start()
  }


  animate(f, t) {
    for (let i = 0; i < 5; i++) {
      this.update(f, t)
    }
    this.draw(f, t)
  }


  update( ) {
    this.nodes.forEach((node) => {
      node.prev.copy(node)

      if (node.x < 0 || Config.RENDER_WIDTH < node.x) {
        node.velocity.x *= -1
      }
      if (node.y < 0 || Config.RENDER_HEIGHT < node.y) {
        node.velocity.y *= -1
      }

      let query = node.velocity.clone().multiplyScalar(5)
      let d = Math.max(query.length(), 30)
      query.setLength(d)
      query.add(node)
      query.width = query.height = d * 2
      query.x -= d
      query.y -= d
      node._searchArea = query

      let sorted = this.spatialHash.retrieve(query).map((p) => {
        p._v = (p._v || new THREE.Vector3()).copy(p).sub(node)
        p._a = signedAngle(node.velocity, p._v)
        p._d = p._v.lengthSq()
        return p
      }).sort((a, b) => a._d - b._d).filter((p) => Math.abs(p._a) < Math.PI * 0.4)

      if (sorted.length) { // found some nodes nearby
        if (node.target) { // already tracked a node
          if (sorted.indexOf(node.target) == -1) { // target passed
            // find a nearest connected node for next target
            let list = node.target.connection.concat()
            let visited = {}
            let candidate = []
            while (list.length) {
              let node = list.shift()
              if (visited[node.id]) {
                continue
              }
              if (sorted.indexOf(node) == -1) {
                continue
              }
              visited[node.id] = true
              candidate.push(node)
              list.push(...node.connection)
            }
            node.target = candidate.length ? candidate.sort((a, b) => a._d - b._d)[0] : sorted[0]
          }
        } else {
          node.target = sorted[0]
        }
        _v1.copy(node.velocity).applyAxisAngle(PLUS_Z, node.target._a)
        node.velocity.lerp(_v1, 0.35).setLength(3)
      } else {
        delete node.target
        let t = Date.now() / 1000
        node.velocity.x += noise.simplex3((node.x - Config.RENDER_WIDTH * 0.5) * 0.0005, (node.y - Config.RENDER_HEIGHT * 0.5) * 0.001, t) * 0.2
        node.velocity.y += noise.simplex3((node.x - Config.RENDER_WIDTH * 0.5) * 0.0005, -(node.y - Config.RENDER_HEIGHT * 0.5) * 0.001, t) * 0.2
        node.velocity.setLength(3)
      }
      node._approaching = sorted

      node.add(node.velocity)

      /*{
        const w = Config.RENDER_WIDTH
        if (node.x < 0) {
          node.x += w
          node.prev.x += w
        } else if (w < node.x) {
          node.x -= w
          node.prev.x -= w
        }
        const h = Config.RENDER_HEIGHT
        if (node.y < 0) {
          node.y += h
          node.prev.y += h
        } else if (h < node.y) {
          node.y -= h
          node.prev.y -= h
        }
      }*/

      node.history.push([node.x, node.y])
      if (node.history.length > 100) {
        node.history.shift()
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
    // ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    // this.waypoints.forEach((p) => {
    //   ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
    // })
    // ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'
    // this.waypoints.forEach((p) => {
    //   ctx.beginPath()
    //   ctx.moveTo(p.x, p.y)
    //   ctx.lineTo(p.connection[0].x, p.connection[0].y)
    //   ctx.stroke()
    // })
    // ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)'
    // this.waypoints.forEach((p) => {
    //   ctx.beginPath()
    //   ctx.moveTo(p.x + 2, p.y)
    //   ctx.lineTo(p.connection[1].x + 2, p.connection[1].y)
    //   ctx.stroke()
    // })
    ctx.restore()

    // ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    // ctx.fillRect(this.mouseX - 50, this.mouseY - 50, 100, 100)
    // ctx.fillStyle = '#ff0000'
    // this.spatialHash.retrieve({x: this.mouseX - 50, y: this.mouseY - 50, width: 100, height: 100}).forEach((p) => {
    //   ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
    // })

    ctx.save()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    // ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    this.nodes.forEach((node) => {
      // ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      // ctx.strokeRect(node._searchArea.x, node._searchArea.y, node._searchArea.width, node._searchArea.height)

      ctx.strokeStyle = 'white'
      const n = node.history.length
      for (let i = 0; i < n - 1; i++) {
        ctx.globalAlpha = i / n * 0.5
        ctx.beginPath()
        ctx.moveTo(node.history[i][0], node.history[i][1])
        ctx.lineTo(node.history[i + 1][0], node.history[i + 1][1])
        ctx.stroke()
      }

      /*ctx.strokeStyle = 'green'
      ctx.beginPath()
      ctx.arc(node.x, node.y, 5, 0, Math.PI * 2, false)
      ctx.stroke()

      ctx.fillStyle = 'red'
      node._approaching.forEach((p) => {
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
      })

      if (node.target) {
        ctx.strokeStyle = 'red'
        ctx.beginPath()
        ctx.arc(node.target.x, node.target.y, 5, 0, Math.PI * 2, false)
        ctx.stroke()
      }*/
    })

    ctx.restore()
  }


  onResize() {
    let s = Math.min(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.canvas).css({
      transformOrigin: 'left top',
      // translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }

}

new App()
