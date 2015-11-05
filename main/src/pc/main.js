/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import Stats from 'stats-js'
import StateMachine from 'javascript-state-machine'

import Ticker from './ticker'
import WebcamPlane from './webcamplane'
import DeformableFace from './deformableface'


const RENDER_WIDTH = 1920
const RENDER_HEIGHT = 1080



class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initStates()
    this.loadAssets()
  }


  initStates() {
    this.statesMachine = StateMachine.create({
      initial: 'loadAssets',
      events: [
        {name: 'loadComplete', from: 'loadAssets', to: 'entrance'},
        {name: 'start', from: 'entrance', to: 'captureFace'},
        {name: 'captured', from: 'captureFace', to: 'playing'},
        {name: 'playCompleted', from: 'playing', to: 'share'},
        {name: 'goEntrance', from: 'share', to: 'entrance'}
      ]
    })

    this.statesMachine.ontop = () => {
      this.statesMachine.start()
    }
    // this.statesMachine.oncaptureFace = () => {
    //   console.log('oncaptureFace')
    // }
  }


  loadAssets() {
    $.getJSON('data/keyframes.json').done((result) => {
      this.keyframes = result
      console.log(this.keyframes)

      this.initScene()
      this.initObjects()

      this.stats = new Stats()
      document.body.appendChild(this.stats.domElement)

      Ticker.on('update', this.animate)
      Ticker.start()

      this.statesMachine.loadComplete()
    })
  }



  initScene() {
    let fov = this.keyframes.camera.property.fov[0]
    this.camera = new THREE.PerspectiveCamera(fov, 16 / 9, 1, 5000)
    this.camera.position.z = this.keyframes.camera.property.position[2]

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()

    this.controllers = []
    this.previouslyEnabledControllers = []
  }


  initObjects() {
    this.webcam = new WebcamPlane(this.camera)
    this.webcam.addEventListener('complete', () => {
      this.webcam.stop()
      this.webcam.applyTextureForFace(this.face)
      this.webcam.visible = false
      this.face.prepareForMorph()
      this.startFrame = Ticker.currentFrame
      this.captureController.enabled = false
      this.faceMorphController.enabled = true
    })
    this.webcam.start()
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    this.face = new DeformableFace()
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    this.captureController = {
      enabled: true,
      update: () => {
        if (this.webcam.normalizedFeaturePoints) {
          this.face.deform(this.webcam.normalizedFeaturePoints)
          this.face.matrix.copy(this.webcam.matrixFeaturePoints)
          this.face.matrixWorldNeedsUpdate = true
        }
      }
    }
  
    this.faceMorphController = {
      enabled: false,
      update: (frameCount) => {
        let f = (frameCount - this.startFrame) % 1843
        this.face.applyMorph(this.keyframes.user.property.face_vertices[f])
      }
    }

    this.controllers.push(this.captureController, this.faceMorphController)
  }


  animate(frameCount) {
    this.stats.begin()

    this.controllers.forEach((controller) => {
      if (controller.enabled) {
        controller.update(frameCount)
      }
    })

    this.renderer.render(this.scene, this.camera)

    this.stats.end()
  }


  onResize() {
    let s = Math.max(window.innerWidth / RENDER_WIDTH, window.innerHeight / RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      scale: [s, s],
      translate: [(window.innerWidth - RENDER_WIDTH * s) / 2, (window.innerHeight - RENDER_HEIGHT * s) / 2]
    })
  }

}

new App()
