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
import FaceBlender from './face-blender'

import './main.sass'


export default class App {

  constructor() {
    this.loader = require('./asset-loader')
    this.loader.on('progress', (event) => {
      console.log(Math.round((event.progress / event.total) * 100))
    })
    this.loader.on('complete', (event) => {
      // console.log(this.loader.getResult('keyframes'))
      this.initScene()
      this.initObjects()
      Ticker.on('update', this.update.bind(this))
      Ticker.start()
    })
    this.loader.load()
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
    // this.webcam.visible = false

    this.face = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face.matrixAutoUpdate = false
    this.face.scale.set(300, 300, 300)
    // this.face.updateMatrixWorld()
    this.scene.add(this.face)

    this._updateObjects = () => {
      if (this.webcam.normalizedFeaturePoints) {
        this.face.geometry.deform(this.webcam.normalizedFeaturePoints)
        this.face.matrix.copy(this.webcam.matrixFeaturePoints)
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.keyCode == 32 && this.webcam.normalizedFeaturePoints) {
        // this.webcam.stop()
        this.webcam.pause()
        this.webcam.fadeOut()
        // this.webcam.visible = false
        this.face.material = new THREE.MeshBasicMaterial({map: this.webcam.texture.clone(), transparent: true, opacity: 0})
        this.face.renderOrder = 1
        this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 1700)
        this.face.position.set(0, 0, 0)
        this.face.rotation.set(0, 0, 0)
        this.face.scale.set(300, 300, 300)
        this.face.updateMatrix()
        this.face.updateMatrixWorld(true)
        new TWEEN.Tween(this.face.material).to({opacity: 1}, 2000).delay(15000).start().onComplete(() => {
          setTimeout(this.onParticleEnd.bind(this), 3000)
        })

        scale = Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2)
        let sprite = new THREE.CanvasTexture(this.loader.getResult('particle-sprite'))
        let lut = new THREE.CanvasTexture(this.loader.getResult('particle-lut'))
        lut.minFilter = lut.maxFilter = THREE.NearestFilter
        this.particles = new FaceParticle(scale, this.face, sprite, lut)
        this.scene.add(this.particles)
        this.particles.update()
        this.particles.start()

        this._updateObjects = null
      }
    })
  }


  onParticleEnd() {
    this.webcam.visible = true
    // this.webcam.start()
    this.webcam.resume()
    this.webcam.fadeIn()

    this.face2 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({map: this.webcam.texture, transparent: true}))
    this.face2.scale.set(300, 300, 300)
    this.face2.visible = false
    this.scene.add(this.face2)
    this.face2.matrixAutoUpdate = false
  
    this.face.visible = false

    this._updateObjects = () => {
      if (this.webcam.normalizedFeaturePoints) {
        // this.face2.geometry.deform(this.webcam.normalizedFeaturePoints)
        this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 1700)
        this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
      }
    }


    this.blender = new FaceBlender(this.face, this.face2)
    this.scene.add(this.blender)
    new TWEEN.Tween(this.blender).to({blend: 1}, 5000).easing(TWEEN.Easing.Exponential.InOut).start().onComplete(() => {
      this.blender.visible = false
      this.face2.visible = true
    })
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this._updateObjects) {
      this._updateObjects(currentFrame, time)
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
