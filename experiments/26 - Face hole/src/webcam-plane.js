/* global THREE clm pModel */

// import $ from 'jquery'
import {vec2, mat3} from 'gl-matrix'
import TWEEN from 'tween.js'

import Ticker from './ticker'
import StandardFaceData from './standard-face-data'


export const FACE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 71, 72, 73, 74, 75, 76, 77, 78, 79]
export const PARTS_INDICES = [23, 24, 25, 26, 28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 40]


export default class WebcamPlane extends THREE.Mesh {

  constructor(camera) {
    super(
      new THREE.PlaneBufferGeometry(16 / 9, 1, 1, 1),
      new THREE.MeshBasicMaterial({color: 0xffffff, depthWrite: false})
    )

    this.update = this.update.bind(this)

    this.camera = camera

    this.video = document.createElement('video')
    // document.body.appendChild(this.video)

    this.textureCanvas = document.createElement('canvas')
    this.textureCanvas.width = this.textureCanvas.height = 1024
    this.textureContext = this.textureCanvas.getContext('2d')
    this.textureContext.translate(1024, 0)
    this.textureContext.scale(-1, 1)
    this.texture = new THREE.CanvasTexture(this.textureCanvas)
    this.material.map = this.texture
    // document.body.appendChild(this.textureCanvas)

    this.trackerCanvas = document.createElement('canvas')
    this.trackerCanvas.width = 320
    this.trackerCanvas.height = 180
    this.trackerContext = this.trackerCanvas.getContext('2d')
    this.trackerContext.translate(this.trackerCanvas.width, 0)
    this.trackerContext.scale(-1, 1)
    // document.body.appendChild(this.trackerCanvas)

    this.standardFaceData = new StandardFaceData()
    this.matrixFeaturePoints = new THREE.Matrix4()

    this.scoreHistory = []
  }


  start() {
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
    let options = {
      video: {
        mandatory: {minWidth: 640},
        optional: [
          {minWidth: 1280},
          {minWidth: 1920}
        ]
      }
    }
    navigator.getUserMedia(options, this.onSuccess.bind(this), this.onError.bind(this))
  }


  stop() {
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop()
      this.video.pause()
    }
    Ticker.removeListener('update', this.update)
  }


  onSuccess(stream) {
    this.stream = stream
    this.video.src = window.URL.createObjectURL(stream)
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this))
    this.video.play()
  }


  onError(error) {
    console.error(error)  
    debugger
  }


  onLoadedMetadata() {
    console.log({width: this.video.videoWidth, height: this.video.videoHeight})

    this.tracker = new clm.tracker({useWebGL: true})
    this.tracker.init(pModel)

    Ticker.on('update', this.update)
  }


  normralizeFeaturePoints() {
    this.featurePoint3D = null
    this.normalizedFeaturePoints = null

    if (!this.rawFeaturePoints) {
      return
    }

    // add head feature points
    {
      let faceCenter = vec2.lerp([], this.standardFaceData.getFeatureVertex(14), this.standardFaceData.getFeatureVertex(0), 0.5)
      let scale = 1.0 / vec2.sub([], this.standardFaceData.getFeatureVertex(14), faceCenter)[0]

      let v0 = this.rawFeaturePoints[0]
      let v1 = this.rawFeaturePoints[14]
      let center = vec2.lerp(vec2.create(), v0, v1, 0.5)
      let xAxis = vec2.sub([], v1, center)
      scale *= vec2.len(xAxis)
      let rotation = mat3.create()
      mat3.rotate(rotation, rotation, Math.atan2(xAxis[1], xAxis[0]))

      for (let i = 71; i < 80; i++) {
        let p = vec2.sub([], this.standardFaceData.getFeatureVertex(i), faceCenter)
        vec2.scale(p, p, scale)
        p[1] *= -1
        vec2.transformMat3(p, p, rotation)
        vec2.add(p, p, center)
        this.rawFeaturePoints[i] = p
      }
    }

    // convert to canvas coord to world coord
    let size
    {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      let mtx = mat3.create()
      let scale = this.scale.y / 180
      mat3.scale(mtx, mtx, [scale, -scale, scale])
      mat3.translate(mtx, mtx, [-160, -90, 0])
      this.featurePoint3D = this.rawFeaturePoints.map((p) => {
        let q = vec2.transformMat3([], p, mtx)
        vec2.min(min, min, q)
        vec2.max(max, max, q)
        return q
      })
      size = vec2.sub([], max, min)
    }

    // calc z position
    let scale = vec2.len(size) / this.standardFaceData.size
    {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      let cameraZ = this.camera.position.length()
      this.featurePoint3D.forEach((p, i) => {
        let z = this.standardFaceData.getFeatureVertex(i)[2] * scale
        if (isNaN(z)) {
          return
        }
        let perspective = (cameraZ - z) / cameraZ
        p[0] *= perspective
        p[1] *= perspective
        p[2] = z
        vec2.min(min, min, p)
        vec2.max(max, max, p)
      })
      size = vec2.sub([], max, min)
      scale = this.standardFaceData.size / vec2.len(size)
    }

    // normalize captured feature point coords
    {
      let center = this.featurePoint3D[41]
      let yAxis = vec2.sub([], this.featurePoint3D[75], this.featurePoint3D[7])
      let angle = Math.atan2(yAxis[1], yAxis[0]) - Math.PI * 0.5

      let mtx = mat3.create()
      mat3.rotate(mtx, mtx, -angle)
      mat3.scale(mtx, mtx, [scale, scale])
      mat3.translate(mtx, mtx, vec2.scale([], center, -1))

      this.matrixFeaturePoints.identity()
      this.matrixFeaturePoints.makeRotationZ(angle)
      let s = 1 / scale
      this.matrixFeaturePoints.scale(new THREE.Vector3(s, s, s))
      this.matrixFeaturePoints.setPosition(new THREE.Vector3(center[0], center[1], center[2]))

      this.normalizedFeaturePoints = this.featurePoint3D.map((p) => {
        let q = vec2.transformMat3([], p, mtx)
        q[2] = p[2] * scale
        return q
      })
    }
  }


  checkCaptureScore() {
    if (this.featurePoint3D) {
      let {size, center} = this.getBoundsFor(this.featurePoint3D, FACE_INDICES)
      let len = vec2.len(size)
      let {center: pCenter} = this.getBoundsFor(this.featurePoint3D, PARTS_INDICES)
      let isOK = len > 400 && Math.abs(center[0] - pCenter[0]) < 10 && this.tracker.getConvergence() < 50
      // $('#frame-counter').text(`size: ${size[0].toPrecision(3)}, ${size[1].toPrecision(3)} / len: ${len.toPrecision(3)} / center: ${center[0].toPrecision(3)}, ${center[1].toPrecision(3)} / pCenter: ${pCenter[0].toPrecision(3)}, ${pCenter[1].toPrecision(3)} / Score: ${this.tracker.getScore().toPrecision(4)} / Convergence: ${this.tracker.getConvergence().toPrecision(5)} / ${isOK ? 'OK' : 'NG'}`)
      this.scoreHistory.push(isOK)
    } else {
      this.scoreHistory.push(false)
    }

    const WAIT_FOR_FRAMES = 10 // 2 secs
    if (this.scoreHistory.length > WAIT_FOR_FRAMES) {
      this.scoreHistory.shift()
    }
    if (this.scoreHistory.length == WAIT_FOR_FRAMES && this.scoreHistory.every((s) => s)) {
      this.dispatchEvent({type: 'complete'})
    }
  }


  update() {
    let h = this.video.videoWidth / 16 * 9
    let y = (this.video.videoHeight - h) / 2
    this.textureContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, 1024, 1024)
    this.texture.needsUpdate = true

    this.trackerContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, this.trackerCanvas.width, this.trackerCanvas.height)

    for (let i = 0; i < 2; i++) {
      this.rawFeaturePoints = this.tracker.track(this.trackerCanvas)
    }
    this.normralizeFeaturePoints()
    // this.tracker.draw(this.trackerCanvas)

    this.checkCaptureScore()
  }


  fadeOut() {
    let p = {b: 1}
    new TWEEN.Tween(p).to({b: 0}, 2000).onUpdate(() => {
      this.material.color.setHSL(0, 0, p.b)
    }).onComplete(() => {
      this.visible = false
    }).start()
  }

  
  getBoundsFor(vertices, indices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    indices.forEach((index) => {
      vec2.min(min, min, vertices[index])
      vec2.max(max, max, vertices[index])
    })
    return {min, max, size: vec2.sub([], max, min), center: vec2.lerp([], min, max, 0.5)}
  }

}
