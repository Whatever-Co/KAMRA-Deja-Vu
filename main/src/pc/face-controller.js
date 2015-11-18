/* global THREE */

import $ from 'jquery'
import _ from 'lodash'

import Config from './config'
import Ticker from './ticker'
import DeformableFaceGeometry from './deformable-face-geometry'
import SlitScanPlane from './slit-scan-plane'
import CreepyFaceTexture from './creepy-face-texture'
import FaceParticle from './face-particle'
import FaceBlender from './face-blender'

const SCALE = 150

const loader = window.__djv_loader


class FaceFrontMaterial extends THREE.ShaderMaterial {

  constructor(texture) {
    super({
      uniforms: {
        map: {type: 't', value: texture},
        clipRange: {type: 'v2', value: new THREE.Vector2(-10000, 10000)},
        scaleZ: {type: 'f', value: 1.0},
        curlStrength: {type: 'f', value: 1.0},
        curlRadius: {type: 'f', value: 0.2},
        curlPushMatrix: {type: 'm4', value:new THREE.Matrix4()},
        curlPopMatrix: {type: 'm4', value:new THREE.Matrix4()}
      },
      vertexShader: require('./shaders/face-front.vert'),
      fragmentShader: require('./shaders/face-front.frag'),
      side: THREE.DoubleSide,
      transparent: true,
    })
  }

}


export default class FaceController extends THREE.Object3D {

  constructor(data, webcam, renderer, camera) {
    super()

    this.enabled = true

    this.data = data
    this.webcam = webcam
    this.renderer = renderer
    this.camera = camera

    // faces
    this.main = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.0}))
    this.main.renderOrder = 1000
    this.main.matrixAutoUpdate = false
    this.add(this.main)

    this.alts = []
    for (let i = 0; i < this.data.user_alt.property.length; i++) {
      let alt = new THREE.Mesh(new DeformableFaceGeometry())
      alt.visible = false
      this.add(alt)
      this.alts.push(alt)
    }

    // children
    this.smalls = []
    for (let i = 0; i < this.data.user_children.property.length; i++) {
      let featurePoints = loader.getResult(`face${i}data`)
      if (!Array.isArray(featurePoints)) debugger
      featurePoints.forEach((p) => {
        p[0] *= 512
        p[1] = (1 - p[1]) * 512
      })
      let geometry = new DeformableFaceGeometry(featurePoints, 512, 512, 400, 1200)
      let material = new FaceFrontMaterial(new THREE.CanvasTexture(loader.getResult(`face${i}image`)))
      let small = new THREE.Mesh(geometry, material)
      small.visible = false
      this.add(small)
      this.smalls.push(small)
    }
    this.smallsEnabled = Config.DATA.user_children

    // mosaic part
    this.rotateGroup = new THREE.Object3D()
    this.add(this.rotateGroup)

    this.face1 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face1.visible = false
    this.face1.matrixAutoUpdate = false
    this.add(this.face1)

    this.face2 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({transparent: true}))
    this.face2.visible = false
    this.face2.matrixAutoUpdate = false
    this.rotateGroup.add(this.face2)

    this.creepyFaceTexture = new CreepyFaceTexture(this.renderer, this.camera, this.webcam, this.face2, new THREE.CanvasTexture(loader.getResult('remap')))

    this.face2.material.map = this.creepyFaceTexture


    this.initFrameEvents()

    // first animation
    this.update = this._followWebcam.bind(this)


    // if (Config.DEV_MODE) {
    //   this.main.add(new THREE.AxisHelper())
    //   this.alts.forEach((face) => face.add(new THREE.AxisHelper()))
    //   this.smalls.forEach((face) => face.add(new THREE.AxisHelper()))
    // }
  }


  initFrameEvents() {
    Config.DATA.user_children.forEach((e, i) => {
      Ticker.addFrameEvent(e.stranger_in_frame, this.changeChildToAnother.bind(this, i))
    })

    Ticker.addFrameEvent(Config.DATA.slitscan.uv_in_frame, () => {
      this.main.visible = false
      this.slicedFaces.forEach((face, i) => face.visible = i != 4)
      this.slitScan = new SlitScanPlane()
      this.slitScan.start(this.main)
      this.add(this.slitScan)
    })

    Ticker.addFrameEvent(this.data.falling_children.in_frame, () => {
      this.main.visible = true
      this.remove(this.slitScan)

      let geometry = this.main.geometry.clone()
      this.fallingChildren = this.data.falling_children.property.map(() => {
        let face = new THREE.Mesh(geometry, this.main.material)
        face.scale.set(SCALE, SCALE, SCALE)
        this.add(face)
        return face
      })
    })

    Ticker.addFrameEvent(this.data.falling_children.out_frame + 1, () => {
      this.fallingChildren[0].geometry.dispose()
      this.fallingChildren.forEach((face) => {
        this.remove(face)
      })
      delete this.fallingChildren
      this.remove(this.main)
    })

    Ticker.addFrameEvent(3300, () => {
      this.webcam.restart()
    })

    Ticker.addFrameEvent(3640, () => {
      this.update = this._updateCreepy.bind(this)
    })
  }


  captureWebcam() {
    this.main.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y)
    this.main.material = new FaceFrontMaterial(this.webcam.takeSnapshot())

    let position = new THREE.Vector3()
    let quaternion = new THREE.Quaternion()
    let scale = new THREE.Vector3()
    this.main.matrix.decompose(position, quaternion, scale)
    this.initialTransform = {position, quaternion, scale}
    this.main.matrixAutoUpdate = true

    this.alts.forEach((face) => {
      face.geometry.copy(this.main.geometry)
      face.material = this.main.material
    })
    this.smalls.forEach((face) => {
      face.geometry.originalUV = face.geometry.uvAttribute.clone()
      face.geometry.uvAttribute.copy(this.main.geometry.uvAttribute)
      face.originalMaterial = face.material
      face.material = this.main.material
    })

    // slice & montage part
    {
      let clipRanges = Config.DATA.slice_row.slice(0, 4).map((r) => r.cut_y * SCALE)
      clipRanges.unshift(10000)
      clipRanges.push(-10000)

      this.slicedFaces = []

      let order = [5, 6, 3, 0, -1, 2, 7, 1, 4]
      for (let i = 0; i < 9; i++) {
        let frontGeometry
        let frontMaterial
        if (order[i] == -1) {
          frontGeometry = this.main.geometry
          frontMaterial = this.main.material
        } else {
          frontGeometry = this.smalls[order[i]].geometry
          frontMaterial = this.smalls[order[i]].originalMaterial
        }

        let backGeometry = new THREE.BufferGeometry()
        backGeometry.setIndex(new THREE.Uint16Attribute(frontGeometry.standardFace.data.back.index, 1))
        backGeometry.addAttribute('position', frontGeometry.positionAttribute)

        let backMaterial = new THREE.ShaderMaterial({
          uniforms: {
            clipRange: {type: 'v2', value: new THREE.Vector2()}
          },
          vertexShader: require('./shaders/face-back.vert'),
          fragmentShader: require('./shaders/face-back.frag'),
          side: THREE.BackSide
        })

        let sliced = new THREE.Object3D()
        sliced.scale.set(SCALE, SCALE, SCALE)
        for (let i = 0; i < clipRanges.length - 1; i++) {
          let slice = new THREE.Object3D()
          slice.position.z = -0.1
          sliced.add(slice)

          let front = new THREE.Mesh(frontGeometry, frontMaterial.clone())
          front.position.z = 0.1
          let clipMin = clipRanges[i + 1]
          let clipMax = clipRanges[i]
          front.material.uniforms.clipRange.value.set(clipMin, clipMax)
          slice.add(front)

          let back = new THREE.Mesh(backGeometry, backMaterial.clone())
          back.position.z = 0.1
          back.material.uniforms.clipRange.value.set(clipMin, clipMax)
          slice.add(back)
        }
        this.slicedFaces.push(sliced)
      }

      Ticker.addFrameEvent(this.data.user_children.out_frame + 1, () => {
        this.main.visible = false
        this.smalls.forEach((face) => this.remove(face))
        this.slicedFaces.forEach((face) => this.add(face))
      })
      Ticker.addFrameEvent(this.data.slice_col.out_frame + 1, () => {
        // this.main.visible = true
        // this.smalls.forEach((face) => face.visible = true)
        this.slicedFaces.forEach((face) => this.remove(face))
      })
    }

    // mosaic part
    {
      this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
      this.face2.matrix.copy(this.webcam.matrixFeaturePoints)

      this.face1.material = new THREE.MeshBasicMaterial({map: this.creepyFaceTexture.clone(), transparent: true, opacity: 0})
      this.face1.visible = false
      this.face1.renderOrder = 1
      this.face1.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
      let config = require('./data/config.json')
      this.face1.position.fromArray(config.mosaic_face.position)
      this.face1.rotation.set(0, 0, Math.PI)
      this.face1.scale.fromArray(config.mosaic_face.scale.map((s) => s * 150))

      this.creepyFaceTexture.update()

      this.prepareForSharing()

      let scale = Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2)
      let sprite = new THREE.CanvasTexture(loader.getResult('particle-sprite'))
      let lut = new THREE.CanvasTexture(loader.getResult('particle-lut'))
      lut.minFilter = lut.maxFilter = THREE.NearestFilter
      this.particles = new FaceParticle(scale, this.face1, sprite, lut)
      this.add(this.particles)
      this.particles.updateData()

      this.blender = new FaceBlender(this.face1, this.face2)
      this.blender.visible = false
      this.blender.renderOrder = 1
      this.add(this.blender)
    }

    this.update = this._update.bind(this)
  }


  prepareForSharing() {
    let data = JSON.stringify(this.webcam.rawFeaturePoints)
    let snapshot = this.webcam.takeSnapshot()
    let cap = this.renderTargetToBlob(snapshot)

    {
      let scene = new THREE.Scene()
      let mesh = new THREE.Mesh(this.face2.geometry, new THREE.MeshBasicMaterial({map: this.creepyFaceTexture}))
      mesh.matrix.copy(this.face2.matrix)
      mesh.matrixAutoUpdate = false
      scene.add(mesh)
      let autoClear = this.renderer.autoClear
      this.renderer.autoClear = false
      this.renderer.clearTarget(snapshot, false, true, true)
      this.renderer.render(scene, this.camera, snapshot)
      this.renderer.autoClear = autoClear
    }
    let kimo = this.renderTargetToBlob(snapshot)

    let formData = new FormData()
    formData.append('data', data)
    formData.append('cap', cap)
    formData.append('kimo', kimo)
    $.ajax({
      method: 'post',
      url: 'http://dev-kamra.invisi-dir.com/api/save/',
      data: formData,
      contentType: false,
      processData: false,
      dataType: 'json'
    }).done((data) => {
      console.log('success', data)
      this.sharedURLs = data
    }).fail((error) => {
      console.error(error)
    })
  }


  renderTargetToBlob(target) {
    let w = target.width
    let h = target.height
    let buffer = new Uint8Array(w * h * 4)
    this.renderer.readRenderTargetPixels(target, 0, 0, w, h, buffer)

    let canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    document.body.appendChild(canvas)
    let ctx = canvas.getContext('2d')
    let imageData = ctx.createImageData(w, h)
    imageData.data.set(buffer)
    ctx.putImageData(imageData, 0, 0)
    ctx.translate(0, canvas.height)
    ctx.scale(1, -1)
    ctx.drawImage(canvas, 0, 0)

    const type = 'image/jpeg'
    let base64 = canvas.toDataURL(type, 0.8)
    let bin = atob(base64.replace(/^.*,/, ''))
    buffer = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i)
    }
    let blob = new Blob([buffer.buffer], {type})
    return blob
  }


  enableChild(i) {
    console.log('enableChild', i, Ticker.currentFrame)
  }


  changeChildToAnother(i) {
    let child = this.smalls[i]
    child.geometry.uvAttribute.copy(child.geometry.originalUV)
    child.geometry.uvAttribute.needsUpdate = true
    child.material = child.originalMaterial
    delete child.geometry.originalUV
    delete child.originalMaterial
  }


  _followWebcam() {
    if (this.webcam.normalizedFeaturePoints) {
      this.main.geometry.deform(this.webcam.normalizedFeaturePoints)
      this.main.matrix.copy(this.webcam.matrixFeaturePoints)
    }
  }


  _update(currentFrame) {
    // intro
    {
      let f = Math.max(this.data.i_extra.in_frame, Math.min(this.data.i_extra.out_frame, currentFrame))
      let scaleZ = this.data.i_extra.property.scale_z[f]

      f = Math.max(this.data.user.in_frame, Math.min(this.data.user.out_frame, currentFrame))
      let props = this.data.user.property
      this.main.position.fromArray(props.position, f * 3)
      this.main.scale.fromArray(props.scale, f * 3).multiplyScalar(SCALE)
      this.main.quaternion.fromArray(props.quaternion, f * 4)
      if (props.morph[f]) {
        this.main.geometry.applyMorph(props.morph[f])
      }

      // transition from captured position to data'
      f = Math.max(this.data.i_extra.in_frame, Math.min(this.data.i_extra.out_frame, currentFrame))
      let blend = 1 - this.data.i_extra.property.interpolation[f]

      this.main.material.uniforms.scaleZ.value = scaleZ
      if (scaleZ < 1) {
        // Apply curl morph
        let material = this.main.material
        let strength = this.data.i_extra.property.curl_strength[f]
        let rotation = this.data.i_extra.property.curl_rotation[f]
        let offset = this.data.i_extra.property.curl_offset[f]

        //console.log(`strength:${strength} offset:${offset} z:${scaleZ}`)
        offset = this._remap(offset, 90, 300, -1.0, 1.0)
        let mat = new THREE.Matrix4()
        mat.multiply(new THREE.Matrix4().makeTranslation(offset, 0, 0))
        mat.multiply(new THREE.Matrix4().makeRotationZ(1.1))
        let invMat = new THREE.Matrix4().getInverse(mat)
        material.uniforms.curlPushMatrix.value = mat
        material.uniforms.curlPopMatrix.value = invMat
        material.uniforms.curlStrength.value = this._remap(strength, 0.0, 4.73, 0.0, 1.0)
      }
      if (blend > 0) {
        this.main.position.lerp(this.initialTransform.position, blend)
        this.main.scale.lerp(this.initialTransform.scale, blend)
        this.main.quaternion.slerp(this.initialTransform.quaternion, blend)
      }
    }

    // alts
    {
      if (this.data.user_alt.in_frame <= currentFrame && currentFrame <= this.data.user_alt.out_frame) {
        let f = currentFrame - this.data.user_alt.in_frame
        this.data.user_alt.property.forEach((props, i) => {
          let face = this.alts[i]
          face.visible = props.enabled[f]
          if (face.visible) {
            face.position.fromArray(props.position, f * 3)
            face.scale.fromArray(props.scale, f * 3).multiplyScalar(SCALE)
            face.quaternion.fromArray(props.quaternion, f * 4)
            if (props.morph[f]) {
              face.geometry.applyMorph(props.morph[f])
            }
          }
        })
      }
    }

    // spawn children
    {
      if (this.data.user_children.in_frame <= currentFrame && currentFrame <= this.data.user_children.out_frame) {
        let f = currentFrame - this.data.user_children.in_frame
        this.data.user_children.property.forEach((props, i) => {
          let face = this.smalls[i]
          face.visible = this.smallsEnabled[i].enabled_in_frame <= currentFrame
          if (face.visible) {
            face.position.fromArray(props.position, f * 3)
            face.scale.fromArray(props.scale, f * 3).multiplyScalar(SCALE)
            face.quaternion.fromArray(props.quaternion, f * 4)
            if (props.morph[f]) {
              face.geometry.applyMorph(props.morph[f])
            }
          }
        })
      }
    }

    // slicing
    if (this.data.slice_row.in_frame <= currentFrame && currentFrame <= this.data.slice_row.out_frame) {
      let f = currentFrame - this.data.slice_row.in_frame
      for (let i = 0; i < 9; i++) {
        let face = this.slicedFaces[i]
        let props = this.data.slice_col.property[i]
        face.position.fromArray(props.position, f * 3)
        face.quaternion.fromArray(props.quaternion, f * 4)
        for (let j = 0; j < 5; j++) {
          let slice = face.children[j]
          let props = this.data.slice_row.property[j]
          slice.position.x = props.offset_x[f] / SCALE
          slice.rotation.y = props.rotation[f]
        }
      }
    }

    // slit-scan
    if (Config.DATA.slitscan.uv_in_frame <= currentFrame && currentFrame <= Config.DATA.slitscan.uv_out_frame) {
      this.slitScan.update(this.renderer)
    }

    // falling children
    if (this.data.falling_children.in_frame <= currentFrame && currentFrame <= this.data.falling_children.out_frame) {
      let f = currentFrame - this.data.falling_children.in_frame
      // this.fallingChildren[0].geometry.applyMorph(this.data.falling_children_mesh.property[0].morph[f])
      this.data.falling_children.property.forEach((props, i) => {
        let face = this.fallingChildren[i]
        face.position.fromArray(props.position, f * 3)
        face.quaternion.fromArray(props.quaternion, f * 4)
      })
    }

    // mosaic
    if (this.data.mosaic.in_frame <= currentFrame && currentFrame <= this.data.mosaic.out_frame + 50) {
      let t = (currentFrame - this.data.mosaic.in_frame) / (this.data.mosaic.out_frame + 50 - this.data.mosaic.in_frame)
      this.particles.update(t)
    }
    if (this.data.o2_extra.in_frame <= currentFrame && currentFrame <= this.data.o2_extra.out_frame) {
      let f = currentFrame - this.data.o2_extra.in_frame
      let props = this.data.o2_extra.property
      this.rotateGroup.rotation.z = this.camera.rotation.z

      this.blender.visible = true
      this.blender.blend = props.interpolation[f]
      this.blender.opacity = THREE.Math.clamp(f / 50, 0, 1)
      if (this.blender.blend >= 1) {
        this.blender.visible = false
        this.face1.visible = false
        this.face2.visible = true
      }
      if (this.webcam.normalizedFeaturePoints) {
        this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
        this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
        this.creepyFaceTexture.update()
      }
    }
  }


  _updateCreepy() {
    if (this.webcam.normalizedFeaturePoints) {
      this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
      this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
      this.creepyFaceTexture.update()
    }
  }


  _remap(value, inputMin, inputMax, outputMin, outputMax) {
    return ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin)
  }

}
