/* global THREE */

import Config from '../config'


export default class CompositePass extends THREE.ShaderPass {

  constructor() {
    super({
      uniforms: {
        resolution: {type: 'v2', value: new THREE.Vector2(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)},
        tDiffuse: {type: 't', value: null},
        tNoise: {type: 't', value: null},
        noiseSize: {type: 'v2', value: new THREE.Vector2(512, 512)},
        noiseOffset: {type: 'v2', value: new THREE.Vector2(0, 0)},
        noiseEnabled: {type: 'i', value: 0}
      },
      vertexShader: require('../shaders/basic-transform.vert'),
      fragmentShader: require('../shaders/composite2.frag'),
    })
    this.enabled = false
    this.loadNoise()
  }


  loadNoise() {
    let loader = new THREE.TextureLoader()
    loader.load('images/noise.png', (texture) => {
      texture.magFilter = texture.minFilter = THREE.NearestFilter
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      this.material.uniforms.tNoise.value = texture
    this.enabled = true
    })
  }


  update(currentFrame) {
    if (currentFrame % 2 == 0) {
      this.material.uniforms.noiseOffset.value.set(Math.random() * 4, Math.random() * 3)
    }
  }


  set noiseEnabled(value) {
    this.material.uniforms.noiseEnabled.value = +value
  }

  get noiseEnabled() {
    return !!this.material.uniforms.noiseEnabled.value
  }

}
