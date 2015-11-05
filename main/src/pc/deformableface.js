/* global THREE createjs */

import {vec2, vec3, mat3} from 'gl-matrix'
import Delaunay from 'delaunay-fast'
import TWEEN from 'tween.js'

import Config from './config'
import StandardFaceData from './standardfacedata'


export default class DeformableFace extends THREE.Mesh {


  constructor(keyframes) {
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: null}
      },
      vertexShader: require('./shaders/face.vert'),
      fragmentShader: require('./shaders/face.frag'),
      side: THREE.DoubleSide
    })
    material = new THREE.MeshBasicMaterial({wireframe: true, transparent: true, opacity: 0.3})
    super(new THREE.BufferGeometry(), material)

    this.keyframes = keyframes
    this.enabled = false

    this.standardFaceData = new StandardFaceData()
    this.buildMesh()

    if (Config.DEV_MODE) {
      this.add(new THREE.AxisHelper())
    }
  }


  buildMesh() {
    this.geometry.dynamic = true
    this.geometry.setIndex(this.standardFaceData.index)
    this.geometry.addAttribute('position', this.standardFaceData.position)
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.standardFaceData.position.array.length / 3 * 2), 2))
  }


  deform(featurePoints) {
    let displacement = featurePoints.map((p, i) => {
      let fp = this.standardFaceData.getFeatureVertex(i)
      return vec3.sub([], p, fp)
    })

    let position = this.geometry.getAttribute('position')
    let n = position.array.length / 3
    for (let i = 0; i < n; i++) {
      let p = vec3.create()
      let b = 0
      this.standardFaceData.data.face.weight[i].forEach((w) => {
        vec3.add(p, p, vec3.scale(vec3.create(), displacement[w[0]], w[1]))
        b += w[1]
      })
      vec3.scale(p, p, 1 / b)
      vec3.add(p, p, this.standardFaceData.getVertex(i))

      position.array[i * 3 + 0] = p[0]
      position.array[i * 3 + 1] = p[1]
      position.array[i * 3 + 2] = p[2]
    }
    position.needsUpdate = true
  }


  setTexture(texture) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: texture.clone()}
      },
      vertexShader: require('./shaders/face.vert'),
      fragmentShader: require('./shaders/face.frag'),
      side: THREE.DoubleSide
    })
  }


  prepareForMorph() {
    this.standardFacePoints = []
    let position = this.standardFaceData.data.face.position
    for (let i = 0; i < position.length; i += 3) {
      this.standardFacePoints.push([position[i], position[i + 1]])
    }
    // console.table(this.getBounds2(this.standardFacePoints))
    this.standardFacePoints.push([1, 1])
    this.standardFacePoints.push([1, -1])
    this.standardFacePoints.push([-1, -1])
    this.standardFacePoints.push([-1, 1])

    this.triangleIndices = Delaunay.triangulate(this.standardFacePoints)

    {
      let position = this.geometry.getAttribute('position').array
      this.capturedVertices = []
      let zMin = Number.MAX_VALUE
      for (let i = 0; i < position.length; i += 3) {
        let z = position[i + 2]
        this.capturedVertices.push([position[i], position[i + 1], z])
        if (z < zMin) {
          zMin = z
        }
      }
      this.capturedVertices.push([1, 1, zMin])
      this.capturedVertices.push([1, -1, zMin])
      this.capturedVertices.push([-1, -1, zMin])
      this.capturedVertices.push([-1, 1, zMin])
    }
  }


  applyMorph(vertices) {
    let position = this.geometry.getAttribute('position')
    for (let i = 0; i < vertices.length; i += 3) {
      let r = this.getTriangleIndex([vertices[i], vertices[i + 1]], this.standardFacePoints)
      if (!r) return
      let [index, bc] = r
      let p0 = this.capturedVertices[this.triangleIndices[index + 0]]
      let p1 = this.capturedVertices[this.triangleIndices[index + 1]]
      let p2 = this.capturedVertices[this.triangleIndices[index + 2]]
      position.array[i + 0] = p0[0] * bc[0] + p1[0] * bc[1] + p2[0] * bc[2]
      position.array[i + 1] = p0[1] * bc[0] + p1[1] * bc[1] + p2[1] * bc[2]
      position.array[i + 2] = vertices[i + 2]
    }
    position.needsUpdate = true
  }


  getTriangleIndex(p, vertices) {
    // console.log(p)
    for (let i = 0; i < this.triangleIndices.length; i += 3) {
      let uv = Delaunay.contains([vertices[this.triangleIndices[i]], vertices[this.triangleIndices[i + 1]], vertices[this.triangleIndices[i + 2]]], p)
      if (uv) {
        uv.unshift(1 - uv[0] - uv[1])
        return [i, uv]
      }
    }
  }


  update(currentFrame) {
    // curl part
    let f = Math.max(this.keyframes.i_extra.in_frame, Math.min(this.keyframes.i_extra.out_frame, currentFrame))
    let scaleZ = this.keyframes.i_extra.property.scale_z[f]

    f = Math.max(this.keyframes.user.in_frame, Math.min(this.keyframes.user.out_frame, currentFrame))
    let props = this.keyframes.user.property
    this.applyMorph(props.face_vertices[f])

    let i = f * 3
    this.position.set(props.position[i], props.position[i + 1], props.position[i + 2])
    this.scale.set(props.scale[i] * 200, props.scale[i + 1] * 200, props.scale[i + 2] * 200 * scaleZ)
    i = f * 4
    this.quaternion.set(props.quaternion[i], props.quaternion[i + 1], props.quaternion[i + 2], props.quaternion[i + 3]).normalize()

    // transition from captured position to keyframes'
    if (f < 200) {
      let blend = TWEEN.Easing.Cubic.InOut(1 - Math.max(0, Math.min(1, f / 200)))
      this.position.lerp(this.initialTransform.position, blend)
      this.scale.lerp(this.initialTransform.scale, blend)
      this.quaternion.slerp(this.initialTransform.quaternion, blend)
    }
  }



  /*
  load(basename) {
    return new Promise((resolve) => {
      let loader = new createjs.LoadQueue()
      loader.loadFile({id: 'json', src: `${basename}.json`})
      loader.loadFile({id: 'image', src: `${basename}.png`})
      loader.loadFile({id: 'anime', src: 'keyframes.json'})
      loader.on('complete', () => {
        this.frames = loader.getResult('anime')
        this.buildMesh(loader.getResult('image'), loader.getResult('json'))
        resolve()
      })
    })
  }


  normalizeFeaturePoints(points) {
    let {size} = this.getBounds2(points)
    let scale = 1.52 / vec2.len(size)
    // console.log('scale', scale)
    let center = points[41]

    let yAxis = vec2.sub([], points[75], points[7])
    let angle = Math.atan2(yAxis[1], yAxis[0]) - Math.PI * 0.5

    let mtx = mat3.create()
    mat3.rotate(mtx, mtx, -angle)
    mat3.scale(mtx, mtx, [scale, scale])
    mat3.translate(mtx, mtx, vec2.scale([], center, -1))
    let normalized = points.map((p) => {
      return vec2.transformMat3([], p, mtx)
    })

    // open the mouth
    let lipPair = [[45, 61], [47, 60], [49, 59], [52, 58], [53, 57], [54, 56]]
    let lipThickness = lipPair.map((pair) => {
      return normalized[pair[0]][1] - normalized[pair[1]][1]
    })

    let mouthWidth = normalized[50][0] - normalized[44][0]
    let mouthHeight = normalized[60][1] - normalized[57][1]
    let offset = mouthWidth * 0.2 - mouthHeight
    let origin = vec2.lerp([], normalized[46], normalized[48], 0.5)
    scale = (Math.abs(normalized[53][1] - origin[1]) + offset) / Math.abs(normalized[53][1] - origin[1])
    mtx = mat3.create()
    mat3.translate(mtx, mtx, origin)
    mat3.scale(mtx, mtx, [1, scale])
    mat3.translate(mtx, mtx, vec2.scale([], origin, -1))
    for (let i = 44; i <= 61; i++) {
      vec2.transformMat3(normalized[i], normalized[i], mtx)
    }
    lipPair.forEach((pair, i) => {
      normalized[pair[1]][1] = normalized[pair[0]][1] - lipThickness[i]
    })

    return normalized
  }


  buildCapturedVertices(featurePoints) {
    let displacement = featurePoints.map((c, i) => {
      let fp = this.getPosition(this.data.face.featurePoint[i])
      let scale = (500 - fp[2] * 150) / 500
      let p = vec3.clone(fp)
      p[0] = c[0] * scale
      p[1] = c[1] * scale
      return vec3.sub(p, p, fp)
    })

    let n = this.data.face.position.length / 3
    let position = new Float32Array(n * 3)
    let zMin = Number.MAX_VALUE
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
      if (p[2] < zMin) zMin = p[2]
    }

    this.capturedVertices = []
    for (let i = 0; i < n; i++) {
      this.capturedVertices.push([position[i * 3 + 0], position[i * 3 + 1], position[i * 3 + 2]])
    }
    this.capturedVertices.push([1, 1, zMin])
    this.capturedVertices.push([1, -1, zMin])
    this.capturedVertices.push([-1, -1, zMin])
    this.capturedVertices.push([-1, 1, zMin])

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


  getBounds2(vertices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    vertices.forEach((v) => {
      vec2.min(min, min, v)
      vec2.max(max, max, v)
    })
    return {min, max, size: vec2.sub([], max, min), center: vec2.lerp([], min, max, 0.5)}
  }
  */

}
