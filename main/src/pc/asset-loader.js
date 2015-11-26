/* global createjs */
import _ from 'lodash'

import Config from './config'

const ids = _.shuffle([
  // 'rosathw1', // yuichi
  'b5o1gggy',
  'e63f0agh',
  'hmcsmuq7',
  'ps4mjjan',
  'swu9y4cf',
  'krw9m2p5',
  'g42ohue8',
  'ahy185mx',
  '85yu33pv',
  's8reld7c',
  'y5682ark',
  '1tovhszw',
  '1mln12xq',
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

manifest.push(
  {id: `shared-data`, src: `textures/members/rosathw1.json`, weight: 0},
  {id: `shared-image`, src: `textures/members/rosathw1.jpg`, weight: 0.05}
)

for (let i = 0; i < ids.length; i++) {
  manifest.push(
    {id: `face${i}-data`, src: `textures/members/${ids[i]}.json`, weight: 0},
    {id: `face${i}-image`, src: `textures/members/${ids[i]}.jpg`, weight: 0.05}
  )
}

/*for (let i = 0; i < 20; i++) {
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
}*/

manifest.push({src: 'app.js', weight: 0.6})

manifest.forEach((item) => {
  item.progress = 0
})

loader.on('fileprogress', (e) => {
  e.item.progress = e.progress
})

loader.on('fileload', (e) => {
  e.item.progress = 1
})

let interval = setInterval(() => {
  let loaded = 0
  let total = 0
  manifest.forEach((item) => {
    loaded += item.progress * item.weight
    total += item.weight
  })
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
