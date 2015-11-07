/* global THREE */

import $ from 'jquery'
import 'OrbitControls'
import dat from 'dat-gui'
import TWEEN from 'tween.js'

import DeformableFaceGeometry from './deformable-face-geometry'

import './main.sass'
document.body.innerHTML = require('./main.jade')()


class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.initScene()
    this.initObjects()

    this.animate()
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000)
    this.camera.position.set(0, 0, 500).setLength(500)
    this.camera.lookAt(new THREE.Vector3())

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x333333, 1)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
  }


  initObjects() {
    let basename = 'media/shutterstock_62329057'
    $.getJSON(`${basename}.json`).done((result) => {
      let frontGeometry = new DeformableFaceGeometry(result, 512, 512, 500, 1000)
      let frontMaterial = new THREE.ShaderMaterial({
        uniforms: {
          map: {type: 't', value: null},
          clipRange: {type: 'v2', value: new THREE.Vector2()}
        },
        vertexShader: require('./face.vert'),
        fragmentShader: require('./face.frag'),
        side: THREE.DoubleSide
        // wireframe: true
      })
      frontGeometry.computeBoundingBox()
      console.table(frontGeometry.boundingBox)

      let backGeometry = new THREE.BufferGeometry()
      backGeometry.setIndex(new THREE.Uint16Attribute(frontGeometry.standardFace.data.back.index, 1))
      backGeometry.addAttribute('position', frontGeometry.positionAttribute)

      let backMaterial = new THREE.ShaderMaterial({
        uniforms: {
          clipRange: {type: 'v2', value: new THREE.Vector2()}
        },
        vertexShader: require('./cross-section.vert'),
        fragmentShader: require('./cross-section.frag'),
        side: THREE.BackSide
      })

      const scale = 150
      const minY = frontGeometry.boundingBox.min.y * scale
      const maxY = frontGeometry.boundingBox.max.y * scale
      const height = maxY - minY
      const numSlices = 5
      const sliceHeight = height / numSlices

      let slices = []
      for (let i = 0; i < numSlices; i++) {
        let face = new THREE.Object3D()
        face.scale.set(scale, scale, scale)
        // face.rotation.y = THREE.Math.degToRad((i - 2) * 20)
        // face.position.x = (i - 2) * 50
        this.scene.add(face)

        let front = new THREE.Mesh(frontGeometry, frontMaterial.clone())
        front.position.z = 0.5
        let clipMin = minY + i * sliceHeight
        let clipMax = minY + (i + 1) * sliceHeight
        front.material.uniforms.clipRange.value.set(clipMin, clipMax)
        face.add(front)

        let back = new THREE.Mesh(backGeometry, backMaterial.clone())
        back.position.z = 0.5
        back.material.uniforms.clipRange.value.set(clipMin, clipMax)
        face.add(back)

        slices.push(face)
      }

      new THREE.TextureLoader().load(`${basename}.png`, (map) => {
        slices.forEach((face) => {
          face.children[0].material.uniforms.map.value = map
        })
      })

      let params = {
        rotate: () => {
          slices.forEach((slice, i) => {
            slice.rotation.y = 0
            new TWEEN.Tween(slice.rotation).to({y: -Math.PI * 2}, 3000).delay(i * 300).easing(TWEEN.Easing.Cubic.InOut).start()
          })
        },
        slide: () => {
          new TWEEN.Tween(slices[1].position).to({x: -200}, 1000).easing(TWEEN.Easing.Cubic.InOut).start()
          new TWEEN.Tween(slices[4].position).to({x: 200}, 1000).easing(TWEEN.Easing.Cubic.InOut).start()
        },
        reset: () => {
          slices.forEach((slice, i) => {
            slice.position.set(0, 0, 0)
            slice.rotation.set(0, 0, 0)
          })
        }
      }
      let gui = new dat.GUI()
      gui.add(params, 'rotate').name('Rotate')
      gui.add(params, 'slide').name('Slide')
      gui.add(params, 'reset').name('Reset')


      /*
      this.face = new THREE.Mesh(geometry, material)
      this.face.scale.set(150, 150, 150)
      this.scene.add(this.face)
      new THREE.TextureLoader().load(`${basename}.png`, (map) => {
        material.uniforms.map.value = map
      })

      {
        let geometry = new THREE.BufferGeometry()
        geometry.setIndex(new THREE.Uint16Attribute(this.face.geometry.standardFace.data.back.index, 1))
        geometry.addAttribute('position', this.face.geometry.positionAttribute)
        let material = new THREE.ShaderMaterial({
          uniforms: {
            clipRange: {type: 'v2', value: new THREE.Vector2(-25, 25)}
          },
          vertexShader: require('./cross-section.vert'),
          fragmentShader: require('./cross-section.frag'),
          side: THREE.BackSide,
          transparent: true
        })
        this.back = new THREE.Mesh(geometry, material)
        this.back.scale.set(150, 150, 150)
        this.scene.add(this.back)
      }

      let params = {wireframe: false, clipCenter: 0, clipHeight: 50}
      let gui = new dat.GUI()
      gui.add(params, 'wireframe').onChange((value) => {
        this.face.material.wireframe = value
        this.back.material.wireframe = value
      })
      let updateClip = () => {
        let h = params.clipHeight / 2
        let min = params.clipCenter - h
        let max = params.clipCenter + h
        this.face.material.uniforms.clipRange.value.set(min, max)
        this.back.material.uniforms.clipRange.value.set(min, max)
      }
      gui.add(params, 'clipCenter', -150, 150).name('Clip center').onChange(updateClip)
      gui.add(params, 'clipHeight', 1, 200).name('Clip height').onChange(updateClip)
      updateClip()
      */
    })
  }


  animate(t) {
    requestAnimationFrame(this.animate)

    TWEEN.update(t)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

}


new App()
