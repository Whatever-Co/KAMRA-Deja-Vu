/* global THREE */

import {vec2, mat3} from 'gl-matrix'
import {FACE_INDICES} from './webcam-plane'

//#071520
const KEY_COLOR = [0, 255, 0]

export default class FaceHolePlane {

  constructor() {
    this.videoTexture
    {
      let video = document.createElement('video')
      video.src = 'media/curl_bg.mp4'
      video.loop = true
      video.play()


      let tex = new THREE.VideoTexture(video)
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.format = THREE.RGBFormat

      this.videoTexture = tex
    }
  }

  capture(webcam) {
    if(!webcam.rawFeaturePoints) {
      console.warn('not tracking')
      return
    }
    let area = this.drawHole(webcam)
    webcam.material.uniforms.holeTexture.value = this.videoTexture
  }

  drawHole(webcam) {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

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
    let webcam_area = {}
    {
      let webcam_scale = [1024 / webcam_size[0], 1024 / webcam_size[1]]
      webcam_area.pos = vec2.mul([], area.pos, webcam_scale)
      webcam_area.size = vec2.mul([], area.size, webcam_scale)
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
      ctx.drawImage(webcam.textureCanvas,
        webcam_area.pos[0], webcam_area.pos[1], webcam_area.size[0], webcam_area.size[1],
        0, 0, canvas_size[0], canvas_size[1]
      )
    }

    // Draw edge
    [2,4,8].forEach(d =>{
      ctx.drawImage(canvas,
        0, 0, canvas_size[0], canvas_size[1],
        d, d, canvas_size[1]-d*2, canvas_size[1]-d*2
      );
      // A little darker
      ctx.fillStyle = `rgba(0, 0, 0, ${0.1})`
      ctx.fillRect(0, 0, canvas_size[0], canvas_size[1])
    })
    ctx.restore() // clear mask

    // Fill chroma key color
    {
      const offset = 0.03
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

    // Apply to webcam
    {
      let webcamCtx = webcam.textureCanvas.getContext('2d')
      webcamCtx.save()
      webcamCtx.translate(1024, 0)
      webcamCtx.scale(-1, 1) // flip
      webcamCtx.drawImage(canvas,
        0, 0, canvas_size[0], canvas_size[1],
        webcam_area.pos[0], webcam_area.pos[1], webcam_area.size[0], webcam_area.size[1],
      )
      webcamCtx.restore()

    }
    return webcam_area
  } // >> draw face

}