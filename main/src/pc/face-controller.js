/* global THREE */

// import TWEEN from 'tween.js'

import Config from './config'
import DeformableFaceGeometry from './deformable-face-geometry'


export default class FaceController extends THREE.Object3D {

  constructor(data) {
    super()

    this.data = data

    this.main = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.add(this.main)

    if (Config.DEV_MODE) {
      this.main.add(new THREE.AxisHelper())
    }
  }


  applyMainTexture(texture) {
    this.main.material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: texture}
      },
      vertexShader: require('./shaders/face.vert'),
      fragmentShader: require('./shaders/face.frag'),
      side: THREE.DoubleSide
    })
  }


  update(currentFrame) {
    // curl part
    let f = Math.max(this.data.i_extra.in_frame, Math.min(this.data.i_extra.out_frame, currentFrame))
    let scaleZ = this.data.i_extra.property.scale_z[f]

    f = Math.max(this.data.user.in_frame, Math.min(this.data.user.out_frame, currentFrame))
    let props = this.data.user.property
    this.main.geometry.applyMorph(props.morph[f])

    let i = f * 3
    this.main.position.set(props.position[i], props.position[i + 1], props.position[i + 2])
    this.main.scale.set(props.scale[i] * 150, props.scale[i + 1] * 150, props.scale[i + 2] * 150 * scaleZ)
    i = f * 4
    this.main.quaternion.set(props.quaternion[i], props.quaternion[i + 1], props.quaternion[i + 2], props.quaternion[i + 3]).normalize()

    // transition from captured position to keyframes'
    f = Math.max(this.data.i_extra.in_frame, Math.min(this.data.i_extra.out_frame, currentFrame))
    let blend = 1 - this.data.i_extra.property.interpolation[f]
    if (blend > 0) {
      this.main.position.lerp(this.initialTransform.position, blend)
      this.main.scale.lerp(this.initialTransform.scale, blend)
      this.main.quaternion.slerp(this.initialTransform.quaternion, blend)
    }
  }

}
