/* global THREE */
import 'OrbitControls'
import dat from 'dat-gui'

import './main.sass'
document.body.innerHTML = require('./main.jade')()


class App {

  constructor() {

    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()

    this.animate()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    this.camera.position.set(200, 300, 500)
    this.camera.lookAt(new THREE.Vector3())
    console.log(this.camera.position.length())

    let plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    let ray = new THREE.Ray(this.camera.position.clone(), new THREE.Vector3(10, 0, 30).sub(this.camera.position).normalize())
    console.log(ray.intersectPlane(plane))

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x333333, 1)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: null},
        clipY: {type: 'f', value: 0.0001}
      },
      vertexShader: require('./crosssection.vert'),
      fragmentShader: require('./crosssection.frag'),
      side: THREE.DoubleSide
    })
    new THREE.TextureLoader().load('uvcheck.png', (texture) => {
      material.uniforms.map.value = texture
    })
    /*
    let geometry = new THREE.BoxGeometry(200, 200, 200)
    let mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)
    */

    new THREE.JSONLoader().load('face.json', (geometry) => {
      geometry.center()
      // let material = new THREE.MeshBasicMaterial({wireframe: true})
      let materials = new THREE.MultiMaterial([
        material,
        // new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.BackSide})
        material
      ])
      let mesh = new THREE.Mesh(geometry, materials)
      mesh.scale.set(200, 200, 200)
      this.scene.add(mesh)

      let gui = new dat.GUI()
      gui.add(material, 'wireframe')
      gui.add(material.uniforms.clipY, 'value', -1, 1).name('Clip Y')
    })
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

new App()
