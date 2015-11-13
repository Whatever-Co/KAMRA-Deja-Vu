/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import dat from 'dat-gui'
import TWEEN from 'tween.js'
import {vec2, mat3} from 'gl-matrix'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcam-plane'

import DeformableFaceGeometry from './deformable-face-geometry'
import FaceHolePlane from './face-hole-plane'

import './main.sass'
document.body.innerHTML = require('./main.jade')()

class App {

  constructor() {
    this.initScene()
    this.initObjects()
    this.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 2400)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    // webcam
    this.webcam = new WebcamPlane(this.camera)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    this.webcam.addEventListener('complete', this.takeSnapshot.bind(this))
    this.webcam.start()

    // face
    this.face = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    this.faceHole = new FaceHolePlane()
    this.faceHole.matrixAutoUpdate = false
    this.scene.add(this.faceHole)



    this.gui = new dat.GUI()
    this.gui.add(this, 'takeSnapshot').name('Take snapshot')

    {
      // Hole canvas

      $(this.faceHole.canvas).css({
        position: "absolute",
        border: "1px solid",
        top: "0",
        left: "0",
        transformOrigin: 'left top',
        transform:'scale(0.5)'
      })
      document.body.appendChild(this.faceHole.canvas)
    }
  }


  takeSnapshot() {
    if(!this.webcam.rawFeaturePoints) {
      console.warn('not tracking')
      return
    }

    this.faceHole.capture(this.webcam)
  }

  start() {
    this.startTime = performance.now()
    this.previousFrame = -1
    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this.webcam.normalizedFeaturePoints) {
      this.face.geometry.deform(this.webcam.normalizedFeaturePoints)
      this.face.matrix.copy(this.webcam.matrixFeaturePoints)
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      scale: [s, s],
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2]
    })
  }

}

new App()
