/* global THREE */

import TWEEN from 'tween.js'

import Config from '../config'


export default class CompositePass extends THREE.ShaderPass {

  constructor(lut) {
    lut.magFilter = lut.minFilter = THREE.NearestFilter
    lut.generateMipmaps = false
    lut.flipY = false
    super({
      uniforms: {
        resolution: {type: 'v2', value: new THREE.Vector2(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)},
        tDiffuse: {type: 't', value: null},
        tLut: {type: 't', value: lut},
        lutBlend: {type: 'f', value: 0},
        tOverlay: {type: 't', value: null},
      },
      vertexShader: require('../shaders/basic-transform.vert'),
      fragmentShader: require('../shaders/composite1.frag'),
    })

    new THREE.EventDispatcher().apply(this)

    this.video = document.createElement('video')
    this.video.src = 'textures/bg_movie_prizm.mp4?.jpg'
    this.video.addEventListener('canplay', this.loadedmetadata.bind(this))
    this.video.addEventListener('ended', this.ended.bind(this))
    this.video.load()
    // this.video.muted = true

    this.enabled = true
  }

  set lutBlend(value) {
    this.uniforms.lutBlend.value = value
  }

  get lutBlend() {
    return this.uniforms.lutBlend.value
  }

  setLUTEnabled(value) {
    new TWEEN.Tween(this).to({lutBlend: value ? 1 : 0}, 5000).start()
  }


  loadedmetadata() {
    this.video.width = this.video.videoWidth
    this.video.height = this.video.videoHeight
    this.texture = new THREE.CanvasTexture(this.video)
    this.uniforms.tOverlay.value = this.texture
  }


  ended() {
    this.dispatchEvent({type: 'complete'})
  }


  start() {
    this.video.currentTime = 0
    this.video.play()
    this.enabled = true
  }


  update() {
    if (this.texture) {
      this.texture.needsUpdate = true
    }
  }


  get position() {
    return this.video.currentTime * 1000
  }

  set position(value) {
    this.video.currentTime = value / 1000
  }

}
