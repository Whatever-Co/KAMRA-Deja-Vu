/* global THREE */
import $ from 'jquery'
import 'OrbitControls'

import Face from './face'

import './main.sass'
document.body.innerHTML = require('./body.jade')()



class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    this.camera.position.z = 400

    this.controls = new THREE.OrbitControls(this.camera)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x1a2b34)

    const container = document.querySelector('.container')
    container.appendChild(this.renderer.domElement)

    this.face = new Face()
    this.face.scale.set(200, 200, 200)
    this.scene.add(this.face)

    // this.convert()

    window.addEventListener('resize', this.onResize.bind(this))

    this.animate()
  }


  convert() {
    let data = this.face.export()
    console.log(data)
    $(`<a class="download" href="data:application/json,${encodeURIComponent(JSON.stringify(data))}" download="face2.json">Download JSON</a>`).appendTo(document.body)
  }


  animate() {
    requestAnimationFrame(this.animate)

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

}

// window.onerror = (e) => {
//   debugger
// }

new App()
