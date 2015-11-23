/* global THREE */

import StandardFaceData from './standard-face-data'


export default class DeformedUVTexture extends THREE.WebGLRenderTarget {

  constructor(renderer, faceGeometry) {
    super(512, 512, {type: THREE.FloatType, depthBuffer: false, stencilBuffer: false})

    this.faceGeometry = faceGeometry

    let standardFace = new StandardFaceData()
    let uvs = []
    for (let i = 0; i < standardFace.uv.count; i++) {
      let j = i * 2
      uvs.push(standardFace.uv.array[j], standardFace.uv.array[j + 1], 0)
    }

    let geometry = new THREE.BufferGeometry()
    geometry.setIndex(standardFace.mouthIncludedIndex)
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
