/* global THREE */

import {vec2, mat3} from 'gl-matrix'

import Ticker from './ticker'
import StandardFaceData from './standard-face-data'
import DeformableFaceGeometry from './deformable-face-geometry'


const ROT_Z_90 = new THREE.Matrix4().makeRotationZ(Math.PI)



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
        resolution: {type: 'v2', value: new THREE.Vector2(2048, 1024)}
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
        uniform vec2 resolution;
        void main() {
          vec2 uv = (gl_FragCoord.xy / resolution * vec2(320., 180.) - min) / (max - min);
          uv.y = 1.0 - uv.y;
          gl_FragColor = texture2D(spaceMap, uv);
        }
      `
    })

    this.video = document.createElement('video')
    // this.video.id = '_tracker-canvas'
    // document.body.appendChild(this.video)
    this.video.width = this.video.height = 256
    this.video.loop = true
    this.video.autoplay = true
    this.video.src = 'textures/curl_bg.mp4'
    this.video.addEventListener('loadedmetadata', () => {
      this.texture = new THREE.Texture(this.video)
      this.uniforms.spaceMap.value = this.texture
    })

    // let loader = new THREE.TextureLoader()
    // loader.load('textures/uvcheck.png', (texture) => {
    //   this.texture = texture
    //   this.uniforms.spaceMap.value = this.texture
    // })
  }

  update() {
    if (this.texture && this.prev != this.video.currentTime) {
      // console.log(this.video.currentTime)
      this.texture.needsUpdate = true
      this.prev = this.video.currentTime
    }
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



export default class UserImagePlane extends THREE.Mesh {

  constructor(data, camera, renderer) {
    super(
      new THREE.PlaneBufferGeometry(16 / 9, 1, 16 * 4, 9 * 4),
      new THREE.ShaderMaterial({
        uniforms: {
          texture: {type: 't', value: null},
          alpha: {type: 'f', value: 1},
          rate: {type: 'f', value: 0},
          frame: {type: 'f', value: 0.0},
          faceCenter: {type: 'v2', value: new THREE.Vector2(0.5, 0.5)},
          faceRadius: {type: 'f', value: 0.5},
          waveForce: {type: 'f', value: 0.03},
        },
        vertexShader:require('./shaders/webcam-plane.vert'),
        fragmentShader:require('./shaders/webcam-plane.frag'),
        transparent: true,
        depthWrite: false,
      })
    )
    this.renderOrder = -1000

    this.update = this.update.bind(this)

    this.data = data
    this.camera = camera
    this.renderer = renderer
    this.scene = new THREE.Scene()

    this.texture = new THREE.WebGLRenderTarget(2048, 1024, {
      wrapS: THREE.MirroredRepeatWrapping,
      wrapT: THREE.MirroredRepeatWrapping,
      stencilBuffer: false,
    })

    this.material.uniforms.texture.value = this.texture

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
        uniform vec2 resolution;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(map, vUv);
        }
      `,
      depthWrite: false,
      depthTest: false,
    }))
    this.scene.add(this.webcamPlane)

    this.standardFaceData = new StandardFaceData()

    this.faceEdgeMaterial = new FaceEdgeMaterial(this.webcamTexture)
    this.faceSpaceMaterial = new FaceSpaceMaterial()
    {
      let geometry = new DeformableFaceGeometry()
      let data = this.standardFaceData.data
      geometry.setIndex(new THREE.Uint16Attribute(data.face.index.concat(data.rightEye.index, data.leftEye.index, data.mouth.index), 1))
      this.face = new THREE.Mesh(geometry, this.faceEdgeMaterial)
      this.face.matrixAutoUpdate = false
      this.scene.add(this.face)
    }

    this.matrixFeaturePoints = new THREE.Matrix4()

    this.drawFaceHole = false
    this.isOutro = false
    this.enabled = false

    this.initFrameEvent()
  }


  get alpha() {
    return this.material.uniforms.alpha.value
  }

  set alpha(value) {
    this.material.uniforms.alpha.value = value
  }


  initFrameEvent() {
    Ticker.addFrameEvent(this.data.i_extra.out_frame, () => {
      this.faceSpaceMaterial.video.pause()
    })
    Ticker.addFrameEvent(this.data.o2_extra.in_frame, () => {
      this.faceSpaceMaterial.video.play()
    })
    Ticker.addFrameEvent(3590, () => {
      this.faceSpaceMaterial.video.pause()
      this.drawFaceHole = false
      this.updateWebcamPlane()
    })
  }


  start() {
    throw 'not implemented in sub class'
  }


  restart() {
    this.isOutro = true
  }


  update(currentFrame) {
    if (this.data.i_extra.in_frame <= currentFrame && currentFrame <= this.data.i_extra.out_frame) {
      let f = currentFrame - this.data.i_extra.in_frame
      this.material.uniforms.rate.value = this.data.i_extra.property.webcam_fade[f]
    }

    if (this.data.o2_extra.in_frame <= currentFrame && currentFrame <= this.data.o2_extra.out_frame) {
      let f = currentFrame - this.data.o2_extra.in_frame
      let props = this.data.o2_extra.property
      this.material.uniforms.rate.value = props.webcam_fade[f]
    }

    this.material.uniforms.frame.value++
  }


  updateWebcamPlane() {
    this.webcamPlane.visible = true
    this.face.visible = false
    this.renderer.render(this.scene, this.camera, this.texture, true)
  }


  updateFaceHole() {
    if (!this.drawFaceHole || !this.rawFeaturePoints) {
      return
    }

    this.face.geometry.init(this.rawFeaturePoints, 320, 180, this.scale.y, this.camera.position.z)
    this.face.matrix.copy(this.matrixFeaturePoints)
    if (this.isOutro) {
      this.face.matrix.multiplyMatrices(ROT_Z_90, this.face.matrix)
    }

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

    let autoClear = this.renderer.autoClear
    this.renderer.autoClear = false

    this.webcamPlane.visible = true
    this.face.visible = true
    this.face.material = this.faceEdgeMaterial
    this.faceEdgeMaterial.scale = 0.99
    this.faceEdgeMaterial.brightness = 1
    this.renderer.render(this.scene, this.camera, this.texture, true)

    this.webcamPlane.visible = false
    for (let i = 0; i < 8; i++) {
      this.faceEdgeMaterial.scale = 0.99 - i * 0.004
      this.faceEdgeMaterial.brightness = 0.8 - i * 0.05
      this.renderer.clearTarget(this.texture, false, true, true)
      this.renderer.render(this.scene, this.camera, this.texture)
    }

    this.face.material = this.faceSpaceMaterial
    this.faceSpaceMaterial.update()
    this.faceSpaceMaterial.scale = 0.99 - 8 * 0.004
    this.renderer.clearTarget(this.texture, false, true, true)
    this.renderer.render(this.scene, this.camera, this.texture)

    this.renderer.autoClear = autoClear
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

    // calc center and size of raw points
    {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      this.rawFeaturePoints.forEach((p) => {
        vec2.min(min, min, p)
        vec2.max(max, max, p)
      })
      let center = vec2.lerp([], min, max, 0.5)
      this.material.uniforms.faceCenter.value.set(center[0] / 320, center[1] / 180)
      let size = vec2.sub([], max, min)
      this.material.uniforms.faceRadius.value = Math.max(size[0], size[1]) / 180 * 1.1
    }
  }


  updateTexture() {
    console.warn('No need to updateTexture?')
    // debugger
  }


  takeSnapshot(width = 1024, height = 1024) {
    let snapshot = new THREE.WebGLRenderTarget(width, height, {stencilBuffer: false})
    this.updateTexture()
    this.webcamPlane.visible = true
    this.face.visible = false
    this.renderer.render(this.scene, this.camera, snapshot, true)
    return snapshot
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
