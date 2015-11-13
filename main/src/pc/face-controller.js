/* global THREE */

import Config from './config'
import DeformableFaceGeometry from './deformable-face-geometry'
import CreepyFaceTexture from './creepy-face-texture'
import FaceParticle from './face-particle'
import FaceBlender from './face-blender'

const SCALE = 150


export default class FaceController extends THREE.Object3D {

  constructor(data, webcam, renderer, camera) {
    super()

    this.enabled = true

    this.data = data
    this.webcam = webcam
    this.renderer = renderer
    this.camera = camera

    // faces
    this.main = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.main.matrixAutoUpdate = false
    this.add(this.main)

    this.alts = []
    for (let i =0; i < this.data.user_alt.property.length; i++) {
      let alt = new THREE.Mesh(new DeformableFaceGeometry())
      alt.visible = false
      this.add(alt)
      this.alts.push(alt)
    }

    this.smalls = []
    for (let i = 0; i < this.data.user_children.property.length; i++) {
      let small = new THREE.Mesh(new DeformableFaceGeometry())
      small.visible = false
      this.add(small)
      this.smalls.push(small)
    }
    this.smallsEnabled = Config.DATA.user_children


    // mosaic part
    this.rotateGroup = new THREE.Object3D()
    this.add(this.rotateGroup)

    this.face1 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face1.matrixAutoUpdate = false
    this.add(this.face1)

    this.face2 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({transparent: true}))
    this.face2.visible = false
    this.face2.matrixAutoUpdate = false
    this.rotateGroup.add(this.face2)

    this.creepyFaceTexture = new CreepyFaceTexture(this.renderer, this.camera, this.webcam, this.face2)

    this.face2.material.map = this.creepyFaceTexture


    // first animation
    this.update = this._followWebcam.bind(this)


    if (Config.DEV_MODE) {
      this.main.add(new THREE.AxisHelper())
      this.alts.forEach((face) => face.add(new THREE.AxisHelper()))
      this.smalls.forEach((face) => face.add(new THREE.AxisHelper()))
    }
  }


  captureWebcam() {
    this.main.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y)

    this.main.material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: this.webcam.texture.clone()},
        clipRange: {type: 'v2', value: new THREE.Vector2(-10000, 10000)},
        scaleZ: {type: 'f', value:1.0},
        curlStrength: {type: 'f', value:1.0},
        curlRadius: {type: 'f', value:0.2},
        curlPushMatrix: {type: 'm4', value:new THREE.Matrix4()},
        curlPopMatrix: {type: 'm4', value:new THREE.Matrix4()}
      },
      vertexShader: require('./shaders/face-front.vert'),
      fragmentShader: require('./shaders/face-front.frag'),
      side: THREE.DoubleSide
    })

    let position = new THREE.Vector3()
    let quaternion = new THREE.Quaternion()
    let scale = new THREE.Vector3()
    this.main.matrix.decompose(position, quaternion, scale)
    this.initialTransform = {position, quaternion, scale}
    this.main.matrixAutoUpdate = true

    this.alts.forEach((face) => {
      face.geometry.positionAttribute.copy(this.main.geometry.positionAttribute)
      face.geometry.uvAttribute.copy(this.main.geometry.uvAttribute)
      face.geometry.uvAttribute.needsUpdate = true
      face.material = this.main.material
    })
    this.smalls.forEach((face) => {
      face.geometry.positionAttribute.copy(this.main.geometry.positionAttribute)
      face.geometry.uvAttribute.copy(this.main.geometry.uvAttribute)
      face.geometry.uvAttribute.needsUpdate = true
      face.material = this.main.material
    })

    // slice & montage part
    {
      let frontGeometry = this.main.geometry
      let frontMaterial = this.main.material
      frontGeometry.computeBoundingBox()

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

      const minY = frontGeometry.boundingBox.min.y * SCALE
      const maxY = frontGeometry.boundingBox.max.y * SCALE
      const height = maxY - minY
      const numSlices = 5
      const sliceHeight = height / numSlices

      this.mainSlices = []
      for (let i = 0; i < numSlices; i++) {
        let face = new THREE.Object3D()
        face.visible = false
        face.scale.set(SCALE, SCALE, SCALE)
        face.position.z = -0.5 * SCALE
        this.add(face)

        let front = new THREE.Mesh(frontGeometry, frontMaterial.clone())
        front.position.z = 0.5
        let clipMin = minY + i * sliceHeight
        let clipMax = minY + (i + 1) * sliceHeight
        front.material.uniforms.clipRange.value.set(clipMin, clipMax)
        face.add(front)

        let back = new THREE.Mesh(backGeometry, backMaterial.clone())
        back.position.z = 0.5
        back.material.uniforms.clipRange.value.set(clipMin, clipMax)
        face.add(back)

        this.mainSlices.push(face)
      }
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
      console.log(this.face1.scale)

      this.creepyFaceTexture.update()

      let scale = Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2)
      let loader = window.__djv_loader
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
      this.main.geometry.applyMorph(props.morph[f])

      this.main.position.fromArray(props.position, f * 3)
      this.main.scale.fromArray(props.scale, f * 3).multiplyScalar(SCALE)
      this.main.quaternion.fromArray(props.quaternion, f * 4)

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
          }
        })
      }
    }

    // slicing
    if (this.data.slice_row.in_frame <= currentFrame && currentFrame <= this.data.slice_row.out_frame) {
      this.main.visible = false
      let f = currentFrame - this.data.slice_row.in_frame
      this.data.slice_row.property.forEach((props, i) => {
        let slice = this.mainSlices[i]
        slice.visible = true
        slice.position.x = props.offset_x[f]
        slice.rotation.y = props.rotation[f]
      })
    }

    // mosaic
    if (this.data.mosaic.in_frame <= currentFrame && currentFrame <= this.data.mosaic.out_frame + 50) {
      let t = (currentFrame - this.data.mosaic.in_frame) / (this.data.mosaic.out_frame + 50 - this.data.mosaic.in_frame)
      this.particles.update(t)
      this.webcam.enableTracking = true
      this.webcam.enableScoreChecking = false
    }
    if (this.data.o2_extra.in_frame <= currentFrame && currentFrame <= this.data.o2_extra.out_frame) {
      let f = currentFrame - this.data.o2_extra.in_frame
      let props = this.data.o2_extra.property
      // this.webcam.opacity = 1 - props.webcam_fade[f]
      // let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
      // this.webcam.scale.set(scale, scale, scale)
      // this.webcam.rotation.z = this.camera.rotation.z
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

    if (this.data.camera.out_frame < currentFrame) {
      this._update = this._updateCreepy.bind(this)
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
