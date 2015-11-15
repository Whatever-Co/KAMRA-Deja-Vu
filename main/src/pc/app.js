/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import StateMachine from 'javascript-state-machine'
import TWEEN from 'tween.js'
import Stats from 'stats-js'

import Ticker from './ticker'
import Config from './config'
import PageManager from './page-manager'
import PreprocessWorker from 'worker!./preprocess-worker'
import WebcamPlane from './webcam-plane'
import FaceController from './face-controller'



class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.controllers = []

    this.initStates()
    this.initAssets()
    this.initWebGL()
  }


  initStates() {
    this.stateMachine = StateMachine.create({
      initial: 'loadAssets',
      events: [
        {name: 'loadComplete', from: 'loadAssets', to: 'top'},
        {name: 'start', from: 'top', to: 'playing'},
        {name: 'playCompleted', from: 'playing', to: 'share'},
        {name: 'goTop', from: 'share', to: 'top'}
      ]
    })

    this.stateMachine.onenterplaying = this.start.bind(this)

    this.pageManager = new PageManager(this.stateMachine)

    // this.stateMachine.loadComplete()
  }


  initAssets() {
    let loader = window.__djv_loader

    this.keyframes = loader.getResult('keyframes')
    console.log(this.keyframes)

    let worker = new PreprocessWorker()
    let start = performance.now()
    console.log('start', start)
    this.keyframes = loader.getResult('keyframes')
    let vertices = this.keyframes.user.property.face_vertices.map((v) => new Float32Array(v))
    console.log('toarraybuffer', start)
    worker.postMessage(vertices, vertices.map((a) => a.buffer))
    worker.onmessage = (event) => {
      console.log('finish', performance.now())
      this.keyframes.user.property.morph = event.data

      this.stateMachine.loadComplete()
    }
  }


  initWebGL() {
    this.camera = new THREE.PerspectiveCamera(this.keyframes.camera.property.fov[0], 16 / 9, 10, 10000)
    this.camera.position.z = this.keyframes.camera.property.position[2]

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({canvas: document.querySelector('canvas#main')})
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    this.renderer.setClearColor(0x071520, 1)
    this.renderer.clear()

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()

    if (Config.DEV_MODE) {
      this.scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 1000, 10, 10), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.2})))

      this.stats = new Stats()
      document.body.appendChild(this.stats.domElement)

      this._frameCounter = $('<div>').attr({id: '_frame-counter'}).appendTo(document.body)
    }

    Ticker.on('update', this.animate)
    Ticker.start()
  }


  start(event, from, to, useWebcam) {
    // music
    this.sound = createjs.Sound.createInstance('music-main')
    // this.sound.volume = 0.05
    this.sound.pan = 0.0000001 // これがないと Chrome だけ音が右に寄る...?
    this.sound.on('complete', () => {
      Ticker.setClock(null)
      this.stateMachine.playCompleted()
    })

    // camera controller
    this.camera.enabled = false
    this.camera.update = (currentFrame) => {
      let props = this.keyframes.camera.property
      let f = Math.max(this.keyframes.camera.in_frame, Math.min(this.keyframes.camera.out_frame, currentFrame))
      this.camera.fov = props.fov[f]
      this.camera.updateProjectionMatrix()
      this.camera.position.fromArray(props.position, f * 3)
      this.camera.quaternion.fromArray(props.quaternion, f * 4)

      let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
      this.webcam.scale.set(scale, scale, scale)
      this.webcam.rotation.z = this.camera.rotation.z
    }
    this.controllers.push(this.camera)

    // webcam
    this.webcam = new WebcamPlane(this.keyframes, this.camera)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    this.webcam.addEventListener('complete', () => {
      this.face.captureWebcam()
      this.webcam.enableTracking = false
      this.webcam.fadeOut()

      this.camera.enabled = true

      this.sound.play()
      Ticker.setClock(this.sound)

      if (Config.DEV_MODE) {
        this._vcon = $('<video>').attr({
          id: '_vcon',
          src: 'data/438726972.mp4',
          width: 1280,
          height: 720,
          muted: true
        }).appendTo('body')[0]
        this._vcon.currentTime = 2 / 24
        this._vcon.play()
      }
    })
    this.controllers.push(this.webcam)
    this.webcam.start(useWebcam)

    // face
    this.face = new FaceController(this.keyframes, this.webcam, this.renderer, this.camera)
    this.scene.add(this.face)
    this.controllers.push(this.face)
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
