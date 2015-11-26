/* global THREE */

import _ from 'lodash'

import DeformableFaceGeometry from './deformable-face-geometry'
import FaceFrontMaterial from './face-front-material'


const loader = window.__djv_loader

class FaceLibrary {

  init() {
    this.library = {}
    // this.library['lula'] = this.initFace('lula')
    this.faceIds = []
    for (let i = 0; i < 100; i++) {
      let id = `face${i}`
      let face = this.initFace(id)
      if (!face) {
        break
      }
      this.library[id] = face
      this.faceIds.push(id)
    }
  }


  initFace(id) {
    console.log(id, loader.getResult(`${id}-data`))
    let featurePoints = loader.getResult(`${id}-data`)
    if (!featurePoints || !Array.isArray(featurePoints.points)) {
      return null
    }

    // featurePoints.forEach((p) => {
    //   p[0] *= 512
    //   p[1] = (1 - p[1]) * 512
    // })
    let texture = new THREE.CanvasTexture(loader.getResult(`${id}-image`))
    return {
      geometry: new DeformableFaceGeometry(featurePoints.points, 320, 180, 700),
      material: new FaceFrontMaterial(texture),
      texture
    }
  }


  getMesh(id, shared = true) {
    if (!this.library.hasOwnProperty(id)) {
      console.warn('no such face id', id)
      return
    }
    return new THREE.Mesh(
      shared ? this.library[id].geometry : this.library[id].geometry.clone(),
      this.library[id].material
    )
  }


  getRandomMeshes(numMeshes = 1) {
    return _.sample(this.faceIds, numMeshes).map((id) => this.getMesh(id))
  }

}

let instance = new FaceLibrary()
loader.on('complete', () => instance.init())

export default instance
