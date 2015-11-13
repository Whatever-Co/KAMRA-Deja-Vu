/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'

import Config from './config'
import DeformableFaceGeometry from './deformable-face-geometry'

import './main.sass'
document.body.innerHTML = require('./main.jade')()


class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()
    this.initUI()

    this.animate()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, 1, 10, 3000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    this.renderer.setSize(512, 512)
    this.renderer.setClearColor(0x1a2b34, 0)
    document.querySelector('.preview').appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
  }


  initObjects() {
    let geometry = new DeformableFaceGeometry()
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: null}
      },
      vertexShader: require('./shaders/face-front.vert'),
      fragmentShader: require('./shaders/face-front.frag'),
      side: THREE.DoubleSide,
      // wireframe: true,
    })
    this.face = new THREE.Mesh(geometry, material)
    this.face.scale.set(300, 300, 300)
    this.scene.add(this.face)

    this.loadTexture('shutterstock_102487424.png')
    this.loadData('shutterstock_102487424.json')
  }


  initUI() {
    window.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
    }, false)
    window.addEventListener('drop', (e) => {
      e.preventDefault()
      e.stopPropagation()
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        let file = e.dataTransfer.files[i]
        this.basename = file.name.split('/').pop().split('.').shift()
        console.log(this.basename)
        switch (file.type) {
          case 'application/json':
            this.readAsDataURL(file).then(this.loadData.bind(this))
            break
          case 'image/png':
            this.readAsDataURL(file).then(this.loadTexture.bind(this))
            break
        }
      }
    })

    $('#rotate').on('click', (e) => {
      e.preventDefault()
      let z = Math.random()
      let a = Math.random() * Math.PI * 2
      let r = Math.sqrt(1 - z * z)
      let x = r * Math.cos(a)
      let y = r * Math.cos(a)
      let d = this.camera.position.length()
      this.camera.position.set(x, y, z).setLength(d)
      this.camera.lookAt(new THREE.Vector3())
    })

    this.takeSnapshot = false
    window.addEventListener('mouseup', (e) => {
      this.takeSnapshot = true
    })
  }


  readAsDataURL(file) {
    return new Promise((resolve) => {
      let reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target.result)
      }
      reader.readAsDataURL(file)
    })
  }


  loadTexture(url) {
    let loader = new THREE.TextureLoader()
    loader.load(url, (texture) => {
      texture.needsUpdate = true
      this.face.material.uniforms.map.value = texture
    })
  }


  loadData(url) {
    // this.basename = url.split('/').pop().split('.').shift()
    $.getJSON(url).done((result) => {
      result.forEach((p) => {
        p[0] *= 512
        p[1] = (1 - p[1]) * 512
      })
      this.face.geometry.init(result, 512, 512, 400, 1200)
      this.face.geometry.center()
    })
  }


  animate() {
    requestAnimationFrame(this.animate)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)

    if (this.takeSnapshot) {
      this.takeSnapshot = false
      $('#download').attr({
        download: `${this.basename}.png`,
        href: this.renderer.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream')
      }).click()
    }
  }

}


new App()
