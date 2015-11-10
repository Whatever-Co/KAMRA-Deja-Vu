/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import dat from 'dat-gui'
import TWEEN from 'tween.js'
import {vec3} from 'gl-matrix'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcam-plane'
import DeformableFaceGeometry from './deformable-face-geometry'
import FaceParticle from './face-particle'

import './main.sass'


export default class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    this.webcam = new WebcamPlane(this.camera)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)
    this.webcam.start()
    this.webcam.visible = false

    this.face = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    // this.face.matrixAutoUpdate = false
    this.face.scale.set(300, 300, 300)
    this.face.updateMatrixWorld()
    this.scene.add(this.face)

    scale = Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2)
    this.particles = new FaceParticle(scale, this.face)
    this.scene.add(this.particles)
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this.webcam.normalizedFeaturePoints) {
      if (!this.face.material.map) {
        this.face.material.map = this.webcam.texture
        this.face.material.needsUpdate = true
      }
      this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 1700)
      // this.face.geometry.deform(this.webcam.normalizedFeaturePoints)
      // this.face.matrix.copy(this.webcam.matrixFeaturePoints)
      this.particles.update()
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }

}

new App()
