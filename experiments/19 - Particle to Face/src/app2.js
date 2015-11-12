/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
// import dat from 'dat-gui'
import TWEEN from 'tween.js'
// import {vec3} from 'gl-matrix'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcam-plane'
import DeformableFaceGeometry from './deformable-face-geometry'
import FaceParticle from './face-particle'
import FaceBlender from './face-blender'

import './main.sass'



class App2 {

  constructor() {
    this.loader = require('./asset-loader')
    this.loader.on('complete', () => {
      this.keyframes = this.loader.getResult('keyframes')
      console.log(this.keyframes)

      this.initScene()
      this.initObjects()

      Ticker.on('update', this.update.bind(this))
      Ticker.start()
    })
    this.loader.load()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(this.keyframes.camera.property.fov[0], Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 13000)
    this.camera.position.fromArray(this.keyframes.camera.property.position)
    console.log(this.camera.fov, this.camera.position)

    this.scene = new THREE.Scene()
    this.scene.add(this.camera)

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    let hoge = new THREE.Object3D()
    this.scene.add(hoge)

    this.webcam = new WebcamPlane(this.camera)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    hoge.add(this.webcam)
    this.webcam.start()

    this.face = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    this.face2 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({color: 0xffffff, map: this.webcam.texture, transparent: true, opacity: 1, wireframe: false}))
    this.face2.matrixAutoUpdate = false
    this.face2.visible = false
    hoge.add(this.face2)

    this.blender = new FaceBlender(this.face, this.face2)
    this.blender.visible = false
    this.scene.add(this.blender)

    this._updateObjects = () => {
      if (this.webcam.normalizedFeaturePoints) {
        this.face.geometry.deform(this.webcam.normalizedFeaturePoints)
        this.face.matrix.copy(this.webcam.matrixFeaturePoints)
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.keyCode == 32 && this.webcam.normalizedFeaturePoints) {
        this.webcam.opacity = 0

        this.face.material = new THREE.MeshBasicMaterial({map: this.webcam.texture.clone(), transparent: true, opacity: 0})
        this.face.renderOrder = 1
        this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
        let config = require('./data/config.json')
        this.face.position.fromArray(config.mosaic_face.position)
        this.face.rotation.set(0, 0, Math.PI)
        this.face.scale.fromArray(config.mosaic_face.scale.map((s) => s * 150))
        this.face.updateMatrix()
        this.face.updateMatrixWorld(true)

        this._updateObjects = () => {
          if (this.webcam.normalizedFeaturePoints) {
            this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
            this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
          }
        }

        let scale = Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2)
        let sprite = new THREE.CanvasTexture(this.loader.getResult('particle-sprite'))
        let lut = new THREE.CanvasTexture(this.loader.getResult('particle-lut'))
        lut.minFilter = lut.maxFilter = THREE.NearestFilter
        this.particles = new FaceParticle(scale, this.face, sprite, lut)
        this.scene.add(this.particles)
        this.particles.updateData()

        let _update = (currentFrame) => {
          // console.log(currentFrame)
          {
            let f = currentFrame
            let props = this.keyframes.camera.property
            this.camera.fov = props.fov[currentFrame]
            this.camera.updateProjectionMatrix()
            this.camera.position.fromArray(props.position, f * 3)
            this.camera.quaternion.fromArray(props.quaternion, f * 4)

            hoge.rotation.z = this.camera.rotation.z

            let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
            this.webcam.scale.set(scale, scale, scale)
          }

          if (this.keyframes.mosaic.in_frame <= currentFrame && currentFrame <= this.keyframes.mosaic.out_frame) {
            let t = (currentFrame - this.keyframes.mosaic.in_frame) / (this.keyframes.mosaic.out_frame - this.keyframes.mosaic.in_frame)
            // console.log(t)
            this.particles.update(t)
          }

          if (this.keyframes.o2_extra.in_frame <= currentFrame && currentFrame <= this.keyframes.o2_extra.out_frame) {
            let f = currentFrame - this.keyframes.o2_extra.in_frame
            let props = this.keyframes.o2_extra.property
            this.webcam.opacity = 1 - props.webcam_fade[f]
            this.blender.visible = true
            this.blender.blend = props.interpolation[f]
            this.face.visible = props.interpolation[f] == 0
          }

          if (this.webcam.normalizedFeaturePoints) {
            this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
            this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
          }
        }


        let startFrame = Ticker.currentFrame - (this.keyframes.mosaic.in_frame - 10)
        this._updateObjects = (currentFrame) => {
          _update(currentFrame - startFrame)
        }

        /*let p = {f: this.keyframes.camera.in_frame}
        new TWEEN.Tween(p).to({f: this.keyframes.camera.out_frame}, 15000).start().onUpdate(() => {
          _update(Math.round(p.f))
        }).onComplete(() => {
          this.blender.visible = false
          this.face2.visible = true
        })*/
      }
    })
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this._updateObjects) {
      this._updateObjects(currentFrame, time)
    }

    // this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }

}


new App2()
