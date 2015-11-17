/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import dat from 'dat-gui'
import {vec2} from 'gl-matrix'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcam-plane'
import DeformableFaceGeometry from './deformable-face-geometry'

import './main.sass'



class App {

  constructor() {
    this.initScene()
    this.initObjects()
    this.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 2400)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.autoClear = false
    this.renderer.setClearColor(0xffd3ae)
    this.clearColor = new THREE.Color(0xffd3ae)
    console.log(this.clearColor)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    // webcam
    this.webcam = new WebcamPlane(null, this.camera)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    this.webcam.updateMatrixWorld()
    // this.scene.add(this.webcam)

    // this.webcam.addEventListener('complete', this.takeSnapshot.bind(this))
    this.webcam.start(true)

    // face
    // let material = new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.1, depthTest: false})
    let material = new THREE.MeshBasicMaterial({map: this.webcam.texture, depthTest: false})
    this.face = new THREE.Mesh(new DeformableFaceGeometry(), material)
    this.face.renderOrder = 200
    this.face.matrixAutoUpdate = false
    // this.face.visible = false
    this.scene.add(this.face)


    // 
    this.holeTexture = new THREE.WebGLRenderTarget(1024, 1024, {stencilBuffer: false})
    // this.holeTexture.texture.minFilter = this.holeTexture.texture.magFilter = THREE.NearestFilter
    this.holeScene = new THREE.Scene()
    this.spaceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        scale: {type: 'f', value: 1.0},
        spaceMap: {type: 't', value: null},
        min: {type: 'v2', value: new THREE.Vector2()},
        max: {type: 'v2', value: new THREE.Vector2()},
      },
      vertexShader: `
        uniform float scale;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D spaceMap;
        uniform vec2 min;
        uniform vec2 max;
        void main() {
          vec2 uv = (gl_FragCoord.xy / 1024. * vec2(320., 180.) - min) / (max - min);
          uv.y = 1.0 - uv.y;
          gl_FragColor = texture2D(spaceMap, uv);
          // gl_FragColor = vec4(vec3(uv.y), 1);
        }
      `
    })
    this.edgeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        scale: {type: 'f', value: 1.0},
        brightness: {type: 'f', value: 1.0}
      },
      vertexShader: `
        uniform float scale;
        varying vec2 vUv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
          vUv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float brightness;
        varying vec2 vUv;
        void main () {
          gl_FragColor = texture2D(map, vUv);
          gl_FragColor.rgb *= brightness;
          if (gl_FragCoord.y < 540.) {
            gl_FragColor.rgb += pow(1.0 - gl_FragCoord.y / 540., 4.0);
          } else {
            gl_FragColor.rgb *= pow(1.0 - (gl_FragCoord.y - 540.) / 540., 4.0) * 0.3 + 0.7;
          }
        }
      `
    })
    this.holeFace = new THREE.Mesh(this.face.geometry, this.edgeMaterial)
    this.holeFace.matrixAutoUpdate = false
    this.holeScene.add(this.holeFace)
    this.holeFace.renderOrder = 200

    // this.holeScene.add(this.webcam)
    this.holeScene.add(this.webbb = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {
        resolution: {type: 'v2', value: new THREE.Vector2(1024, 1024)},
        map: {type: 't', value: this.webcam.texture}
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 resolution;
        uniform sampler2D map;
        void main() {
          gl_FragColor = texture2D(map, gl_FragCoord.xy / resolution);
          // gl_FragColor.a = 0.3;
        }
      `,
      depthTest: false,
      depthWrite: false,
      // transparent: true,
    })))

    // {
    //   let loader = new THREE.TextureLoader()
    //   loader.load('media/uvcheck.png', (texture) => {
    //     this.spaceMaterial.uniforms.spaceMap.value = texture
    //   })
    // }
    let video = document.createElement('video')
    video.width = video.height = 256
    video.loop = true
    video.autoplay = true
    video.src = 'media/curl_bg.mp4'
    video.addEventListener('loadedmetadata', () => {
      console.log('loadedmetadata')
      this.spaceTexture = new THREE.Texture(video)
      this.spaceMaterial.uniforms.spaceMap.value = this.spaceTexture
      // this.holeFace.material.uniforms.spaceMap.value = this.spaceTexture
    })

    // this.webcam.material.uniforms.holeTexture.value = this.holeTexture

    let texturePreview = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {
        resolution: {type: 'v2', value: new THREE.Vector2(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)},
        map: {type: 't', value: this.holeTexture}
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
          // gl_Position.x += 1.0;
        }
      `,
      fragmentShader: `
        uniform vec2 resolution;
        uniform sampler2D map;
        void main() {
          gl_FragColor = texture2D(map, gl_FragCoord.xy / resolution);
        }
      `,
      depthTest: false,
      depthWrite: false,
    }))
    // texturePreview.sortOrder = -100
    this.scene.add(texturePreview)

    // this.gui = new dat.GUI()
    // this.gui.add(this, 'takeSnapshot').name('Take snapshot')

    {
      this.freezing = false
      let position = new THREE.Vector3()
      let current = new THREE.Vector3()
      let quaternion = new THREE.Quaternion()
      let scale = new THREE.Vector3()
      window.addEventListener('keydown', (e) => {
        if (e.keyCode == 32) {
          if (this.freezing) {
            new TWEEN.Tween(current).to({x: position.x}, 1000).easing(TWEEN.Easing.Exponential.InOut).start().onUpdate((t) => {
              this.face.matrix.compose(current, quaternion, scale)
            }).onComplete(() => {
              this.freezing = false
            })
          } else {
            this.freezing = true
            this.face.matrix.decompose(position, quaternion, scale)
            current.copy(position)
            new TWEEN.Tween(current).to({x: position.x + 300}, 1000).easing(TWEEN.Easing.Exponential.InOut).start().onUpdate((t) => {
              this.face.matrix.compose(current, quaternion, scale)
            })
          }
        }
      })
    }
  }


  takeSnapshot() {
    // if (this.webcam.enableTextureUpdating) {
    //   if(!this.webcam.rawFeaturePoints) {
    //     console.warn('not tracking')
    //     return
    //   }
    //   this.faceHole.capture(this.webcam)
    //   this.webcam.enableTextureUpdating = false
    // }
    // else {
    //   this.webcam.enableTextureUpdating = true
    // }
  }


  start() {
    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (!this.freezing) {
      if (this.webcam.enabled) {
        this.webcam.update(currentFrame)
      }
      if (this.webcam.normalizedFeaturePoints) {
        this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 2400)
        this.face.matrix.copy(this.webcam.matrixFeaturePoints)
        this.holeFace.matrix.copy(this.webcam.matrixFeaturePoints)

        let min = [Number.MAX_VALUE, Number.MAX_VALUE]
        let max = [Number.MIN_VALUE, Number.MIN_VALUE]
        this.webcam.rawFeaturePoints.forEach((p) => {
          vec2.min(min, min, p)
          vec2.max(max, max, p)
        })
        let center = vec2.lerp([], min, max, 0.5)
        let size = Math.max.apply(null, vec2.sub([], max, min)) / 2
        vec2.sub(min, center, [size, size])
        vec2.add(max, center, [size, size])
        this.spaceMaterial.uniforms.min.value.set(min[0], 180 - min[1])
        this.spaceMaterial.uniforms.max.value.set(max[0], 180 - max[1])
        // console.log(this.spaceMaterial.uniforms.min.value, this.spaceMaterial.uniforms.max.value)
      }
    }

    // this.controls.update()

    if (this.spaceTexture) {
      this.spaceTexture.needsUpdate = true
    }

    this.renderer.setClearColor(0xff0000, 0)
    this.renderer.clearTarget(this.holeTexture)
    this.webbb.visible = true
    this.holeFace.material = this.edgeMaterial
    this.holeFace.material.uniforms.scale.value = 0.99
    this.holeFace.material.uniforms.brightness.value = 1
    this.renderer.render(this.holeScene, this.camera, this.holeTexture)
    this.webbb.visible = false
    for (let i = 1; i < 20; i++) {
      this.holeFace.material.uniforms.scale.value = 0.99 - i * 0.004
      this.holeFace.material.uniforms.brightness.value = 0.9 - i * 0.02
      this.renderer.clearTarget(this.holeTexture, false, true, true)
      this.renderer.render(this.holeScene, this.camera, this.holeTexture, false)
    }
    this.holeFace.material = this.spaceMaterial
    this.holeFace.material.uniforms.scale.value = 0.99 - 20 * 0.004
    this.renderer.clearTarget(this.holeTexture, false, true, true)
    this.renderer.render(this.holeScene, this.camera, this.holeTexture, false)

    this.renderer.setRenderTarget(null)
    this.renderer.setClearColor(this.clearColor)
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      scale: [s, s],
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2]
    })
  }

}

new App()
