/* global THREE clm pModel */

// import $ from 'jquery'
import {vec2} from 'gl-matrix'
import Modernizr from 'exports?Modernizr!modernizr-custom'

import UserPlaneBase from './user-plane-base'

const FACE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 71, 72, 73, 74, 75, 76, 77, 78, 79]
const PARTS_INDICES = [23, 24, 25, 26, 28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 40]


export default class UserWebcamPlane extends UserPlaneBase {

  constructor(...args) {
    super(...args)

    this.onSuccess = this.onSuccess.bind(this)
    this.onError = this.onError.bind(this)
    this.onLoadedMetadata = this.onLoadedMetadata.bind(this)

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

    let options = {
      video: {
        mandatory: {minWidth: 640},
        optional: [
          {minWidth: 1280},
          {minWidth: 1920}
        ]
      }
    }
    let gUM = Modernizr.prefixed('getUserMedia', navigator)
    gUM(options, this.onSuccess, this.onError)
  }


  onSuccess(stream) {
    this.stream = stream
    this.video = document.createElement('video')
    this.video.src = window.URL.createObjectURL(stream)
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata)
    this.video.play()
    this.enableTextureUpdating = true
    this.enableTracking = true
    this.enableScoreChecking = true
  }


  onError(error) {
    console.error(error)  
    debugger
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


  checkCaptureScore() {
    if (this.featurePoint3D) {
      let {size, center} = this.getBoundsFor(this.featurePoint3D, FACE_INDICES)
      let len = vec2.len(size)
      let {center: pCenter} = this.getBoundsFor(this.featurePoint3D, PARTS_INDICES)
      let isSizeOK = 350 < len && len < 600
      let isPositionOK = Math.abs(center[0]) < 100 && Math.abs(center[1]) < 100
      let isAngleOK = Math.abs(center[0] - pCenter[0]) < 30
      let isStable = this.tracker.getConvergence() < 100
      // $('#_frame-counter').text(`size: ${size[0].toPrecision(3)}, ${size[1].toPrecision(3)} / len: ${len.toPrecision(3)} / center: ${center[0].toPrecision(3)}, ${center[1].toPrecision(3)} / pCenter: ${pCenter[0].toPrecision(3)}, ${pCenter[1].toPrecision(3)} / Score: ${this.tracker.getScore().toPrecision(4)} / Convergence: ${this.tracker.getConvergence().toPrecision(5)} / ${isSizeOK}, ${isPositionOK}, ${isAngleOK}, ${isStable}`)
      this.dispatchEvent({type: isSizeOK && isPositionOK && isAngleOK ? 'detected' : 'lost'})
      this.scoreHistory.push(isSizeOK && isPositionOK && isAngleOK && isStable)

      // update center position of shader
      let w = this.trackerCanvas.width
      let h = this.trackerCanvas.height
      let v4 = new THREE.Vector4(
        center[0] / (w * 2) + 0.5,
        center[1] / (h * 2) + 0.5,
        size[0] / (w * 4),
        size[1] / (h * 4)
      )
      this.material.uniforms.centerRect.value = v4

    } else {
      this.scoreHistory.push(false)
    }
    // console.log(this.scoreHistory)

    const WAIT_FOR_FRAMES = 50
    if (this.scoreHistory.length > WAIT_FOR_FRAMES) {
      this.scoreHistory.shift()
    }
    if (this.scoreHistory.length == WAIT_FOR_FRAMES && this.scoreHistory.every((s) => s)) {
      this.enableTextureUpdating = false
      this.enableTracking = false
      this.enableScoreChecking = false
      this.dispatchEvent({type: 'complete'})
    }
  }

}
