/* global THREE */

import _ from 'lodash'
import {vec2} from 'gl-matrix'
import TWEEN from 'tween.js'

import UserPlaneBase from './user-plane-base'


const scalePoints = (points, scale = 1 / 6) => {
  return points.map((p) => {
    p[0] *= scale
    p[1] *= scale
    return p
  })
}

const INTRO_FP = scalePoints(require('./data/riri-in.json'))
const OUTRO_FP = _.mapValues(require('./data/riri-out.json'), (points) => {
  return scalePoints(points)
})
const FP_NAME_AT_TIME = [
  [0, '1028'],
  [13.04, null],
  [13.30, '1439'],
  [14.83, null],
  [15.28, '1611'],
  [17.00, null],
  [17.37, '1795'],
  [18.16, null],
  [18.60, '1916'],
  [20.25, null],
  [20.50, '2133'],
  [Number.MAX_VALUE],
]


export default class UserVideoPlane extends UserPlaneBase {

  constructor(...args) {
    super(...args)

    this.onLoadedMetadata = this.onLoadedMetadata.bind(this)
    this.onTimeUpdate = this.onTimeUpdate.bind(this)
    this.onIntroEnded = this.onIntroEnded.bind(this)
    this.onOutroEnded = this.onOutroEnded.bind(this)
  }


  start() {
    this.video = document.createElement('video')
    this.video.src = 'data/_/riri-in-1920.mp4?.jpg'
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata)
    this.video.addEventListener('timeupdate', this.onTimeUpdate)
    this.video.addEventListener('ended', this.onIntroEnded)
    this.video.play()

    this.rawFeaturePoints = INTRO_FP

    this.enableTextureUpdating = true
  }


  onLoadedMetadata() {
    this.video.removeEventListener('loadedmetadata', this.onLoadedMetadata)
    this.enabled = true
  }


  onTimeUpdate() {
    if (this.video.currentTime > 4) {
      this.video.removeEventListener('timeupdate', this.onTimeUpdate)
      this.dispatchEvent({type: 'detected'})
    }
  }


  onIntroEnded() {
    this.video.removeEventListener('ended', this.onIntroEnded)
    this.video.pause()

    this.enableTextureUpdating = true
    this.dispatchEvent({type: 'complete'})

    this.video.pause()
    this.video.src = 'data/_/riri-out-1920.mp4?.jpg'
    this.video.load()
  }


  restart() {
    this.video.addEventListener('ended', this.onOutroEnded)
    this.video.play()
    this.enableTextureUpdating = true
    this.isOutro = true
  }


  onOutroEnded() {
    this.video.currentTime = 10
    this.video.play()
  }


  getFPNameAtTime(time) {
    for (let i = 0; i < FP_NAME_AT_TIME.length - 1; i++) {
      if (FP_NAME_AT_TIME[i][0] <= time && time < FP_NAME_AT_TIME[i + 1][0]) {
        return [i, FP_NAME_AT_TIME[i][1]]
      }
    }
  }


  blendFPs(fp1, fp2, alpha) {
    alpha = TWEEN.Easing.Sinusoidal.Out(alpha)
    return fp1.map((p1, i) => {
      let p = vec2.lerp([], p1, fp2[i], alpha)
      return p
    })
  }


  update(currentFrame) {
    super.update(currentFrame)

    if (this.enableTextureUpdating) {
      if (this.isOutro) {
        let [index, name] = this.getFPNameAtTime(this.video.currentTime)
        if (name) {
          this.rawFeaturePoints = OUTRO_FP[name]
        } else {
          let fp1 = FP_NAME_AT_TIME[index - 1]
          let fp2 = FP_NAME_AT_TIME[index + 1]
          let t = THREE.Math.mapLinear(this.video.currentTime, FP_NAME_AT_TIME[index][0], fp2[0], 0, 1)
          // console.log(fp1[1], fp2[1], t)
          this.rawFeaturePoints = this.blendFPs(OUTRO_FP[fp1[1]], OUTRO_FP[fp2[1]], t)
        }
      }
      this.normralizeFeaturePoints()

      let h = this.video.videoWidth / 16 * 9
      let y = (this.video.videoHeight - h) / 2
      this.webcamContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, 1024, 1024)
      this.webcamTexture.needsUpdate = true

      this.updateWebcamPlane()
      this.updateFaceHole()
    }
  }


  scalePoints(points, scale = 1 / 6) {
    return points.map((p) => {
      p[0] *= scale
      p[1] *= scale
      return p
    })
  }

}
