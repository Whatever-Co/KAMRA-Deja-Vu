/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import dat from 'dat-gui'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcam-plane'
import DeformableFaceGeometry from './deformable-face-geometry'

import './main.sass'
document.body.innerHTML = require('./main.jade')()



class App {

  constructor() {
    this.initScene()
    this.initObjects()
    this.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 2400)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    // webcam
    this.webcam = new WebcamPlane(this.camera)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.scene.add(this.webcam)

    this.webcam.addEventListener('complete', this.takeSnapshot.bind(this))
    this.webcam.start()

    // face
    this.face = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    let gui = new dat.GUI()
    gui.add(this, 'takeSnapshot').name('Take snapshot')
  }


  _sendtest() {
    let canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1024
    // document.body.appendChild(canvas)
    let ctx = canvas.getContext('2d')
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgb(${~~(Math.random() * 255)}, ${~~(Math.random() * 255)}, ${~~(Math.random() * 255)})`
      ctx.fillRect(Math.random() * 500, Math.random() * 500, Math.random() * 500, Math.random() * 500)
    }
    let image = new Image()
    image.src = canvas.toDataURL()
    document.body.appendChild(image)

    let formData = new FormData()
    formData.append('image', canvas.toDataURL('image/jpeg', 0.7).split(',')[1])
    formData.append('image2', this.toBlob(canvas, 'image/jpeg', 0.7))
    formData.append('data', JSON.stringify({hoge: 'moge'}))
    $.ajax({
      method: 'post',
      url: 'http://localhost:3008/save',
      data: formData,
      contentType: false,
      processData: false
    }).done((data) => {
      console.log('success', data)
    }).fail((error) => {
      console.error(error)
    })
  }


  takeSnapshot() {
    this.webcam.stop()

    let formData = new FormData()
    // formData.append('image', this.webcam.textureCanvas.toDataURL('image/jpeg', 0.7).split(',')[1])
    formData.append('image2', this.toBlob(this.webcam.textureCanvas, 'image/jpeg', 0.7))
    formData.append('data', JSON.stringify(this.webcam.featurePoint3D))
    $.ajax({
      method: 'post',
      url: 'http://localhost:3008/save',
      data: formData,
      contentType: false,
      processData: false
    }).done((data) => {
      console.log('success', data)
    }).fail((error) => {
      console.error(error)
    })
  }


  toBlob(canvas, type, q = 1.0) {
    let base64 = canvas.toDataURL(type, q)
    let bin = atob(base64.replace(/^.*,/, ''))
    let buffer = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i)
    }
    let blob = new Blob([buffer.buffer], {type})
    return blob
  }


  start() {
    this.startTime = performance.now()
    this.previousFrame = -1
    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this.webcam.normalizedFeaturePoints) {
      this.face.geometry.deform(this.webcam.normalizedFeaturePoints)
      this.face.matrix.copy(this.webcam.matrixFeaturePoints)
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.min(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      // translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }

}

new App()
