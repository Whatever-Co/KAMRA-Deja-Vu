/* global THREE */
import path from 'path'

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
    $('<button>').addClass('btn btn-default').text('Dump raw coords').appendTo(this.buttons).on('click', this.dump.bind(this))

    this.texture = document.createElement('canvas')
    this.texture.id = 'texture-preview'
    this.texture.width = 512
    this.texture.height = 512
    this.texture.style.width = this.texture.style.height = `${window.innerHeight >> 1}px`
    this.texture.style.top = `${window.innerHeight >> 1}px`
    document.body.appendChild(this.texture)

    this.tracker = new FaceTracker()

    this.initKeyEvents()
    this.initDropHandler()
    // this.filename = 'shutterstock_62329042.jpg'
    // this.filename = 'shutterstock_102487424_512.jpg'
    this.filename = 'shutterstock_102487424_1920.jpg'
    this.loadImage(`media/${this.filename}`)
  }


  initKeyEvents() {
    window.addEventListener('keydown', (e) => {
      // console.log(e.keyCode)
      let scale = e.shiftKey || e.metaKey ? 0.1 : 1
      switch (e.keyCode) {
        case 37: // left
          if (e.ctrlKey) {
            this.rotatePoints(THREE.Math.degToRad(-3 * scale))
          } else {
            this.translatePoints(-10 * scale, 0)
          }
          break
        case 38: // up
          if (e.ctrlKey) {
            this.scalePoints(1 + 0.05 * scale)
          } else {
            this.translatePoints(0, -10 * scale)
          }
          break
        case 39: // right
          if (e.ctrlKey) {
            this.rotatePoints(THREE.Math.degToRad(3 * scale))
          } else {
            this.translatePoints(10 * scale, 0)
          }
          break
        case 40: // down
          if (e.ctrlKey) {
            this.scalePoints(1 - 0.05 * scale)
          } else {
            this.translatePoints(0, 10 * scale)
          }
          break
        // case 84:
        //   this.scalePoints(1.05)
        //   break
        default:
          return
      }
      e.preventDefault()
      this.update()
    })
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
      switch (file.type) {
        case 'image/png':
        case 'image/jpeg':
          this.filename = file.name
          let reader = new FileReader()
          reader.onload = (e) => {
            this.loadImage(e.target.result)
          }
          reader.readAsDataURL(file)
          break
        case 'application/json':
          this.loadPoints(file)
          break
      }
    })
  }


  loadImage(url) {
    $('.drop-message', this.el).hide()
    this.buttons.show()

    if (this.editArea) {
      this.editArea.empty()
    } else {
      this.editArea = $('<div id="edit-area">').appendTo(this.el).css('position', 'relative')
    }

    this.currentImage = new Image()
    this.currentImage.onload = () => {
      let s = 320 / Math.max(this.currentImage.width, this.currentImage.height)
      this.trackingScale = s

      let imageForTracking = document.createElement('canvas')
      imageForTracking.width = Math.round(this.currentImage.width * s)
      imageForTracking.height = Math.round(this.currentImage.height * s)
      console.log('tracking scale', this.trackingScale, imageForTracking.width, imageForTracking.height)

      let ctx = imageForTracking.getContext('2d')
      ctx.drawImage(this.currentImage, 0, 0, this.currentImage.width, this.currentImage.height, 0, 0, imageForTracking.width, imageForTracking.height)

      // this.imageForEditting = document.createElement('canvas')
      // this.imageForEditting.width = this.imageForEditting.height = 1024

      // const ctx = this.imageForEditting.getContext('2d')
      // let s = 1024 / Math.min(image.width, image.height)
      // let w = image.width * s
      // let h = image.height * s
      // this.origin = [-(w - 1024) / 2, -(h - 1024) / 2]
      // ctx.drawImage(image, this.origin[0], this.origin[1], w, h)

      // $(this.imageForEditting).appendTo(this.editArea)
      $(this.currentImage).appendTo(this.editArea)

      this.tracker.startImage(imageForTracking)
      this.startTime = Date.now()
      this.interval = setInterval(this.checkScore, 200)
    }
    this.currentImage.src = url
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
      this.face.applyMorph()
      this.setupDownloadData()

      window.addEventListener('keydown', (e) => {
        let n = e.keyCode - 49
        if (0 <= n && n <= 9) {
          this.face.applyMorph(n)
        }
      })
    }
  }


  loadPoints(file) {
    let reader = new FileReader()
    reader.onload = (e) => {
      let data = JSON.parse(reader.result)
      data.forEach((p, i) => {
        let dot = this.editPoints[i]
        dot.css({left: `${p[0] - 6}px`, top: `${p[1] - 6}px`, opacity: 0.5})
      })
      this.cropTexture()
      this.face.applyTexture(this.texture, this.textureCoords)
      this.face.applyMorph()
      this.setupDownloadData()
    }
    reader.readAsText(file)
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


  addEditPoint(p) {
    let dot = $('<div>').addClass('edit-point')
    dot.css({left: `${p[0] / this.trackingScale - 6}px`, top: `${p[1] / this.trackingScale - 6}px`, opacity: 0.5})
    dot.appendTo(this.editArea)
    dot.draggable({stop: () => this.update()})
    this.editPoints.push(dot)
    return dot
  }


  translatePoints(x, y) {
    this.editPoints.forEach((p) => {
      p.css({
        left: `+=${x}`,
        top: `+=${y}`
      })
    })
  }


  scalePoints(scale) {
    let {center} = this.getBounds()
    let mtx = mat3.create()
    mat3.translate(mtx, mtx, center)
    mat3.scale(mtx, mtx, [scale, scale])
    mat3.translate(mtx, mtx, vec2.scale([], center, -1))
    let scrollLeft = this.editArea.scrollLeft()
    let scrollTop = this.editArea.scrollTop()
    this.editPoints.forEach((p) => {
      let c = p.position()
      c = [scrollLeft + c.left + 6, scrollTop + c.top + 6]
      vec2.transformMat3(c, c, mtx)
      p.css({left: c[0] - 6, top: c[1] - 6})
    })
  }


  rotatePoints(angle) {
    let {center} = this.getBounds()
    let mtx = mat3.create()
    mat3.translate(mtx, mtx, center)
    mat3.rotate(mtx, mtx, angle)
    mat3.translate(mtx, mtx, vec2.scale([], center, -1))
    let scrollLeft = this.editArea.scrollLeft()
    let scrollTop = this.editArea.scrollTop()
    this.editPoints.forEach((p) => {
      let c = p.position()
      c = [scrollLeft + c.left + 6, scrollTop + c.top + 6]
      vec2.transformMat3(c, c, mtx)
      p.css({left: c[0] - 6, top: c[1] - 6})
    })
  }


  getBounds() {
    let scrollLeft = this.editArea.scrollLeft()
    let scrollTop = this.editArea.scrollTop()
    // console.log({scrollLeft, scrollTop})
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    this.editPoints.forEach((p) => {
      let c = p.position()
      c = [scrollLeft + c.left + 6, scrollTop + c.top + 6]
      vec2.min(min, min, c)
      vec2.max(max, max, c)
    })
    let size = vec2.sub([], max, min)
    let center = vec2.lerp([], min, max, 0.5)
    // console.log(min, max, size, center)
    return {size, center}
  }


  cropTexture() {
    let {size, center} = this.getBounds()

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
    ctx.drawImage(this.currentImage, 0, 0)
    ctx.restore()

    let scrollLeft = this.editArea.scrollLeft()
    let scrollTop = this.editArea.scrollTop()
    this.textureCoords = this.editPoints.map((ep) => {
      let c = ep.position()
      let p = vec2.transformMat3([], [scrollLeft + c.left + 6, scrollTop + c.top + 6], mtx)
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


  update() {
    this.cropTexture()
    this.face.applyTexture(this.texture, this.textureCoords)
    this.face.applyMorph()
    this.setupDownloadData()
  }


  dump() {
    let scrollLeft = this.editArea.scrollLeft()
    let scrollTop = this.editArea.scrollTop()
    let points = this.editPoints.map((p) => {
      let c = p.position()
      return [scrollLeft + c.left + 6, scrollTop + c.top + 6]
    })
    console.log(JSON.stringify(points))
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
    this.controls.enableKeys = false

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    this.face = new DeformableFace()
    this.face.scale.set(200, 200, 150)
    this.scene.add(this.face)
  }


  animate() {
    requestAnimationFrame(this.animate)
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
