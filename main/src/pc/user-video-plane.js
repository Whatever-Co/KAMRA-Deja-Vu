import UserPlaneBase from './user-plane-base'

const RIRI = [[791.046875,507.953125],[791.453125,565.34375],[800.671875,632.640625],[810.21875,692.859375],[831.5625,741.921875],[871.09375,778.84375],[912.15625,810.828125],[968.296875,823.65625],[1026.703125,811.015625],[1076.84375,784.296875],[1124.234375,741.609375],[1145.140625,696.03125],[1157.03125,635.40625],[1163.171875,569.375],[1160.859375,501.40625],[1135.53125,474.140625],[1106.359375,454.015625],[1065.5625,458.953125],[1023.921875,469.78125],[815.71875,474.6875],[841.328125,457.46875],[886.15625,462.890625],[924.515625,469.21875],[826.546875,516.453125],[879.234375,490],[923.75,525.9375],[871.640625,528.78125],[880.640625,510.59375],[1132.234375,518.71875],[1069.375,490.375],[1027.40625,520.453125],[1074.9375,532.640625],[1069.296875,515.21875],[978.25,490.34375],[925.375,601.71875],[917.703125,630.953125],[931.953125,648.6875],[972.515625,648.703125],[1016.0625,649.59375],[1029.90625,630.265625],[1017.359375,603.921875],[975.65625,562.203125],[943.921875,633.703125],[997.28125,634.796875],[902.5625,714.828125],[925.375,693.5625],[947.953125,678.421875],[970.328125,681.90625],[990.203125,679.96875],[1016.5,693.9375],[1035.59375,717.421875],[1013.734375,729.09375],[996.03125,739.3125],[967.71875,743],[943.140625,739.40625],[920.640625,727.859375],[940.03125,711.328125],[969.015625,709.328125],[993.5,708.96875],[995.25,708.546875],[968.5,708.609375],[940.1875,709.890625],[973.453125,618.125],[851.421875,496.765625],[910.15625,504.671875],[898.015625,527.078125],[845.796875,521.921875],[1102.5625,501.828125],[1040.8125,502.625],[1048.3125,527.84375],[1102.015625,528.90625],[1157.90625,447.78125],[1136.140625,372.5625],[1101.953125,335.0625],[1036.953125,299.15625],[975.25,290.328125],[915.71875,294.796875],[842.3125,327.8125],[809.09375,381.078125],[791.6875,454.921875]].map((p) => {
  p[0] /= 6
  p[1] /= 6
  return p
})

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

    this.rawFeaturePoints = RIRI

    this.enableTextureUpdating = true
  }


  onLoadedMetadata() {
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


  update(currentFrame) {
    super.update(currentFrame)

    if (this.enableTextureUpdating) {
      this.normralizeFeaturePoints()

      let h = this.video.videoWidth / 16 * 9
      let y = (this.video.videoHeight - h) / 2
      this.webcamContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, 1024, 1024)
      this.webcamTexture.needsUpdate = true

      this.updateWebcamPlane()
      this.updateFaceHole()
    }
  }

}
