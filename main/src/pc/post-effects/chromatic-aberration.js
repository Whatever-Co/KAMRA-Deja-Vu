/* global THREE */


export default class ChromaticAberration extends THREE.ShaderPass {

  constructor() {
    super({
      uniforms: {
        tDiffuse: {type: 't', value: null},
      },
      vertexShader: require('../shaders/basic-transform.vert'),
      fragmentShader: require('../shaders/chromatic-aberration.frag'),
    })
  }

}
