/* global THREE */

import {vec2, vec3, mat3} from 'gl-matrix'
import StandardFaceData from './standard-face-data'


export default class DeformableFaceGeometry extends THREE.BufferGeometry {

  constructor(featurePoint2D, image, planeHeight, cameraZ = 2435.782592) {
    super()

    this.standardFace = new StandardFaceData()

    this.setIndex(this.standardFace.index)
    this.positionAttribute = this.standardFace.position.clone()
    this.positionAttribute.dynamic = true
    this.addAttribute('position', this.positionAttribute)
    this.uvAttribute = new THREE.BufferAttribute(new Float32Array(this.standardFace.position.array.length / 3 * 2), 2)
    this.uvAttribute.dynamic = true
    this.addAttribute('uv', this.uvAttribute)
    this.addAttribute('uv2', this.standardFace.uv)

    if (featurePoint2D) {
      this.init(featurePoint2D, image, planeHeight, cameraZ)
    }
  }


  init(featurePoint2D, imageWidth, imageHeight, planeHeight, cameraZ = 2435.782592) {
    // convert to image coord to world coord
    let featurePoint3D, size
    {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      let mtx = mat3.create()
      let scale = planeHeight / imageHeight
      mat3.scale(mtx, mtx, [scale, -scale])
      mat3.translate(mtx, mtx, [-imageWidth / 2, -imageHeight / 2])
      featurePoint3D = featurePoint2D.map((p) => {
        let q = vec2.transformMat3([], p, mtx)
        vec2.min(min, min, q)
        vec2.max(max, max, q)
        return q
      })
      size = vec2.sub([], max, min)
    }

    // calc z position
    let scale = vec2.len(size) / this.standardFace.size
    {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE]
      let max = [Number.MIN_VALUE, Number.MIN_VALUE]
      featurePoint3D.forEach((p, i) => {
        let z = this.standardFace.getFeatureVertex(i)[2] * scale
        if (isNaN(z)) {
          return
        }
        let perspective = (cameraZ - z) / cameraZ
        p[0] *= perspective
        p[1] *= perspective
        p[2] = z
        vec2.min(min, min, p)
        vec2.max(max, max, p)
      })
      size = vec2.sub([], max, min)
      scale = this.standardFace.size / vec2.len(size)
    }

    // normalize captured feature point coords
    {
      let center = featurePoint3D[41]
      let yAxis = vec2.sub([], featurePoint3D[75], featurePoint3D[7])
      let angle = Math.atan2(yAxis[1], yAxis[0]) - Math.PI * 0.5

      let mtx = mat3.create()
      mat3.rotate(mtx, mtx, -angle)
      mat3.scale(mtx, mtx, [scale, scale])
      mat3.translate(mtx, mtx, vec2.scale([], center, -1))

      this.matrixFeaturePoints = new THREE.Matrix4()
      this.matrixFeaturePoints.makeRotationZ(angle)
      let s = 1 / scale
      this.matrixFeaturePoints.scale(new THREE.Vector3(s, s, s))
      this.matrixFeaturePoints.setPosition(new THREE.Vector3(center[0], center[1], 0))

      this.normalizedFeaturePoints = featurePoint3D.map((p) => {
        let q = vec2.transformMat3([], p, mtx)
        q[2] = p[2] * scale
        return q
      })
    }

    this.deform(this.normalizedFeaturePoints)

    // calc uv with deformed vertices
    {
      let position = this.positionAttribute.array
      let uv = this.uvAttribute.array
      const n = position.length / 3
      let cameraPosition = new THREE.Vector3(0, 0, cameraZ)
      let ray = new THREE.Ray(cameraPosition.clone())
      let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
      // const height = planeHeight
      // const width = height// / 9 * 16
      const planeWidth = imageWidth / imageHeight * planeHeight
      for (let i = 0; i < n; i++) {
        let p = new THREE.Vector3(position[i * 3], position[i * 3 + 1], position[i * 3 + 2])
        p.applyMatrix4(this.matrixFeaturePoints)
        ray.direction.copy(p).sub(cameraPosition)
        ray.intersectPlane(plane, p)
        uv[i * 2 + 0] = (p.x + planeWidth / 2) / planeWidth
        uv[i * 2 + 1] = (p.y + planeHeight / 2) / planeHeight
      }
      this.uvAttribute.needsUpdate = true
    }

    // open the mouth (neutral position)
    {
      let nfp = this.normalizedFeaturePoints
      let lipPair = [[45, 61], [47, 60], [49, 59], [52, 58], [53, 57], [54, 56]]
      let lipThickness = lipPair.map((pair) => {
        return nfp[pair[0]][1] - nfp[pair[1]][1]
      })

      let mouthWidth = nfp[50][0] - nfp[44][0]
      let mouthHeight = nfp[60][1] - nfp[57][1]
      let offset = mouthWidth * 0.2 - mouthHeight
      let origin = vec2.lerp([], nfp[46], nfp[48], 0.5)
      scale = (Math.abs(nfp[53][1] - origin[1]) + offset) / Math.abs(nfp[53][1] - origin[1])
      let mtx = mat3.create()
      mat3.translate(mtx, mtx, origin)
      mat3.scale(mtx, mtx, [1, scale])
      mat3.translate(mtx, mtx, vec2.scale([], origin, -1))
      for (let i = 44; i <= 61; i++) {
        vec2.transformMat3(nfp[i], nfp[i], mtx)
      }
      lipPair.forEach((pair, i) => {
        nfp[pair[1]][1] = nfp[pair[0]][1] - lipThickness[i]
      })
    }

    // this.deform(this.normalizedFeaturePoints)

    {
      let position = this.positionAttribute.array
      this.neutralPosition = []
      let zMin = Number.MAX_VALUE
      for (let i = 0; i < this.standardFace.data.face.position.length; i += 3) {
        let z = position[i + 2]
        this.neutralPosition.push([position[i], position[i + 1], z])
        if (z < zMin) {
          zMin = z
        }
      }
      this.neutralPosition.push([2, 2, zMin])
      this.neutralPosition.push([2, -2, zMin])
      this.neutralPosition.push([-2, -2, zMin])
      this.neutralPosition.push([-2, 2, zMin])
    }
  }


  fillMouth() {
    this.setIndex(this.standardFace.mouthIncludedIndex)
  }


  deform(featurePoints) {
    let displacement = featurePoints.map((p, i) => {
      let fp = this.standardFace.getFeatureVertex(i)
      return vec3.sub([], p, fp)
    })

    let weight = this.standardFace.data.face.weight
    let position = this.positionAttribute.array
    for (let i = 0; i < weight.length; i++) {
      let p = vec3.create()
      let b = 0
      weight[i].forEach((w) => {
        vec3.add(p, p, vec3.scale(vec3.create(), displacement[w[0]], w[1]))
        b += w[1]
      })
      vec3.scale(p, p, 1 / b)
      vec3.add(p, p, this.standardFace.getVertex(i))

      position[i * 3 + 0] = p[0]
      position[i * 3 + 1] = p[1]
      position[i * 3 + 2] = p[2]
    }
    this.standardFace.faceEyeIndex.forEach((index) => {
      let i0 = index[0] * 3
      let i1 = index[1] * 3
      position[i1 + 0] = position[i0 + 0]
      position[i1 + 1] = position[i0 + 1]
      position[i1 + 2] = position[i0 + 2]
    })
    this.positionAttribute.needsUpdate = true
  }


  applyMorph(weights) {
    let position = this.positionAttribute.array
    let n = position.length / 3
    let offset = 40 / 150
    for (let i = 0; i < n; i++) {
      let j = i * 7
      let p0 = this.neutralPosition[weights[j + 0]]
      let p1 = this.neutralPosition[weights[j + 1]]
      let p2 = this.neutralPosition[weights[j + 2]]
      let w0 = weights[j + 3]
      let w1 = weights[j + 4]
      let w2 = weights[j + 5]
      let k = i * 3
      position[k + 0] = p0[0] * w0 + p1[0] * w1 + p2[0] * w2
      position[k + 1] = p0[1] * w0 + p1[1] * w1 + p2[1] * w2
      position[k + 2] = weights[j + 6] + offset
    }
    this.positionAttribute.needsUpdate = true
  }


  copy(geometry) {
    this.positionAttribute.copy(geometry.positionAttribute)
    this.positionAttribute.needsUpdate = true
    this.uvAttribute.copy(geometry.uvAttribute)
    this.uvAttribute.needsUpdate = true
    this.neutralPosition = geometry.neutralPosition
  }


  clone() {
    let geometry = new DeformableFaceGeometry()
    geometry.copy(this)
    return geometry
  }

}
