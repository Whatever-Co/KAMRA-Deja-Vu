/* global THREE */
import $ from 'jquery'
import 'OrbitControls'
import dat from 'dat-gui'
import {vec2, mat3} from 'gl-matrix'

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
    // console.table(this.getBounds(position))
    for (let i = 0; i < position.length; i += 3) {
      this.originalPoints.push([position[i], position[i + 1]])
    }
    this.originalPoints.push([1, 1])
    this.originalPoints.push([1, -1])
    this.originalPoints.push([-1, -1])
    this.originalPoints.push([-1, 1])

    this.triangleIndices = Delaunay.triangulate(this.originalPoints)

    this.context = this.canvas.getContext('2d')
    this.context.fillStyle = '#ffffff'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.strokeStyle = '#000000'
    let scale = 250
    this.context.lineWidth = 0.2 / scale
    this.context.translate(250, 250)
    this.context.scale(scale, -scale)
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

    return $.getJSON('media/shutterstock_62329042.json').done((fp) => {

      let displacement = this.normalizeFeaturePoints(fp).map((c, i) => {
        let fp = getPosition(this.standardData.face.featurePoint[i])
        return vec2.sub([], c, fp)
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
        this.capturedPoints.push(p)
      }

      this.capturedPoints.push([1, 1])
      this.capturedPoints.push([1, -1])
      this.capturedPoints.push([-1, -1])
      this.capturedPoints.push([-1, 1])

      this.context.save()
      this.context.translate(2, 0)
      this.drawTriangles(this.capturedPoints)
      this.context.restore()
    })
  }


  normalizeFeaturePoints(points) {
    // console.log(points.length, points)

    let {size: standardSize} = this.getBounds2(this.standardData.face.featurePoint.filter((fp) => {
      return fp >= 0
    }).map((fp) => {
      let index = fp * 3
      let position = this.standardData.face.position
      return [position[index], position[index + 1]]
    }))
    let len = vec2.len(standardSize)
    // console.log(standardSize)

    let {size} = this.getBounds2(points)
    let scale = len / vec2.len(size)
    let center = points[41]

    let yAxis = vec2.sub([], points[75], points[7])
    let angle = Math.atan2(yAxis[1], yAxis[0]) - Math.PI * 0.5

    let mtx = mat3.create()
    mat3.rotate(mtx, mtx, -angle)
    mat3.scale(mtx, mtx, [scale, scale])
    mat3.translate(mtx, mtx, vec2.scale([], center, -1))
    let normalized = points.map((p) => {
      return vec2.transformMat3([], p, mtx)
    })

    // open the mouth
    let lipPair = [[45, 61], [47, 60], [49, 59], [52, 58], [53, 57], [54, 56]]
    let lipThickness = lipPair.map((pair) => {
      return normalized[pair[0]][1] - normalized[pair[1]][1]
    })

    let mouthWidth = normalized[50][0] - normalized[44][0]
    let mouthHeight = normalized[60][1] - normalized[57][1]
    let offset = mouthWidth * 0.2 - mouthHeight
    let origin = vec2.lerp([], normalized[46], normalized[48], 0.5)
    scale = (Math.abs(normalized[53][1] - origin[1]) + offset) / Math.abs(normalized[53][1] - origin[1])
    mtx = mat3.create()
    mat3.translate(mtx, mtx, origin)
    mat3.scale(mtx, mtx, [1, scale])
    mat3.translate(mtx, mtx, vec2.scale([], origin, -1))
    for (let i = 44; i <= 61; i++) {
      vec2.transformMat3(normalized[i], normalized[i], mtx)
    }
    lipPair.forEach((pair, i) => {
      normalized[pair[1]][1] = normalized[pair[0]][1] - lipThickness[i]
    })

    return normalized
  }


  loadMorphTarget() {
    this.morphedPoints = []
    let position = require('./morph2.json')[4].face.vertices
    for (let i = 0; i < position.length; i += 3) {
      this.morphedPoints.push([position[i], position[i + 1]])
    }
    this.morphedPoints.push([1, 1])
    this.morphedPoints.push([1, -1])
    this.morphedPoints.push([-1, -1])
    this.morphedPoints.push([-1, 1])

    this.context.save()
    this.context.translate(0, -2)
    this.drawTriangles(this.morphedPoints)
    this.context.restore()
  }


  calcMorphed() {
    let deformed = this.morphedPoints.map((mp, i) => {
      let r = this.getTriangleIndex(mp, this.originalPoints)
      if (r) {
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
    this.context.translate(2, -2)
    this.drawTriangles(deformed)
    this.context.restore()
  }


  onMouseMove(e) {
    // console.log(e)
    e.preventDefault()

    let ctx = this.overlay.getContext('2d')
    ctx.clearRect(0, 0, 1000, 1000)

    let mx = (e.offsetX - 250) / 250
    let my = -(e.offsetY - 250) / 250
    let ret = this.getTriangleIndex([mx, my], this.originalPoints)
    // console.log(mx, my, ret)
    if (ret) {
      let [index, coord] = ret
      // console.log(index, coord)
      ctx.save()
      let scale = 250
      // ctx.lineWidth = 0.2 / scale
      ctx.translate(250, 250)
      ctx.scale(scale, -scale)

      ctx.fillStyle = 'rgba(255, 0, 0, 0.2'
      ctx.beginPath()
      ctx.arc(mx, my, 10 / scale, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.strokeStyle = 'rgba(200, 0, 0, 0.7)'
      ctx.lineWidth = 3 / scale
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

      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.arc(p0[0] * coord[0] + p1[0] * coord[1] + p2[0] * coord[2], p0[1] * coord[0] + p1[1] * coord[1] + p2[1] * coord[2], 3 / scale, 0, Math.PI * 2)
      ctx.fill()

      ctx.translate(2, 0)
      ctx.beginPath()
      p0 = this.capturedPoints[this.triangleIndices[index + 0]]
      p1 = this.capturedPoints[this.triangleIndices[index + 1]]
      p2 = this.capturedPoints[this.triangleIndices[index + 2]]
      ctx.moveTo(p0[0], p0[1])
      ctx.lineTo(p1[0], p1[1])
      ctx.lineTo(p2[0], p2[1])
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.arc(p0[0] * coord[0] + p1[0] * coord[1] + p2[0] * coord[2], p0[1] * coord[0] + p1[1] * coord[1] + p2[1] * coord[2], 3 / scale, 0, Math.PI * 2)
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
      let uv = Delaunay.contains([vertices[this.triangleIndices[i]], vertices[this.triangleIndices[i + 1]], vertices[this.triangleIndices[i + 2]]], p)
      if (uv) {
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
    return {min, max, size: vec2.sub([], max, min), center: vec2.lerp([], min, max, 0.5)}
  }


  getBounds2(vertices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    vertices.forEach((v) => {
      vec2.min(min, min, v)
      vec2.max(max, max, v)
    })
    return {min, max, size: vec2.sub([], max, min), center: vec2.lerp([], min, max, 0.5)}
  }

}


// new App()
new DelauneyTestApp()
