/* global createjs */

import _ from 'lodash'
import Config from './config'


const ids = _.shuffle([
  'slice_face_00',
  'slice_face_01',
  'slice_face_02',
  'slice_face_03',
  'slice_face_04',
  'slice_face_05',
  'slice_face_06',
  'slice_face_07',
  'slice_face_08',
  'slice_face_09',
  'slice_face_10',
  'slice_face_11',
  'slice_face_12',
  'slice_face_13',
  'slice_face_14',
  'slice_face_15',
  'slice_face_16',
  'slice_face_17',
  'slice_face_18',
  'slice_face_19',
  'slice_face_20',
  'slice_face_21',
  'slice_face_22',
  'slice_face_23',
  'slice_face_24',
  'slice_face_25',
  'slice_face_26',
  'slice_face_27',
  'slice_face_28',
  'slice_face_29',
  'slice_face_30',
  'slice_face_31',
  'slice_face_32',
  'slice_face_33',
  'slice_face_34',
  'slice_face_35',
  'slice_face_36',
  'slice_face_37',
  'slice_face_38',
  'slice_face_39',
  'slice_face_40',
  'slice_face_41',
  'slice_face_42',
  'slice_face_43',
  'slice_face_44',
  'slice_face_45',
  'slice_face_46',
  'slice_face_47',
  'slice_face_48',
  'slice_face_49',
  'slice_face_50',
  'slice_face_51',
  'slice_face_52',
  'slice_face_53',
  'slice_face_54',
  'slice_face_55',
  'slice_face_56',
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
