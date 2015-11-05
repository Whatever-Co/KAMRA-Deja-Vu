/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import StateMachine from 'javascript-state-machine'
import TWEEN from 'tween.js'
import Stats from 'stats-js'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcamplane'
import DeformableFace from './deformableface'



class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.controllers = []

    this.initStates()
    this.loadAssets()

    if (Config.DEV_MODE) {
      this.stats = new Stats()
      document.body.appendChild(this.stats.domElement)

      this._frameCounter = $('<div>').attr({id: '_frame-counter'}).appendTo(document.body)
    }
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
    let loader = new createjs.LoadQueue()
    loader.installPlugin(createjs.Sound)
    loader.loadManifest([
      {id: 'keyframes', src: 'data/keyframes.json'},
      {id: 'music-main', src: 'data/main.mp3'}
    ])
    loader.on('complete', () => {
      this.keyframes = loader.getResult('keyframes')
      console.log(this.keyframes)

      this.sound = createjs.Sound.createInstance('music-main')
      this.sound.pan = 0.0000001 // これがないと Chrome だけ音が右に寄る...?

      this.initScene()
      this.initObjects()
      this.initControllers()

      Ticker.on('update', this.animate)
      Ticker.start()

      this.statesMachine.loadComplete()
    })
  }



  initScene() {
    this.camera = new THREE.PerspectiveCamera(this.keyframes.camera.property.fov[0], 16 / 9, 1, 5000)
    this.camera.position.z = this.keyframes.camera.property.position[2]

    this.camera.enabled = false
    this.camera.update = (currentFrame) => {
      let props = this.keyframes.camera.property
      let f = Math.max(this.keyframes.camera.in_frame, Math.min(this.keyframes.camera.out_frame, currentFrame))
      this.camera.fov = props.fov[f]
      this.camera.updateProjectionMatrix()
      let i = f * 3
      this.camera.position.set(props.position[i], props.position[i + 1], props.position[i + 2])
      i = f * 4
      this.camera.quaternion.set(props.quaternion[i], props.quaternion[i + 1], props.quaternion[i + 2], props.quaternion[i + 3])
    }
    this.controllers.push(this.camera)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    this.startFrame = 999999999

    this.webcam = new WebcamPlane(this.camera)
    this.webcam.addEventListener('complete', () => {
      this.webcam.stop()
      this.webcam.applyTextureForFace(this.face)
      this.webcam.fadeOut()
      this.face.prepareForMorph()
      this.face.matrixAutoUpdate = true
      {
        let position = new THREE.Vector3()
        let quaternion = new THREE.Quaternion()
        let scale = new THREE.Vector3()
        this.face.matrix.decompose(position, quaternion, scale)
        this.face.initialTransform = {position, quaternion, scale}
      }
      this.camera.enabled = true
      this.captureController.enabled = false
      this.face.enabled = true
      this.sound.play()
      Ticker.setClock(this.sound)
    })
    this.webcam.start()
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    this.face = new DeformableFace(this.keyframes)
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)
    this.controllers.push(this.face)

    if (Config.DEV_MODE) {
      this.scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 1000, 10, 10), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3})))
    }
  }


  initControllers() {
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
    this.controllers.push(this.captureController)
  }


  animate(currentFrame, time) {
    if (Config.DEV_MODE) {
      this.stats.begin()
      this._frameCounter.text(currentFrame)
    }

    this.controllers.forEach((controller) => {
      if (controller.enabled) {
        controller.update(currentFrame)
      }
    })

    TWEEN.update(time)

    this.renderer.render(this.scene, this.camera)

    if (Config.DEV_MODE) {
      this.stats.end()
    }
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
