import UserPlaneBase from './user-plane-base'


export default class UserImagePlane extends UserPlaneBase {

  start() {
    this.rawFeaturePoints = window.__djv_loader.getResult('shared-data')

    let image = window.__djv_loader.getResult('shared-image')
    this.webcamContext.drawImage(image, 0, 0, image.width, image.height, 0, 0, this.webcamCanvas.width, this.webcamCanvas.height)
    this.webcamTexture.needsUpdate = true

    setTimeout(() => {
      this.dispatchEvent({type: 'detected'})
    }, 1000)
    setTimeout(() => {
      this.dispatchEvent({type: 'complete'})
    }, 5000)

    this.enabled = true
  }


  update(currentFrame) {
    super.update(currentFrame)
    this.normralizeFeaturePoints()
    this.updateWebcamPlane()
    this.updateFaceHole()
  }

}
