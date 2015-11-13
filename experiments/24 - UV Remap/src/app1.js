/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import TWEEN from 'tween.js'
import {vec3} from 'gl-matrix'

import Config from './config'
import Ticker from './ticker'
import DeformableFaceGeometry from './deformable-face-geometry'
import FaceBlender from './face-blender'
import StandardFaceData from './standard-face-data'


import './main.sass'


class App {

  constructor() {
    this.initScene()
    this.initObjects()

    Ticker.on('update', this.update.bind(this))
    Ticker.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    // window.addEventListener('resize', this.onResize.bind(this))
    // this.onResize()
  }


  initObjects() {
    let data = require('raw!./data/face.obj')
    let vertices = []
    let texCoords = []
    let v2vt = []
    data.split(/\n/).forEach((line) => {
      let tokens = line.split(' ')
      let type = tokens.shift()
      switch (type) {
        case 'v':
          vertices.push(tokens.map((v) => parseFloat(v)))
          break
        case 'vt':
          texCoords.push(tokens.map((v) => parseFloat((v))))
          break
        case 'f':
          tokens.forEach((pair) => {
            pair = pair.split('/').map((v) => parseInt(v) - 1)
            v2vt[pair[0]] = pair[1]
          })
          break
      }
    })

    let getUVForVertex = (v) => {
      let min = Number.MAX_VALUE
      let index
      for (let i = 0; i < vertices.length; i++) {
        let d = vec3.distance(v, vertices[i])
        if (d < min) {
          min = d
          index = i
        }
      }
      return texCoords[v2vt[index]]
    }

    let standardFace = new StandardFaceData()
    // let v = standardFace.data.face.position.slice(0, 3)
    // console.log(v, getUVForVertex(v))
    let uvs = []
    let position = standardFace.data.face.position
    for (let i = 0; i < position.length; i += 3) {
      let uv = getUVForVertex(position.slice(i, i + 3))
      uvs.push(uv[0], uv[1])
    }


    // let geometry = new THREE.PlaneGeometry(1, 1)
    let geometry = new THREE.BufferGeometry()
    geometry.setIndex(standardFace.index)
    geometry.addAttribute('position', standardFace.position)
    // geometry.addAttribute('position', standardFace.position)
    // geometry.addAttribute('uv', new THREE.Float32Attribute(uvs, 2))

    // let material = new THREE.MeshBasicMaterial({wireframe: true})
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: null},
        lut: {type: 't', value: null},
        _grid: {type: 't', value: null},
      },
      vertexShader: `
        attribute vec2 uv2;
        varying vec2 vUv;
        varying vec2 vUv2;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vUv = uv;
          vUv2 = uv2;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D lut;
        uniform sampler2D hoge;

        varying vec2 vUv;
        varying vec2 vUv2;

        void main() {
          vec4 original = texture2D(map, vUv);
          vec4 uv2 = texture2D(lut, vUv2);
          vec4 uv3 = texture2D(hoge, uv2.xy);
          vec4 parts = texture2D(map, uv3.xy);
          gl_FragColor = vec4(mix(original.rgb, parts.rgb, uv2.a), 1.0);
        }
      `,
      transparent: true
    })
    // let mesh = new THREE.Mesh(geometry, material)
    // mesh.scale.set(300, 300, 300)
    // this.scene.add(mesh)

    let loader = new createjs.LoadQueue()
    loader.loadManifest([
      {id: 'color', src: 'faceuv.png'},
      {id: 'lut', src: 'lut4b.png'},
      {id: 'image', src: 'media/shutterstock_56254417.png'},
      // {id: 'image', src: 'uvcheck.png'},
      {id: 'data', src: 'media/shutterstock_56254417.json'}
    ])
    loader.on('complete', () => {
      let featurePoints = loader.getResult('data')
      let faceGeometry = new DeformableFaceGeometry(featurePoints, 512, 512, 400, this.camera.position.z)
      // faceGeometry.positionAttribute.array.set(standardFace.data.face.position)

      let target
      {
        let uvs = []
        let position = standardFace.data.face.position
        for (let i = 0; i < position.length; i += 3) {
          let uv = getUVForVertex(position.slice(i, i + 3))
          uvs.push(uv[0], uv[1], 0)
        }
        let geometry = new THREE.BufferGeometry()
        geometry.setIndex(standardFace.index)
        geometry.addAttribute('position', new THREE.Float32Attribute(uvs, 3))
        geometry.addAttribute('uv', faceGeometry.uvAttribute)
        let material = new THREE.ShaderMaterial({
          vertexShader: `
            varying vec3 vColor;
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
              vColor = vec3(uv, 0);
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            void main() {
              gl_FragColor = vec4(vColor, 1.0);
            }
          `
        })
        let mesh = new THREE.Mesh(geometry, material)
        // mesh.scale.set(300, 300, 300)
        // this.scene.add(mesh)
        target = new THREE.WebGLRenderTarget(512, 512, {type: THREE.FloatType, depthBuffer: false, stencilBuffer: false})
        let scene = new THREE.Scene()
        scene.add(mesh)
        let camera = new THREE.OrthographicCamera(0, 1, 1, 0, -100, 100)
        this.renderer.setClearColor(0x808080, 1)
        this.renderer.render(scene, camera, target, true)
        this.renderer.setClearColor(0x333333, 1)

        // let plane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({map: target}))
        // plane.position.x = 300
        // this.scene.add(plane)
      }

      // return

      material.uniforms._grid.value = new THREE.CanvasTexture(loader.getResult('color'))
      let color = new THREE.CanvasTexture(loader.getResult('image'))
      // color.minFilter = color.magFilter = THREE.NearestFilter
      material.uniforms.map.value = color
      let lut = new THREE.CanvasTexture(loader.getResult('lut'))
      // lut.minFilter = lut.magFilter = THREE.NearestFilter
      // lut.generateMipmaps = false
      material.uniforms.lut.value = lut
      material.uniforms.hoge = {type: 't', value: target}

      // let featurePoints = loader.getResult('data')
      // let geometry = new DeformableFaceGeometry(featurePoints, 512, 512, 400, this.camera.position.z)
      faceGeometry.addAttribute('uv2', new THREE.Float32Attribute(uvs, 2))

      let mesh = new THREE.Mesh(faceGeometry, material)
      mesh.scale.set(300, 300, 300)
      this.scene.add(mesh)
    })
  }


  initObjects_() {
    let loader = new createjs.LoadQueue()
    // loader.loadFile({id: 'keyframes', src: 'keyframes.json'})
    let items = [
      'shutterstock_38800999',
      'shutterstock_56254417',
      'shutterstock_61763248',
      // 'shutterstock_62329042',
      'shutterstock_62329057',
      'shutterstock_102487424',
      'shutterstock_102519095',
      'shutterstock_154705646'
    ]
    items.forEach((name, i) => {
      loader.loadFile({id: `data${i}`, src: `media/${name}.json`})
      loader.loadFile({id: `image${i}`, src: `media/${name}.png`})
    })
    loader.on('complete', () => {
      this.faces = items.map((name, i) => {
        let featurePoints = loader.getResult(`data${i}`)
        let image = loader.getResult(`image${i}`)
        return new THREE.Mesh(
          new DeformableFaceGeometry(featurePoints, 512, 512, 400, this.camera.position.z),
          new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(image)})
        )
      })

      this.blender = new FaceBlender(this.faces[0], this.faces[1])
      this.scene.add(this.blender)

      this.current = 1
      this.change()

      this.scene.scale.set(300, 300, 300)
    })
  }


  update(currentFrame, time) {
    TWEEN.update(time)

    // if (this.blender) {
    //   this.blender.blend = Math.sin(time / 1000) * 0.5 + 0.5
    // }

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


/*
let canvas = document.createElement('canvas')
canvas.width = canvas.height = 512
// document.body.appendChild(canvas)

let ctx = canvas.getContext('2d')
let pixels = ctx.getImageData(0, 0, 512, 512)
for (let y = 0; y < 512; y++) {
  for (let x = 0; x < 512; x++) {
    let v = x << 9 | y
    let i = (x + y * 512) * 4
    pixels.data[i++] = (v >> 16) & 0xff
    pixels.data[i++] = (v >> 8) & 0xff
    pixels.data[i++] = v & 0xff
    pixels.data[i] = 255
  }
}
ctx.putImageData(pixels, 0, 0)

let image = new Image()
image.src = canvas.toDataURL('image/png')
document.body.appendChild(image)
//*/


/*
let canvas = document.createElement('canvas')
canvas.width = canvas.height = 256
// document.body.appendChild(canvas)

let ctx = canvas.getContext('2d')
let pixels = ctx.getImageData(0, 0, 256, 256)
for (let y = 0; y < 256; y++) {
  for (let x = 0; x < 256; x++) {
    let i = (x + y * 256) * 4
    pixels.data[i++] = x
    pixels.data[i++] = 255 - y
    pixels.data[i++] = 0
    pixels.data[i] = 255
  }
}
ctx.putImageData(pixels, 0, 0)

let image = new Image()
image.src = canvas.toDataURL('image/png')
document.body.appendChild(image)
//*/

