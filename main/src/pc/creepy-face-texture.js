/* global THREE */

import DeformedUVTexture from './deformed-uv-texture'


class FacePartsDuplicateMaterial extends THREE.ShaderMaterial {

  constructor(webcam, warpTexture, uvTexture) {
    let u = webcam.webcamPlane.material.uniforms
    super({
      uniforms: {
        faceTexture: {type: 't', value: webcam.webcamTexture},
        inMax: u.inMax,
        inMin: u.inMin,
        outMax: u.outMax,
        gamma: u.gamma,
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
        uniform float inMax;
        uniform float inMin;
        uniform float outMax;
        uniform float gamma;
        uniform sampler2D warpTexture;
        uniform sampler2D uvTexture;

        varying vec2 vUv;
        varying vec2 vUv2;

        vec4 contrast(vec4 c) {
          vec4 d = clamp((c - inMin) / (inMax - inMin), 0., 1.);
          return pow(d, vec4(gamma)) * outMax;
        }

        void main() {
          vec4 color = contrast(texture2D(faceTexture, vUv));
          vec4 uv2 = texture2D(warpTexture, vUv2);
          vec4 uv3 = texture2D(uvTexture, uv2.xy);
          vec4 parts = contrast(texture2D(faceTexture, uv3.xy));
          gl_FragColor = vec4(mix(color.rgb, parts.rgb, uv2.a), 1.0);
        }
      `,
      transparent: true,
    })
  }

}



export default class CreepyFaceTexture extends THREE.WebGLRenderTarget {

  constructor(renderer, camera, webcam, face) {
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
    let material = new FacePartsDuplicateMaterial(this.baseWebcam, null, uvTexture)
    this.face = new THREE.Mesh(this.baseFace.geometry, material)
    this.face.matrixAutoUpdate = false
    this.scene.add(this.face)
  }


  setRemapType(remapType) {
    this.remapType = remapType
    let loader = new THREE.TextureLoader()
    loader.load(`textures/remap_${remapType}.png`, (texture) => {
      this.face.material.uniforms.warpTexture.value = texture
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
