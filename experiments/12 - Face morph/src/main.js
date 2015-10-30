/* global THREE */
import $ from 'jquery'
import 'OrbitControls'
import dat from 'dat-gui'

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

      let gui = new dat.GUI()
      for (let i = 0; i < 11; i++) {
        let p = gui.add(this.face.mesh.material.uniforms.morphTargetInfluences.value, i, -1, 1).name(this.face.morph[i].name)
        this.face.mesh.material.uniforms.morphTargetInfluences.value[i] = 0
      }
      gui.__controllers.forEach((c) => c.updateDisplay())
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
    let canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1000
    document.body.appendChild(canvas)

    let position = require('./face.json').face.position
    let points = []
    for (let i = 0; i < position.length; i += 3) {
      points.push([250 + position[i] * 300, 250 - position[i + 1] * 300])
    }

    points.push([0.5, 0.5])
    points.push([500 - 0.5, 0.5])
    points.push([0.5, 500 - 0.5])
    points.push([500 - 0.5, 500 - 0.5])

    let result = Delaunay.triangulate(points)

    let ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 0.2
    for (let i = 0; i < result.length; i += 3) {
      ctx.beginPath()
      ctx.moveTo(points[result[i + 0]][0], points[result[i + 0]][1])
      ctx.lineTo(points[result[i + 1]][0], points[result[i + 1]][1])
      ctx.lineTo(points[result[i + 2]][0], points[result[i + 2]][1])
      ctx.closePath()
      ctx.stroke()
    }
  }

}


new App()
// new DelauneyTestApp()
