/* global THREE createjs */
import {vec2, vec3} from 'gl-matrix'


export default class extends THREE.Object3D {

  constructor() {
    super()
  }


  load(basename) {
    return new Promise((resolve) => {
      let loader = new createjs.LoadQueue()
      loader.loadFile({id: 'json', src: `${basename}.json`})
      loader.loadFile({id: 'image', src: `${basename}.png`})
      loader.loadFile({id: 'anime', src: 'keyframes.json'})
      loader.on('complete', () => {
        this.frames = loader.getResult('anime')
        console.log(this.frames.length, this.frames[500])
        this.buildMesh(loader.getResult('image'), loader.getResult('json'))
        resolve()
      })
    })
  }


  buildMesh(image, featurePoints) {
    this.morph = require('./morph.json')
    console.log(this.morph)

    this.data = require('./face.json')
    console.log(this.data)

    let index = this.data.face.index.concat(this.data.rightEye.index, this.data.leftEye.index)

    let geometry = new THREE.BufferGeometry()
    geometry.dynamic = true
    geometry.setIndex(new THREE.Uint16Attribute(index, 1))
    this.positionAttribute = new THREE.Float32Attribute(this.frames[0].faces[0].morph.face.vertices, 3)
    // geometry.addAttribute('position', this.getInitialDeformedVertices(featurePoints))
    // geometry.addAttribute('position', new THREE.Float32Attribute(this.morph[0].face.vertices, 3))
    // geometry.addAttribute('position', new THREE.Float32Attribute(this.data.face.position, 3))
    geometry.addAttribute('position', this.positionAttribute)
    geometry.addAttribute('uv', this.getDeformedUV(featurePoints))

    this.morph.forEach((target, i) => {
      geometry.addAttribute(`morphTarget${i}`, new THREE.Float32Attribute(target.face.vertices, 3))
    })

    let morphTargetInfluences = []
    for (let i = 0; i < this.morph.length; i++) {
      morphTargetInfluences.push(0.001)
    }
    // morphTargetInfluences[3] = 1
    // console.log(morphTargetInfluences)

    let map = new THREE.Texture(image)
    map.needsUpdate = true
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: map},
        morphTargetInfluences: {type: 'fv1', value: morphTargetInfluences}
      },
      vertexShader: require('raw!./face.vert'),
      fragmentShader: require('raw!./face.frag'),
      side: THREE.DoubleSide
    })
    // let material = new THREE.MeshBasicMaterial({map, side: THREE.DoubleSide, morphTargets: true})

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.scale.set(0.01, 0.01, 0.01)
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


  update(t) {
    if (this.frames) {
      let currentFrame = Math.floor(t / 1000 * 24) % this.frames.length
      let data = this.frames[currentFrame].faces[0]
      // console.log(data.quat)
      this.mesh.quaternion.set(data.quat[0], data.quat[1], data.quat[2], data.quat[3])
      // console.log(this.mesh.rotation)
      this.rotation.set(Math.PI, 0, 0)
      this.positionAttribute.array.set(data.morph.face.vertices)
      this.positionAttribute.needsUpdate = true
    }
  }

}
