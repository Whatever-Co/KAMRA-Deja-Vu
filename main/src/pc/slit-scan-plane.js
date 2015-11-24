/* global THREE */

import Config from './config'


export default class SlitScanPlane extends THREE.Mesh {

  constructor() {
    super(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {
        resolution: {type: 'v2', value: new THREE.Vector2(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)},
        blurSize: {type: 'f', value: 8},
        remap: {type: 't', value: null},
        face: {type: 't', value: null},
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: require('./shaders/slit-scan-remap.frag'),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }))

    this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {stencilBuffer: false})
    this.material.uniforms.face.value = this.renderTarget

    this.camera = new THREE.PerspectiveCamera(Config.DATA.slitscan.camera_fov, 1, 10, 10000)
    this.camera.position.fromArray(Config.DATA.slitscan.camera_position)

    this.scene = new THREE.Scene()

    this.video = document.createElement('video')
    this.video.width = this.video.height = 512
    this.video.src = 'textures/slitscan_uv_512.mp4?.jpg'
    this.video.load()
    this.material.uniforms.remap.value = new THREE.Texture(this.video)

    /*this.video.style.position = 'absolute'
    this.video.style.top = 0
    this.video.style.right = 0
    this.video.style.zIndex = 1000
    this.video.style.transformOrigin = 'top right'
    this.video.style.transform = 'scale(0.5, 0.5)'
    document.body.appendChild(this.video)*/
  }


  start(face) {
    this.face = new THREE.Mesh(face.geometry, face.material)
    this.face.matrix.copy(face.matrix)
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    this.video.play()
  }


  update(renderer) {
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.material.uniforms.remap.value.needsUpdate = true
    }

    if (!this.prevClearColor) {
      this.prevClearColor = renderer.getClearColor().clone()
    }
    renderer.setClearColor(0xff0000, 0)
    renderer.render(this.scene, this.camera, this.renderTarget, true)
    renderer.setClearColor(this.prevClearColor, 1)
  }

}
