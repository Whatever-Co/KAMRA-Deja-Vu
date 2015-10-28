/* global THREE */
import path from 'path'
console.log(path)

import $ from 'jquery'
import 'jquery-ui'
import 'OrbitControls'
import {vec2, mat3} from 'gl-matrix'

import FaceTracker from './facetracker'
import DeformableFace from './deformableface'

import './main.sass'
document.body.innerHTML = require('./body.jade')()



class FeaturePointEditor {

  constructor(face) {
    this.checkScore = this.checkScore.bind(this)

    this.face = face

    this.el = document.querySelector('#editor')
    this.el.style.width = `${window.innerWidth - (window.innerHeight >> 1)}px`

    this.buttons = $('<div>').addClass('buttons').appendTo(this.el).hide()
    this.textureButton = $('<a>').addClass('btn btn-default').text('Save texture').appendTo(this.buttons)
    this.dataButton = $('<a>').addClass('btn btn-default').text('Save JSON').appendTo(this.buttons)

    this.texture = document.createElement('canvas')
    this.texture.id = 'texture-preview'
    this.texture.width = 512
    this.texture.height = 512
    this.texture.style.width = this.texture.style.height = `${window.innerHeight >> 1}px`
    this.texture.style.top = `${window.innerHeight >> 1}px`
    document.body.appendChild(this.texture)

    this.tracker = new FaceTracker()

    this.initDropHandler()
    // this.filename = 'shutterstock_62329042.jpg'
    this.filename = 'shutterstock_102487424.jpg'
    this.loadImage(`media/${this.filename}`)
  }


  initDropHandler() {
    document.body.addEventListener('dragover', (e) => {
      e.stopPropagation()
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }, false)
    document.body.addEventListener('drop', (e) => {
      e.stopPropagation()
      e.preventDefault()
      let file = e.dataTransfer.files[0]
      console.log(file)
      if (file.type.match(/image/i)) {
        this.filename = file.name
        let reader = new FileReader()
        reader.onload = (e) => {
          this.loadImage(e.target.result)
        }
        reader.readAsDataURL(file)
      }
    })
  }


  loadImage(url) {
    $('.drop-message', this.el).hide()
    this.buttons.show()

    if (this.editArea) {
      this.editArea.empty()
    } else {
      this.editArea = $('<div>').appendTo(this.el).css('position', 'relative')
    }

    let image = new Image()
    image.onload = () => {
      this.imageForEditting = document.createElement('canvas')
      this.imageForEditting.width = this.imageForEditting.height = 1024
      const ctx = this.imageForEditting.getContext('2d')
      let s = 1024 / Math.min(image.width, image.height)
      let w = image.width * s
      let h = image.height * s
      this.origin = [-(w - 1024) / 2, -(h - 1024) / 2]
      // this.origin = [0, 0]
      // console.log(this.origin)
      ctx.drawImage(image, this.origin[0], this.origin[1], w, h)
      $(this.imageForEditting).appendTo(this.editArea)
      this.tracker.startImage(this.imageForEditting)
      this.startTime = Date.now()
      this.interval = setInterval(this.checkScore, 200)
    }
    image.src = url
  }


  checkScore() {
    let t = Date.now() - this.startTime
    console.log(t, this.tracker.getScore())
    if (t > 5000 || this.tracker.getScore() > 0.5) {
      this.tracker.stop()
      clearInterval(this.interval)
      this.placeEditPoints()
      this.cropTexture()
      this.face.applyTexture(this.texture, this.textureCoords)
      this.setupDownloadData()
    }
  }


  placeEditPoints() {
    this.editPoints = []

    this.tracker.currentPosition.forEach(this.addEditPoint.bind(this))

    let fpCenter = vec2.lerp([], this.face.getFPCoord(14), this.face.getFPCoord(0), 0.5)
    let scale = 1.0 / vec2.sub([], this.face.getFPCoord(14), fpCenter)[0]
    
    let v0 = this.tracker.currentPosition[0]
    let v1 = this.tracker.currentPosition[14]
    let center = vec2.lerp(vec2.create(), v0, v1, 0.5)
    let xAxis = vec2.sub([], v1, center)
    scale *= vec2.len(xAxis)
    let rotation = mat3.create()
    mat3.rotate(rotation, rotation, Math.atan2(xAxis[1], xAxis[0]))
    for (let i = 71; i < 80; i++) {
      let p = vec2.sub([], this.face.getFPCoord(i), fpCenter)
      vec2.scale(p, p, scale)
      p[1] *= -1
      vec2.transformMat3(p, p, rotation)
      vec2.add(p, p, center)
      this.addEditPoint(p, i)
    }
  }


  addEditPoint(p, i) {
    let dot = $('<div>').addClass('edit-point')
    dot.data('index', i)
    dot.css({left: `${p[0] - 6}px`, top: `${p[1] - 6}px`, opacity: 0.5})
    dot.appendTo(this.editArea)
    dot.draggable({stop: () => {
      this.cropTexture()
      this.face.applyTexture(this.texture, this.textureCoords)
      this.setupDownloadData()
    }})
    this.editPoints.push(dot)
    return dot
  }


  onEditPointMouseDown(e) {
    e.preventDefault()
    console.log(this)
  }


  cropTexture() {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    this.editPoints.forEach((p) => {
      let c = p.position()
      c = [c.left, c.top]
      vec2.min(min, min, c)
      vec2.max(max, max, c)
    })
    let size = vec2.sub([], max, min)
    let center = vec2.lerp([], min, max, 0.5)
    // console.log(min, max, size, center)

    let ctx = this.texture.getContext('2d')
    if (!ctx.getTransform) {
      new (require('ctx-get-transform'))(ctx)
    }
    ctx.save()
    ctx.translate(256, 256)
    let scale = 500 / Math.max(size[0], size[1])
    ctx.scale(scale, scale)
    ctx.translate(-center[0], -center[1])
    let mtx = ctx.getTransform()
    ctx.drawImage(this.imageForEditting, 0, 0)
    ctx.restore()

    this.textureCoords = this.editPoints.map((ep) => {
      let c = ep.position()
      let p = vec2.transformMat3([], [c.left, c.top], mtx)
      vec2.scale(p, p, 1 / 512)
      p[1] = 1 - p[1]
      return p
    })
  }


  setupDownloadData() {
    let basename = path.basename(this.filename).split('.')[0]

    this.textureButton.attr({
      href: this.texture.toDataURL('image/png'),
      download: `${basename}.png`
    })

    let data = this.textureCoords.map((c) => [parseFloat(c[0].toPrecision(5)), parseFloat(c[1].toPrecision(5))])
    this.dataButton.attr({
      href: `data:application/json,${encodeURIComponent(JSON.stringify(data))}`,
      download: `${basename}.json`
    })
  }


  onResize() {
    let size = window.innerHeight >> 1
    this.el.style.width = `${window.innerWidth - size}px`
    this.texture.style.width = this.texture.style.height = `${size}px`
    this.texture.style.top = `${size}px`
  }

}




class EditorApp {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()

    this.editor = new FeaturePointEditor(this.face)

    this.animate()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, 1, 1, 3000)
    this.camera.position.z = 400

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    let size = window.innerHeight >> 1
    this.renderer.setSize(size, size)
    this.renderer.domElement.id = 'model-preview'
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    this.face = new DeformableFace()
    this.face.scale.set(200, 200, 150)
    this.scene.add(this.face)
  }


  animate(t) {
    requestAnimationFrame(this.animate)

    this.face.update(t)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let size = window.innerHeight >> 1
    this.renderer.setSize(size, size)
    this.editor.onResize()
  }

}


new EditorApp()
