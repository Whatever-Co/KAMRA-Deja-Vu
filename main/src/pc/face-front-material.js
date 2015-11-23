/* global THREE */

export default class FaceFrontMaterial extends THREE.ShaderMaterial {

  constructor(texture, cameraZ) {
    super({
      uniforms: {
        map: {type: 't', value: texture},
        clipRange: {type: 'v2', value: new THREE.Vector2(-10000, 10000)},
        cameraZ: {type: 'f', value: cameraZ},
        inverseModelMatrix: {type: 'm4', value: new THREE.Matrix4()},
        scaleZ: {type: 'f', value: 1},
        curlOffset: {type: 'f', value: 300},
        curlStrength: {type: 'f', value: 0},
        curlRotateX: {type: 'f', value: 0}
      },
      vertexShader: require('./shaders/face-front.vert'),
      fragmentShader: require('./shaders/face-front.frag'),
      side: THREE.DoubleSide,
      transparent: true,
    })
  }

}
