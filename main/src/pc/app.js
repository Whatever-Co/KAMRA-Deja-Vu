/* global THREE */

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
import 'postprocessing/TexturePass'
import 'postprocessing/EffectComposer'

import Ticker from './ticker'
import Config from './config'
import ParticledLogo from './particled-logo'
import UserWebcamPlane from './user-webcam-plane'
import UserVideoPlane from './user-video-plane'
import UserImagePlane from './user-image-plane'
const PLANE_CLASSES = {webcam: UserWebcamPlane, video: UserVideoPlane, shared: UserImagePlane}
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
    this.camera.position.fromArray(this.keyframes.camera.property.position)
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

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({canvas: document.querySelector('canvas#main')})
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    this.renderer.setClearColor(0x031a29, 1)
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
      Ticker.addFrameEvent(50, () => {
        this.logo.hide().then(() => {
          this.scene.remove(this.logo)
          this.logo.enabled = false
        })
      })
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
    this.colorCorrection = new ColorCorrectionPass(new THREE.CanvasTexture(window.__djv_loader.getResult('colorcorrect-lut')))
    this.composer.addPass(this.colorCorrection)

    // texture overlay
    this.videoOverlay = new VideoOverlayPass()
    this.videoOverlay.addEventListener('complete', this.onVideoComplete.bind(this))
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


  initSourcePlane(clazz) {
    this.webcam = new clazz(this.keyframes, this.camera, this.renderer)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)
    this.controllers.push(this.webcam)
  }


  prepareForImage(image, featurePoints, focusFaceEdge = false) {
    if (!this.webcam) {
      this.initSourcePlane(UserImagePlane)
    }
    this.webcam.init(image, featurePoints)

    if (!this.face) {
      this.face = new FaceController(this.keyframes, this.webcam, this.renderer, this.camera)
      this.scene.add(this.face)
      this.controllers.push(this.face)
    }

    if (focusFaceEdge) {
      this.face.main.geometry.deform(this.webcam.normalizedFeaturePoints)
      this.face.main.matrix.copy(this.webcam.matrixFeaturePoints)
      this.logo.setMode('tracker')
      this.logo.updateVertices(this.face, this.camera.position.z)
    }
  }


  start(sourceType, remapType = -1) {
    this.sourceType = sourceType

    if (!this.webcam) {
      this.initSourcePlane(PLANE_CLASSES[sourceType])
    }
    this.webcam.addEventListener('detected', () => {
      this.logo.setMode('tracker')
      this.logo.updateVertices(this.face, this.camera.position.z)
    })
    this.webcam.addEventListener('lost', () => this.logo.setMode('circle'))
    this.webcam.addEventListener('complete', this.onWebcamComplete.bind(this))

    if (!this.face) {
      this.face = new FaceController(this.keyframes, this.webcam, this.renderer, this.camera, sourceType == 'video')
      this.scene.add(this.face)
      this.controllers.push(this.face)
    }
    if (remapType == -1) {
      this.face.creepyFaceTexture.setRemapType(THREE.Math.randInt(0, 5))
    } else {
      this.face.creepyFaceTexture.setRemapType(remapType)
    }

    if (this.sourceType == 'webcam' || this.sourceType == 'video') {
      this.logo.setMode('circle')
    }
    this.webcam.start()

    this.colorCorrection.setEnabled(true)
  }


  onWebcamComplete() {
    console.time('capture')
    this.face.captureWebcam(this.sourceType == 'webcam' || this.sourceType == 'uploaded')
    this.webcam.enableTracking = false
    this.webcam.drawFaceHole = true

    this.camera.enabled = true

    Ticker.setClock(this.videoOverlay)
    // this.videoOverlay.start()
    setTimeout(() => {
      this.videoOverlay.start()
    })
    console.timeEnd('capture')

    if (Config.DEV_MODE) {
      // this._vcon = $('<video>').attr({
      //   id: '_vcon',
      //   src: 'data/_/440344979.mp4',
      //   width: 1280,
      //   height: 720,
      //   muted: true
      // }).appendTo('body')[0]
      // this._vcon.currentTime = 2 / 24
      // this._vcon.play()
    }
    Ticker.addFrameEvent(this.keyframes.i_extra.out_frame, () => {
      let t = parseInt(location.hash.substr(1))
      if (!isNaN(t)) {
        this.videoOverlay.position = t / 24 * 1000
      }
    })
  }


  onVideoComplete() {
    Ticker.setClock(null)

    if (this.sourceType == 'webcam' || this.sourceType == 'uploaded') {
      console.time('prepare form data')
      let formData = new FormData()
      formData.append('data', JSON.stringify({
        points: this.face.shareData.data,
        remapType: this.face.creepyFaceTexture.remapType
      }))
      formData.append('cap', this.renderTargetToBlob(this.face.shareData.cap))
      formData.append('kimo', this.renderTargetToBlob(this.applyPostEffect(this.face.shareData.kimo)))
      console.timeEnd('prepare form data')
      console.time('send to server')
      $.ajax({
        method: 'post',
        url: '/api/save/',
        data: formData,
        contentType: false,
        processData: false,
        dataType: 'json'
      }).done((data, status) => {
        console.timeEnd('send to server')
        console.log('success', data, status)
        if (status == 'success' && data && data.status == 201) {
          this.emit('complete', data.data.detail_url)
        } else {
          this.emit('complete')
        }
      }).fail((error) => {
        console.timeEnd('send to server')
        console.error(error)
        this.emit('complete')
      })
    } else {
      this.emit('complete')
    }
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
    let w = Math.max(1100, window.innerWidth)
    let s = Math.max(w / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      translate: [(w - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }


  applyPostEffect(target) {
    let result = target.clone()
    let composer = new THREE.EffectComposer(this.renderer, result)
    composer.addPass(new THREE.TexturePass(target))

    // antialias
    let fxaa = new THREE.ShaderPass(THREE.FXAAShader)
    fxaa.uniforms.resolution.value.set(1 / target.width, 1 / target.height)
    composer.addPass(fxaa)

    // color correction
    composer.addPass(this.colorCorrection)

    // chromatic aberration
    composer.addPass(new ChromaticAberrationPass())

    // vignette
    let vignette = new THREE.ShaderPass(THREE.VignetteShader)
    vignette.uniforms.darkness.value = 1.2
    composer.addPass(vignette)

    composer.render()

    return result
  }


  renderTargetToBlob(target) {
    let w = target.width
    let h = target.height
    let buffer = new Uint8Array(w * h * 4)
    this.renderer.readRenderTargetPixels(target, 0, 0, w, h, buffer)

    let canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    // document.body.appendChild(canvas)
    let ctx = canvas.getContext('2d')
    let imageData = ctx.createImageData(w, h)
    imageData.data.set(buffer)
    ctx.putImageData(imageData, 0, 0)
    ctx.translate(0, canvas.height)
    ctx.scale(1, -1)
    ctx.drawImage(canvas, 0, 0)

    const type = 'image/jpeg'
    let base64 = canvas.toDataURL(type, 0.8)
    let bin = atob(base64.replace(/^.*,/, ''))
    buffer = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i)
    }
    let blob = new Blob([buffer.buffer], {type})
    return blob
  }

}
