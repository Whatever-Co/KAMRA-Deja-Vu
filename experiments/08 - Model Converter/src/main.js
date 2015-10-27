/*global THREE*/
import $ from 'jquery'
import 'OrbitControls'

// import FaceTracker from './facetracker'
import Face from './face'

import './main.sass'
document.body.innerHTML = require('./body.jade')()



let toTypedArray = (type, array) => {
  let typed = new type(array.length)
  array.forEach((v, i) => typed[i] = v)
  return typed
}



class ExportApp {

  constructor() {
    this.animate = this.animate.bind(this)

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    this.camera.position.z = 400

    this.controls = new THREE.OrbitControls(this.camera)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    const container = document.querySelector('.container')
    container.appendChild(this.renderer.domElement)

    this.face = new Face()
    this.face.scale.set(200, 200, 200)
    this.scene.add(this.face)

    this.convert()

    window.addEventListener('resize', this.onResize.bind(this))

    this.animate()
  }


  convert() {
    let data = encodeURIComponent(JSON.stringify(this.face.export()))
    $(`<a class="download" href="data:application/json,${data}" download="face2.json">Download JSON</a>`).appendTo(document.body)
  }


  animate(t) {
    requestAnimationFrame(this.animate)

    // this.face.animate(t)

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

}


class ImportApp {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()

    this.animate()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    this.camera.position.z = 400

    this.controls = new THREE.OrbitControls(this.camera)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    const container = document.querySelector('.container')
    container.appendChild(this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    let data = require('json!./data/face2.json')

    let position = toTypedArray(Float32Array, data.face.position)
    // let index = toTypedArray(Uint16Array, data.face.index)
    // console.log(data.mouth.index)
    let index = new Uint16Array(data.face.index.length + data.rightEye.index.length + data.leftEye.index.length + data.mouth.index.length)
    data.face.index.forEach((i, j) => index[j] = i)
    let offset = data.face.index.length
    data.rightEye.index.forEach((i, j) => index[j + offset] = i)
    offset += data.rightEye.index.length
    data.leftEye.index.forEach((i, j) => index[j + offset] = i)
    offset += data.leftEye.index.length
    data.mouth.index.forEach((i, j) => index[j + offset] = i)

    let geometry = new THREE.BufferGeometry()
    geometry.dynamic = true
    geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setIndex(new THREE.BufferAttribute(index, 1))

    let material = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true})

    this.face = new THREE.Mesh(geometry, material)
    this.face.scale.set(200, 200, 200)
    this.scene.add(this.face)
  }


  animate(t) {
    requestAnimationFrame(this.animate)

    // this.face.animate(t)

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

}


new ExportApp()
// new ImportApp()
