/* global THREE */
import $ from 'jquery'
import 'OrbitControls'
import dat from 'dat-gui'
import {vec2, vec3, mat3} from 'gl-matrix'
import Stats from 'stats-js'

import Delaunay from 'delaunay-fast'

import FaceTracker from './facetracker'
import DeformableFace from './deformableface'

import './main.sass'
document.body.innerHTML = require('./main.jade')()



class StandardFaceData {

  constructor() {
    this.data = require('./face.json')

    let index = this.data.face.index.concat(this.data.rightEye.index, this.data.leftEye.index)
    this.index = new THREE.Uint16Attribute(index, 1)
    this.position = new THREE.Float32Attribute(this.data.face.position, 3)

    this.bounds = this.getBounds()
    this.size = vec2.len(this.bounds.size)
  }


  getBounds() {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
    let position = this.data.face.position
    let n = position.length
    for (let i = 0; i < n; i += 3) {
      let p = [position[i], position[i + 1], position[i + 2]]
      vec3.min(min, min, p)
      vec3.max(max, max, p)
    }
    return {min, max, size: vec3.sub([], max, min), center: vec3.lerp([], min, max, 0.5)}
  }


  getFeatureVertex(index) {
    let i = this.data.face.featurePoint[index] * 3
    let p = this.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }


  getVertex(index) {
    let i = index * 3
    let p = this.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
  }
 
}



class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()

    this.stats = new Stats()
    document.body.appendChild(this.stats.domElement)

    this.animate()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    this.camera.position.z = 500

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    let el = document.createElement('video')
    el.id = 'webcam'
    // el.style.display = 'none'
    document.body.appendChild(el)

    navigator.webkitGetUserMedia({
      video: {
        mandatory: {
          minWidth: 640,
          minHeight: 360
        },
        optional: [
          { minWidth: 1280 },
          { minWidth: 1920 }
        ]
      }
    }, (stream) => {
      el.src = window.URL.createObjectURL(stream)
      el.addEventListener('loadedmetadata', () => {
        console.log({width: el.videoWidth, height: el.videoHeight})
        el.width = el.videoWidth / 4
        el.height = el.videoHeight / 4
        let geometry = new THREE.PlaneGeometry(el.videoWidth / el.videoHeight, 1, 10, 10)
        let map = new THREE.VideoTexture(el)
        map.minFilter = THREE.LinearFilter
        let material = new THREE.MeshBasicMaterial({map, side: THREE.DoubleSide, depthWrite: false})
        this.webcam = new THREE.Mesh(geometry, material)
        let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 500 * 2
        this.webcam.scale.set(-scale, scale, scale)
        this.scene.add(this.webcam)

        this.webcam.add(this.face)

        this.tracker = new FaceTracker()
        this.tracker.startVideo(el)
      })
      el.play()
    }, (error) => {
      console.log(error)
    })

    this.data = new StandardFaceData()

    let geometry = new THREE.BufferGeometry()
    geometry.dynamic = true
    geometry.setIndex(this.data.index)
    geometry.addAttribute('position', this.data.position.clone())
    let material = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.3, wireframe: true})
    this.face = new THREE.Mesh(geometry, material)
    // this.scene.add(this.face)
  }


  animate(t) {
    this.stats.begin()

    requestAnimationFrame(this.animate)

    if (this.tracker && this.tracker.currentPosition) {
      let fpCenter = vec2.lerp([], this.data.getFeatureVertex(14), this.data.getFeatureVertex(0), 0.5)
      let scale = 1.0 / vec2.sub([], this.data.getFeatureVertex(14), fpCenter)[0]

      let v0 = this.tracker.currentPosition[0]
      let v1 = this.tracker.currentPosition[14]
      let center = vec2.lerp(vec2.create(), v0, v1, 0.5)
      let xAxis = vec2.sub([], v1, center)
      scale *= vec2.len(xAxis)
      let rotation = mat3.create()
      mat3.rotate(rotation, rotation, Math.atan2(xAxis[1], xAxis[0]))
      for (let i = 71; i < 80; i++) {
        let p = vec2.sub([], this.data.getFeatureVertex(i), fpCenter)
        vec2.scale(p, p, scale)
        p[1] *= -1
        vec2.transformMat3(p, p, rotation)
        vec2.add(p, p, center)
        this.tracker.currentPosition[i] = p
      }

      if (!this.markers) {
        this.markers = this.tracker.currentPosition.map((p) => {
          let geometry = new THREE.BoxGeometry(0.005, 0.005, 0.005)
          let material = new THREE.MeshBasicMaterial({color: 0xff0000})
          let marker = new THREE.Mesh(geometry, material)
          this.webcam.add(marker)
          return marker
        })
      }

      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      this.tracker.currentPosition.forEach((p) => {
        vec2.min(min, min, p)
        vec2.max(max, max, p)
      })
      let size = vec2.sub([], max, min)
      scale = vec2.len(size) / this.data.size / 180

      this.tracker.currentPosition.forEach((p, i) => {
        let z = this.data.getFeatureVertex(i)[2] * scale
        let wz = this.webcam.localToWorld(new THREE.Vector3(0, 0, z)).z
        let pc = (500 - wz) / 500
        this.markers[i].position.set((p[0] / 180 - .888888889) * pc, -(p[1] / 180 - 0.5) * pc, z)
      })

      let mtx = mat3.create()
      let scale2 = 1
      {
        let min = [Number.MAX_VALUE, Number.MAX_VALUE]
        let max = [Number.MIN_VALUE, Number.MIN_VALUE]
        let points = this.markers.map((marker) => {
          let p = [marker.position.x, marker.position.y]
          vec2.min(min, min, p)
          vec2.max(max, max, p)
          return p
        })
        let size = vec2.sub([], max, min)
        let scale = this.data.size / vec2.len(size)
        scale2 = scale
        let center = points[41]
        let yAxis = vec2.sub([], points[75], points[7])
        let angle = Math.atan2(yAxis[1], yAxis[0]) - Math.PI * 0.5

        mat3.rotate(mtx, mtx, -angle)
        mat3.scale(mtx, mtx, [scale, scale])
        mat3.translate(mtx, mtx, vec2.scale([], center, -1))
      }
      let invertMtx = mat3.invert(mat3.create(), mtx)

      {
        let displacement = this.markers.map((marker, i) => {
          let fp = this.data.getFeatureVertex(i)
          let p = [marker.position.x, marker.position.y]
          vec2.transformMat3(p, p, mtx)
          return vec3.sub([], [p[0], p[1], marker.position.z / scale], fp)
        })
        let attribute = this.face.geometry.getAttribute('position')
        let n = attribute.array.length / 3
        for (let i = 0; i < n; i++) {
          let p = vec3.create()
          let b = 0
          this.data.data.face.weight[i].forEach((w) => {
            vec3.add(p, p, vec3.scale(vec3.create(), displacement[w[0]], w[1]))
            b += w[1]
          })
          vec3.scale(p, p, 1 / b)
          vec3.add(p, p, this.data.getVertex(i))
          let q = vec2.transformMat3([], p, invertMtx)
          attribute.array[i * 3 + 0] = q[0]
          attribute.array[i * 3 + 1] = q[1]
          attribute.array[i * 3 + 2] = p[2] * scale
        }
        attribute.needsUpdate = true
      }
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)

    this.stats.end()
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

}



class KeyframeAnimeApp {


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


  animate(t) {
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



// new App()
new KeyframeAnimeApp()
