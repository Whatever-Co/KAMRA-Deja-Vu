/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import TWEEN from 'tween.js'
import dat from 'dat-gui'

import Config from './config'
import Ticker from './ticker'
import PreprocessWorker from 'worker!./preprocess-worker'
import DeformableFaceGeometry from './deformable-face-geometry'
import DeformedUVTexture from './deformed-uv-texture'
import WebcamPlane from './webcam-plane'

import './main.sass'


class App {

  constructor() {
    this.loader = new createjs.LoadQueue()
    this.loader.loadManifest([
      {id: 'keyframes', src: 'keyframes.json'},
      {id: 'data', src: 'media/shutterstock_62329057.json'},
      {id: 'image', src: 'media/shutterstock_62329057.png'},
    ])
    this.loader.on('complete', () => {
      this.keyframes = this.loader.getResult('keyframes')
      let vertices = this.keyframes.user.property.face_vertices.map((v) => new Float32Array(v))
      let worker = new PreprocessWorker()
      worker.postMessage(vertices, vertices.map((a) => a.buffer))
      worker.onmessage = (event) => {
        this.keyframes.user.property.morph = event.data

        this.initScene()
        this.initObjects()

        Ticker.on('update', this.update.bind(this))
        Ticker.start()
      }
    })
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071544)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    this.keyframes = this.loader.getResult('keyframes')
    console.log(this.keyframes)
    this.config = require('./data/config.json').slitscan

    let featurePoints = this.loader.getResult('data')
    let image = this.loader.getResult('image')
    this.face = new THREE.Mesh(
      new DeformableFaceGeometry(featurePoints, 512, 512, 400, 1200),
      new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(image)})
    )

    {
      let f = this.config.uv_in_frame
      let props = this.keyframes.user.property
      this.face.position.fromArray(props.position, f * 3)
      this.face.scale.fromArray(props.scale, f * 3).multiplyScalar(150)
      this.face.quaternion.fromArray(props.quaternion, f * 4)
    }

    {
      let target = new THREE.WebGLRenderTarget(1024, 1024, {stencilBuffer: false})
      let camera = new THREE.PerspectiveCamera(this.config.camera_fov, 1, 10, 10000)
      camera.position.fromArray(this.config.camera_position)
      let scene = new THREE.Scene()
      scene.add(this.face)
      this.faceRenderer = {scene, camera, target}
    }

    // let prev = this.renderer.getClearColor().clone()
    // this.renderer.setClearColor(0xff0000, 0)
    // // this.renderer.render(scene, camera)
    // this.renderer.render(scene, camera, target, true)
    // this.renderer.setClearColor(prev, 1)

    this.video = document.createElement('video')
    this.video.src = 'slitscan_uv_512.mp4'
    this.video.loop = true
    this.video.play()

    let map = new THREE.VideoTexture(this.video)
    map.minFilter = map.magFilter = THREE.LinearFilter
    let result = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {
        resolution: {type: 'v2', value: new THREE.Vector2(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)},
        blurSize: {type: 'f', value: 8},
        map: {type: 't', value: map},
        face: {type: 't', value: this.faceRenderer.target},
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 resolution;
        uniform float blurSize;
        uniform sampler2D map;
        uniform sampler2D face;
        void main() {
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
          for (int i = 0; i < NUM_TAPS; i++) {
            sum += texture2D(map, (gl_FragCoord.xy + fTaps_Poisson[i] * blurSize) / resolution);
            sum += texture2D(map, (gl_FragCoord.xy + fTaps_Poisson[i] * blurSize * 2.) / resolution);
            sum += texture2D(map, (gl_FragCoord.xy + fTaps_Poisson[i] * blurSize * 3.) / resolution);
          }
          sum /= float(NUM_TAPS * 3);

          // vec2 uv = texture2D(map, gl_FragCoord.xy / resolution).xy;
          gl_FragColor = texture2D(face, sum.xy);

          // gl_FragColor = vec4(uv, 0., 1.);
          // gl_FragColor = vec4(gl_FragCoord.xy / resolution, 0, 1);
          // gl_FragColor = texture2D(face, gl_FragCoord.xy / resolution);
          // gl_FragColor = sum;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }))
    this.scene.add(result)

    let p = {src512: true}
    let gui = new dat.GUI()
    gui.add(result.material.uniforms.blurSize, 'value', 0, 30, 0.01).name('Blur size')
    gui.add(this.video, 'play').name('Play')
    gui.add(this.video, 'pause').name('Pause')
    gui.add(p, 'src512').name('512?').onChange((e) => {
      this.video.src = e ? 'slitscan_uv_512.mp4' : 'slitscan_uv_h264.mp4'
      this.video.play()
    })
  }


  update(currentFrame, time) {
    let f = currentFrame % (this.config.uv_out_frame - this.config.uv_in_frame)// + this.config.uv_in_frame
    this.face.geometry.applyMorph(this.keyframes.user.property.morph[f])

    let prev = this.renderer.getClearColor().clone()
    this.renderer.setClearColor(0xff0000, 0)
    this.renderer.render(this.faceRenderer.scene, this.faceRenderer.camera, this.faceRenderer.target, true)
    this.renderer.setClearColor(prev, 1)

    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    let s = Math.min(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      // translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s],
    })
  }

}


new App()
