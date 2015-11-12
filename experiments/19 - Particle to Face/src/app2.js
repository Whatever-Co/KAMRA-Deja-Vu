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
import DeformedUVTexture from './deformed-uv-texture'
import FaceParticle from './face-particle'
import FaceBlender from './face-blender'

import './main.sass'



class FacePartsDuplicateMaterial extends THREE.ShaderMaterial {

  constructor(faceTexture, warpTexture, uvTexture) {
    super({
      uniforms: {
        faceTexture: {type: 't', value: faceTexture},
        warpTexture: {type: 't', value: warpTexture},
        uvTexture: {type: 't', value: uvTexture},
      },
      vertexShader: `
        attribute vec2 uv2;

        varying vec2 vUv;
        varying vec2 vUv2;

        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vUv = uv;
          vUv2 = uv2;
        }
      `,
      fragmentShader: `
        uniform sampler2D faceTexture;
        uniform sampler2D warpTexture;
        uniform sampler2D uvTexture;

        varying vec2 vUv;
        varying vec2 vUv2;

        void main() {
          vec4 color = texture2D(faceTexture, vUv);
          vec4 uv2 = texture2D(warpTexture, vUv2);
          vec4 uv3 = texture2D(uvTexture, uv2.xy);
          vec4 parts = texture2D(faceTexture, uv3.xy);
          gl_FragColor = vec4(mix(color.rgb, parts.rgb, uv2.a), 1.0);
          // gl_FragColor = vec4(uv2.xy, 0, 1);
        }
      `,
      transparent: true,
    })
  }

}



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

    this.face1 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3}))
    this.face1.matrixAutoUpdate = false
    // this.face1.visible = false
    this.scene.add(this.face1)

    {
      this.face2 = new THREE.Mesh(new DeformableFaceGeometry(), new THREE.MeshBasicMaterial({transparent: true}))
      this.face2.matrixAutoUpdate = false
      this.face2.visible = false
      hoge.add(this.face2)
    }

    this._updateObjects = () => {
      if (this.webcam.normalizedFeaturePoints) {
        this.face1.geometry.deform(this.webcam.normalizedFeaturePoints)
        this.face1.matrix.copy(this.webcam.matrixFeaturePoints)
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.keyCode == 32 && this.webcam.normalizedFeaturePoints) {
        this.webcam.opacity = 0

        {
          let target = new THREE.WebGLRenderTarget(1024, 1024)
          target.scene = new THREE.Scene()
          let plane = this.webcam.clone()
          plane.material.map = this.webcam.texture
          plane.scale.copy(this.webcam.scale)
          target.scene.add(plane)

          target.camera = this.camera.clone()

          let geometry = this.face2.geometry
          let uvTexture = new DeformedUVTexture(this.renderer, geometry)
          geometry.addAttribute('uv2', uvTexture.uvAttribute)
          let material = new FacePartsDuplicateMaterial(this.webcam.texture, new THREE.CanvasTexture(this.loader.getResult('lut')), uvTexture)
          this.face0 = new THREE.Mesh(geometry, material)
          this.face0.matrixAutoUpdate = false
          target.scene.add(this.face0)
          this.creepyTexture = target

          this.face2.material.map = this.creepyTexture
          this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
          // this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
          this.face0.matrix.copy(this.webcam.matrixFeaturePoints)
          this.face0.material.uniforms.uvTexture.value.update()

          this.face1.material = new THREE.MeshBasicMaterial({map: this.creepyTexture.clone(), transparent: true, opacity: 0})
          this.renderer.render(this.creepyTexture.scene, this.creepyTexture.camera, this.face1.material.map, true)

          // let mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({map: target}))
          // mesh.position.set(-340, -150, -2000)
          // this.camera.add(mesh)
        }

        this.face1.visible = false
        this.face1.renderOrder = 1
        this.face1.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
        let config = require('./data/config.json')
        this.face1.position.fromArray(config.mosaic_face.position)
        this.face1.rotation.set(0, 0, Math.PI)
        this.face1.scale.fromArray(config.mosaic_face.scale.map((s) => s * 150))
        this.face1.updateMatrix()
        this.face1.updateMatrixWorld(true)

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
        this.particles = new FaceParticle(scale, this.face1, sprite, lut)
        this.scene.add(this.particles)
        this.particles.updateData()

        this.blender = new FaceBlender(this.face1, this.face2)
        this.blender.visible = false
        this.blender.renderOrder = 1
        this.scene.add(this.blender)

        let _update = (currentFrame) => {
          if (this.keyframes.camera.in_frame <= currentFrame && currentFrame <= this.keyframes.camera.out_frame + 50) {
            let f = currentFrame
            let props = this.keyframes.camera.property
            this.camera.fov = props.fov[currentFrame]
            this.camera.updateProjectionMatrix()
            this.camera.position.fromArray(props.position, f * 3)
            this.camera.quaternion.fromArray(props.quaternion, f * 4)

            hoge.rotation.z = this.camera.rotation.z

            let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
            this.webcam.scale.set(scale, scale, scale)
            this.creepyTexture.scene.children[0].scale.set(scale, scale, scale)
          }

          if (this.keyframes.mosaic.in_frame <= currentFrame && currentFrame <= this.keyframes.mosaic.out_frame + 50) {
            let t = (currentFrame - this.keyframes.mosaic.in_frame) / (this.keyframes.mosaic.out_frame + 50 - this.keyframes.mosaic.in_frame)
            this.particles.update(t)
          }

          if (this.keyframes.o2_extra.in_frame <= currentFrame && currentFrame <= this.keyframes.o2_extra.out_frame) {
            let f = currentFrame - this.keyframes.o2_extra.in_frame
            let props = this.keyframes.o2_extra.property
            this.webcam.opacity = 1 - props.webcam_fade[f]
            this.blender.visible = true
            this.blender.blend = props.interpolation[f]
            this.blender.opacity = THREE.Math.clamp(f / 50, 0, 1)

            this.renderer.setClearColor(0x888888, 1)
            this.creepyTexture.camera.fov = this.camera.fov
            this.creepyTexture.camera.updateProjectionMatrix()
            this.creepyTexture.camera.position.copy(this.camera.position)
            this.creepyTexture.camera.rotation.set(0, 0, 0)
            this.renderer.render(this.creepyTexture.scene, this.creepyTexture.camera, this.creepyTexture, true)
            this.renderer.setClearColor(0x071520, 1)
          }
          if (this.blender.blend >= 1) {
            this.blender.visible = false
            this.face1.visible = false
            this.face2.visible = true
          }

          if (this.webcam.normalizedFeaturePoints) {
            this.face2.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, this.camera.position.z)
            this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
            this.face0.matrix.copy(this.webcam.matrixFeaturePoints)
            this.face0.material.uniforms.uvTexture.value.update()
          }
        }

        let startFrame = Ticker.currentFrame - (this.keyframes.mosaic.in_frame - 10)
        this._updateObjects = (currentFrame) => {
          if (currentFrame <= this.keyframes.camera.out_frame) {
            _update(currentFrame - startFrame)
          }
        }
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
