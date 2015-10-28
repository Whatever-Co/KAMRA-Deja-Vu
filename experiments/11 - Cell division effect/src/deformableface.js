/* global THREE createjs */
import {vec2, vec3} from 'gl-matrix'


export default class extends THREE.Object3D {

  constructor() {
    super()
    // this.loadAssets(basename)
  }


  load(basename) {
    return new Promise((resolve) => {
      let loader = new createjs.LoadQueue()
      loader.loadFile({id: 'json', src: `${basename}.json`})
      loader.loadFile({id: 'image', src: `${basename}.png`})
      loader.on('complete', () => {
        this.buildMesh(loader.getResult('image'), loader.getResult('json'))
        resolve()
      })
    })
  }


  buildMesh(image, featurePoints) {
    this.data = require('./face.json')

    let index = new Uint16Array(this.data.face.index.length + this.data.rightEye.index.length + this.data.leftEye.index.length)
    this.data.face.index.forEach((i, j) => index[j] = i)
    let offset = this.data.face.index.length
    this.data.rightEye.index.forEach((i, j) => index[j + offset] = i)
    offset += this.data.rightEye.index.length
    this.data.leftEye.index.forEach((i, j) => index[j + offset] = i)

    let geometry = new THREE.BufferGeometry()
    geometry.dynamic = true
    geometry.setIndex(new THREE.BufferAttribute(index, 1))
    geometry.addAttribute('position', this.getInitialDeformedVertices(featurePoints))
    geometry.addAttribute('uv', this.getDeformedUV(featurePoints))

    let map = new THREE.Texture(image)
    map.needsUpdate = true
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: map},
        offset: {type: 'f', value: 0},
        amount: {type: 'f', value: 0.5}
      },
      vertexShader: require('raw!./face.vert'),
      fragmentShader: require('raw!./face.frag'),
      side: THREE.DoubleSide
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.add(this.mesh)
  }


  getInitialDeformedVertices(featurePoints) {
    let displacement = featurePoints.map((c, i) => {
      let fp = this.getPosition(this.data.face.featurePoint[i])
      let scale = (500 - fp[2] * 200) / 500
      let p = vec3.clone(fp)
      p[0] = (c[0] - 0.5) * scale
      p[1] = (c[1] - 0.5) * scale
      return vec3.sub(p, p, fp)
    })

    let n = this.data.face.position.length / 3
    let position = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      let p = vec3.create()
      let b = 0
      this.data.face.weight[i].forEach((w) => {
        vec3.add(p, p, vec3.scale(vec3.create(), displacement[w[0]], w[1]))
        b += w[1]
      })
      vec3.scale(p, p, 1 / b)
      vec3.add(p, p, this.getPosition(i))
      position[i * 3 + 0] = p[0]
      position[i * 3 + 1] = p[1]
      position[i * 3 + 2] = p[2]
    }
    return new THREE.BufferAttribute(position, 3)
  }


  getDeformedUV(featurePoint) {
    let displacement = featurePoint.map((c, i) => {
      let fp = this.getPosition(this.data.face.featurePoint[i])
      return vec2.sub([], c, fp)
    })

    let n = this.data.face.position.length / 3
    let uv = new Float32Array(n * 2)
    for (let i = 0; i < n; i++) {
      let p = vec2.create()
      let b = 0
      this.data.face.weight[i].forEach((w) => {
        vec2.add(p, p, vec2.scale([], displacement[w[0]], w[1]))
        b += w[1]
      })
      vec2.scale(p, p, 1 / b)
      vec2.add(p, p, this.getPosition(i))
      uv[i * 2 + 0] = p[0]
      uv[i * 2 + 1] = p[1]
    }
    return new THREE.BufferAttribute(uv, 2)
  }


  getPosition(index, array = this.data.face.position) {
    let i = index * 3
    return [array[i], array[i + 1], array[i + 2]]
  }

}
