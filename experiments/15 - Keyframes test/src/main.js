/* global THREE */

import $ from 'jquery'
import 'OrbitControls'
// import dat from 'dat-gui'
import {vec2, vec3, mat3} from 'gl-matrix'
import Stats from 'stats-js'

import Ticker from './ticker'

import './main.sass'
document.body.innerHTML = require('./main.jade')()



class KeyframeTestApp {

  constructor() {
    this.animate = this.animate.bind(this)

    $.getJSON('keyframes.json').done((result) => {
      this.keyframes = result
      console.log(this.keyframes)

      this.initScene()
      this.initObjects()

      this.stats = new Stats()
      document.body.appendChild(this.stats.domElement)

      this.previousFrame = -1
      this.scoreHistory = []

      Ticker.on('update', this.animate)
      Ticker.start()
    })
  }


  initScene() {
    let fov = this.keyframes.camera.property.fov[0]
    this.camera = new THREE.PerspectiveCamera(fov, 16 / 9, 1, 5000)
    this.camera.position.z = this.keyframes.camera.property.position[2]

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(1280, 720)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    // window.addEventListener('resize', this.onResize.bind(this))
    // this.onResize()
  }


  initObjects() {
    let geom = new THREE.BoxGeometry(50, 50, 50)
    let mat = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true})
    this.box = new THREE.Mesh(geom, mat)

    this.scene.add(this.box)

    // plane
    let planeGeom = new THREE.PlaneGeometry(267.949, 267.949, 4, 4)
    this.scene.add(new THREE.Mesh(planeGeom,
      new THREE.MeshBasicMaterial({color: 0x00ffff, wireframe: true })))

    // helper
    let axisHelper = new THREE.AxisHelper(100)
    this.scene.add(axisHelper)

    let gridHelper = new THREE.GridHelper(500, 10)
    this.scene.add(gridHelper)

  }


  animate(t) {
    this.stats.begin()

    let currentFrame = Math.floor(performance.now() / 1000 * 24) % 120

    this.camera.fov = this.keyframes.camera.property.fov[currentFrame]
    this.camera.updateProjectionMatrix()

    this.camera.position.set(
      this.keyframes.camera.property.position[currentFrame*3],
      this.keyframes.camera.property.position[currentFrame*3 + 1],
      this.keyframes.camera.property.position[currentFrame*3 + 2]
    )

    this.box.position.set(
      this.keyframes.box.property.position[currentFrame*3],
      this.keyframes.box.property.position[currentFrame*3 + 1],
      this.keyframes.box.property.position[currentFrame*3 + 2]
    )

    this.box.quaternion.set(
      this.keyframes.box.property.quaternion[currentFrame*4 + 0],
      this.keyframes.box.property.quaternion[currentFrame*4 + 1],
      this.keyframes.box.property.quaternion[currentFrame*4 + 2],
      this.keyframes.box.property.quaternion[currentFrame*4 + 3]
    )

    this.box.scale.set(
      this.keyframes.box.property.scale[currentFrame*3],
      this.keyframes.box.property.scale[currentFrame*3 + 1],
      this.keyframes.box.property.scale[currentFrame*3 + 2]
    )

    

    this.controls.update()
    this.renderer.render(this.scene, this.camera)

    this.stats.end()
  }


  onResize() {
    let s = Math.max(window.innerWidth / 1280, window.innerHeight / 720)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      scale: [s, s],
      translate: [(window.innerWidth - 1280 * s) / 2, (window.innerHeight - 720 * s) / 2]
    })
  }

}

class ModelApp {

  constructor() {
    this.animate = this.animate.bind(this)

    // init scene
    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 5000)
    this.camera.position.z = 10

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(1280, 720)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    // load models
    let faceJson = require('../../../data/3 - JSON/face_hull.json')

    let material = new THREE.MeshBasicMaterial({wireframe: true})

    let faceGeometry = new THREE.JSONLoader().parse(faceJson).geometry
    let faceMesh = new THREE.Mesh(faceGeometry, material)

    this.scene.add(faceMesh)

    Ticker.on('update', this.animate)
    Ticker.start()
  }

  animate(t) {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)

  }

}

new ModelApp()

// new KeyframeTestApp()
