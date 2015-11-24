import TWEEN from 'tween.js'

import UserPlaneBase from './user-plane-base'


export default class UserImagePlane extends UserPlaneBase {

  init(image, featurePoints) {
    let h = image.width / 16 * 9
    let y = (image.height - h) / 2
    this.webcamContext.drawImage(image, 0, y, image.width, h, 0, 0, this.webcamCanvas.width, this.webcamCanvas.height)
    this.webcamTexture.needsUpdate = true
    this.rawFeaturePoints = featurePoints
    this.normralizeFeaturePoints()
    // this.enabled = true
    this.alpha = 0
  }


  start() {
    setTimeout(() => {
      this.dispatchEvent({type: 'detected'})
    }, 1000)
    setTimeout(() => {
      this.dispatchEvent({type: 'complete'})
    }, 5000)
  }


  update(currentFrame) {
    super.update(currentFrame)
    this.normralizeFeaturePoints()
    this.updateWebcamPlane()
    this.updateFaceHole()
  }

}
