/* global THREE createjs */

import {EventEmitter} from 'events'
import $ from 'jquery'
import 'jquery.transit'
import _ from 'lodash'
import TWEEN from 'tween.js'
import Stats from 'stats-js'

import 'shaders/CopyShader'
// import 'shaders/BokehShader'
import 'shaders/FXAAShader'
import 'shaders/VignetteShader'
import 'postprocessing/ShaderPass'
import 'postprocessing/MaskPass'
import 'postprocessing/RenderPass'
// import 'postprocessing/BokehPass'
import 'postprocessing/EffectComposer'

import Ticker from './ticker'
import Config from './config'
import ParticledLogo from './particled-logo'
import WebcamPlane from './webcam-plane'
import FaceController from './face-controller'

import ColorCorrectionPass from './post-effects/color-correction'
import ChromaticAberrationPass from './post-effects/chromatic-aberration'
import VideoOverlayPass from './post-effects/video-overlay'



export default class App extends EventEmitter {

  constructor(keyframes) {
    super()

    this.keyframes = keyframes
    this.controllers = []

    this.initScene()
    this.initPostprocessing()

    this.noiseLayer = $('.noise')

    Ticker.on('update', this.animate.bind(this))
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(this.keyframes.camera.property.fov[0], 16 / 9, 10, 10000)
    this.camera.position.z = this.keyframes.camera.property.position[2]

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({canvas: document.querySelector('canvas#main')})
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    this.renderer.setClearColor(0x071520, 1)
    this.renderer.clear()

    // logo
    {
      this.logo = new ParticledLogo(this.keyframes)
      let scale = 2 * Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z / 1080
      // console.log(scale)
      this.logo.scale.set(scale, scale, scale)
      this.scene.add(this.logo)
      this.controllers.push(this.logo)
      this.logo.enabled = true
    }

    //
    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()

    if (Config.DEV_MODE) {
      // this.scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 1000, 10, 10), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.2})))

      // this.stats = new Stats()
      // document.body.appendChild(this.stats.domElement)

      this._frameCounter = $('<div>').attr({id: '_frame-counter'}).appendTo(document.body)
    }
  }


  initPostprocessing() {
    this.composer = new THREE.EffectComposer(this.renderer)

    // render scene
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera))

    // antialias
    let fxaa = new THREE.ShaderPass(THREE.FXAAShader)
    fxaa.uniforms.resolution.value.set(1 / Config.RENDER_WIDTH, 1 / Config.RENDER_HEIGHT)
    this.composer.addPass(fxaa)

    // color correction
    this.composer.addPass(new ColorCorrectionPass(new THREE.CanvasTexture(window.__djv_loader.getResult('colorcorrect-lut'))))

    // texture overlay
    this.videoOverlay = new VideoOverlayPass()
    this.videoOverlay.addEventListener('complete', () => {
      Ticker.setClock(null)
      this.emit('complete')
    })
    this.composer.addPass(this.videoOverlay)
    this.controllers.push(this.videoOverlay)

    // chromatic aberration
    this.composer.addPass(new ChromaticAberrationPass())

    // vignette
    let vignette = new THREE.ShaderPass(THREE.VignetteShader)
    vignette.uniforms.darkness.value = 1.2
    this.composer.addPass(vignette)

    _.last(this.composer.passes).renderToScreen = true
  }


  start(sourceType) {
    // camera controller
    this.camera.enabled = false
    this.camera.update = (currentFrame) => {
      if (this.keyframes.camera.in_frame <= currentFrame && currentFrame <= this.keyframes.camera.out_frame) {
        let f = currentFrame - this.keyframes.camera.in_frame
        let props = this.keyframes.camera.property
        this.camera.fov = props.fov[f]
        this.camera.updateProjectionMatrix()
        this.camera.position.fromArray(props.position, f * 3)
        this.camera.quaternion.fromArray(props.quaternion, f * 4)

        let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
        this.webcam.scale.set(scale, scale, scale)
        this.webcam.rotation.z = this.camera.rotation.z
      }
    }
    this.controllers.push(this.camera)

    // webcam
    this.webcam = new WebcamPlane(this.keyframes, this.camera, this.renderer)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    this.webcam.addEventListener('detected', () => {
      this.logo.setMode('tracker')
      this.logo.updateVertices(this.face, this.camera.position.z)
    })
    this.webcam.addEventListener('lost', () => {
      this.logo.setMode('circle')
    })

    this.webcam.addEventListener('complete', () => {
      console.time('capture')
      this.face.captureWebcam()
      this.webcam.enableTracking = false
      this.webcam.drawFaceHole = true

      this.camera.enabled = true

      Ticker.setClock(this.videoOverlay)
      this.videoOverlay.start()
      // setTimeout(() => {
      //   this.videoOverlay.start()
      // }, 1000)
      console.timeEnd('capture')

      if (Config.DEV_MODE) {
        this._vcon = $('<video>').attr({
          id: '_vcon',
          src: 'data/_/440344979.mp4',
          width: 1280,
          height: 720,
          muted: true
        }).appendTo('body')[0]
        this._vcon.currentTime = 2 / 24
        this._vcon.play()

        // setTimeout(() => {
        //   this.videoOverlay.position = 3290 / 24 * 1000
        // }, 3000)
      }
    })
    this.controllers.push(this.webcam)

    // face
    this.face = new FaceController(this.keyframes, this.webcam, this.renderer, this.camera)
    this.scene.add(this.face)
    this.controllers.push(this.face)

    this.logo.setMode('circle')

    this.webcam.start(sourceType)
  }


  animate(currentFrame, time) {
    // console.time('frame')
    if (Config.DEV_MODE) {
      // this.stats.begin()
      this._frameCounter.text(currentFrame)
    }

    this.controllers.forEach((controller) => {
      if (controller.enabled) {
        controller.update(currentFrame, time)
      }
    })

    TWEEN.update(time)

    this.composer.render()

    if (currentFrame % 2 == 0) {
      this.noiseLayer.css({backgroundPosition: `${~~(Math.random() * 512)}px ${~~(Math.random() * 512)}px`})
    }

    // if (Config.DEV_MODE) {
    //   this.stats.end()
    // }
    // console.timeEnd('frame')
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
