/*global THREE*/
import $ from 'jquery'
import 'OrbitControls'

import FaceTracker from './facetracker'
import Face from './face'

import './main.sass'
document.body.innerHTML = require('./body.jade')()



class ImageApp {

  constructor() {
    this.animate = this.animate.bind(this)

    document.body.addEventListener('dragover', (e) => {
      e.stopPropagation()
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }, false)
    document.body.addEventListener('drop', (e) => {
      e.stopPropagation()
      e.preventDefault()
      let file = e.dataTransfer.files[0]
      if (file.type.match(/image/i)) {
        let reader = new FileReader()
        reader.onload = (e) => {
          this.startTracker(e.target.result)
        }
        reader.readAsDataURL(file)
      }
    })

    this.initScene()

    this.tracker = new FaceTracker()
    this.tracker.on('tracked', () => {
      this.initObjects()
      this.animate()

      let ctx = this.tracker.debugCanvas.getContext('2d')
      ctx.fillStyle = 'red'
      this.tracker.currentPosition.forEach((p) => {
        ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2)
      })
    })

    this.startTracker('media/shutterstock_282461870.jpg')
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    // let w = window.innerWidth / 2;
    // let h = window.innerHeight / 2;
    // this.camera = new THREE.OrthographicCamera(-w, w, h, -h, 1, 3000);
    this.camera.position.z = 500

    this.controls = new THREE.OrbitControls(this.camera)

    this.scene = new THREE.Scene()
    // this.scene.fog = new THREE.Fog(0x000000, 100, 600);

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    const container = document.querySelector('.container')
    container.appendChild(this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  startTracker(url) {
    let container = document.querySelector('#tracker')

    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      this.scene.remove(this.scene.children[i])
    }
    if (this.tracker.target) {
      container.removeChild(this.tracker.target)
      container.removeChild(this.tracker.debugCanvas)
    }
    cancelAnimationFrame(this.requestId)
    this.face = null

    this.tracker.startImage(url)

    container.appendChild(this.tracker.target)
    container.appendChild(this.tracker.debugCanvas)
  }


  initObjects() {
    this.face = new Face(this.tracker)
    this.face.scale.set(150, 150, 150)
    this.scene.add(this.face)
  }


  animate() {
    this.requestId = requestAnimationFrame(this.animate)

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

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

    let position = new Float32Array(data.position.length)
    data.position.forEach((p, i) => position[i] = p)

    let index = new Uint16Array(data.index.length)
    data.index.forEach((j, i) => index[i] = j)

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


// new ImageApp()
new ExportApp()
// new ImportApp()
