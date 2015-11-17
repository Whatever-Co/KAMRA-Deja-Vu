/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'

import 'shaders/CopyShader'
import 'shaders/FXAAShader'
import 'postprocessing/ShaderPass'
import 'postprocessing/MaskPass'
import 'postprocessing/RenderPass'
import 'postprocessing/EffectComposer'

import Config from './config'
import Ticker from './ticker'
import ParticledLogo from './particled-logo'

import './main.sass'





class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.animate.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: false})
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.composer = new THREE.EffectComposer(this.renderer)
    this.composer.addPass(new THREE.RenderPass(this.scene, this.camera))
    let effect = new THREE.ShaderPass(THREE.FXAAShader)
    effect.uniforms.resolution.value.set(1 / Config.RENDER_WIDTH, 1 / Config.RENDER_HEIGHT)
    effect.renderToScreen = true
    this.composer.addPass(effect)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    this.logo = new ParticledLogo()
    let height = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    console.log(height)
    this.logo.position.set(height / 9 * 16 / -2, height / 2, 0)
    let scale = height / 1080
    this.logo.scale.set(scale, -scale, scale)
    this.scene.add(this.logo)

    window.addEventListener('keydown', (e) => {
      if (e.keyCode == 32) {
        console.log(this.logo.mode)
        this.logo.setMode(this.logo.mode == 'logo' ? 'circle' : 'logo')
      }
    })
  }


  animate(currentFrame, time) {
    this.logo.update(currentFrame, time)

    this.controls.update()
    // this.renderer.render(this.scene, this.camera)
    this.composer.render()
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
