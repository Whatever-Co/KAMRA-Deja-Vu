/* global THREE */

import 'OrbitControls'
import $ from 'jquery'
import _ from 'lodash'
import dat from 'dat-gui'

import Ticker from './ticker'
import StandardFaceData from './standard-face-data'
import PreprocessWorker from 'worker!./preprocess-worker'
import DeformableFaceGeometry from './deformable-face-geometry'


class App {

  constructor() {
    this.animate = this.animate.bind(this)

    console.time('load assets')
    this.loader = new createjs.LoadQueue()
    this.loader.loadManifest([
      {src: 'keyframes.json'},
      {id: 'image', src: 'slice_face_28.jpg'},
      {id: 'data', src: 'slice_face_28.json'},
    ])
    this.loader.on('complete', () => {
      console.timeEnd('load assets')
      this.keyframes = this.loader.getResult('keyframes.json')
      console.log(this.keyframes.user.property)

      console.time('morph data processing')
      let worker = new PreprocessWorker()

      let targetObject = [
        this.keyframes.user.property,
        // this.keyframes.user_alt.property[0],
        // this.keyframes.user_alt.property[1],
        // this.keyframes.slice_alt.property,
        // {face_vertices: Config.DATA.user_particles_mesh.map((prop) => prop.face_vertices)}
      ]
      // .concat(this.keyframes.user_children.property.map((props) => props))
      // .concat(this.keyframes.falling_children_mesh.property.map((props) => props))

      let transferList = []
      let objectVertices = targetObject.map((obj) => {
        return obj.face_vertices.map((v, i) => {
          if (v) {
            let a = new Float32Array(v.concat(obj.eyemouth_vertices[i]))
            transferList.push(a.buffer)
            return a
          }
          return null
        })
      })

      worker.postMessage(objectVertices, transferList)
      worker.onmessage = (event) => {
        event.data.forEach((morph, i) => {
          targetObject[i].morph = morph
        })
        console.timeEnd('morph data processing')
        
        this.initScene()
        this.initObjects()
        this.animate()

        Ticker.on('update', this.update.bind(this))
        Ticker.start()
      }
    })
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16, 1280 / 720, 10, 10000)
    this.camera.position.set(0, 0, 2400)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setClearColor(0x172b35)
    this.renderer.setSize(1280, 720)
    document.body.appendChild(this.renderer.domElement)

    this.controller = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.controller.enableKeys = false
  }


  initObjects() {
    let geometry = new DeformableFaceGeometry()
    let points = this.loader.getResult('data').map((p) => {
      p[0] *= 512
      p[1] = (1 - p[1]) * 512
      return p
    })
    geometry.init(points, 512, 512, 400, 1200)
    geometry.computeVertexNormals()
    // let material = new THREE.MeshNormalMaterial({wireframe: true})
    let material = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(this.loader.getResult('image')), side: THREE.DoubleSide})
    // material.wireframe = true
    this.face = new THREE.Mesh(geometry, material)
    this.face.scale.multiplyScalar(400)
    this.scene.add(this.face)

    this._currentFrame = 0

    let gui = new dat.GUI()
    this.currentFrameGui = gui.add(this, 'currentFrame', this.keyframes.user.in_frame, this.keyframes.user.out_frame, 1)
    this.currentFrameGui.setValue(1564)
    gui.add(material, 'wireframe')

    this.keyPressing = {}
    window.addEventListener('keydown', (e) => {
      this.keyPressing[e.keyCode] = true
    })
    window.addEventListener('keyup', (e) => {
      delete this.keyPressing[e.keyCode]
    })
  }


  get currentFrame() {
    return this._currentFrame
  }

  set currentFrame(value) {
    this._currentFrame = value
    this.face.geometry.applyMorph(this.keyframes.user.property.morph[Math.floor(value)])
    this.face.geometry.computeVertexNormals()
  }


  update(f) {
    if (this.prevFrame == f) {
      return
    }
    if (this.keyPressing[39]) {
      this.currentFrame++
      this.currentFrameGui.updateDisplay()
    } else if (this.keyPressing[37]) {
      this.currentFrame--
      this.currentFrameGui.updateDisplay()
    }
    this.prevFrame = f
  }


  animate() {
    requestAnimationFrame(this.animate)
    this.controller.update()
    this.renderer.render(this.scene, this.camera)
  }


}

new App()
