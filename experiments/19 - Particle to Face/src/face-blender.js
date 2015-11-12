/* global THREE */


export default class FaceBlender extends THREE.Mesh {

  constructor(face1, face2, blend = 0) {
    super(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      vertexShader: `
        uniform float blend;
        attribute vec3 position2;
        attribute vec2 uv2;
        varying vec2 vUv1;
        varying vec2 vUv2;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(position, position2, blend), 1.0);
          vUv1 = uv;
          vUv2 = uv2;
        }
      `,
      fragmentShader: `
        uniform sampler2D map1;
        uniform sampler2D map2;
        uniform float blend;
        uniform float alpha;
        varying vec2 vUv1;
        varying vec2 vUv2;
        void main() {
          gl_FragColor = mix(texture2D(map1, vUv1), texture2D(map2, vUv2), blend);
          gl_FragColor.a = alpha;
        }
      `,
      uniforms: {
        map1: {type: 't', value: null},
        map2: {type: 't', value: null},
        blend: {type: 'f', value: 0},
        alpha: {type: 'f', value: 0}
      },
      side: THREE.DoubleSide,
      transparent: true,
      // wireframe: true,
    }))

    this.geometry.setIndex(face1.geometry.index)
    this.setFace1(face1)
    this.setFace2(face2)

    this.blend = blend

    this.matrixAutoUpdate = false
  }


  setFace1(face) {
    this.face1 = face
    this.geometry.addAttribute('position', face.geometry.positionAttribute)
    this.geometry.addAttribute('uv', face.geometry.uvAttribute)
    this.material.uniforms.map1.value = face.material.map
  }


  setFace2(face) {
    this.face2 = face
    this.geometry.addAttribute('position2', face.geometry.positionAttribute)
    this.geometry.addAttribute('uv2', face.geometry.uvAttribute)
    this.material.uniforms.map2.value = face.material.map
  }


  set opacity(value) {
    this.material.uniforms.alpha.value = value
  }


  get blend() {
    return this.material.uniforms.blend.value
  }


  set blend(value) {
    this.material.uniforms.blend.value = value

    let position = new THREE.Vector3()
    let quat = new THREE.Quaternion()
    let scale = new THREE.Vector3()
    this.face1.updateMatrixWorld()
    this.face1.matrixWorld.decompose(position, quat, scale)
    let position2 = new THREE.Vector3()
    let quat2 = new THREE.Quaternion()
    let scale2 = new THREE.Vector3()
    this.face2.updateMatrixWorld()
    this.face2.matrixWorld.decompose(position2, quat2, scale2)

    position.lerp(position2, value)
    quat.slerp(quat2, value)
    scale.lerp(scale2, value)
    this.matrix.compose(position, quat, scale)
  }

}
