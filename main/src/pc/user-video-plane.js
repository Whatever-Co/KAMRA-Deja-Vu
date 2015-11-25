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
const FP_KEY_TIME = _.keys(OUTRO_FP).map((k) => parseInt(k)).sort()


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
    this.video.src = 'data/_/riri-in-1280.mp4?.jpg'
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata)
    this.video.addEventListener('timeupdate', this.onTimeUpdate)
    this.video.addEventListener('ended', this.onIntroEnded)
    this.video.play()

    this.rawFeaturePoints = _.cloneDeep(INTRO_FP)
    this.normralizeFeaturePoints(false)

    this.enableTextureUpdating = true
    this.alpha = 0
    this.fadeIn()
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
  }


  restart() {
    this.video.src = 'data/_/riri-out-1280.mp4?.jpg'
    this.video.addEventListener('ended', this.onOutroEnded)
    this.video.play()
    this.enableTextureUpdating = true
    this.isOutro = true
  }


  onOutroEnded() {
    this.video.currentTime = 10
    this.video.play()
  }


  blendFPs(fp1, fp2, alpha) {
    alpha = TWEEN.Easing.Sinusoidal.Out(alpha)
    return fp1.map((p1, i) => {
      let p = vec2.lerp([], p1, fp2[i], alpha)
      return p
    })
  }


  updateTexture() {
    let h = this.video.videoWidth / 16 * 9
    let y = (this.video.videoHeight - h) / 2
    this.webcamContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, 1024, 1024)
    this.webcamTexture.needsUpdate = true
  }


  update(currentFrame) {
    super.update(currentFrame)

    if (this.enableTextureUpdating) {
      if (this.isOutro) {
        let time = this.video.currentTime * 1000
        for (let i = 0; i < FP_KEY_TIME.length; i++) {
          if (time < FP_KEY_TIME[i]) {
            if (i == 0) {
              this.rawFeaturePoints = _.cloneDeep(OUTRO_FP[FP_KEY_TIME[0]])
            } else {
              let t = (time - FP_KEY_TIME[i - 1]) / (FP_KEY_TIME[i] - FP_KEY_TIME[i - 1])
              this.rawFeaturePoints = this.blendFPs(OUTRO_FP[FP_KEY_TIME[i - 1]], OUTRO_FP[FP_KEY_TIME[i]], t)
            }
            break
          }
        }
        this.normralizeFeaturePoints(false)
      }

      this.updateTexture()
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
