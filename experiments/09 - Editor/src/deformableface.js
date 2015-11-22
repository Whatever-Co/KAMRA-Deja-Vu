/* global THREE */
import {vec2, vec3, mat3} from 'gl-matrix'
import Delaunay from 'delaunay-fast'


export default class extends THREE.Mesh {

  constructor() {
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({map: new THREE.Texture()}))
    this.initGeometry()
    this.prepareForMorph()
    // this.applyMorph()
  }


  initGeometry() {
    this.data = require('./face.json')
    /*
    console.log(this.data.face.featurePoint)
    {
      let position = this.data.face.position
      let pts = this.data.face.featurePoint.filter((fp) => fp >= 0).map((fp) => {
        let i = fp * 3
        return [position[i], position[i + 1]]
      })
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      pts.forEach((p) => {
        vec2.min(min, min, p)
        vec2.max(max, max, p)
      })
      let size = vec2.sub([], max, min)
      console.log(vec2.len(size))
      console.log(min, max, size, vec2.lerp([], min, max, 0.5))
    }
    */

    let index = this.data.face.index.concat(this.data.rightEye.index, this.data.leftEye.index)
    let uv = new Float32Array(this.data.face.position.length / 3 * 2)

    this.geometry.dynamic = true
    this.geometry.setIndex(new THREE.Uint16Attribute(index, 1))
    this.geometry.addAttribute('position', new THREE.Float32Attribute(this.data.face.position, 3))
    this.geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2))
  }


  prepareForMorph() {
    this.standardFacePoints = []
    let position = this.data.face.position
    for (let i = 0; i < position.length; i += 3) {
      this.standardFacePoints.push([position[i], position[i + 1]])
    }
    this.standardFacePoints.push([1, 1])
    this.standardFacePoints.push([1, -1])
    this.standardFacePoints.push([-1, -1])
    this.standardFacePoints.push([-1, 1])

    this.triangleIndices = Delaunay.triangulate(this.standardFacePoints)
  }


  applyTexture(texture, featurePoints) {
    let map = new THREE.Texture(texture)
    map.needsUpdate = true
    this.material.map = map

    let displacement = featurePoints.map((c, i) => {
      let fp = this.getPosition(this.data.face.featurePoint[i])
      return vec2.sub([], c, fp)
    })

    let n = this.data.face.position.length / 3
    let attribute = this.geometry.getAttribute('uv')
    for (let i = 0; i < n; i++) {
      let p = vec2.create()
      let b = 0
      this.data.face.weight[i].forEach((w) => {
        vec2.add(p, p, vec2.scale([], displacement[w[0]], w[1]))
        b += w[1]
      })
      vec2.scale(p, p, 1 / b)
      vec2.add(p, p, this.getPosition(i))
      attribute.array[i * 2 + 0] = p[0]
      attribute.array[i * 2 + 1] = p[1]
    }
    attribute.needsUpdate = true


    displacement = this.normalizeFeaturePoints(featurePoints).map((c, i) => {
      let fp = this.getPosition(this.data.face.featurePoint[i])
      let scale = (500 - fp[2] * 50) / 500
      // scale = 1
      let p = vec3.clone(fp)
      p[0] = c[0] * scale
      p[1] = c[1] * scale
      return vec3.sub(p, p, fp)
    })
    attribute = this.geometry.getAttribute('position')
    for (let i = 0; i < n; i++) {
      let p = vec3.create()
      let b = 0
      this.data.face.weight[i].forEach((w) => {
        vec3.add(p, p, vec3.scale(vec3.create(), displacement[w[0]], w[1]))
        b += w[1]
      })
      vec3.scale(p, p, 1 / b)
      vec3.add(p, p, this.getPosition(i))
      attribute.array[i * 3 + 0] = p[0]
      attribute.array[i * 3 + 1] = p[1]
      attribute.array[i * 3 + 2] = p[2]
    }
    attribute.needsUpdate = true

    // this.initialPosition = new Float32Array(attribute.array)
    // console.log(this.initialPosition)
    this.capturedVertices = []
    for (let i = 0; i < n; i++) {
      this.capturedVertices.push([attribute.array[i * 3 + 0], attribute.array[i * 3 + 1], attribute.array[i * 3 + 2]])
    }
    this.capturedVertices.push([1, 1, 0])
    this.capturedVertices.push([1, -1, 0])
    this.capturedVertices.push([-1, -1, 0])
    this.capturedVertices.push([-1, 1, 0])
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


  applyMorph(morphIndex = 0) {
    let targetVertices = []
    {
      let position = require('./morph.json')[morphIndex].face.vertices
      for (let i = 0; i < position.length; i += 3) {
        targetVertices.push([position[i], position[i + 1], position[i + 2]])
      }
    }

    let position = this.geometry.getAttribute('position')
    targetVertices.forEach((mp, i) => {
      let r = this.getTriangleIndex(mp, this.standardFacePoints)
      if (!r) return
      let [index, bc] = r
      let p0 = this.capturedVertices[this.triangleIndices[index + 0]]
      let p1 = this.capturedVertices[this.triangleIndices[index + 1]]
      let p2 = this.capturedVertices[this.triangleIndices[index + 2]]
      i *= 3
      position.array[i + 0] = p0[0] * bc[0] + p1[0] * bc[1] + p2[0] * bc[2]
      position.array[i + 1] = p0[1] * bc[0] + p1[1] * bc[1] + p2[1] * bc[2]
      position.array[i + 2] = p0[2] * bc[0] + p1[2] * bc[1] + p2[2] * bc[2]
    })

    position.needsUpdate = true
  }


  getPosition(index, array = this.data.face.position) {
    let i = index * 3
    return [array[i], array[i + 1], array[i + 2]]
  }


  getFPCoord(index) {
    let i = this.data.face.featurePoint[index] * 3
    let p = this.data.face.position
    return [p[i], p[i + 1], p[i + 2]]
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

}
