/* global THREE createjs */

import {EventEmitter} from 'events'
import $ from 'jquery'
import 'jquery.transit'
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
import WebcamPlane from './webcam-plane'
import FaceController from './face-controller'



export default class App extends EventEmitter {

  constructor(keyframes) {
    super()

    this.keyframes = keyframes
    this.controllers = []

    this.initWebGL()

    this.noiseLayer = $('.noise')

    Ticker.on('update', this.animate.bind(this))
  }


  initWebGL() {
    this.camera = new THREE.PerspectiveCamera(this.keyframes.camera.property.fov[0], 16 / 9, 10, 10000)
    this.camera.position.z = this.keyframes.camera.property.position[2]

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({canvas: document.querySelector('canvas#main')})
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    this.renderer.setClearColor(0x071520, 1)
    this.renderer.clear()

    // post-processing
    this.composer = new THREE.EffectComposer(this.renderer)
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera))
    {
      let effect = new THREE.ShaderPass(THREE.FXAAShader)
      effect.uniforms.resolution.value.set(1 / Config.RENDER_WIDTH, 1 / Config.RENDER_HEIGHT)
      this.composer.addPass(effect)
    }
    {
      this.composer.addPass(new THREE.ShaderPass({
        uniforms: {
          tDiffuse: {type: 't', value: null},
          resolution: {type: 'v2', value: new THREE.Vector2(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)}
        },
        vertexShader: require('./shaders/basic-transform.vert'),
        fragmentShader: require('./shaders/chromatic-aberration.frag')
      }))
    }
    {
      let effect = new THREE.ShaderPass(THREE.VignetteShader)
      effect.uniforms.darkness.value = 1.2
      this.composer.addPass(effect)
    }
    {
      let texture = new THREE.CanvasTexture(window.__djv_loader.getResult('colorcorrect-lut'))
      texture.magFilter = texture.minFilter = THREE.NearestFilter
      texture.generateMipmaps = false
      texture.flipY = false
      this.composer.addPass(new THREE.ShaderPass({
        uniforms: {
          tDiffuse: {type: 't', value: null},
          tLut: {type: 't', value: texture}
        },
        vertexShader: require('./shaders/basic-transform.vert'),
        fragmentShader: require('./shaders/color-correction.frag'),
      }))
    }
    this.composer.passes[this.composer.passes.length - 1].renderToScreen = true

    //
    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()

    if (Config.DEV_MODE) {
      this.scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 1000, 10, 10), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.2})))

      this.stats = new Stats()
      document.body.appendChild(this.stats.domElement)

      this._frameCounter = $('<div>').attr({id: '_frame-counter'}).appendTo(document.body)
    }
  }


  start(useWebcam) {
    // music
    this.sound = createjs.Sound.createInstance('music-main')
    this.sound.volume = 0.05
    this.sound.pan = 0.0000001 // これがないと Chrome だけ音が右に寄る...?
    this.sound.on('complete', () => {
      Ticker.setClock(null)
      this.emit('complete')
    })

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
          src: 'data/_/440344979.mp4',
          width: 1280,
          height: 720,
          muted: true
        }).appendTo('body')[0]
        this._vcon.currentTime = 2 / 24
        this._vcon.play()

        // setTimeout(() => {
        //   this.sound.position = 3390 / 24 * 1000
        // }, 1000)
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

    this.composer.render()

    if (currentFrame % 2 == 0) {
      this.noiseLayer.css({backgroundPosition: `${~~(Math.random() * 512)}px ${~~(Math.random() * 512)}px`})
    }

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
