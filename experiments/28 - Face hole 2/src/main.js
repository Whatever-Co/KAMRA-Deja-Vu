/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import dat from 'dat-gui'
import {vec2} from 'gl-matrix'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcam-plane'
import DeformableFaceGeometry from './deformable-face-geometry'

import './main.sass'



class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 2400)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setClearColor(0x172b35)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    this.face = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.2}))
    this.face.matrixAutoUpdate = false
    // this.scene.add(this.face)

    // webcam
    this.webcam = new WebcamPlane(null, this.camera, this.renderer, this.face.geometry)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    // this.webcam.addEventListener('complete', this.takeSnapshot.bind(this))
    this.webcam.start(true)

    window.addEventListener('keydown', (e) => {
      if (e.keyCode == 32) {
        this.webcam.drawFaceHole = !this.webcam.drawFaceHole
      }
    })
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this.webcam.enabled) {
      this.webcam.update(currentFrame)
      if (this.webcam.normalizedFeaturePoints) {
        this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 2400)
        this.face.matrix.copy(this.webcam.matrixFeaturePoints)
      }
    }

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
