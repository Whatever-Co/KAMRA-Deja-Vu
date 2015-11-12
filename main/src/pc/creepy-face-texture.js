/* global THREE */

import DeformedUVTexture from './deformed-uv-texture'


class FacePartsDuplicateMaterial extends THREE.ShaderMaterial {

  constructor(faceTexture, warpTexture, uvTexture) {
    super({
      uniforms: {
        faceTexture: {type: 't', value: faceTexture},
        warpTexture: {type: 't', value: warpTexture},
        uvTexture: {type: 't', value: uvTexture},
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
        uniform sampler2D faceTexture;
        uniform sampler2D warpTexture;
        uniform sampler2D uvTexture;

        varying vec2 vUv;
        varying vec2 vUv2;

        void main() {
          vec4 color = texture2D(faceTexture, vUv);
          vec4 uv2 = texture2D(warpTexture, vUv2);
          vec4 uv3 = texture2D(uvTexture, uv2.xy);
          vec4 parts = texture2D(faceTexture, uv3.xy);
          gl_FragColor = vec4(mix(color.rgb, parts.rgb, uv2.a), 1.0);
          // gl_FragColor = vec4(uv2.xy, 0., 1.);
          // gl_FragColor = color;
        }
      `,
      transparent: true,
    })
  }

}



export default class CreepyTexture extends THREE.WebGLRenderTarget {

  constructor(renderer, camera, webcam, face, warpTexture) {
    super(1024, 1024, {depthBuffer: false, stencilBuffer: false})

    this.renderer = renderer
    this.baseCamera = camera
    this.camera = camera.clone()
    this.baseWebcam = webcam
    this.baseFace = face

    this.scene = new THREE.Scene()

    this.webcam = new THREE.Mesh(this.baseWebcam.geometry, this.baseWebcam.material)
    this.scene.add(this.webcam)

    let uvTexture = new DeformedUVTexture(this.renderer, this.baseFace.geometry)
    this.baseFace.geometry.addAttribute('uv2', uvTexture.uvAttribute)
    let material = new FacePartsDuplicateMaterial(this.baseWebcam.texture, warpTexture, uvTexture)
    this.face = new THREE.Mesh(this.baseFace.geometry, material)
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)

    let loader = new THREE.TextureLoader()
    loader.load('textures/creepy-remap1.png', (texture) => {
      material.uniforms.warpTexture.value = texture
    })
  }


  update() {
    this.render(this)
  }


  render(target) {
    this.camera.fov = this.baseCamera.fov
    this.camera.updateProjectionMatrix()
    this.camera.position.copy(this.baseCamera.position)
    this.camera.rotation.set(0, 0, 0)

    this.webcam.scale.copy(this.baseWebcam.scale)

    this.face.matrix.copy(this.baseFace.matrix)
    this.face.material.uniforms.uvTexture.value.update()

    this.renderer.render(this.scene, this.camera, target, true)
  }


  clone() {
    let target = new THREE.WebGLRenderTarget(1024, 1024, {depthBuffer: false, stencilBuffer: false})
    this.render(target)
    return target
  }

}
