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

    this.previousFrame = -1
    this.scoreHistory = []
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
    this.video = document.createElement('video')
    this.video.id = 'webcam'
    // this.video.style.display = 'none'
    document.body.appendChild(this.video)

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
      this.stream = stream
      this.video.src = window.URL.createObjectURL(stream)
      this.video.addEventListener('loadedmetadata', () => {
        console.log({width: this.video.videoWidth, height: this.video.videoHeight})
        this.video.width = this.video.videoWidth / 4
        this.video.height = this.video.videoHeight / 4
        let geometry = new THREE.PlaneGeometry(this.video.videoWidth / this.video.videoHeight, 1, 10, 10)
        let map = new THREE.VideoTexture(this.video)
        map.minFilter = THREE.LinearFilter
        let material = new THREE.MeshBasicMaterial({map, side: THREE.DoubleSide, depthWrite: false})
        this.webcam = new THREE.Mesh(geometry, material)
        let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 500 * 2
        this.webcam.scale.set(-scale, scale, scale)
        this.scene.add(this.webcam)

        // this.webcam.add(this.face)
        this.scene.add(this.face)

        this.tracker = new FaceTracker()
        this.tracker.startVideo(this.video)
      })
      this.video.play()
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
    requestAnimationFrame(this.animate)

    let currentFrame = Math.floor(t / 1000 * 24)
    if (currentFrame != this.previousFrame) {
      this.stats.begin()
  
      this.update(currentFrame)
  
      this.controls.update()
      this.renderer.render(this.scene, this.camera)

      this.previousFrame = currentFrame
  
      this.stats.end()
    }
  }


  update(currentFrame) {
    if (this.tracker && this.tracker.currentPosition) {

      // add head feature points
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

      // check capture condition
      {
        const faceIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 71, 72, 73, 74, 75, 76, 77, 78, 79]
        const partsIndices = [23, 24, 25, 26, 28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 40]
        let {size, center} = this.getBoundsFor(this.tracker.currentPosition, faceIndices)
        let len = vec2.len(size)
        let {center: pCenter} = this.getBoundsFor(this.tracker.currentPosition, partsIndices)
        let isOK = size[1] > 120 && Math.abs(center[0] - pCenter[0]) < 3 && this.tracker.getConvergence() < 20
        $('#frame-counter').text(`size: ${size[0].toPrecision(3)}, ${size[1].toPrecision(3)} / len: ${len.toPrecision(3)} / center: ${center[0].toPrecision(3)}, ${center[1].toPrecision(3)} / pCenter: ${pCenter[0].toPrecision(3)}, ${pCenter[1].toPrecision(3)} / Score: ${this.tracker.getScore().toPrecision(4)} / Convergence: ${this.tracker.getConvergence().toPrecision(5)} / ${isOK ? 'OK' : 'NG'}`)
        this.scoreHistory.push(isOK)
        if (this.scoreHistory.length > 30) {
          this.scoreHistory.shift()
        }
        // console.log(this.scoreHistory)
        if (this.scoreHistory && this.scoreHistory.every((s) => s)) {
          // this.stream.stop()
          this.stream.getVideoTracks()[0].stop()
          this.video.pause()
          this.tracker.stop()
          this.tracker = null
          return
        }
      }

      // add markers for feature points
      if (!this.markers) {
        this.markers = this.tracker.currentPosition.map(() => {
          let geometry = new THREE.BoxGeometry(0.005, 0.005, 0.005)
          let material = new THREE.MeshBasicMaterial({color: 0xff0000})
          let marker = new THREE.Mesh(geometry, material)
          this.webcam.add(marker)
          return marker
        })
      }

      // calc captured face size (in canvas coordinate)
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      this.tracker.currentPosition.forEach((p) => {
        vec2.min(min, min, p)
        vec2.max(max, max, p)
      })
      let size = vec2.sub([], max, min)
      scale = vec2.len(size) / this.data.size / 180

      // move markers to captured position (in mesh local coordinates (height = 2.0))
      this.tracker.currentPosition.forEach((p, i) => {
        let z = this.data.getFeatureVertex(i)[2] * scale
        let wz = this.webcam.localToWorld(new THREE.Vector3(0, 0, z)).z
        let pc = (500 - wz) / 500
        this.markers[i].position.set((p[0] / 180 - .888888889) * pc, -(p[1] / 180 - 0.5) * pc, z)
      })

      // normalize captured feature points coords
      let mtx = mat3.create()
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
        scale = this.data.size / vec2.len(size)
        let center = points[41]
        let yAxis = vec2.sub([], points[75], points[7])
        let angle = Math.atan2(yAxis[1], yAxis[0]) - Math.PI * 0.5

        mat3.rotate(mtx, mtx, -angle)
        mat3.scale(mtx, mtx, [scale, scale])
        mat3.translate(mtx, mtx, vec2.scale([], center, -1))

        this.face.rotation.z = -angle
        let s = 1 / scale * -this.webcam.scale.x
        this.face.scale.set(-s, s, s)
        this.face.position.set(center[0] * this.webcam.scale.x, center[1] * this.webcam.scale.y, 0)
      }

      {
        // displace standard mesh to captured face (in normalized coords)
        let displacement = this.markers.map((marker, i) => {
          let fp = this.data.getFeatureVertex(i)
          let p = [marker.position.x, marker.position.y]
          vec2.transformMat3(p, p, mtx)
          return vec3.sub([], [p[0], p[1], marker.position.z * scale], fp)
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

          attribute.array[i * 3 + 0] = p[0]
          attribute.array[i * 3 + 1] = p[1]
          attribute.array[i * 3 + 2] = p[2]
        }
        attribute.needsUpdate = true
      }
    }
  }

  
  getBoundsFor(vertices, indices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    indices.forEach((index) => {
      vec2.min(min, min, vertices[index])
      vec2.max(max, max, vertices[index])
    })
    return {min, max, size: vec2.sub([], max, min), center: vec2.lerp([], min, max, 0.5)}
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



new App()
// new KeyframeAnimeApp()
