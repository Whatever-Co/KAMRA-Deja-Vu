/* global THREE */

import {vec2,vec3} from 'gl-matrix'
import TWEEN from 'tween.js'
import dat from 'dat-gui'

import Config from './config'


class FaceColor {
  constructor(){
    this.colors = require('./data/particle_sprite_colors.json')
  }

  findNearestColor(inColor) {
    let currDist = Number.MAX_VALUE
    let currIndex = -1
    this.colors.forEach((c, i) => {
      let d = vec3.squaredDistance(inColor, c)
      if(d < currDist) {
        currDist = d
        currIndex = i
      }
    })
    //this.log(inColor, this.colors[currIndex])
    return currIndex
  }

  chooseNearColor(inColor, range) {
    let currDist = Number.MAX_VALUE
    let currIndex = -1
    let idx = []
    this.colors.forEach((c, i) => {
      let d = vec3.squaredDistance(inColor, c)
      if(d < range) {
        idx.push(i)
      }
      if(d < currDist) {
        currDist = d
        currIndex = i
      }
    })

    if(idx.length == 0) {
      // if not found in range.
      // return nearest
      console.log('return nearest')
      return currIndex
    }
    //
    let i = Math.floor(Math.random() * idx.length)
    return idx[i]
  }

  log(inColor, outColor) {
    console.log(`%cIN${ inColor } %cOUT${outColor}`, `background:${this.cssColor(inColor)}`, `background:${this.cssColor(outColor)}`)
  }

  cssColor (c) {
    return `rgb(${c[0]},${c[1]},${c[2]})`
  }
}


class RandomFaceSelector {

  constructor(geometry) {
    this._v1 = vec3.create()
    this._v2 = vec3.create()

    let indices = geometry.index
    let position = geometry.getAttribute('position').array
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


  triangleArea(a, b, c) {
    vec3.sub(this._v1, b, a)
    vec3.sub(this._v2, c, a)
    vec3.cross(this._v1, this._v1, this._v2)
    return 0.5 * vec3.len(this._v1)
  }


  get() {
    let r = Math.random() * this.totalArea
    return this.binarySearch(r, 0, this.cumulativeAreas.length - 1)
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

}


export default class FaceParticle extends THREE.Points {

  constructor(scale, face, sprite_tex, sprite_lut) {
    super(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      vertexShader: require('./shaders/face-particle.vert'),
      fragmentShader: require('./shaders/face-particle.frag'),
      uniforms: {
        time: {type: 'f', value: 0},
        size: {type: 'f', value: 100},
        scale: {type: 'f', value: scale},
        faceMatrix: {type: 'm4', value: face.matrixWorld},
        facePosition: {type: 't', value: null},
        faceTexture: {type: 't', value: null},
        spriteTexture: {type: 't', value: sprite_tex},
        spritePosition: {type: 't', value: sprite_lut}
      },
      transparent: true,
      blending: THREE.CustomBlending,
      depthTest: true,
      depthWrite: true
    }))

    this.face = face

    this.dataTexture = new THREE.DataTexture(new Float32Array(32 * 32 * 3), 32, 32, THREE.RGBFormat, THREE.FloatType)
    this.material.uniforms.facePosition.value = this.dataTexture

    let amount = 10000
    let position = new Float32Array(amount * 3)
    let triangleIndices = new Float32Array(amount * 3)
    let weight = new Float32Array(amount * 3)
    let radius = 3000
    let randomFaceSelector = new RandomFaceSelector(this.face.geometry)
    let faceIndices = this.face.geometry.index.array
    for (let i = 0; i < position.length; i += 3) {
      let z = Math.random() * 2 - 1
      let th = Math.random() * Math.PI * 2
      let r = Math.sqrt(1 - z * z)
      let x = r * Math.cos(th)
      let y = r * Math.sin(th)
      position[i] = x * radius
      position[i + 1] = y * radius
      position[i + 2] = z * radius
      
      let faceIndex = randomFaceSelector.get()
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

    this.weight = new THREE.BufferAttribute(weight, 3)
    this.triangleIndices = new THREE.BufferAttribute(triangleIndices, 3)

    this.geometry.addAttribute('position', new THREE.BufferAttribute(position, 3))
    this.geometry.addAttribute('triangleIndices', this.triangleIndices)
    this.geometry.addAttribute('weight', this.weight)

    this._gui = new dat.GUI()
    this._guiTime = this._gui.add(this.material.uniforms.time, 'value', 0, 1).setValue(0).name('Time')
    this._guiSize = this._gui.add(this.material.uniforms.size, 'value', 1, 100).name('Size')
    this._gui.add(this, 'start').name('Start')
    this._gui.add(this, 'updateUV').name('Update UV')
  }


  start() {
    let p = {t: 0, s: 100}
    new TWEEN.Tween(p).to({t: 1, s: 5}, 5000).easing(TWEEN.Easing.Cubic.Out).onUpdate(() => {
      this._guiTime.setValue(p.t)
      this._guiSize.setValue(p.s)
    }).start()
  }

  update() {
    if (!this.material.uniforms.faceTexture.value) {
      this.material.uniforms.faceTexture.value = this.face.material.map
    }

    let tex = this.material.uniforms.faceTexture.value
    let pixels = tex.image.getContext('2d').getImageData(0, 0, 1024, 1024).data
    let minColor, maxColor
    let minLen = Number.MAX_VALUE
    let maxLen = Number.MIN_VALUE

    let data = this.dataTexture.image.data
    data.set(this.face.geometry.positionAttribute.array)
    let uv = this.face.geometry.uvAttribute
    for (let i = 0; i < uv.count; i++) {
      let j = data.length * 0.5 + i * 3
      data[j] = uv.array[i * 2]
      data[j + 1] = uv.array[i * 2 + 1]

      let c = this.texture2D(pixels, [uv.array[i * 2], uv.array[i * 2 + 1]])
      let d = vec3.squaredLength(c)
      if (d < minLen) {
        minLen = d
        minColor = c
      }
      if (d > maxLen) {
        maxLen = d
        maxColor = c
      }
    }

    console.log(
      `%cMIN${minColor} %cMAX${maxColor}`,
      `background:rgb(${minColor[0]},${minColor[1]},${minColor[2]})`,
      `background:rgb(${maxColor[0]},${maxColor[1]},${maxColor[2]})`
    )

    this.dataTexture.needsUpdate = true
  }

  texture2D(pixels, uv) {
    let x = Math.floor(uv[0] * 1024)
    let y = 1024 - Math.floor(uv[1] * 1024)
    let i = x + y * 1024
    return [pixels[i*4], pixels[i*4+1], pixels[i*4+2]]
  }

  getUV(data, triangleIndices, weight, index) {
    let getu = (index) => {
      let x = index % 32.0
      let y = Math.floor(index / 32.0) + 16
      let i = x + y * 32
      return [data[i * 3], data[i * 3 + 1]]
    }
    let x = vec2.scale([], getu(triangleIndices[index*3]), weight[index*3])
    let y = vec2.scale([], getu(triangleIndices[index*3+1]), weight[index*3+1])
    let z = vec2.scale([], getu(triangleIndices[index*3+2]), weight[index*3+2])
    return [x[0]+y[0]+z[0], x[1]+y[1]+z[1]]
  }

  updateUV() {
    let tex = this.material.uniforms.faceTexture.value
    let pixels = tex.image.getContext('2d').getImageData(0, 0, 1024, 1024).data

    let amount = 10000
    let faceUv = new Float32Array(amount * 2)
    let facecolor = new FaceColor()

    let data = this.dataTexture.image.data
    let t = this.triangleIndices.array
    let w = this.weight.array
    let r16 = 1.0 / 16.0
    for (let i = 0; i < amount; ++i) {
      let uv = this.getUV(data, t, w, i)
      let orig_c = this.texture2D(pixels, uv)
      if(orig_c[0] == undefined) {
        console.warn('none')
        orig_c = [0,0,0]
      }

      //let resultIndex = facecolor.findNearestColor(orig_c)
      let resultIndex = facecolor.chooseNearColor(orig_c, 500)

      faceUv[i*2]   = (resultIndex  % 16) * r16
      faceUv[i*2+1] = (15 - Math.floor(resultIndex  * r16)) * r16
    }

    this.geometry.addAttribute('faceUv', new THREE.BufferAttribute(faceUv, 2))

    //this.textColors()
  }

  textColors() {
    let facecolor = new FaceColor()
    for(let i=0; i<100; ++i) {
      let c = [
        Math.floor(Math.random()*255),
        Math.floor(Math.random()*255),
        Math.floor(Math.random()*255)
      ]
      let result = facecolor.findNearestColor(c)
    }
  }

}
