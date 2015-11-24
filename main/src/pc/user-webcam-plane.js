/* global clm pModel */

import $ from 'jquery'
import {vec2} from 'gl-matrix'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import UserPlaneBase from './user-plane-base'
import WebcamManager from './webcam-manager'

const FACE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 71, 72, 73, 74, 75, 76, 77, 78, 79]
const PARTS_INDICES = [23, 24, 25, 26, 28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 40]


export default class UserWebcamPlane extends UserPlaneBase {

  constructor(...args) {
    super(...args)

    this.onLoadedMetadata = this.onLoadedMetadata.bind(this)
    this.onResize = this.onResize.bind(this)
    this.updateProgress = this.updateProgress.bind(this)

    this.webcamStep1 = $('#canvas-clip .step1').css({display: 'flex'}).hide()
    this.webcamStep2 = $('#canvas-clip .step2').css({display: 'flex'}).hide()
    this.scoreContext = document.querySelector('#canvas-clip .progress').getContext('2d')
    this.scoreContext.translate(100, 100)
    this.currentProgress = 0
    this.destProgress = 0

    this.faceDetected = false
    this.numTrackingIteration = 2
    this.scoreHistory = []
  }


  start() {
    this.webcamContext.translate(1024, 0)
    this.webcamContext.scale(-1, 1)

    this.trackerCanvas = document.createElement('canvas')
    this.trackerCanvas.width = 320
    this.trackerCanvas.height = 180
    this.trackerContext = this.trackerCanvas.getContext('2d')
    this.trackerContext.translate(this.trackerCanvas.width, 0)
    this.trackerContext.scale(-1, 1)

    this.video = document.createElement('video')
    this.video.src = window.URL.createObjectURL(WebcamManager.stream)
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata)
    this.video.play()
    this.enableTextureUpdating = true
    this.enableTracking = false
    this.enableScoreChecking = false

    this.alpha = 0
    new TWEEN.Tween(this).to({alpha: 1}, 2000).delay(200).start().onComplete(() => {
      this.enableTracking = true
      this.enableScoreChecking = true
    })

    Ticker.on('update', this.updateProgress)
    window.addEventListener('resize', this.onResize)
    this.onResize()
    this.webcamStep1.fadeIn(1000)
  }


  onLoadedMetadata() {
    // console.log({width: this.video.videoWidth, height: this.video.videoHeight})
    this.tracker = new clm.tracker({useWebGL: true})
    this.tracker.init(pModel)
    this.enabled = true
  }


  restart() {
    this.enableTextureUpdating = true
    this.enableTracking = true
    this.enableScoreChecking = false
    this.numTrackingIteration = 2
    this.isOutro = true
  }


  update(currentFrame) {
    super.update(currentFrame)

    if (this.enableTextureUpdating) {
      this.updateTexture()
    }

    if (this.enableTracking) {
      for (let i = 0; i < this.numTrackingIteration; i++) {
        this.rawFeaturePoints = this.tracker.track(this.trackerCanvas)
      }
      this.normralizeFeaturePoints()
      if (this.enableScoreChecking) {
        this.checkCaptureScore()
      }
      this.setAutoContrastParams()
    }

    if (this.enableTextureUpdating || this.enableTracking || this.drawFaceHole) {
      this.updateWebcamPlane()
      this.updateFaceHole()
    }
  }


  updateTexture() {
    let h = this.video.videoWidth / 16 * 9
    let y = (this.video.videoHeight - h) / 2
    this.webcamContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, 1024, 1024)
    this.webcamTexture.needsUpdate = true

    this.trackerContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, this.trackerCanvas.width, this.trackerCanvas.height)
  }


  setAutoContrastParams() {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    for (let i = 0; i < this.rawFeaturePoints.length; i++) {
      let p = this.rawFeaturePoints[i]
      vec2.min(min, min, p)
      vec2.max(max, max, p)
    }
    let size = vec2.sub([], max, min)
    if (size[0] < 1 || size[1] < 1) {
      return
    }
    let data = this.trackerContext.getImageData(min[0], min[1], size[0], size[1])
    let numPixels = data.width * data.height
    let n = (numPixels / 30) | 0
    min = Number.MAX_VALUE
    max = Number.MIN_VALUE
    for (let i = 0; i < numPixels; i += n) {
      let ii = i * 4
      let gray = (data.data[ii] + data.data[ii + 1] + data.data[ii + 2]) / 3
      if (gray < min) {
        min = gray
      }
      if (gray > max) {
        max = gray
      }
    }
    let current = this.webcamPlane.material.uniforms.inMax.value
    this.webcamPlane.material.uniforms.inMax.value += (max * 1.5 / 255 - current) * 0.05
  }


  checkCaptureScore() {
    let faceDetected = false
    if (this.featurePoint3D) {
      let {size, center} = this.getBoundsFor(this.featurePoint3D, FACE_INDICES)
      let len = vec2.len(size)
      let {center: pCenter} = this.getBoundsFor(this.featurePoint3D, PARTS_INDICES)
      let isSizeOK = 350 < len && len < 600
      let isPositionOK = Math.abs(center[0]) < 150 && Math.abs(center[1]) < 150
      let isAngleOK = Math.abs(center[0] - pCenter[0]) < 100
      let isStable = this.tracker.getConvergence() < 150
      faceDetected = isSizeOK && isPositionOK && isAngleOK
      // $('#_frame-counter').text(`size: ${size[0].toPrecision(3)}, ${size[1].toPrecision(3)} / len: ${len.toPrecision(3)} / center: ${center[0].toPrecision(3)}, ${center[1].toPrecision(3)} / pCenter: ${pCenter[0].toPrecision(3)}, ${pCenter[1].toPrecision(3)} / Score: ${this.tracker.getScore().toPrecision(4)} / Convergence: ${this.tracker.getConvergence().toPrecision(5)} / ${isSizeOK}, ${isPositionOK}, ${isAngleOK}, ${isStable}`)
      this.dispatchEvent({type: faceDetected ? 'detected' : 'lost'})
      this.scoreHistory.push(faceDetected && isStable)
    } else {
      this.scoreHistory.push(false)
    }
    // console.log(this.scoreHistory)
    if (this.faceDetected != faceDetected) {
      this.faceDetected = faceDetected
      if (this.faceDetected) {
        this.webcamStep1.fadeOut(500)
        this.webcamStep2.delay(300).fadeIn(500)
      } else {
        this.webcamStep1.delay(300).fadeIn(500)
        this.webcamStep2.fadeOut(500)
      }
    }

    const WAIT_FOR_FRAMES = 50

    if (this.scoreHistory.length > WAIT_FOR_FRAMES) {
      this.scoreHistory.shift()
    }

    this.destProgress = 0
    for (let i = this.scoreHistory.length - 1; i >= 0; i--) {
      if (!this.scoreHistory[i]) {
        break
      }
      this.destProgress++
    }

    if (this.destProgress == WAIT_FOR_FRAMES) {
      this.enableScoreChecking = false
    }

    this.destProgress /= WAIT_FOR_FRAMES
  }


  updateProgress() {
    this.currentProgress += (this.destProgress - this.currentProgress) * 0.5
    let ctx = this.scoreContext
    ctx.clearRect(-100, -100, 200, 200)
    ctx.beginPath()
    ctx.arc(0, 0, 75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.currentProgress, false)
    ctx.strokeStyle = 'white'
    ctx.stroke()

    if (this.currentProgress > 0.99) {
      ctx.beginPath()
      ctx.arc(0, 0, 75, 0, Math.PI * 2, false)
      ctx.strokeStyle = 'white'
      ctx.stroke()

      this.enableTextureUpdating = false
      this.enableTracking = false
      this.enableScoreChecking = false
      this.dispatchEvent({type: 'complete'})

      Ticker.removeListener('update', this.updateProgress)
      window.removeEventListener('resize', this.onResize)
      this.webcamStep2.fadeOut(1000)
    }
  }


  onResize() {
    let w = Math.max(Config.MIN_WINDOW_WIDTH, window.innerWidth)
    let h = window.innerHeight
    let props = {x: (w - 400) >> 1, y: (h - 200) >> 1}
    this.webcamStep1.css(props)
    this.webcamStep2.css(props)
  }

}
