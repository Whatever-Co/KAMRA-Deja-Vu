/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import DeformableFaceGeometry from './deformable-face-geometry'
import DeformedUVTexture from './deformed-uv-texture'
import WebcamPlane from './webcam-plane'

import './main.sass'


class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    // window.addEventListener('resize', this.onResize.bind(this))
    // this.onResize()
  }


  initObjects() {
    let loader = new createjs.LoadQueue()
    loader.loadManifest([
      // {id: 'color', src: 'faceuv.png'},
      {id: 'lut', src: 'remap_1.png'},
      // {id: 'image', src: 'media/shutterstock_56254417.png'},
      // {id: 'data', src: 'media/shutterstock_56254417.json'}
    ])
    loader.on('complete', () => {
      let geometry = new DeformableFaceGeometry()
      let uvTexture = new DeformedUVTexture(this.renderer, geometry)
      geometry.addAttribute('uv2', uvTexture.uvAttribute)

      this.webcam = new WebcamPlane(this.camera)
      let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
      this.webcam.scale.set(scale, scale, scale)
      this.scene.add(this.webcam)
      this.webcam.start()

      let target = new THREE.WebGLRenderTarget(1024, 1024)
      {
        target.scene = new THREE.Scene()
        let plane = this.webcam.clone()
        plane.material.map = this.webcam.texture
        plane.scale.copy(this.webcam.scale)
        target.scene.add(plane)
        let material = new THREE.ShaderMaterial({
          uniforms: {
            map: {type: 't', value: this.webcam.texture},
            lut: {type: 't', value: new THREE.CanvasTexture(loader.getResult('lut'))},
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
            uniform sampler2D map;
            uniform sampler2D lut;
            uniform sampler2D uvTexture;

            varying vec2 vUv;
            varying vec2 vUv2;

            vec4 sampleLUT(vec2 uv) {
              const int NUM_TAPS = 12;
            
              vec2 fTaps_Poisson[NUM_TAPS];
              fTaps_Poisson[0]  = vec2(-.326,-.406);
              fTaps_Poisson[1]  = vec2(-.840,-.074);
              fTaps_Poisson[2]  = vec2(-.696, .457);
              fTaps_Poisson[3]  = vec2(-.203, .621);
              fTaps_Poisson[4]  = vec2( .962,-.195);
              fTaps_Poisson[5]  = vec2( .473,-.480);
              fTaps_Poisson[6]  = vec2( .519, .767);
              fTaps_Poisson[7]  = vec2( .185,-.893);
              fTaps_Poisson[8]  = vec2( .507, .064);
              fTaps_Poisson[9]  = vec2( .896, .412);
              fTaps_Poisson[10] = vec2(-.322,-.933);
              fTaps_Poisson[11] = vec2(-.792,-.598);

              vec4 sum;
              float size = 2. / 256.;
              for (int i = 0; i < NUM_TAPS; i++) {
                // sum += texture2D(remap, (gl_FragCoord.xy + fTaps_Poisson[i] * blurSize) / resolution);
                sum += texture2D(lut, uv + fTaps_Poisson[i] * size);
              }
              sum /= float(NUM_TAPS);

              // vec4 uv2 = texture2D(lut, uv);
              vec4 uv2 = sum;
              // uv2.rg = mix(uv2.rg, uv, 1. - uv2.a);
              // uv2.a = texture2D(lut, uv).a;
              return uv2;
            }

            void main() {
              vec4 original = texture2D(map, vUv);
              // vec4 uv2 = texture2D(lut, vUv2);
              vec4 uv2 = sampleLUT(vUv2);
              vec4 uv3 = texture2D(uvTexture, uv2.xy);
              vec4 parts = texture2D(map, uv3.xy);
              gl_FragColor = vec4(mix(original.rgb, parts.rgb, uv2.a), 1.0);
              // gl_FragColor = parts;
            }
          `,
          transparent: true,
        })
        this.face = new THREE.Mesh(geometry, material)
        this.face.matrixAutoUpdate = false
        target.scene.add(this.face)
      }
      this.target = target

      {
        // let material = new THREE.MeshBasicMaterial({map: this.face.material.uniforms.lut.value})
        let material = new THREE.ShaderMaterial({
          uniforms: this.face.material.uniforms,
          vertexShader: `
            varying vec2 vUv;
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              vUv = uv;
            }
          `,
          fragmentShader: `
            uniform sampler2D map;
            uniform sampler2D lut;
            uniform sampler2D uvTexture;
            varying vec2 vUv;
            void main() {
              gl_FragColor = texture2D(lut, vUv);
              gl_FragColor.rg = mix(gl_FragColor.rg, vUv, 1. - gl_FragColor.a);
              // gl_FragColor.a = 1.;
            }
          `,
          depthTest: false,
          depthWrite: false,
          transparent: true,
        })
        let mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material)
        mesh.renderOrder = 1000
        mesh.position.set(-340, -150, 10)
        this.scene.add(mesh)
      }

      this.face2 = new THREE.Mesh(this.face.geometry, new THREE.MeshBasicMaterial({map: target, transparent: true}))
      this.face2.matrixAutoUpdate = false
      this.scene.add(this.face2)

      this._updateObjects = () => {
        if (this.webcam.normalizedFeaturePoints) {
          this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 1700)
          this.face.matrix.copy(this.webcam.matrixFeaturePoints)
          this.face2.matrix.copy(this.webcam.matrixFeaturePoints)
          uvTexture.update()
        }

        let c = this.renderer.getClearColor()
        this.renderer.setClearColor(0x888888)
        this.renderer.render(this.target.scene, this.camera, this.target, true)
        this.renderer.setClearColor(c)
      }
    })
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this._updateObjects) {
      this._updateObjects(currentFrame, time)
    }

    this.controls.update()
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


new App()
