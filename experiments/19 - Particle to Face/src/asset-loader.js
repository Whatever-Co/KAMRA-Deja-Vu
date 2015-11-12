/* global createjs */

// import Config from './config'

let loader = new createjs.LoadQueue()
loader.installPlugin(createjs.Sound)
// let min = Config.DEV_MODE ? '.min' : ''
loader.loadManifest([
  {id: 'keyframes', src: 'keyframes.json'},
  {id: 'particle-sprite', src: 'media/particle_sprite.png'},
  {id: 'particle-lut', src: 'media/particle_index_lut.png'},
  {id: 'lut', src: 'lut4b.png'},
], false)

export default loader
