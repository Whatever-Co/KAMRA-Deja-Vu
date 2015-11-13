/* global THREE */

import {vec2, mat3} from 'gl-matrix'
import {FACE_INDICES} from './webcam-plane'

//#071520
const KEY_COLOR = [7, 21, 32]
const SCALE = 0.98

export default class FaceHolePlane extends THREE.Mesh {

  constructor() {
    super(
      new THREE.PlaneBufferGeometry(SCALE, SCALE, 1, 1),
      new THREE.ShaderMaterial({
        vertexShader:require('./shaders/face-hole.vert'),
        fragmentShader:require('./shaders/face-hole.frag'),
        uniforms: {
          map: {type: 't', value: null},
          hole: {type: 't', value: null},
          keyColor: {type: 'v3', value: new THREE.Vector3(KEY_COLOR[0]/255.0, KEY_COLOR[1]/255.0, KEY_COLOR[2]/255.0)},
          keyThreshold: {type: 'f', value:0.05}
        }
      })
    )

    this.videoTexture
    {
      let video = document.createElement('video')
      video.src = 'media/curl_bg.mp4'
      video.play()
      video.loop = true

      let tex = new THREE.VideoTexture(video)
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.format = THREE.RGBFormat

      this.videoTexture = tex
      this.material.uniforms.hole.value = tex
    }

    this.canvas = document.createElement('canvas')
    this.canvas.width = 512
    this.canvas.height = 512

    this.maskTexture = new THREE.CanvasTexture(this.canvas)
    this.material.uniforms.map.value = this.maskTexture
  }

  capture(webcam) {
    if(!webcam.rawFeaturePoints) {
      console.warn('not tracking')
      return
    }

    let area = this.drawHole(webcam)

    // Fit matrix to the crop area
    let vidSize = [webcam.video.videoHeight, webcam.video.videoHeight]
    let rate = vec2.div([], area.size, vidSize)
    let s = vec2.mul([], [webcam.scale.x, webcam.scale.y], rate)

    let center = []
    {
      let out = vec2.mul([], area.size, [0.5, 0.5])
      vec2.add(out, area.pos, out)
      vec2.div(out, out, vidSize)
      vec2.sub(center, out, [16/9 * 0.5, 0.5])
    }
    let t = vec2.mul([], [webcam.scale.x, webcam.scale.y], center)

    let mtx = new THREE.Matrix4()
    mtx.identity()
    mtx.makeScale(s[0], s[1], 1)
    mtx.setPosition(new THREE.Vector3(t[0], -t[1], 0))
    this.matrix = mtx
  }

  drawHole(webcam) {
    const canvas = this.canvas
    const ctx = this.canvas.getContext('2d')

    const webcam_size = [webcam.video.videoWidth, webcam.video.videoHeight]
    const canvas_size = [canvas.width, canvas.height]

    // Set clipping area, path
    let area = {}, paths
    {
      let scale = vec2.div([], webcam_size, [320,180])
      let points = webcam.rawFeaturePoints.map(p=>{
        return vec2.mul([], p, scale)
      })

      let b = webcam.getBoundsFor(points, FACE_INDICES)
      if (b.size[0] / b.size[1]<1) {
        area.pos = [b.min[0] - (b.size[1]-b.size[0])*0.5, b.min[1]]
        area.size = [b.size[1], b.size[1]]
      }
      else {
        area.pos = [b.min[0], b.min[1] - (b.size[0]-b.size[1])*0.5]
        area.size = [b.size[0], b.size[0]]
      }

      let canvas_scale = vec2.div([], canvas_size, area.size)
      paths = FACE_INDICES.map(i=>{
        let p = []
        vec2.sub(p, points[i], area.pos)
        vec2.mul(p, p, canvas_scale)
        return p
      })
    }

    ctx.save()
    ctx.clearRect(0, 0, canvas_size[0], canvas_size[1])

    // Clipping mask
    ctx.strokeStyle = '#0000FF'
    ctx.beginPath()
    ctx.moveTo(paths[0][0],paths[0][1])
    paths.forEach(p => {
      ctx.lineTo(p[0],p[1])
    })
    ctx.closePath()
    ctx.clip()

    // Copy image
    {
      let webcam_scale = [1024 / webcam_size[0], 1024 / webcam_size[1]]
      let p = vec2.mul([], area.pos, webcam_scale)
      let s = vec2.mul([], area.size, webcam_scale)
      ctx.drawImage(webcam.textureCanvas,
        p[0], p[1], s[0], s[1],
        0, 0, canvas_size[0], canvas_size[1]
      );
    }

    // Draw edge
    [2,4,8,16,32].forEach(d =>{
      ctx.drawImage(canvas,
        0, 0, canvas_size[0], canvas_size[1],
        d, d, canvas_size[1]-d*2, canvas_size[1]-d*2
      );
      // A little darker
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1})`
      ctx.fillRect(0, 0, canvas_size[0], canvas_size[1])
    })

    ctx.restore()

    // Draw green
    {
      const offset = 0.05
      ctx.save()
      ctx.scale(1-offset*2, 1-offset*2)
      ctx.translate(canvas_size[0]*offset, canvas_size[1]*offset)

      ctx.fillStyle = `rgb(${KEY_COLOR[0]}, ${KEY_COLOR[1]}, ${KEY_COLOR[2]})`
      ctx.beginPath()
      ctx.moveTo(paths[0][0],paths[0][1])
      paths.forEach(p => {
        ctx.lineTo(p[0],p[1])
      })
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    this.maskTexture.needsUpdate = true

    return area
  } // >> draw face

}