/* global createjs */
import _ from 'lodash'

import Config from './config'


const ids = _.shuffle([
  'slice_face_00', 'slice_face_01', 'slice_face_02', 'slice_face_03', 'slice_face_04', 'slice_face_05', 'slice_face_06', 'slice_face_07', 'slice_face_08', 'slice_face_09', 'slice_face_10', 'slice_face_11', 'slice_face_12', 'slice_face_13', 'slice_face_14', 'slice_face_15', 'slice_face_16', 'slice_face_17', 'slice_face_18', 'slice_face_19', 'slice_face_20', 'slice_face_21', 'slice_face_22', 'slice_face_23', 'slice_face_24', 'slice_face_25', 'slice_face_26', 'slice_face_27', 'slice_face_28', 'slice_face_29', 'slice_face_30', 'slice_face_31', 'slice_face_32', 'slice_face_33', 'slice_face_34', 'slice_face_35', 'slice_face_36', 'slice_face_37', 'slice_face_38', 'slice_face_39', 'slice_face_40', 'slice_face_41', 'slice_face_42', 'slice_face_43', 'slice_face_44', 'slice_face_45', 'slice_face_46', 'slice_face_47', 'slice_face_48', 'slice_face_49', 'slice_face_50', 'slice_face_51', 'slice_face_52', 'slice_face_53', 'slice_face_54', 'slice_face_55', 'slice_face_56',
])


let loader = new createjs.LoadQueue()
loader.setMaxConnections(10)

let min = Config.DEV_MODE ? '' : '.min'
let manifest = [
  {src: `libs/clmtrackr${min}.js`, weight: 0.8},
  {src: 'libs/model_pca_20_svm.js', weight: 0.7},
  {src: `libs/three${min}.js`, weight: 0.4},
  {id: 'keyframes', src: 'data/keyframes.json', weight: 18},
  {id: 'particle-sprite', src: 'textures/particle_sprite.png', weight: 3.2},
  {id: 'particle-lut', src: 'textures/particle_index_lut.png', weight: 0.1},
  {id: 'colorcorrect-lut', src: 'textures/lut.png', weight: 0.1},
  {id: `lula-data`, src: `textures/faces/lula.json`, weight: 0},
  {id: `lula-image`, src: `textures/faces/lula.jpg`, weight: 0.05},
]

for (let i = 0; i < 20; i++) {
  manifest.push(
    {id: `face${i}-data`, src: `textures/faces/${ids[i]}.json`, weight: 0},
    {id: `face${i}-image`, src: `textures/faces/${ids[i]}.jpg`, weight: 0.05}
  )
}

let match = location.href.match(/\/([a-z0-9]{8})\/$/)
if (match) {
  let id = match[1]
  manifest.push(
    {id: 'shared-data', src: `/${id}/data.json`, weight: 0},
    {id: 'shared-image', src: `/${id}/cap.jpg`, weight: 0.2}
  )
}
manifest.push({src: 'app.js', weight: 0.6})

manifest.forEach((item) => {
  item.progress = 0
})

loader.on('fileprogress', (e) => {
  if (e.progress > 1) { // only for keyframes.json
    e.item.progress = e.progress / 111912786 // e.progress indicates loaded bytes (decompressed size)
    // console.log('fileprogress', e.item.src, e.progress, e.item.progress)
  } else {
    e.item.progress = e.progress
  }
})

loader.on('fileload', (e) => {
  e.item.progress = 1
  // console.log('fileload', e.item.src)
})

let interval = setInterval(() => {
  let loaded = 0
  let total = 0
  manifest.forEach((item) => {
    loaded += item.progress * item.weight
    total += item.weight
  })
  // console.log(loaded, total, loaded / total)
  let event = new createjs.Event('weighted progress')
  event.progress = loaded
  event.total = total
  loader.dispatchEvent(event)
  if (loaded == total) {
    clearInterval(interval)
  }
}, 200)


loader.loadManifest(manifest, false)

export default loader
