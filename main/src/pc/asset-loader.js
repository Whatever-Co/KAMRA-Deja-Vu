/* global createjs */

import _ from 'lodash'
import Config from './config'


const ids = _.shuffle([
  'shutterstock_34458424',
  'shutterstock_38800999',
  'shutterstock_43029727',
  'shutterstock_50319730',
  'shutterstock_56254417',
  'shutterstock_61763248',
  'shutterstock_61763281',
  'shutterstock_61763284',
  'shutterstock_62322955',
  'shutterstock_62322958',
  'shutterstock_62322991',
  'shutterstock_62323015',
  'shutterstock_62326021',
  'shutterstock_62329042',
  'shutterstock_62329057',
  'shutterstock_65723770',
  'shutterstock_67482535',
  'shutterstock_73560778',
  'shutterstock_75964753',
  'shutterstock_76228309',
  'shutterstock_76601563',
  'shutterstock_82382014',
  'shutterstock_84450604',
  'shutterstock_88981282',
  'shutterstock_90132811',
  'shutterstock_90145822',
  'shutterstock_90145831',
  'shutterstock_102487424',
  'shutterstock_102519095',
  'shutterstock_108823715',
  'shutterstock_119418220',
  'shutterstock_123210295',
  'shutterstock_154575875',
  'shutterstock_154705646',
  'shutterstock_191655620',
  'shutterstock_192777233',
  'shutterstock_192779666',
  'shutterstock_196463690',
  'shutterstock_201214193',
  'shutterstock_208819636',
  'shutterstock_222952117',
  'shutterstock_227519725',
  'shutterstock_253050412',
  'shutterstock_259299740',
  'shutterstock_269297027',
  'shutterstock_273963323',
  'shutterstock_278854301',
  'shutterstock_282461870',
  'shutterstock_287381057',
  'shutterstock_289585766',
  'shutterstock_292276448',
  'shutterstock_294213302',
  'shutterstock_322271375',
  'shutterstock_323119166',
  'shutterstock_323505764',
  'shutterstock_323507891',
])


let loader = new createjs.LoadQueue()
loader.installPlugin(createjs.Sound)

let min = Config.DEV_MODE ? '.min' : ''
let manifest = [
  {src: `libs/clmtrackr${min}.js`},
  {src: 'libs/model_pca_20_svm.js'},
  {src: `libs/three${min}.js`},
  {id: 'keyframes', src: 'data/keyframes.json'},
  {id: 'particle-sprite', src: 'textures/particle_sprite.png'},
  {id: 'particle-lut', src: 'textures/particle_index_lut.png'},
  {id: 'colorcorrect-lut', src: 'textures/lut.png'},
  {id: 'music-main', src: 'data/main.mp3'},
]

for (let i = 0; i < 10; i++) {
  manifest.push(
    {id: `face${i}data`, src: `textures/faces/${ids[i]}.json`},
    {id: `face${i}image`, src: `textures/faces/${ids[i]}.jpg`}
  )
}

manifest.push({src: 'app.js'})

loader.loadManifest(manifest, false)

export default loader
