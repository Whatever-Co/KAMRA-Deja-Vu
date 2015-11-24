/* global THREE */
import Modernizr from 'exports?Modernizr!modernizr-custom'
import {vec2} from 'gl-matrix'
import dat from 'dat-gui'

import Ticker from './ticker'


class App {

  constructor() {
    let options = {
      video: {
        mandatory: {minWidth: 640},
        optional: [
          {minWidth: 1280},
          {minWidth: 1920}
        ]
      }
    }
    let gUM = Modernizr.prefixed('getUserMedia', navigator)
    gUM(options, this.onSuccess.bind(this), this.onError.bind(this))
  }


  onSuccess(stream) {
    console.log(stream)
    this.video = document.createElement('video')
    this.video.width = 320
    this.video.height = 180
    this.video.src = window.URL.createObjectURL(stream)
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this))
    this.video.play()
    document.body.appendChild(this.video)

    this.trackerCanvas = document.createElement('canvas')
    this.trackerCanvas.width = 320
    this.trackerCanvas.height = 180
    this.trackerContext = this.trackerCanvas.getContext('2d')
    this.trackerContext.translate(this.trackerCanvas.width, 0)
    this.trackerContext.scale(-1, 1)
    document.body.appendChild(this.trackerCanvas)

    this.tracker = new clm.tracker({useWebGL: true})
    this.tracker.init(pModel)

    this.camera = new THREE.OrthographicCamera(-160, 160, 90, -90, 1, 100)
    this.camera.position.z = 100
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(320, 180)
    document.body.appendChild(this.renderer.domElement)

    // this.texture = new THREE.CanvasTexture(this.trackerCanvas)
    this.texture = new THREE.VideoTexture(this.video)
    this.texture.minFilter = this.texture.magFilter = THREE.NearestFilter
    let geometry = new THREE.PlaneBufferGeometry(320, 180, 4, 4)
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: this.texture},
        inMax: {type: 'f', value: 1 - 0.001},
        inMin: {type: 'f', value: 0 + 0.001},
        gamma: {type: 'f', value: 1 - 0.001},
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vUv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float inMax;
        uniform float inMin;
        uniform float gamma;

        varying vec2 vUv;

        void main() {
          vec4 c = texture2D(map, vUv);
          c = (c - inMin) / (inMax - inMin);
          // gl_FragColor = (outMax - outMin) * c + outMin;
          gl_FragColor = pow(c, vec4(gamma)) * 0.8;
          gl_FragColor.a = 1.;
          // gl_FragColor = c;
        }
      `,
    })
    this.scene.add(new THREE.Mesh(geometry, material))

    let gui = new dat.GUI()
    this.inMax = gui.add(material.uniforms.inMax, 'value', 0, 1, 0.01).name('in-max').setValue(1)
    this.inMin = gui.add(material.uniforms.inMin, 'value', 0, 1, 0.01).name('in-min').setValue(0)
    gui.add(material.uniforms.gamma, 'value', 0.5, 2, 0.01).name('gamma').setValue(.7)

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  onError(error) {
    console.error(error)
  }


  onLoadedMetadata() {
    // this.video.width = this.video.videoWidth
    // this.video.height = this.video.videoHeight
    console.log('onLoadedMetadata', this.video.videoWidth, this.video.videoHeight)
  }


  update() {
    this.trackerContext.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight, 0, 0, this.trackerCanvas.width, this.trackerCanvas.height)
    this.rawFeaturePoints = this.tracker.track(this.trackerCanvas)
    if (this.rawFeaturePoints) {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      for (let i = 0; i < this.rawFeaturePoints.length; i++) {
        let p = this.rawFeaturePoints[i]
        vec2.min(min, min, p)
        vec2.max(max, max, p)
        this.trackerContext.fillStyle = 'rgba(255, 0, 0, 0.7)'
        this.trackerContext.fillRect(320 - p[0], p[1], 2, 2)
      }
      let size = vec2.sub([], max, min)
      let data = this.trackerContext.getImageData(min[0], min[1], size[0], size[1])
      let numPixels = data.width * data.height
      let n = (numPixels / 30) | 0
      min = Number.MAX_VALUE
      max = Number.MIN_VALUE
      for (let i = 0; i < numPixels; i += n) {
        let ii = i * 4
        let gray = (data.data[ii] + data.data[ii + 1] + data.data[ii + 2]) / 3
        if (gray < min) {
          min = gray
        }
        if (gray > max) {
          max = gray
        }
      }
      let current = this.inMax.getValue()
      current += (max / 255 - current) * 0.05
      this.inMax.setValue(current) 
      current = this.inMin.getValue()
      current += (min / 255 - current) * 0.05
      this.inMin.setValue(current) 
    }

    this.texture.needsUpdate = true
    this.renderer.render(this.scene, this.camera)
  }

}

new App()
