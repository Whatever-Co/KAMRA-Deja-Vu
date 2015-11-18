/* global THREE */

import Config from '../config'


export default class ChromaticAberration extends THREE.ShaderPass {

  constructor(lut) {
    super({
      uniforms: {
        tDiffuse: {type: 't', value: null},
        resolution: {type: 'v2', value: new THREE.Vector2(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)}
      },
      vertexShader: require('../shaders/basic-transform.vert'),
      fragmentShader: require('../shaders/chromatic-aberration.frag')
    })
  }

}
