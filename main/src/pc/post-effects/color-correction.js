/* global THREE */


export default class ColorCorrection extends THREE.ShaderPass {

  constructor(lut) {
    lut.magFilter = lut.minFilter = THREE.NearestFilter
    lut.generateMipmaps = false
    lut.flipY = false
    super({
      uniforms: {
        tDiffuse: {type: 't', value: null},
        tLut: {type: 't', value: lut}
      },
      vertexShader: require('../shaders/basic-transform.vert'),
      fragmentShader: require('../shaders/color-correction.frag'),
    })
  }

}
