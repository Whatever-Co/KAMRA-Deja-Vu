/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
// import dat from 'dat-gui'
import {vec2, vec3, mat3} from 'gl-matrix'
import Stats from 'stats-js'

import Ticker from './ticker'
import WebcamPlane from './webcamplane'
import DeformableFace from './deformableface'

import './main.sass'
document.body.innerHTML = require('./main.jade')()



class App {

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
    this.webcam = new WebcamPlane(this.camera)
    this.webcam.addEventListener('complete', (e) => {
      console.info('OK!!!!!!!!!!!!!', e)
      this.webcam.stop()
      this.webcam.applyTextureForFace(this.face)
      this.webcam.visible = false
      this.face.prepareForMorph()
      this.morphStart = performance.now()
    })
    this.webcam.start()
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    this.face = new DeformableFace()
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    // debug markers
    // {
    //   this._markers = []
    //   let size = 5
    //   let geometry = new THREE.BoxGeometry(size, size, size)
    //   let material = new THREE.MeshBasicMaterial({color: 0xff0000, depthTest: false, transparent: true, opacity: 0.5})
    //   for (let i = 0;  i < 80; i++) {
    //     let mesh = new THREE.Mesh(geometry, material)
    //     this.scene.add(mesh)
    //     this._markers.push(mesh)
    //   }
    // }
  }


  animate(t) {
    this.stats.begin()

    if (this.webcam.visible) {
      if (this.webcam.normalizedFeaturePoints) {
        this.face.deform(this.webcam.normalizedFeaturePoints)
        this.face.matrix.copy(this.webcam.matrixFeaturePoints)
        this.face.matrixWorldNeedsUpdate = true

        // this.webcam.featurePoint3D.forEach((p, i) => {
        //   this._markers[i].position.set(p[0], p[1], p[2])
        // })
      }
    } else {
      let currentFrame = Math.floor((performance.now() - this.morphStart) / 1000 * 24) % 1000
      this.face.applyMorph(this.keyframes.user.property.face_vertices[currentFrame])
    }

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



new App()
// new (require('./keyframeanimeapp.js'))()
