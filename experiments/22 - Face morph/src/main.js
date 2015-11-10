/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import DeformableFaceGeometry from './deformable-face-geometry'
import FaceBlender from './face-blender'

import './main.sass'


export default class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    let loader = new createjs.LoadQueue()
    // loader.loadFile({id: 'keyframes', src: 'keyframes.json'})
    let items = [
      'shutterstock_38800999',
      'shutterstock_56254417',
      'shutterstock_61763248',
      // 'shutterstock_62329042',
      'shutterstock_62329057',
      'shutterstock_102487424',
      'shutterstock_102519095',
      'shutterstock_154705646'
    ]
    items.forEach((name, i) => {
      loader.loadFile({id: `data${i}`, src: `media/${name}.json`})
      loader.loadFile({id: `image${i}`, src: `media/${name}.png`})
    })
    loader.on('complete', () => {
      this.faces = items.map((name, i) => {
        let featurePoints = loader.getResult(`data${i}`)
        let image = loader.getResult(`image${i}`)
        return {
          geometry: new DeformableFaceGeometry(featurePoints, 512, 512, 400, this.camera.position.z),
          texture: new THREE.CanvasTexture(image)
        }
      })

      this.blender = new FaceBlender(this.faces[0].geometry, this.faces[0].texture, this.faces[1].geometry, this.faces[1].texture)
      this.scene.add(this.blender)

      this.current = 1
      this.change()

      this.scene.scale.set(300, 300, 300)
    })
  }


  change() {
    let n = this.current
    this.blender.setFace1(this.faces[n].geometry, this.faces[n].texture)
    n = this.current = ~~(Math.random() * this.faces.length)
    this.blender.setFace2(this.faces[n].geometry, this.faces[n].texture)
    this.blender.blend = 0
    new TWEEN.Tween(this.blender).to({blend: 1}, 200 + Math.random() * 2000).delay(500).easing(TWEEN.Easing.Cubic.InOut).start().onComplete(this.change.bind(this))
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    // if (this.blender) {
    //   this.blender.blend = Math.sin(time / 1000) * 0.5 + 0.5
    // }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
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
