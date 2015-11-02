/* global THREE */

import $ from 'jquery'
import {vec3} from 'gl-matrix'
import Stats from 'stats-js'


export default class {

  constructor() {
    this.animate = this.animate.bind(this)

    $.getJSON('keyframes.json').done((result) => {
      this.keyframes = result
      console.log(this.keyframes)

      this.initScene()
      this.initObjects()

      this.stats = new Stats()
      document.body.appendChild(this.stats.domElement)
      this.counter = $('#frame-counter')

      this.startTime = performance.now()
      this.previousFrame = -1

      this.animate()
    })
  }


  getBounds(vertices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
    for (let i = 0; i < vertices.length; i += 3) {
      let p = [vertices[i], vertices[i + 1], vertices[i + 2]]
      vec3.min(min, min, p)
      vec3.max(max, max, p)
    }
    return {min, max, size: vec3.sub([], max, min), center: vec3.lerp([], min, max, 0.5)}
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000)
    this.camera.position.z = 500
    console.log(this.camera.fov, this.camera.position, this.camera.quaternion)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    // console.table(this.getBounds(this.keyframes.user.property.face_vertices[0]))

    // let geometry = new THREE.BoxGeometry(87.6, 124.2, 65.2)
    // let geometry = new THREE.SphereGeometry(2, 8, 8, 0, Math.PI)

    let data = require('./face.json')
    let geometry = new THREE.BufferGeometry()
    geometry.dynamic = true
    geometry.setIndex(new THREE.Uint16Attribute(data.face.index, 1))
    geometry.addAttribute('position', new THREE.Float32Attribute(data.face.position, 3))
    let material = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true, transparent: true, opacity: 0.5})
    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)
  }


  animate() {
    this.stats.begin()

    requestAnimationFrame(this.animate)

    let currentFrame = Math.floor((performance.now() - this.startTime) / 1000 * 24) % 1000
    if (currentFrame != this.previousFrame) {
      let props = this.keyframes.camera.property
      this.camera.fov = props.fov[currentFrame]
      this.camera.updateProjectionMatrix()
      let index = currentFrame * 3
      this.camera.position.set(props.position[index], props.position[index + 1], props.position[index + 2])
      index = currentFrame * 4
      this.camera.quaternion.set(props.quaternion[index + 1], props.quaternion[index + 2], props.quaternion[index + 3], props.quaternion[index])

      let prop = this.keyframes.user.property.position
      index = currentFrame * 3
      this.mesh.position.set(prop[index], prop[index + 1], prop[index + 2])
      prop = this.keyframes.user.property.quaternion
      index = currentFrame * 4
      this.mesh.quaternion.set(prop[index + 1], prop[index + 2], prop[index + 3], prop[index])
      prop = this.keyframes.user.property.scale
      index = currentFrame
      let scale = prop[index] * 100
      this.mesh.scale.set(scale, scale, scale)

      let attribute = this.mesh.geometry.getAttribute('position')
      attribute.array.set(this.keyframes.user.property.face_vertices[currentFrame])
      attribute.needsUpdate = true

      this.renderer.render(this.scene, this.camera)

      this.counter.text(currentFrame)
      this.previousFrame = currentFrame
    }

    this.stats.end()
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

}
