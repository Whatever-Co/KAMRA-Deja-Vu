/* global THREE */

import _ from 'lodash'

import DeformableFaceGeometry from './deformable-face-geometry'
import SubdividedFaceGeometry from './subdivided-face-geometry'
import FaceFrontMaterial from './face-front-material'

// library faces render at level 1: they are numerous and never fill the
// screen, and 100 level-2 derived meshes cost enough heap that GC pauses
// visibly disturb clmtrackr tracking in the webcam outro
const LIBRARY_SUBDIVISION_LEVELS = 1


const loader = window.__djv_loader

class FaceLibrary {

  init() {
    this.library = {}
    this.library['lula'] = this.initFace('lula')
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
    let featurePoints = loader.getResult(`${id}-data`)
    if (!Array.isArray(featurePoints)) {
      return null
    }

    featurePoints.forEach((p) => {
      p[0] *= 512
      p[1] = (1 - p[1]) * 512
    })
    let texture = new THREE.CanvasTexture(loader.getResult(`${id}-image`))
    return {
      // geometry is built lazily in getMesh: only ~1/3 of the library is
      // ever shown, and building 100 subdivided meshes up front costs
      // enough heap to disturb tracking with GC pauses
      featurePoints,
      geometry: null,
      material: new FaceFrontMaterial(texture),
      texture
    }
  }


  getMesh(id, shared = true) {
    if (!this.library.hasOwnProperty(id)) {
      console.warn('no such face id', id)
      return
    }
    let entry = this.library[id]
    if (!entry.geometry) {
      // matches the historical DeformableFaceGeometry(fp, 512, 512, 400, 1200)
      // call: the 5th arg was always dropped by the 4-arg constructor
      entry.geometry = SubdividedFaceGeometry.wrap(
        new DeformableFaceGeometry(entry.featurePoints, 512, 512, 400),
        LIBRARY_SUBDIVISION_LEVELS
      )
    }
    return new THREE.Mesh(
      shared ? entry.geometry : entry.geometry.clone(),
      entry.material
    )
  }


  getRandomMeshes(numMeshes = 1) {
    return _.sample(this.faceIds, numMeshes).map((id) => this.getMesh(id))
  }

}

let instance = new FaceLibrary()
loader.on('complete', () => instance.init())

export default instance
