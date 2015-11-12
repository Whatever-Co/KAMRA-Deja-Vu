/* global THREE */

import {vec3} from 'gl-matrix'

import StandardFaceData from './standard-face-data'


export default class DeformedUVTexture extends THREE.WebGLRenderTarget {

  constructor(renderer, faceGeometry) {
    super(512, 512, {type: THREE.FloatType, depthBuffer: false, stencilBuffer: false})

    this.faceGeometry = faceGeometry

    let vertices = []
    let texCoords = []
    let v2vt = []
    require('raw!./data/face.obj').split(/\n/).forEach((line) => {
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

    {
      let uvs = []
      let position = standardFace.data.face.position
      for (let i = 0; i < position.length; i += 3) {
        let uv = getUVForVertex(position.slice(i, i + 3))
        uvs.push(uv[0], uv[1])
      }
      this.uvAttribute = new THREE.Float32Attribute(uvs, 2)
    }

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

    this.scene = new THREE.Scene()
    this.scene.add(mesh)
    this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, -100, 100)
    this.renderer = renderer

    this.oldClearColor = new THREE.Color()
    this.oldClearAlpha = 1.0
    this.update()
  }


  update() {
    this.oldClearColor.copy(this.renderer.getClearColor())
    this.oldClearAlpha = this.renderer.getClearAlpha()

    this.renderer.setClearColor(0x808000, 1)
    
    this.renderer.render(this.scene, this.camera, this, true)
    
    this.renderer.setClearColor(this.oldClearColor, this.oldClearAlpha)
  }

}
