/* global createjs */

import Config from './config'

let loader = new createjs.LoadQueue()
loader.installPlugin(createjs.Sound)
let min = Config.DEV_MODE ? '.min' : ''
loader.loadManifest([
  {src: `libs/clmtrackr${min}.js`},
  {src: 'libs/model_pca_20_svm.js'},
  {src: `libs/three${min}.js`},
  {id: 'keyframes', src: 'data/keyframes.json'},
  {id: 'music-main', src: 'data/main.mp3'},
  {src: 'app.js'}
  ], false)

export default loader
