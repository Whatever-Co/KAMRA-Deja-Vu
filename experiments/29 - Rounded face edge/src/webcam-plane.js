/* global THREE clm pModel */

import $ from 'jquery'
import {vec2, mat3} from 'gl-matrix'
import TWEEN from 'tween.js'
import Modernizr from 'exports?Modernizr!modernizr-custom'

import StandardFaceData from './standard-face-data'


const FACE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 71, 72, 73, 74, 75, 76, 77, 78, 79]
const PARTS_INDICES = [23, 24, 25, 26, 28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 40]
const LULA = [[791.046875,507.953125],[791.453125,565.34375],[800.671875,632.640625],[810.21875,692.859375],[831.5625,741.921875],[871.09375,778.84375],[912.15625,810.828125],[968.296875,823.65625],[1026.703125,811.015625],[1076.84375,784.296875],[1124.234375,741.609375],[1145.140625,696.03125],[1157.03125,635.40625],[1163.171875,569.375],[1160.859375,501.40625],[1135.53125,474.140625],[1106.359375,454.015625],[1065.5625,458.953125],[1023.921875,469.78125],[815.71875,474.6875],[841.328125,457.46875],[886.15625,462.890625],[924.515625,469.21875],[826.546875,516.453125],[879.234375,490],[923.75,525.9375],[871.640625,528.78125],[880.640625,510.59375],[1132.234375,518.71875],[1069.375,490.375],[1027.40625,520.453125],[1074.9375,532.640625],[1069.296875,515.21875],[978.25,490.34375],[925.375,601.71875],[917.703125,630.953125],[931.953125,648.6875],[972.515625,648.703125],[1016.0625,649.59375],[1029.90625,630.265625],[1017.359375,603.921875],[975.65625,562.203125],[943.921875,633.703125],[997.28125,634.796875],[902.5625,714.828125],[925.375,693.5625],[947.953125,678.421875],[970.328125,681.90625],[990.203125,679.96875],[1016.5,693.9375],[1035.59375,717.421875],[1013.734375,729.09375],[996.03125,739.3125],[967.71875,743],[943.140625,739.40625],[920.640625,727.859375],[940.03125,711.328125],[969.015625,709.328125],[993.5,708.96875],[995.25,708.546875],[968.5,708.609375],[940.1875,709.890625],[973.453125,618.125],[851.421875,496.765625],[910.15625,504.671875],[898.015625,527.078125],[845.796875,521.921875],[1102.5625,501.828125],[1040.8125,502.625],[1048.3125,527.84375],[1102.015625,528.90625],[1157.90625,447.78125],[1136.140625,372.5625],[1101.953125,335.0625],[1036.953125,299.15625],[975.25,290.328125],[915.71875,294.796875],[842.3125,327.8125],[809.09375,381.078125],[791.6875,454.921875]].map((p) => {
  p[0] /= 6
  p[1] /= 6
  return p
})



class FaceEdgeMaterial extends THREE.ShaderMaterial {

  constructor(map) {
    super({
      uniforms: {
        scale: {type: 'f', value: 0.9},
        brightness: {type: 'f', value: 1.0},
        map: {type: 'f', value: map},
      },
      vertexShader: `
        uniform float scale;
        varying vec2 vUv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
          vUv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float brightness;
        varying vec2 vUv;
        void main () {
          gl_FragColor = texture2D(map, vUv);
          gl_FragColor.rgb *= brightness;
          /*if (gl_FragCoord.y < 540.) {
            gl_FragColor.rgb += pow(1.0 - gl_FragCoord.y / 540., 4.0);
          } else {
            gl_FragColor.rgb *= pow(1.0 - (gl_FragCoord.y - 540.) / 540., 4.0) * 0.3 + 0.7;
          }*/
        }
      `
    })
  }

  set scale(value) {
    this.uniforms.scale.value = value
  }

  set brightness(value) {
    this.uniforms.brightness.value = value
  }

}



class FaceSpaceMaterial extends THREE.ShaderMaterial {

  constructor() {
    super({
      uniforms: {
        scale: {type: 'f', value: 1.0},
        spaceMap: {type: 't', value: null},
        min: {type: 'v2', value: new THREE.Vector2()},
        max: {type: 'v2', value: new THREE.Vector2()},
      },
      vertexShader: `
        uniform float scale;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D spaceMap;
        uniform vec2 min;
        uniform vec2 max;
        void main() {
          vec2 uv = (gl_FragCoord.xy / 1024. * vec2(320., 180.) - min) / (max - min);
          uv.y = 1.0 - uv.y;
          gl_FragColor = texture2D(spaceMap, uv);
        }
      `
    })

    this.video = document.createElement('video')
    this.video.width = this.video.height = 256
    this.video.loop = true
    this.video.autoplay = true
    this.video.src = 'media/curl_bg.mp4'
    this.video.addEventListener('loadedmetadata', () => {
      this.texture = new THREE.Texture(this.video)
      this.uniforms.spaceMap.value = this.texture
    })
  }

  update() {
    this.texture.needsUpdate = true
  }

  set scale(value) {
    this.uniforms.scale.value = value
  }

  set brightness(value) {
    this.uniforms.brightness.value = value
  }

  get min() {
    return this.uniforms.min.value
  }

  get max() {
    return this.uniforms.max.value
  }

}



export default class WebcamPlane extends THREE.Mesh {

  constructor(data, camera, renderer, faceGeometry) {
    super(
      new THREE.PlaneBufferGeometry(16 / 9, 1, 16*4, 9*4),
      new THREE.ShaderMaterial({
        uniforms: {
          texture: {type: 't', value: null},
          rate: {type: 'f', value:0.0},
          frame: {type: 'f', value:0.0},
          centerRect: {type: 'v4', value: new THREE.Vector4(0.4, 0.4, 0.2, 0.2)},
          waveForce: {type: 'f', value:0.1},
          zoomForce: {type: 'f', value:0.3}
        },
        vertexShader:require('./shaders/webcam-plane.vert'),
        fragmentShader:require('./shaders/webcam-plane.frag'),
        transparent: true,
        depthWrite: false,
      })
    )
    this.renderOrder = -1000
    this.enabled = false
    this.isComplete = false

    this.update = this.update.bind(this)
    this.onIntroVideoEnded = this.onIntroVideoEnded.bind(this)
    this.onOutroVideoEnded = this.onOutroVideoEnded.bind(this)

    this.data = data
    this.camera = camera
    this.renderer = renderer

    this.scene = new THREE.Scene()

    this.texture = new THREE.WebGLRenderTarget(1024, 1024, {stencilBuffer: false})
    this.material.uniforms.texture.value = this.texture

    this.video = document.createElement('video')
    // document.body.appendChild(this.video)

    this.webcamCanvas = document.createElement('canvas')
    this.webcamCanvas.width = this.webcamCanvas.height = 1024
    this.webcamContext = this.webcamCanvas.getContext('2d')
    this.webcamTexture = new THREE.CanvasTexture(this.webcamCanvas)
    // document.body.appendChild(this.webcamCanvas)
    this.webcamPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: this.webcamTexture},
      },
      vertexShader: require('./shaders/no-transform.vert'),
      fragmentShader: `
        uniform sampler2D map;
        void main() {
          gl_FragColor = texture2D(map, gl_FragCoord.xy / 1024.);
        }
      `,
      depthWrite: false,
      depthTest: false,
    }))
    this.scene.add(this.webcamPlane)

    this.trackerCanvas = document.createElement('canvas')
    this.trackerCanvas.width = 320
    this.trackerCanvas.height = 180
    this.trackerContext = this.trackerCanvas.getContext('2d')
    // this.trackerCanvas.id = '_tracker-canvas'
    // document.body.appendChild(this.trackerCanvas)

    this.standardFaceData = new StandardFaceData()

    this.faceEdgeMaterial = new FaceEdgeMaterial(this.webcamTexture)
    this.faceSpaceMaterial = new FaceSpaceMaterial()
    {
      let geometry = new THREE.BufferGeometry()
      let data = this.standardFaceData.data
      geometry.setIndex(new THREE.Uint16Attribute(data.face.index.concat(data.rightEye.index, data.leftEye.index), 1))
      geometry.addAttribute('position', faceGeometry.positionAttribute)
      geometry.addAttribute('uv', faceGeometry.uvAttribute)
      this.face = new THREE.Mesh(geometry, this.faceEdgeMaterial)
    }
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    this.matrixFeaturePoints = new THREE.Matrix4()

    this.enableTextureUpdating = false
    this.enableTracking = false
    this.enableScoreChecking = false
    this.numTrackingIteration = 2
    this.scoreHistory = []

    this.drawFaceHole = false
  }


  start(useWebcam) {
    this.useWebcam = useWebcam
    if (useWebcam) {
      this.webcamContext.translate(1024, 0)
      this.webcamContext.scale(-1, 1)
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
      gUM(options, this.onSuccess.bind(this), this.onError.bind(this))

    } else {
      this.video.src = 'data/_/lula-in-1920.jpg'
      this.video.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this))
      this.video.addEventListener('ended', this.onIntroVideoEnded)
      this.video.play()
      this.rawFeaturePoints = LULA
      this.normralizeFeaturePoints()
      this.enableTextureUpdating = true
      this.enableTracking = false
      this.enableScoreChecking = false
    }
  }


  onSuccess(stream) {
    this.stream = stream
    this.video.src = window.URL.createObjectURL(stream)
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this))
    this.video.play()
    this.enableTextureUpdating = true
    this.enableTracking = true
    this.enableScoreChecking = true
  }


  onError(error) {
    console.error(error)  
    debugger
  }


  onIntroVideoEnded() {
    this.video.removeEventListener('ended', this.onIntroVideoEnded)

    this.enableTracking = false
    this.dispatchEvent({type: 'complete'})

    this.video.pause()
    this.video.src = 'data/_/lula-out-1920.jpg'
    this.video.load()
  }


  onOutroVideoEnded() {
    this.video.currentTime = 10
    this.video.play()
  }


  restart() {
    if (!this.useWebcam) {
      this.video.addEventListener('ended', this.onOutroVideoEnded)
      this.video.play()
    }
    this.enableTextureUpdating = true
    this.enableTracking = true
    this.enableScoreChecking = false
    this.numTrackingIteration = 2
  }


  stop() {
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop()
    }
    if (this.video) {
      this.video.removeEventListener('ended', this.onOutroVideoEnded)
      this.video.pause()
    }
    this.enableTextureUpdating = true
    this.enableTracking = false
    this.enableScoreChecking = false
  }


  onLoadedMetadata() {
    // console.log({width: this.video.videoWidth, height: this.video.videoHeight})
    this.tracker = new clm.tracker({useWebGL: true})
    this.tracker.init(pModel)

    this.enabled = true
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
      this.matrixFeaturePoints.setPosition(new THREE.Vector3(center[0], center[1], 0))

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
      let isSizeOK = 350 < len && len < 550
      let isPositionOK = Math.abs(center[0]) < 50 && Math.abs(center[1]) < 150
      let isAngleOK = Math.abs(center[0] - pCenter[0]) < 130
      let isStable = this.tracker.getConvergence() < 150
      // $('#_frame-counter').text(`size: ${size[0].toPrecision(3)}, ${size[1].toPrecision(3)} / len: ${len.toPrecision(3)} / center: ${center[0].toPrecision(3)}, ${center[1].toPrecision(3)} / pCenter: ${pCenter[0].toPrecision(3)}, ${pCenter[1].toPrecision(3)} / Score: ${this.tracker.getScore().toPrecision(4)} / Convergence: ${this.tracker.getConvergence().toPrecision(5)} / ${isSizeOK}, ${isPositionOK}, ${isAngleOK}, ${isStable}`)
      this.dispatchEvent({type: isSizeOK && isPositionOK && isAngleOK ? 'detected' : 'lost'})
      this.scoreHistory.push(isSizeOK && isPositionOK && isAngleOK && isStable)

      // update center position of shader
      let w = this.trackerCanvas.width
      let h = this.trackerCanvas.height
      let v4 = new THREE.Vector4(
        center[0] / (w*2) + 0.5,
        center[1] / (h*2) + 0.5,
        size[0] / (w*4),
        size[1] / (h*4)
      )
      this.material.uniforms.centerRect.value = v4

    } else {
      this.scoreHistory.push(false)
    }
    // console.log(this.scoreHistory)

    const WAIT_FOR_FRAMES = 10
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


  updateTexture() {
    let h = this.video.videoWidth / 16 * 9
    let y = (this.video.videoHeight - h) / 2
    this.webcamContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, 1024, 1024)
    this.webcamTexture.needsUpdate = true

    this.trackerContext.drawImage(this.video, 0, y, this.video.videoWidth, h, 0, 0, this.trackerCanvas.width, this.trackerCanvas.height)
  }


  update(currentFrame) {
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

      if (this.drawFaceHole && this.rawFeaturePoints) {
        // this.face.geometry.init(this.rawFeaturePoints, 320, 180, this.scale.y, 2400)
        this.face.matrix.copy(this.matrixFeaturePoints)

        let min = [Number.MAX_VALUE, Number.MAX_VALUE]
        let max = [Number.MIN_VALUE, Number.MIN_VALUE]
        this.rawFeaturePoints.forEach((p) => {
          vec2.min(min, min, p)
          vec2.max(max, max, p)
        })
        let center = vec2.lerp([], min, max, 0.5)
        let size = Math.max.apply(null, vec2.sub([], max, min)) / 2
        vec2.sub(min, center, [size, size])
        vec2.add(max, center, [size, size])
        this.faceSpaceMaterial.min.set(min[0], 180 - min[1])
        this.faceSpaceMaterial.max.set(max[0], 180 - max[1])
      }
    }

    if (this.drawFaceHole) {
      let autoClear = this.renderer.autoClear
      this.renderer.autoClear = false

      this.webcamPlane.visible = true
      this.face.visible = true
      this.face.material = this.faceEdgeMaterial
      this.faceEdgeMaterial.scale = 0.99
      this.faceEdgeMaterial.brightness = 1
      this.renderer.render(this.scene, this.camera, this.texture, true)

      this.webcamPlane.visible = false
      for (let i = 0; i < 10; i++) {
        this.faceEdgeMaterial.scale = 0.99 - i * 0.004
        this.faceEdgeMaterial.brightness = 0.9 - i * 0.02
        this.renderer.clearTarget(this.texture, false, true, true)
        this.renderer.render(this.scene, this.camera, this.texture)
      }

      this.face.material = this.faceSpaceMaterial
      this.faceSpaceMaterial.update()
      this.faceSpaceMaterial.scale = 0.99 - 10 * 0.004
      this.renderer.clearTarget(this.texture, false, true, true)
      this.renderer.render(this.scene, this.camera, this.texture)

      this.renderer.autoClear = autoClear
    } else {
      this.webcamPlane.visible = true
      this.face.visible = false
      this.renderer.render(this.scene, this.camera, this.texture, true)
    }

    /*if (this.data.i_extra.in_frame <= currentFrame && currentFrame <= this.data.i_extra.out_frame, currentFrame) {
      let f = currentFrame - this.data.i_extra.in_frame
      let fade = 1 - this.data.i_extra.property.webcam_fade[f]
      // console.log(currentFrame +':'+fade)
      // TODO : apply fade animation instead of 'fadeout'
    }

    if (this.data.o2_extra.in_frame <= currentFrame && currentFrame <= this.data.o2_extra.out_frame) {
      let f = currentFrame - this.data.o2_extra.in_frame
      let props = this.data.o2_extra.property
      this.material.uniforms.rate.value = props.webcam_fade[f]
    }

    this.material.uniforms.frame.value = currentFrame*/
  }


  fadeOut() {
    let p = {rate: 0.4, brightness: 1}
    new TWEEN.Tween(p).to({rate: 1, brightness:0}, 8000).onUpdate(() => {
      this.material.uniforms.rate.value = p.rate
      // this.material.uniforms.brightness.value = p.brightness
    }).onComplete(() => {
      // this.visible = false
      // this.enabled = false
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
