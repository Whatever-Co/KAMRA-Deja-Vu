/* global THREE */

import _ from 'lodash'

import Config from './config'
import Ticker from './ticker'
import FaceLibrary from './face-library'
import DeformableFaceGeometry from './deformable-face-geometry'
import FaceFrontMaterial from './face-front-material'
import SlitScanPlane from './slit-scan-plane'
import CreepyFaceTexture from './creepy-face-texture'
import FaceParticle from './face-particle'
import FaceBlender from './face-blender'

const SCALE = 150

const loader = window.__djv_loader




export default class FaceController extends THREE.Object3D {

  constructor(data, webcam, renderer, camera, RIRI = false) {
    super()

    this.enabled = true

    this.data = data
    this.webcam = webcam
    this.renderer = renderer
    this.camera = camera

    console.time('face controller init')

    // faces
    this.main = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.0}))
    this.main.matrixAutoUpdate = false
    this.add(this.main)
    {
      let geometry = new THREE.BufferGeometry()
      geometry.setIndex(new THREE.Uint16Attribute(this.main.geometry.standardFace.data.mouth.index, 1))
      geometry.addAttribute('position', this.main.geometry.positionAttribute)
      geometry.addAttribute('uv', this.main.geometry.uvAttribute)
      this.mouth = new THREE.Mesh(geometry, this.main.material)
      this.main.add(this.mouth)
    }

    this.alts = []
    for (let i = 0; i < this.data.user_alt.property.length; i++) {
      let alt = new THREE.Mesh(new DeformableFaceGeometry())
      alt.visible = false
      this.add(alt)
      this.alts.push(alt)
    }

    // children
    {
      this.smalls = FaceLibrary.getRandomMeshes(this.data.user_children.property.length - 1)
      this.smalls.splice(RIRI ? 0 : ~~(Math.random() * this.smalls.length), 0, FaceLibrary.getMesh('lula'))
      for (let i = 0; i < this.smalls.length; i++) {
        this.smalls[i].visible = false
        this.add(this.smalls[i])
      }
    }

    // mosaic part
    this.rotateGroup = new THREE.Object3D()
    this.add(this.rotateGroup)

    this.face1 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face1.geometry.fillMouth()
    this.face1.visible = false
    this.face1.matrixAutoUpdate = false
    this.add(this.face1)

    this.face2 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({transparent: true}))
    this.face2.geometry.fillMouth()
    this.face2.visible = false
    this.face2.matrixAutoUpdate = false
    this.rotateGroup.add(this.face2)

    this.creepyFaceTexture = new CreepyFaceTexture(this.renderer, this.camera, this.webcam, this.face2)

    this.face2.material.map = this.creepyFaceTexture


    this.initFrameEvents()

    // first animation
    this.update = this._followWebcam.bind(this)

    console.timeEnd('face controller init')

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

    Ticker.addFrameEvent(100, () => {
      this.mouth.visible = false
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

      this.fallingChildren = FaceLibrary.getRandomMeshes(this.data.falling_children.property.length - 1)
      this.fallingChildren.splice(~~(Math.random() * this.smalls.length), 0, FaceLibrary.getMesh('lula'))
      this.fallingChildren.forEach((face) => {
        face.scale.set(SCALE, SCALE, SCALE)
        this.add(face)
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
    this.main.material = new FaceFrontMaterial(this.webcam.takeSnapshot(1024, 1024), this.camera.position.z)
    this.mouth.material = this.main.material

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

      let order = [4, 5, 1, 0, -1, 7, 3, 2, 6]
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
          slice.position.z = -0.15
          sliced.add(slice)

          let front = new THREE.Mesh(frontGeometry, frontMaterial.clone())
          front.position.z = 0.15
          let clipMin = clipRanges[i + 1]
          let clipMax = clipRanges[i]
          front.material.uniforms.clipRange.value.set(clipMin, clipMax)
          slice.add(front)

          let back = new THREE.Mesh(backGeometry, backMaterial.clone())
          back.position.z = 0.15
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

      let scale = Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2)
      let sprite = new THREE.CanvasTexture(loader.getResult('particle-sprite'))
      let lut = new THREE.CanvasTexture(loader.getResult('particle-lut'))
      lut.minFilter = lut.maxFilter = THREE.NearestFilter
      this.particles = new FaceParticle(scale, this.face1, sprite, lut)
      this.particles.renderOrder = 10000
      this.particles.visible = false
      this.add(this.particles)
      this.particles.updateData()

      this.blender = new FaceBlender(this.face1, this.face2)
      this.blender.visible = false
      this.blender.renderOrder = 1
      this.add(this.blender)
    }

    // prepare for sharing
    {
      let data = _.cloneDeep(this.webcam.rawFeaturePoints)
      let cap = this.webcam.takeSnapshot(1280, 720)
      let kimo = this.webcam.takeSnapshot(1280, 720)

      let scene = new THREE.Scene()
      let mesh = new THREE.Mesh(this.face2.geometry, new THREE.MeshBasicMaterial({map: this.creepyFaceTexture}))
      mesh.matrix.copy(this.face2.matrix)
      mesh.matrixAutoUpdate = false
      scene.add(mesh)
      let autoClear = this.renderer.autoClear
      this.renderer.autoClear = false
      this.renderer.clearTarget(kimo, false, true, true)
      this.renderer.render(scene, this.camera, kimo)
      this.renderer.autoClear = autoClear

      this.shareData = {data, cap, kimo}
    }

    this.update = this._update.bind(this)
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
    // main face
    {
      let f = Math.max(this.data.user.in_frame, Math.min(this.data.user.out_frame, currentFrame))
      let props = this.data.user.property
      this.main.position.fromArray(props.position, f * 3)
      this.main.scale.fromArray(props.scale, f * 3).multiplyScalar(SCALE)
      this.main.quaternion.fromArray(props.quaternion, f * 4)
      if (props.morph[f]) {
        this.main.geometry.applyMorph(props.morph[f])
      }
      let uniforms = this.main.material.uniforms
      uniforms.scaleZ.value = 1
      uniforms.curlStrength.value = 0
      uniforms.curlRotateX.value = 0
    }

    // intro
    if (currentFrame <= this.data.i_extra.out_frame) {
      // let f = currentFrame - this.data.i_extra.in_frame
      let f = Math.max(this.data.i_extra.in_frame, Math.min(this.data.i_extra.out_frame, currentFrame))
      let props = this.data.i_extra.property

      // transition from captured position to data'
      let blend = 1 - props.interpolation[f]
      if (blend > 0) {
        this.main.position.lerp(this.initialTransform.position, blend)
        this.main.scale.lerp(this.initialTransform.scale, blend)
        this.main.quaternion.slerp(this.initialTransform.quaternion, blend)
      }

      // curl shader params
      this.main.updateMatrixWorld()
      let uniforms = this.main.material.uniforms
      uniforms.inverseModelMatrix.value.getInverse(this.main.matrixWorld)
      uniforms.scaleZ.value = props.scale_z[f]
      uniforms.curlOffset.value = props.curl_offset[f]
      uniforms.curlStrength.value = props.curl_strength[f]
      uniforms.curlRotateX.value = props.curl_rotation[f]
    }

    // alts
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

    // spawn children
    if (this.data.user_children.in_frame <= currentFrame && currentFrame <= this.data.user_children.out_frame) {
      let f = currentFrame - this.data.user_children.in_frame
      this.data.user_children.property.forEach((props, i) => {
        let face = this.smalls[i]
        face.visible = Config.DATA.user_children[i].enabled_in_frame <= currentFrame
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
      this.data.falling_children.property.forEach((props, i) => {
        let face = this.fallingChildren[i]
        face.position.fromArray(props.position, f * 3)
        face.quaternion.fromArray(props.quaternion, f * 4)
        if (this.data.falling_children_mesh.in_frame <= currentFrame && currentFrame <= this.data.falling_children_mesh.out_frame) {
          let f = currentFrame - this.data.falling_children_mesh.in_frame
          let meshIndex = Config.DATA.falling_children[i].mesh_index
          face.geometry.applyMorph(this.data.falling_children_mesh.property[meshIndex].morph[f])
        }
      })
    }

    // mosaic
    if (this.data.mosaic.in_frame <= currentFrame && currentFrame <= this.data.mosaic.out_frame) {
      let f = currentFrame - this.data.mosaic.in_frame
      this.particles.update(this.data.mosaic.property.time[f])
      this.particles.visible = true
    }
    if (this.data.o2_extra.in_frame <= currentFrame && currentFrame <= this.data.o2_extra.out_frame) {
      let f = currentFrame - this.data.o2_extra.in_frame

      this.particles.update(1 + Math.min(1, f / 30 * 0.1))
      this.particles.visible = f < 30

      let props = this.data.o2_extra.property
      this.rotateGroup.rotation.z = this.camera.rotation.z

      this.blender.visible = true
      this.blender.blend = props.interpolation[f]
      this.blender.opacity = THREE.Math.clamp(f / 10, 0, 1)
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
