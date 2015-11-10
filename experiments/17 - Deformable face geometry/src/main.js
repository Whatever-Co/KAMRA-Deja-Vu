/* global THREE createjs */

import $ from 'jquery'
import 'jquery.transit'
import dat from 'dat-gui'
import Stats from 'stats-js'

import 'shaders/CopyShader'
import 'shaders/BokehShader2'
import 'shaders/FXAAShader'
import 'shaders/VignetteShader'
import 'postprocessing/EffectComposer'
import 'postprocessing/ShaderPass'
import 'postprocessing/RenderPass'
import 'postprocessing/MaskPass'
import 'postprocessing/BokehPass'
import 'OrbitControls'

import Config from './config'
import DeformableFaceGeometry from './deformablefacegeometry'
import Worker from 'worker!./worker'

import './main.sass'
document.body.innerHTML = require('./main.jade')()


class App {

  constructor() {
    this.animate = this.animate.bind(this)

    this.stats = new Stats()
    document.body.appendChild(this.stats.domElement)

    this.initScene()
    this.initObjects()
    this.initPostprocessing()

    this.noise = $('.noise1,.noise2')
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(16.8145, Config.RENDER_WIDTH / Config.RENDER_HEIGHT, 10, 10000)
    this.camera.position.set(2000, 0, 1000)
    this.camera.lookAt(new THREE.Vector3())

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x333333)
    this.renderer.setSize(Config.RENDER_WIDTH, Config.RENDER_HEIGHT)
    this.renderer.sortObjects = false
    document.body.appendChild(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)

    window.addEventListener('resize', this.onResize.bind(this))
    this.onResize()

    window.addEventListener('click', (e) => {
      let raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(), this.camera)
      let intersects = raycaster.intersectObjects(this.scene.children, true)
      if (intersects.length > 0) {
        // let targetDistance = intersects[0].distance
        // distance += (targetDistance - distance) * 0.03
        let sdistance = this.smoothstep(this.camera.near, this.camera.far, intersects[0].distance)
        let ldistance = this.linearize(1 -  sdistance)
        console.log(intersects[0].distance, sdistance, ldistance)
        this.postprocessing.bokeh_uniforms.focalDepth.value = ldistance
        // effectController['focalDepth'] = ldistance;
      }
    })

    // let gui = new dat.GUI()
    // gui.add(this.bokeh.uniforms.focus, 'value', 0.0, 3.0, 0.025).name('Focus')
    // gui.add(this.bokeh.uniforms.aperture, 'value', 0.001, 0.2, 0.001).name('Aparuter')
    // gui.add(this.bokeh.uniforms.maxblur, 'value', 0.0, 3.0, 0.025).name('Max blur')
  }


  linearize(depth) {
    let zfar = this.camera.far
    let znear = this.camera.near
    return -zfar * znear / (depth * (zfar - znear) - zfar)
  }


  smoothstep(near, far, depth) {
    let x = this.saturate( (depth - near) / (far - near))
    return x * x * (3- 2*x)
  }


  saturate(x) {
    return Math.max(0, Math.min(1, x))
  }




  initObjects() {
    // {
    //   this.scene.add(new THREE.Mesh(
    //     new THREE.SphereGeometry(200),
    //     new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true, wireframeLinewidth: 5, transparent: true, opacity: 0.2})
    //     ))
    // }


    let loader = new createjs.LoadQueue()
    loader.loadFile({id: 'keyframes', src: 'keyframes.json'})
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
    // loader.on('progress', (e) => {
    //   console.log(e.loaded, e.total)
    // })
    loader.on('complete', () => {
      this.faces = items.map((name, i) => {
        let featurePoints = loader.getResult(`data${i}`)
        let image = loader.getResult(`image${i}`)
        let geometry = new DeformableFaceGeometry(featurePoints, image, 400, this.camera.position.z)
        let material = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(image)})
        return new THREE.Mesh(geometry, material)
      })

      for (let y = -2; y <= 2; y++) {
        for (let x = -4; x <= 4; x++) {
          let face = this.faces[(x + y * 5 + 100) % this.faces.length].clone()
          face.scale.set(150, 150, 150)
          face.position.set(x * 150, y * 200, 0)
          this.scene.add(face)
        }
      }

      let worker = new Worker()
      worker.onmessage = (event) => {
        console.log('finish', performance.now())
        this.keyframes.user.property.morph = event.data
        // this.keyframes = event.data
        console.log(this.keyframes)
        // this.start()
        this.morphDataReady = true
        this.startTime = performance.now()
      }
      let start = performance.now()
      console.log('start', start)
      this.keyframes = loader.getResult('keyframes')
      let vertices = this.keyframes.user.property.face_vertices.map((v) => new Float32Array(v))
      console.log('toarraybuffer', start)
      worker.postMessage(vertices, vertices.map((a) => a.buffer))

      // let start = performance.now()
      // this.morphData = this.convertData()
      // console.log(performance.now() - start, 'ms')
      // console.log(this.morphData)

      this.start()
    })
  }


  initPostprocessing() {
    let gui = new dat.GUI()

    {
      this.depthMaterial = new THREE.MeshDepthMaterial()

      this.postprocessing = {}
      this.postprocessing.scene = new THREE.Scene()

      this.postprocessing.camera = new THREE.OrthographicCamera(Config.RENDER_WIDTH / - 2, Config.RENDER_WIDTH / 2,  Config.RENDER_HEIGHT / 2, Config.RENDER_HEIGHT / - 2, -10000, 10000)
      this.postprocessing.camera.position.z = 100

      this.postprocessing.scene.add(this.postprocessing.camera)

      let pars = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat}
      this.postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(Config.RENDER_WIDTH, Config.RENDER_HEIGHT, pars )
      this.postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(Config.RENDER_WIDTH, Config.RENDER_HEIGHT, pars )

      this.postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(THREE.BokehShader.uniforms)
      this.postprocessing.bokeh_uniforms.tColor.value = this.postprocessing.rtTextureColor
      this.postprocessing.bokeh_uniforms.tDepth.value = this.postprocessing.rtTextureDepth
      this.postprocessing.bokeh_uniforms.textureWidth.value =Config.RENDER_WIDTH
      this.postprocessing.bokeh_uniforms.textureHeight.value = Config.RENDER_HEIGHT
      this.postprocessing.bokeh_uniforms.focusCoords.value.set(0, 0)
      this.postprocessing.bokeh_uniforms.threshold.value = 1.0
      this.postprocessing.bokeh_uniforms.znear.value = this.camera.near
      this.postprocessing.bokeh_uniforms.zfar.value = this.camera.far
      this.postprocessing.materialBokeh = new THREE.ShaderMaterial({
        uniforms: this.postprocessing.bokeh_uniforms,
        vertexShader: THREE.BokehShader.vertexShader,
        fragmentShader: THREE.BokehShader.fragmentShader,
        defines: {
          RINGS: 3,
          SAMPLES: 4
        }
      })

      this.postprocessing.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(Config.RENDER_WIDTH, Config.RENDER_HEIGHT ), this.postprocessing.materialBokeh)
      this.postprocessing.quad.position.z = - 500
      this.postprocessing.scene.add(this.postprocessing.quad)

      let effectController  = {
        shaderFocus: false,

        fstop: 2.2,
        maxblur: 1.0,

        showFocus: false,
        focalDepth: 2.8,
        manualdof: false,
        vignetting: false,
        // depthblur: false,

        // threshold: 1.0,
        // gain: 2.0,
        // bias: 0.5,
        // fringe: 0.7,

        // focalLength: 35,
        noise: true,
        pentagon: false,

        dithering: 0.0001
      }

      let matChanger = () => {
        for (let e in effectController) {
          if (e in effectController) {
            this.postprocessing.bokeh_uniforms[e].value = effectController[e]
          }
        }

        this.postprocessing.enabled = effectController.enabled
        this.postprocessing.bokeh_uniforms['znear'].value = this.camera.near
        this.postprocessing.bokeh_uniforms['zfar'].value = this.camera.far
        // this.camera.setLens(effectController.focalLength)
      }

      // gui.add(effectController, 'enabled').onChange(matChanger)
      // gui.add(effectController, 'jsDepthCalculation').onChange(matChanger)
      gui.add(effectController, 'shaderFocus').onChange(matChanger)
      // gui.add(effectController, 'focalDepth', 0.0, 3000.0).listen().onChange(matChanger)

      gui.add(effectController, 'fstop', 0.1, 22, 0.001).onChange(matChanger)
      gui.add(effectController, 'maxblur', 0.0, 5.0, 0.025).onChange(matChanger)

      gui.add(effectController, 'showFocus').onChange(matChanger)
      gui.add(effectController, 'manualdof').onChange(matChanger)
      gui.add(effectController, 'vignetting').onChange(matChanger)

      // gui.add(effectController, 'depthblur').onChange(matChanger)

      // gui.add(effectController, 'threshold', 0, 1, 0.001).onChange(matChanger)
      // gui.add(effectController, 'gain', 0, 100, 0.001).onChange(matChanger)
      // gui.add(effectController, 'bias', 0,3, 0.001).onChange(matChanger)
      // gui.add(effectController, 'fringe', 0, 5, 0.001).onChange(matChanger)

      // gui.add(effectController, 'focalLength', 16, 80, 0.001).onChange(matChanger)

      gui.add(effectController, 'noise').onChange(matChanger)

      gui.add(effectController, 'dithering', 0, 0.001, 0.0001).onChange(matChanger)

      gui.add(effectController, 'pentagon').onChange(matChanger)

      // gui.add(shaderSettings, 'rings', 1, 8).step(1).onChange(shaderUpdate)
      // gui.add(shaderSettings, 'samples', 1, 13).step(1).onChange(shaderUpdate)

      // matChanger()
    }

    this.composer = new THREE.EffectComposer(this.renderer)
    // this.composer.addPass(new THREE.RenderPass(this.scene, this.camera))
    this.composer.addPass(new THREE.RenderPass(this.postprocessing.scene, this.postprocessing.camera))

    {
      let lutPass = new THREE.ShaderPass({
        uniforms: {
          tDiffuse: {type: 't', value: null},
          tLut: {type: 't', value: null}
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform sampler2D tLut;

          varying vec2 vUv;

          vec4 lookup(in vec4 textureColor, in sampler2D lookupTable) {
              #ifndef LUT_NO_CLAMP
                  textureColor = clamp(textureColor, 0.0, 1.0);
              #endif

              mediump float blueColor = textureColor.b * 63.0;

              mediump vec2 quad1;
              quad1.y = floor(floor(blueColor) / 8.0);
              quad1.x = floor(blueColor) - (quad1.y * 8.0);

              mediump vec2 quad2;
              quad2.y = floor(ceil(blueColor) / 8.0);
              quad2.x = ceil(blueColor) - (quad2.y * 8.0);

              highp vec2 texPos1;
              texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
              texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

              #ifdef LUT_FLIP_Y
                  texPos1.y = 1.0-texPos1.y;
              #endif

              highp vec2 texPos2;
              texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.r);
              texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * textureColor.g);

              #ifdef LUT_FLIP_Y
                  texPos2.y = 1.0-texPos2.y;
              #endif

              lowp vec4 newColor1 = texture2D(lookupTable, texPos1);
              lowp vec4 newColor2 = texture2D(lookupTable, texPos2);

              lowp vec4 newColor = mix(newColor1, newColor2, fract(blueColor));
              return newColor;
          }

          void main() {
            gl_FragColor = lookup(texture2D(tDiffuse, vUv), tLut);
          }
        `
      })
      let loader = new THREE.TextureLoader()
      loader.load('lookup_selective_color.png', (texture) => {
        texture.magFilter = texture.minFilter = THREE.NearestFilter
        texture.generateMipmaps = false
        texture.flipY = false
        lutPass.uniforms.tLut.value = texture
      })
      this.composer.addPass(lutPass)
    }
    {
      let effect = new THREE.ShaderPass(THREE.VignetteShader)
      effect.uniforms.darkness.value = 1.4
      this.composer.addPass(effect)
      // gui.add(effect.uniforms.darkness, 'value', 0.0, 2.0, 0.01).name('Darkness')
    }
    {
      let effect = new THREE.ShaderPass(THREE.FXAAShader)
      effect.uniforms.resolution.value.set(1 / Config.RENDER_WIDTH, 1 / Config.RENDER_HEIGHT)
      this.composer.addPass(effect)
    }
    this.composer.passes[this.composer.passes.length - 1].renderToScreen = true
  }


  /*
  convertData() {
    let standardFace = new StandardFaceData()

    let standardFacePoints = []
    let position = standardFace.data.face.position
    for (let i = 0; i < position.length; i += 3) {
      standardFacePoints.push([position[i], position[i + 1]])
    }
    standardFacePoints.push([1, 1])
    standardFacePoints.push([1, -1])
    standardFacePoints.push([-1, -1])
    standardFacePoints.push([-1, 1])

    let triangleIndices = Delaunay.triangulate(standardFacePoints)

    const getTriangleIndex = (p, vertices) => {
      for (let i = 0; i < triangleIndices.length; i += 3) {
        let uv = Delaunay.contains([vertices[triangleIndices[i]], vertices[triangleIndices[i + 1]], vertices[triangleIndices[i + 2]]], p)
        if (uv) {
          uv.unshift(1 - uv[0] - uv[1])
          return [i, uv]
        }
      }
    }

    return this.keyframes.user.property.face_vertices.map((vertices) => {
      let weights = []
      for (let i = 0; i < vertices.length; i += 3) {
        let [index, coord] = getTriangleIndex([vertices[i], vertices[i + 1]], standardFacePoints)
        weights.push(triangleIndices[index + 0], triangleIndices[index + 1], triangleIndices[index + 2], coord[0], coord[1], coord[2], vertices[i + 2])
      }
      return weights
    })
  }
  */


  start() {
    this.previousFrame = -1
    this.animate()
  }


  animate() {
    requestAnimationFrame(this.animate)

    let currentFrame = Math.floor((performance.now() - this.startTime) / 1000 * 24) % 1661
    if (currentFrame != this.previousFrame) {
      this.stats.begin()

      if (this.morphDataReady) {
        this.faces.forEach((face) => {
          face.geometry.applyMorph(this.keyframes.user.property.morph[currentFrame])
        })
      }

      this.controls.update()

      this.renderer.clear()

      // Render scene into texture
      this.scene.overrideMaterial = null
      this.renderer.render(this.scene, this.camera, this.postprocessing.rtTextureColor, true)

      // Render depth into texture
      this.scene.overrideMaterial = this.depthMaterial
      this.renderer.render(this.scene, this.camera, this.postprocessing.rtTextureDepth, true)

      // Render bokeh composite
      // this.renderer.render(this.postprocessing.scene, this.postprocessing.camera)
      this.composer.render()

      $('.noise1,.noise2').each((i, el) => {
        $(el).css({backgroundPosition: `${~~(Math.random() * 512)}px ${~~(Math.random() * 512)}px`})
      })

      this.previousFrame = currentFrame
      this.stats.end()
    }
  }


  onResize() {
    let s = Math.max(window.innerWidth / Config.RENDER_WIDTH, window.innerHeight / Config.RENDER_HEIGHT)
    $(this.renderer.domElement).css({
      transformOrigin: 'left top',
      translate: [(window.innerWidth - Config.RENDER_WIDTH * s) / 2, (window.innerHeight - Config.RENDER_HEIGHT * s) / 2],
      scale: [s, s]
    })
  }

}


new App()
