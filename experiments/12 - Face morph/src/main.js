/* global THREE */
import $ from 'jquery'
import 'OrbitControls'
import dat from 'dat-gui'
import {vec2} from 'gl-matrix'

import Delaunay from 'delaunay-fast'
import DeformableFace from './deformableface'

import './main.sass'
document.body.innerHTML = require('./main.jade')()


class App {

  constructor() {

    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()

    this.animate()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    this.camera.position.z = 500

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    this.face = new DeformableFace()
    // shutterstock_62329042.png
    this.face.load('media/shutterstock_62329042').then(() => {
      this.face.scale.set(200, 200, 150)
      this.scene.add(this.face)

      // let gui = new dat.GUI()
      // for (let i = 0; i < 11; i++) {
      //   let p = gui.add(this.face.mesh.material.uniforms.morphTargetInfluences.value, i, -1, 1).name(this.face.morph[i].name)
      //   this.face.mesh.material.uniforms.morphTargetInfluences.value[i] = 0
      // }
      // gui.__controllers.forEach((c) => c.updateDisplay())
    })
  }


  animate(t) {
    requestAnimationFrame(this.animate)

    this.controls.update()
    this.face.update(t)
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

}


class DelauneyTestApp {

  constructor() {
    this.onMouseMove = this.onMouseMove.bind(this)

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = 1000
    document.body.appendChild(this.canvas)

    this.overlay = document.createElement('canvas')
    this.overlay.width = this.overlay.height = 1000
    this.overlay.style.position = 'absolute'
    this.overlay.style.left = '0px'
    this.overlay.style.top = '0px'
    document.body.appendChild(this.overlay)

    this.standardData = require('./face.json')
    this.originalPoints = []
    let position = this.standardData.face.position
    for (let i = 0; i < position.length; i += 3) {
      this.originalPoints.push([250 + position[i] * 300, 250 - position[i + 1] * 300])
    }
    this.originalPoints.push([0, 0])
    this.originalPoints.push([500, 0])
    this.originalPoints.push([0, 500])
    this.originalPoints.push([500, 500])

    this.triangleIndices = Delaunay.triangulate(this.originalPoints)

    this.context = this.canvas.getContext('2d')
    this.context.fillStyle = '#ffffff'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.strokeStyle = '#000000'
    this.context.lineWidth = 0.2
    this.drawTriangles(this.originalPoints)

    this.loadCapturedFace().done(() => {
      window.addEventListener('mousemove', this.onMouseMove)
      this.loadMorphTarget()
      this.calcMorphed()
    })
  }


  loadCapturedFace() {
    let getPosition = (index) => {
      let i = index * 3
      return [this.standardData.face.position[i], this.standardData.face.position[i + 1]]
    }

    return $.getJSON('media/shutterstock_102487424.json').done((fp) => {
      let displacement = fp.map((c, i) => {
        let fp = getPosition(this.standardData.face.featurePoint[i])
        return vec2.sub([], [c[0] - 0.5, c[1] - 0.5], [fp[0] * 0.7, fp[1] * 0.7])
      })

      let n = this.standardData.face.position.length / 3
      this.capturedPoints = []
      for (let i = 0; i < n; i++) {
        let p = vec2.create()
        let b = 0
        this.standardData.face.weight[i].forEach((w) => {
          vec2.add(p, p, vec2.scale([], displacement[w[0]], w[1]))
          b += w[1]
        })
        vec2.scale(p, p, 1 / b)
        vec2.add(p, p, getPosition(i))
        this.capturedPoints.push([250 + p[0] * 300, 250 - p[1] * 300])
      }

      this.capturedPoints.push([0, 0])
      this.capturedPoints.push([500, 0])
      this.capturedPoints.push([0, 500])
      this.capturedPoints.push([500, 500])

      this.context.save()
      this.context.translate(500, 0)
      this.drawTriangles(this.capturedPoints)
      this.context.restore()
    })
  }


  loadMorphTarget() {
    this.morphedPoints = []
    let position = require('./morph.json')[10].face.vertices
    for (let i = 0; i < position.length; i += 3) {
      this.morphedPoints.push([250 + position[i] * 300, 250 - position[i + 1] * 300])
    }
    this.morphedPoints.push([0, 0])
    this.morphedPoints.push([500, 0])
    this.morphedPoints.push([0, 500])
    this.morphedPoints.push([500, 500])

    this.context.save()
    this.context.translate(0, 500)
    this.drawTriangles(this.morphedPoints)
    this.context.restore()
  }


  calcMorphed() {
    let deformed = this.morphedPoints.map((mp, i) => {
      let r = this.getTriangleIndex(mp, this.originalPoints)
      if (r) {
        // console.log(i, r[0], r[1])
        let [index, bc] = r
        let p0 = this.capturedPoints[this.triangleIndices[index + 0]]
        let p1 = this.capturedPoints[this.triangleIndices[index + 1]]
        let p2 = this.capturedPoints[this.triangleIndices[index + 2]]
        return [
          p0[0] * bc[0] + p1[0] * bc[1] + p2[0] * bc[2],
          p0[1] * bc[0] + p1[1] * bc[1] + p2[1] * bc[2]
        ]
      }
      return mp
    })

    this.context.save()
    this.context.translate(500, 500)
    this.drawTriangles(deformed)
    this.context.restore()
  }


  onMouseMove(e) {
    // console.log(e)
    e.preventDefault()

    let ctx = this.overlay.getContext('2d')
    ctx.clearRect(0, 0, 1000, 1000)

    let ret = this.getTriangleIndex([e.offsetX, e.offsetY], this.originalPoints)
    // console.log(e.offsetX, e.offsetY, ret)
    if (ret) {
      let [index, coord] = ret
      // console.log(index, coord)
      ctx.save()
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2'
      ctx.beginPath()
      ctx.arc(e.offsetX, e.offsetY, 10, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)'
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.beginPath()
      let p0 = this.originalPoints[this.triangleIndices[index + 0]]
      let p1 = this.originalPoints[this.triangleIndices[index + 1]]
      let p2 = this.originalPoints[this.triangleIndices[index + 2]]
      // let bc = this.cartesianToBarycentric([30, 200], p0, p1, p2)
      // console.log(bc)
      // console.log(this.barycentricToCartesian(bc, p0, p1, p2))
      ctx.moveTo(p0[0], p0[1])
      ctx.lineTo(p1[0], p1[1])
      ctx.lineTo(p2[0], p2[1])
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 0, 0, 0.5'
      ctx.beginPath()
      ctx.arc(p0[0] * coord[0] + p1[0] * coord[1] + p2[0] * coord[2], p0[1] * coord[0] + p1[1] * coord[1] + p2[1] * coord[2], 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.translate(500, 0)
      ctx.beginPath()
      p0 = this.capturedPoints[this.triangleIndices[index + 0]]
      p1 = this.capturedPoints[this.triangleIndices[index + 1]]
      p2 = this.capturedPoints[this.triangleIndices[index + 2]]
      ctx.moveTo(p0[0], p0[1])
      ctx.lineTo(p1[0], p1[1])
      ctx.lineTo(p2[0], p2[1])
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 0, 0, 0.5'
      ctx.beginPath()
      ctx.arc(p0[0] * coord[0] + p1[0] * coord[1] + p2[0] * coord[2], p0[1] * coord[0] + p1[1] * coord[1] + p2[1] * coord[2], 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }


  drawTriangles(vertices) {
    let connected = {}
    let _draw = (a, b) => {
      let key = (a << 16) | b
      // console.log(key.toString(16))
      // console.log(a, b, key, connected.hasOwnProperty(key))
      if (connected.hasOwnProperty(key)) {
        return
      }
      connected[key] = true
      connected[b << 16 | a] = true
      this.context.moveTo(vertices[this.triangleIndices[a]][0], vertices[this.triangleIndices[a]][1])
      this.context.lineTo(vertices[this.triangleIndices[b]][0], vertices[this.triangleIndices[b]][1])
    }
    for (let i = 0; i < this.triangleIndices.length; i += 3) {
      this.context.beginPath()
      // _draw(i + 0, i + 1)
      // _draw(i + 1, i + 2)
      // _draw(i + 2, i + 0)
      this.context.moveTo(vertices[this.triangleIndices[i + 0]][0], vertices[this.triangleIndices[i + 0]][1])
      this.context.lineTo(vertices[this.triangleIndices[i + 1]][0], vertices[this.triangleIndices[i + 1]][1])
      this.context.lineTo(vertices[this.triangleIndices[i + 2]][0], vertices[this.triangleIndices[i + 2]][1])
      this.context.closePath()
      this.context.stroke()
    }
  }


  getTriangleIndex(p, vertices) {
    // console.log(p)
    for (let i = 0; i < this.triangleIndices.length; i += 3) {
      // console.log([vertices[this.triangleIndices[i]], vertices[this.triangleIndices[i + 1]], vertices[this.triangleIndices[i + 2]]])
      let uv = Delaunay.contains([vertices[this.triangleIndices[i]], vertices[this.triangleIndices[i + 1]], vertices[this.triangleIndices[i + 2]]], p)
      if (uv) {
        // console.log(i, uv)
        uv.unshift(1 - uv[0] - uv[1])
        return [i, uv]
      }
    }
  }


  cartesianToBarycentric(p, p1, p2, p3) {
    let d =  (p2[1] - p3[1]) * (p1[0] - p3[0]) + (p3[0] - p2[0]) * (p1[1] - p3[1])
    let u = ((p2[1] - p3[1]) * (p [0] - p3[0]) + (p3[0] - p2[0]) * (p [1] - p3[1])) / d
    let v = ((p3[1] - p1[1]) * (p [0] - p3[0]) + (p1[0] - p3[0]) * (p [1] - p3[1])) / d
    return [u, v, 1 - u - v]
  }


  barycentricToCartesian(p, p1, p2, p3) {
    return [
      p[0] * p1[0] + p[1] * p2[0] + p[2] * p3[0],
      p[0] * p1[1] + p[1] * p2[1] + p[2] * p3[1]
    ]
  }


  getBounds(vertices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    for (let i = 0; i < vertices.length; i += 2) {
      let v = [vertices[i], vertices[i + 1]]
      vec2.min(min, min, v)
      vec2.max(max, max, v)
    }
    console.log(min, max)
  }


  getBounds2(vertices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    vertices.forEach((v) => {
      vec2.min(min, min, v)
      vec2.max(max, max, v)
    })
    console.log(min, max)
  }

}


// new App()
new DelauneyTestApp()
