/* global THREE */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import {vec2, mat3} from 'gl-matrix'
import TWEEN from 'tween.js'

import Config from './config'
import Ticker from './ticker'
import WebcamPlane from './webcam-plane'
import DeformableFaceGeometry from './deformable-face-geometry'

import './main.sass'



class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 2400)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: false})
    this.renderer.setClearColor(0x172b35)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    // window.addEventListener('resize', this.onResize.bind(this))
    // this.onResize()

    this.canvas = document.createElement('canvas')
    this.canvas.id = 'overlay'
    this.canvas.width = 1024
    this.canvas.height = 1024
    $(this.canvas).css({
      transformOrigin: 'left top',
      scale: [Config.RENDER_WIDTH / 1024, Config.RENDER_HEIGHT / 1024]
    })
    document.body.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.ctx.scale(this.canvas.width / Config.RENDER_WIDTH, this.canvas.height / Config.RENDER_HEIGHT)
  }


  initObjects() {
    // let material = new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.2})
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: null},
        mask: {type: 't', value: null},
        useMask: {type: 'i', value: 0},
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          vUv = uv;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D mask;
        uniform int useMask;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(map, vUv);
          if (useMask > 0) {
            gl_FragColor.a *= texture2D(mask, vUv).r;
          }
        }
      `,
      transparent: true,
    })
    this.face = new THREE.Mesh(new DeformableFaceGeometry(), material)
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    // webcam
    this.webcam = new WebcamPlane(null, this.camera, this.renderer, this.face.geometry)
    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    this.webcam.scale.set(scale, scale, scale)
    // this.scene.add(this.webcam)

    material.uniforms.map.value = this.webcam.texture
    // material.map = this.webcam.texture
    // material.transparent = false
    // material.wireframe = false

    this.webcam.addEventListener('complete', () => {
      let ctx = this.ctx
      let s = 1280 / 320
      ctx.scale(s, s)
      ctx.lineWidth = 1 / s

      // {
      //   let center = vec2.lerp([], this.webcam.rawFeaturePoints[71], this.webcam.rawFeaturePoints[79], 0.5)
      //   // ctx.beginPath()
      //   // ctx.arc(center[0], center[1], 1, 0, Math.PI * 2, false)
      //   // ctx.strokeStyle = 'rgba(194, 98, 201, 0.7)'
      //   // ctx.stroke()
      //   let r = vec2.distance(this.webcam.rawFeaturePoints[71], this.webcam.rawFeaturePoints[79]) / 2
      //   ![72, 73, 74, 75, 76, 77, 78].forEach((i) => {
      //     let p = vec2.sub([], this.webcam.rawFeaturePoints[i], center)
      //     vec2.normalize(p, p)
      //     vec2.scale(p, p, r)
      //     vec2.add(this.webcam.rawFeaturePoints[i], p, center)
      //   })
      // }
      let headCenter = vec2.lerp([], this.webcam.rawFeaturePoints[71], this.webcam.rawFeaturePoints[79], 0.5)
      let headRadius = vec2.distance(this.webcam.rawFeaturePoints[71], this.webcam.rawFeaturePoints[79]) / 2
      let headRadius2 = vec2.distance(headCenter, this.webcam.rawFeaturePoints[75]) * 1.05

      const HEAD_INDICES = [72, 73, 74, 75, 76, 77, 78]
      const OUTLINE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 71, 72, 73, 74, 75, 76, 77, 78, 79]
      let points = OUTLINE_INDICES.map((i) => {
        let p = vec2.clone(this.webcam.rawFeaturePoints[i])
        if (HEAD_INDICES.indexOf(i) >= 0) {
          vec2.sub(p, p, headCenter)
          vec2.normalize(p, p)
          p[0] *= headRadius
          p[1] *= headRadius2
          // vec2.scale(p, p, headRadius)
          vec2.add(p, p, headCenter)
        }
        return p
      })
      console.table(points)

      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      points.forEach((p) => {
        vec2.min(min, min, p)
        vec2.max(max, max, p)
      })
      let center = vec2.lerp([], min, max, 0.5)
      let size = vec2.sub([], max, min)
      console.log(center, size)

      ctx.strokeStyle = 'rgba(55, 122, 189, 0.7)'
      ctx.strokeRect(min[0], min[1], size[0], size[1])
      ctx.beginPath()
      ctx.arc(center[0], center[1], 1, 0, Math.PI * 2, false)
      ctx.stroke()

      // {
      //   let center = vec2.lerp([], this.webcam.rawFeaturePoints[71], this.webcam.rawFeaturePoints[79], 0.5)
      //   console.log(center)
      //   ctx.beginPath()
      //   ctx.arc(center[0], center[1], 1, 0, Math.PI * 2, false)
      //   ctx.strokeStyle = 'rgba(194, 98, 201, 0.7)'
      //   ctx.stroke()
      //   let r = vec2.distance(this.webcam.rawFeaturePoints[71], this.webcam.rawFeaturePoints[79]) / 2
      //   ![72, 73, 74, 75, 76, 77, 78].forEach((i) => {
      //     let p = vec2.sub([], this.webcam.rawFeaturePoints[i], center)
      //     vec2.normalize(p, p)
      //     vec2.scale(p, p, r)
      //     vec2.add(this.webcam.rawFeaturePoints[i], p, center)
      //   })
      // }

      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let i = 1; i <= points.length; i++) {
        let ii = i % points.length
        let p = points[ii]
        ctx.lineTo(p[0], p[1])
      }
      ctx.stroke()

      ctx.beginPath()
      let scale = 0.95
      let mtx = mat3.create()
      mat3.translate(mtx, mtx, center)
      mat3.scale(mtx, mtx, [scale, scale])
      mat3.translate(mtx, mtx, vec2.negate([], center))
      /*let p = vec2.transformMat3([], points[0], mtx)
      ctx.moveTo(p[0], p[1])
      for (let i = 1; i <= points.length; i++) {
        let ii = i % points.length
        vec2.transformMat3(p, points[ii], mtx)
        ctx.lineTo(p[0], p[1])
      }
      ctx.strokeStyle = 'rgba(58, 197, 131, 0.2)'
      ctx.stroke()*/

      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      {
        let points2 = []
        let n = points.length
        for (let i = 0; i < n; i++) {
          let p0 = points[i]
          let p1 = points[(i + 1) % n]
          points2.push(p0)
          points2.push(vec2.lerp([], p0, p1, 0.5))
        }
        // console.table(points2)

        let p = vec2.transformMat3([], points2[points2.length - 1], mtx)
        ctx.moveTo(p[0], p[1])
        let c = vec2.create()
        for (let i = 0; i < points2.length; i += 2) {
          vec2.transformMat3(c, points2[i], mtx)
          vec2.transformMat3(p, points2[(i + 1) % points2.length], mtx)
          ctx.quadraticCurveTo(c[0], c[1], p[0], p[1])
        }
        // ctx.strokeStyle = 'rgba(255, 91, 134, 0.7)'
        // ctx.stroke()
        // ctx.fillStyle = 'rgba(255, 91, 134, 0.7)'
        ctx.fillStyle = 'white'
        ctx.fill()
      }

      this.face.material.uniforms.mask.value = new THREE.CanvasTexture(this.canvas)
      this.face.material.uniforms.useMask.value = 1
      $(this.canvas).hide()
    })
    this.webcam.start(true)
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    if (this.webcam.enabled) {
      this.webcam.update(currentFrame)
      if (this.webcam.normalizedFeaturePoints) {
        this.face.geometry.init(this.webcam.rawFeaturePoints, 320, 180, this.webcam.scale.y, 2400)
        this.face.matrix.copy(this.webcam.matrixFeaturePoints)
      }
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
