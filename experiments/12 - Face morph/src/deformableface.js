/* global THREE createjs */
import {vec2, vec3, mat3} from 'gl-matrix'
import Delaunay from 'delaunay-fast'


export default class extends THREE.Object3D {


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


  buildMesh(image, featurePoints) {
    this.data = require('./face.json')
    console.log(this.data)

    let index = this.data.face.index.concat(this.data.rightEye.index, this.data.leftEye.index)

    let geometry = new THREE.BufferGeometry()
    geometry.dynamic = true
    geometry.setIndex(new THREE.Uint16Attribute(index, 1))
    // this.positionAttribute = new THREE.Float32Attribute(this.frames[0].faces[0].morph.face.vertices, 3)
    // this.positionAttribute = new THREE.Float32Attribute(this.data.face.position, 3)
    this.positionAttribute = this.buildCapturedVertices(this.normalizeFeaturePoints(featurePoints))
    geometry.addAttribute('position', this.positionAttribute)
    geometry.addAttribute('uv', this.getDeformedUV(featurePoints))

    let map = new THREE.Texture(image)
    map.needsUpdate = true
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: 't', value: map}
      },
      vertexShader: require('./face.vert'),
      fragmentShader: require('./face.frag'),
      side: THREE.DoubleSide
    })
    // let material = new THREE.MeshBasicMaterial({map, side: THREE.DoubleSide, morphTargets: true})

    this.mesh = new THREE.Mesh(geometry, material)
    // this.mesh.scale.set(0.01, 0.01, 0.01)
    this.add(this.mesh)

    this.prepareForMorph()
    this.applyMorph(0)
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


  applyMorph(frame) {
    let targetVertices = []
    {
      const scale = 0.006667229494618528
      let position = this.frames[frame].faces[0].morph.face.vertices
      for (let i = 0; i < position.length; i += 3) {
        targetVertices.push([position[i] * scale, position[i + 1] * scale, position[i + 2] * scale])
      }
      // console.table(this.getBounds2(targetVertices))
    }

    targetVertices.forEach((mp, i) => {
      let r = this.getTriangleIndex(mp, this.standardFacePoints)
      if (!r) return
      let [index, bc] = r
      // console.log(i, index, bc)
      let p0 = this.capturedVertices[this.triangleIndices[index + 0]]
      let p1 = this.capturedVertices[this.triangleIndices[index + 1]]
      let p2 = this.capturedVertices[this.triangleIndices[index + 2]]
      i *= 3
      this.positionAttribute.array[i + 0] = p0[0] * bc[0] + p1[0] * bc[1] + p2[0] * bc[2]
      this.positionAttribute.array[i + 1] = p0[1] * bc[0] + p1[1] * bc[1] + p2[1] * bc[2]
      // this.positionAttribute.array[i + 2] = p0[2] * bc[0] + p1[2] * bc[1] + p2[2] * bc[2]
      this.positionAttribute.array[i + 2] = mp[2]
    })
    this.positionAttribute.needsUpdate = true
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


  getBounds2(vertices) {
    let min = [Number.MAX_VALUE, Number.MAX_VALUE]
    let max = [Number.MIN_VALUE, Number.MIN_VALUE]
    vertices.forEach((v) => {
      vec2.min(min, min, v)
      vec2.max(max, max, v)
    })
    return {min, max, size: vec2.sub([], max, min), center: vec2.lerp([], min, max, 0.5)}
  }

  update(t) {
    if (this.frames) {
      let currentFrame = Math.floor(t / 1000 * 24) % this.frames.length
      this.applyMorph(currentFrame)
      // let data = this.frames[currentFrame].faces[0]
      // // console.log(data.quat)
      // this.mesh.quaternion.set(data.quat[0], data.quat[1], data.quat[2], data.quat[3])
      // // console.log(this.mesh.rotation)
      // this.rotation.set(Math.PI, 0, 0)
      // this.positionAttribute.array.set(data.morph.face.vertices)
      // this.positionAttribute.needsUpdate = true
    }
  }

}
