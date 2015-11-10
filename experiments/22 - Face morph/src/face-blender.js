/* global THREE */


export default class FaceBlender extends THREE.Mesh {

  constructor(geometry1, texture1, geometry2, texture2) {
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
        varying vec2 vUv1;
        varying vec2 vUv2;
        void main() {
          gl_FragColor = mix(texture2D(map1, vUv1), texture2D(map2, vUv2), blend);
        }
      `,
      uniforms: {
        map1: {type: 't', value: null},
        map2: {type: 't', value: null},
        blend: {type: 'f', value: 0}
      }
    }))

    this.geometry.setIndex(geometry1.index)
    this.setFace1(geometry1, texture1)
    this.setFace2(geometry2, texture2)
  }


  setFace1(geometry, texture) {
    this.geometry.addAttribute('position', geometry.positionAttribute)
    this.geometry.addAttribute('uv', geometry.uvAttribute)
    this.material.uniforms.map1.value = texture
  }


  setFace2(geometry, texture) {
    this.geometry.addAttribute('position2', geometry.positionAttribute)
    this.geometry.addAttribute('uv2', geometry.uvAttribute)
    this.material.uniforms.map2.value = texture
  }


  get blend() {
    return this.material.uniforms.blend.value
  }


  set blend(value) {
    this.material.uniforms.blend.value = value
  }

}
