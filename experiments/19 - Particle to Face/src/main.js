/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import 'OrbitControls'
import dat from 'dat-gui'
import TWEEN from 'tween.js'
import {vec3} from 'gl-matrix'

import Config from './config'
import DeformableFaceGeometry from './deformablefacegeometry'

import './main.sass'
document.body.innerHTML = require('./main.jade')()


class RandomPointInGeometry {

  constructor(geometry) {
    this._v1 = vec3.create()
    this._v2 = vec3.create()

    this.geometry = geometry

    this.prepare()
  }


  prepare() {
    let indices = this.geometry.index
    let position = this.geometry.getAttribute('position').array
    this.totalArea = 0
    this.cumulativeAreas = []

    for (let i = 0; i < indices.count; i += 3) {
      let j = indices.array[i] * 3
      let p0 = [position[j], position[j + 1], position[j + 2]]
      j = indices.array[i + 1] * 3
      let p1 = [position[j], position[j + 1], position[j + 2]]
      j = indices.array[i + 2] * 3
      let p2 = [position[j], position[j + 1], position[j + 2]]
      let area = this.triangleArea(p0, p1, p2)
      this.totalArea += area
      this.cumulativeAreas.push(this.totalArea)
    }
  }


  next() {
    let r = Math.random() * this.totalArea
    return this.binarySearch(r, 0, this.cumulativeAreas.length - 1)
  }

  next_() {
    let r = Math.random() * this.totalArea
    let faceIndex = this.binarySearch(r, 0, this.cumulativeAreas.length - 1)

    let indices = this.geometry.index
    let position = this.geometry.getAttribute('position').array

    let i = faceIndex * 3
    let j = indices.array[i] * 3
    let p0 = [position[j], position[j + 1], position[j + 2]]
    j = indices.array[i + 1] * 3
    let p1 = [position[j], position[j + 1], position[j + 2]]
    j = indices.array[i + 2] * 3
    let p2 = [position[j], position[j + 1], position[j + 2]]

    return this.randomPointInTriangle(p0, p1, p2)
  }


  randomPointInTriangle(p0, p1, p2) {
    let a = Math.random()
    let b = Math.random()
    if ((a + b) > 1) {
      a = 1 - a
      b = 1 - b
    }
    let c = 1 - a - b

    return [
      p0[0] * a + p1[0] * b + p2[0] * c,
      p0[1] * a + p1[1] * b + p2[1] * c,
      p0[2] * a + p1[2] * b + p2[2] * c
    ]
  }


  binarySearch(value, start, end) {
    if (end < start) {
      return start
    }
    let mid = start + Math.floor((end - start) / 2)
    if (this.cumulativeAreas[mid] > value) {
      return this.binarySearch(value, start, mid - 1)
    } else if (this.cumulativeAreas[ mid ] < value) {
      return this.binarySearch(value, mid + 1, end)
    } else {
      return mid
    }
  }


  triangleArea(a, b, c) {
    vec3.sub(this._v1, b, a)
    vec3.sub(this._v2, c, a)
    vec3.cross(this._v1, this._v1, this._v2)
    return 0.5 * vec3.len(this._v1)
  }

}



class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()
    this.start()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(0, 0, 1700)

    let scale = Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * this.camera.position.z * 2
    console.log(scale)
    console.log(720.0 / 230.94 * 200.0)
    console.log(Math.tan(THREE.Math.degToRad(this.camera.fov / 2)))
    console.log(Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2))

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x071520)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    document.body.appendChild(this.renderer.domElement)

    console.log(this.renderer.context.getParameter(this.renderer.context.ALIASED_POINT_SIZE_RANGE))

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()
  }


  initObjects() {
    let loader = new createjs.LoadQueue()
    // loader.loadFile({id: 'keyframes', src: 'keyframes.json'})
    let items = [
      // 'shutterstock_38800999',
      // 'shutterstock_56254417',
      // 'shutterstock_61763248',
      // 'shutterstock_62329042',
      'shutterstock_62329057',
      // 'shutterstock_102487424',
      // 'shutterstock_102519095',
      // 'shutterstock_154705646',
    ]
    items.forEach((name, i) => {
      loader.loadFile({id: `data${i}`, src: `media/${name}.json`})
      loader.loadFile({id: `image${i}`, src: `media/${name}.png`})
    })
    loader.on('complete', () => {
      let featurePoints = loader.getResult(`data0`)
      let image = loader.getResult(`image0`)
      let geometry = new DeformableFaceGeometry(featurePoints, image, 400, this.camera.position.z)
      let material = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(image), side: THREE.DoubleSide, wireframe: true})
      this.face = new THREE.Mesh(geometry, material)
      this.face.scale.set(150, 150, 150)
      this.face.updateMatrixWorld()
      // this.scene.add(this.face)

      this.initParticles()
    })
  }


  /*getRandomFaceVertex() {
    let indices = this.face.geometry.index
    let position = this.face.geometry.positionAttribute.array

    let i = ~~(Math.random() * indices.count / 3) * 3
    let j = indices.array[i] * 3
    let p0 = [position[j], position[j + 1], position[j + 2]]
    j = indices.array[i + 1] * 3
    let p1 = [position[j], position[j + 1], position[j + 2]]
    j = indices.array[i + 2] * 3
    let p2 = [position[j], position[j + 1], position[j + 2]]

    let a = Math.random()
    let b = Math.random()
    if ((a + b) > 1) {
      a = 1 - a
      b = 1 - b
    }
    let c = 1 - a - b

    return [
      p0[0] * a + p1[0] * b + p2[0] * c,
      p0[1] * a + p1[1] * b + p2[1] * c,
      p0[2] * a + p1[2] * b + p2[2] * c
    ]
  }*/


  initParticles() {
    let start = performance.now()

    let randomPoints = new RandomPointInGeometry(this.face.geometry)
    console.log(performance.now() - start)

    let faceIndices = this.face.geometry.index.array
    let facePosition = this.face.geometry.positionAttribute.array
    console.log(this.face.geometry.positionAttribute.count)
    console.log(this.face.geometry.positionAttribute.array.slice(0, 3))

    let data = new Float32Array(32 * 32 * 3)
    data.set(this.face.geometry.positionAttribute.array)
    let uv = this.face.geometry.uvAttribute
    for (let i = 0; i < uv.count; i++) {
      let j = data.length * 0.5 + i * 3
      data[j] = uv.array[i * 2]
      data[j + 1] = uv.array[i * 2 + 1]
    }
    let dataTexture = new THREE.DataTexture(data, 32, 32, THREE.RGBFormat, THREE.FloatType)
    dataTexture.needsUpdate = true

    let amount = 10000
    let position = new Float32Array(amount * 3)
    let triangleIndices = new Float32Array(amount * 3)
    let weight = new Float32Array(amount * 3)
    let radius = 3000
    for (let i = 0; i < position.length; i += 3) {
      let z = Math.random() * 2 - 1
      let th = Math.random() * Math.PI * 2
      let r = Math.sqrt(1 - z * z)
      let x = r * Math.cos(th)
      let y = r * Math.sin(th)
      position[i] = x * radius
      position[i + 1] = y * radius
      position[i + 2] = z * radius

      let faceIndex = randomPoints.next()
      let j0 = faceIndices[faceIndex * 3]
      let j1 = faceIndices[faceIndex * 3 + 1]
      let j2 = faceIndices[faceIndex * 3 + 2]
      triangleIndices[i] = j0
      triangleIndices[i + 1] = j1
      triangleIndices[i + 2] = j2

      let a = Math.random()
      let b = Math.random()
      if ((a + b) > 1) {
        a = 1 - a
        b = 1 - b
      }
      let c = 1 - a - b
      weight[i] = a
      weight[i + 1] = b
      weight[i + 2] = c
    }

    console.log(performance.now() - start)

    let geometry = new THREE.BufferGeometry()
    geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.addAttribute('triangleIndices', new THREE.BufferAttribute(triangleIndices, 3))
    geometry.addAttribute('weight', new THREE.BufferAttribute(weight, 3))

    let material = new THREE.ShaderMaterial({
      vertexShader: `
        uniform float size;
        uniform float scale;
        uniform float time;
        uniform mat4 faceMatrix;
        uniform sampler2D facePosition;
        uniform sampler2D faceTexture;

        attribute vec3 triangleIndices;
        attribute vec3 weight;

        varying vec3 vColor;

        vec3 getp(float index) {
          return texture2D(facePosition, vec2(mod(index, 32.0) / 32.0, floor(index / 32.0) / 32.0)).xyz;
        }

        vec3 getDest() {
          return getp(triangleIndices.x) * weight.x + getp(triangleIndices.y) * weight.y + getp(triangleIndices.z) * weight.z;
        }

        vec2 getu(float index) {
          return texture2D(facePosition, vec2(mod(index, 32.0) / 32.0, floor(index / 32.0) / 32.0 + 0.5)).xy;
        }

        vec2 getUV() {
          return getu(triangleIndices.x) * weight.x + getu(triangleIndices.y) * weight.y + getu(triangleIndices.z) * weight.z;
        }

        void main() {
          vec4 dest = faceMatrix * vec4(getDest(), 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(mix(position, dest.xyz, time), 1.0);
          gl_PointSize = size * (scale / abs(mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
          vColor = texture2D(faceTexture, getUV()).xyz;
        }
      `,
      fragmentShader: `
        #define LOG2 1.442695
        #define saturate(a) clamp( a, 0.0, 1.0 )
        #define whiteCompliment(a) ( 1.0 - saturate( a ) )

        varying vec3 vColor;

        void main() {
          float depth = gl_FragCoord.z / gl_FragCoord.w;
          /*float fogNear = 1000.0;
          float fogFar = 5000.0;
          float fogFactor = smoothstep(fogNear, fogFar, depth);*/
          float fogDensity = 0.00035;
          float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * depth * depth * LOG2 ) );
          gl_FragColor = vec4(mix(vColor, vec3(0.027, 0.082, 0.125), fogFactor), 1);
        }
      `,
      uniforms: {
        time: {type: 'f', value: 0.01},
        size: {type: 'f', value: 100},
        scale: {type: 'f', value: Config.RENDER_HEIGHT / (Math.tan(THREE.Math.degToRad(this.camera.fov / 2)) * 2)},
        faceMatrix: {type: 'm4', value: this.face.matrixWorld},
        facePosition: {type: 't', value: dataTexture},
        faceTexture: {type: 't', value: this.face.material.map}
      }
    })
    let points = new THREE.Points(geometry, material)
    this.scene.add(points)

    /*{
      let geometry = new THREE.PlaneGeometry(30, 30, 2, 2)
      let material = new THREE.MeshBasicMaterial({wireframe: true, color: 0x00ff00})
      let mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(30, 0, 150)
      // mesh.position.set(-40, 0, -50)
      this.scene.add(mesh)
    }*/

    this.gui = new dat.GUI()
    this.guiTime = this.gui.add(material.uniforms.time, 'value', 0, 1).setValue(0).name('Time')
    this.guiSize = this.gui.add(material.uniforms.size, 'value', 1, 100).name('Size')
    this.gui.add(this, 'bang')
    console.log(this.gui)
  }


  bang() {
    let p = {t: 0, s: 100}
    new TWEEN.Tween(p).to({t: 1, s: 3}, 5000).easing(TWEEN.Easing.Cubic.Out).onUpdate(() => {
      this.guiTime.setValue(p.t)
      this.guiSize.setValue(p.s)
    }).start()
  }


  start() {
    this.startTime = performance.now()
    this.previousFrame = -1
    this.animate()
  }


  animate(t) {
    requestAnimationFrame(this.animate)

    TWEEN.update(t)

    let currentFrame = Math.floor((performance.now() - this.startTime) / 1000 * 24)
    if (currentFrame != this.previousFrame) {
      this.previousFrame = currentFrame
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
