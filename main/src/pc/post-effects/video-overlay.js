/* global THREE */

import Config from '../config'


export default class VideoOverlay extends THREE.ShaderPass {

  constructor() {
    super({
      uniforms: {
        tDiffuse: {type: 't', value: null},
        overlay: {type: 't', value: null},
      },
      vertexShader: require('../shaders/basic-transform.vert'),
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D overlay;
        varying vec2 vUv;
        void main() {
          gl_FragColor = max(texture2D(tDiffuse, vUv), texture2D(overlay, vUv));
        }
      `
    })

    new THREE.EventDispatcher().apply(this)

    this.video = document.createElement('video')
    this.video.src = 'textures/bg_movie_prizm.mp4?.jpg'
    this.video.addEventListener('canplay', this.loadedmetadata.bind(this))
    this.video.addEventListener('ended', this.ended.bind(this))
    this.video.load()

    this.enabled = false
  }


  loadedmetadata() {
    this.video.width = this.video.videoWidth
    this.video.height = this.video.videoHeight
    this.texture = new THREE.CanvasTexture(this.video)
    this.uniforms.overlay.value = this.texture
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
    this.texture.needsUpdate = true
  }


  get position() {
    return this.video.currentTime * 1000
  }

  set position(value) {
    this.video.currentTime = value / 1000
  }

}
