/* global clm pModel */

import {EventEmitter} from 'events'

export default class FaceDetector extends EventEmitter {

  constructor() {
    super()
    this.clmtrackrConverged = this.clmtrackrConverged.bind(this)
  }


  detect(image) {
    this.trackerCanvas = document.createElement('canvas')
    this.trackerCanvas.width = 320
    this.trackerCanvas.height = 180
    let ctx = this.trackerCanvas.getContext('2d')
    let h = image.width / 16 * 9
    let y = (image.height - h) / 2
    ctx.drawImage(image, 0, y, image.width, h, 0, 0, this.trackerCanvas.width, this.trackerCanvas.height)

    this.tracker = new clm.tracker({useWebGL: true})
    this.tracker.init(pModel)
    document.addEventListener('clmtrackrConverged', this.clmtrackrConverged)
    this.timeout = setTimeout(this.clmtrackrConverged, 2000)
    this.tracker.start(this.trackerCanvas)
  }


  clmtrackrConverged() {
    document.removeEventListener('clmtrackrConverged', this.clmtrackrConverged)
    clearTimeout(this.timeout)
    let points = this.tracker.getCurrentPosition()
    this.emit('detected', points)

    this.tracker.stop()
    delete this.tracker
    delete this.trackerCanvas
  }

}
