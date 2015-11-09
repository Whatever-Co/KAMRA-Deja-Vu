/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import dat from 'dat-gui'
import TWEEN from 'tween.js'
import SimplexNoise from 'simplex-noise'

import Config from './config'
// import DeformableFaceGeometry from './deformablefacegeometry'

import './main.sass'
document.body.innerHTML = require('./main.jade')()



class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()
    this.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setClearColor(0x333355)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    this.anchor = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100, 3, 3, 3), new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.2, color: 0xff88ff}))
    // this.anchor.visible = false
    this.scene.add(this.anchor)

    this.numTrails = this.anchor.geometry.vertices.length
    this.numHistory = 32

    console.log(this.numTrails)

    let position = []
    let alpha = []
    for (let j = 0; j < this.numTrails; j++) {
      for (let i = 0; i < this.numHistory; i++) {
        position.push(0, 0, 0)
        alpha.push(((this.numHistory - 2) - i) / this.numHistory)
      }
    }

    let geometry = new THREE.BufferGeometry()
    this.positionAttribute = new THREE.Float32Attribute(position, 3)
    this.positionAttribute.setDynamic(true)
    geometry.addAttribute('position', this.positionAttribute)
    geometry.addAttribute('alpha', new THREE.Float32Attribute(alpha, 1))

    let material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vAlpha = alpha;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(1, 1, 1, vAlpha);
        }
      `,
      transparent: true,
      blendDst: THREE.OneFactor
    })
    let mesh = new THREE.Line(geometry, material)
    this.scene.add(mesh)

    this.simplex = new SimplexNoise()
  }


  start() {
    this.startTime = performance.now()
    this.previousFrame = -1
    this.animate()
  }


  animate(time) {
    requestAnimationFrame(this.animate)

    let currentFrame = Math.floor((performance.now() - this.startTime) / 1000 * 24)
    if (currentFrame != this.previousFrame) {
      this.update(time, currentFrame)
      this.previousFrame = currentFrame
    }
  }


  update(time, currentFrame) {
    TWEEN.update(time)

    // time *= 2
    this.anchor.position.x = Math.sin(time / 1000) * 300
    this.anchor.position.y = Math.sin(time / 1234) * 200
    this.anchor.position.z = Math.cos(time / 1589) * 400
    this.anchor.rotation.x = time / 876
    this.anchor.rotation.y = time / 1200
    this.anchor.rotation.z = Math.sin(time / 1992) * 2
    this.anchor.updateMatrixWorld()

    {
      let t = time * 0.00001
      let array = this.positionAttribute.array
      for (let n = 0; n < this.numTrails; n++) {
        let offset = n * this.numHistory * 3
        for (let i = this.numHistory - 1; i >= 1; i--) {
          let r = i / this.numHistory
          let j = i * 3 + offset
          let k = (i - 1) * 3 + offset
          let x = array[k + 0] * 0.002
          let y = array[k + 1] * 0.002
          let z = array[k + 2] * 0.002
          let a = r * 5
          array[j + 0] = array[k + 0] + this.simplex.noise4D(x, y, z, t) * a
          array[j + 1] = array[k + 1] + this.simplex.noise4D(x, y, z, t + 0.33) * a
          array[j + 2] = array[k + 2] + this.simplex.noise4D(x, y, z, t + 0.77) * a
        }
        let v = this.anchor.geometry.vertices[n].clone().applyMatrix4(this.anchor.matrixWorld)
        array[offset + 0] = v.x
        array[offset + 1] = v.y
        array[offset + 2] = v.z
        if (offset > 0) {
          array[offset - 3] = v.x
          array[offset - 2] = v.y
          array[offset - 1] = v.z
        }
      }
      this.positionAttribute.needsUpdate = true
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
