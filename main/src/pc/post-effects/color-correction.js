/* global THREE */

import TWEEN from 'tween.js'


export default class ColorCorrection extends THREE.ShaderPass {

  constructor(lut) {
    lut.magFilter = lut.minFilter = THREE.NearestFilter
    lut.generateMipmaps = false
    lut.flipY = false
    super({
      uniforms: {
        tDiffuse: {type: 't', value: null},
        tLut: {type: 't', value: lut},
        blend: {type: 'f', value: 0},
      },
      vertexShader: require('../shaders/basic-transform.vert'),
      fragmentShader: require('../shaders/color-correction.frag'),
    })
  }

  set blend(value) {
    this.uniforms.blend.value = value
  }

  get blend() {
    return this.uniforms.blend.value
  }

  setEnabled(value) {
    new TWEEN.Tween(this).to({blend: value ? 1 : 0}, 5000).start()
  }

}
