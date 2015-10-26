/*global THREE*/
import 'OBJLoader';
import {vec2, mat3} from 'gl-matrix';


class Node {

  constructor(index, position) {
    this.index = index;
    this.position = position;
    this.connection = [];
    this.distanceToFP = [];
    this.weights = [];
  }

  nearestFeaturePointIndex() {
    let index = 0;
    let distance = this.distanceToFP[0];
    this.distanceToFP.forEach((d, i) => {
      if (d < distance) {
        distance = d;
        index = i;
      }
    });
    return index;
  }

}


export default class extends THREE.Mesh {

  constructor(tracker) {
    let geometry = new THREE.JSONLoader().parse(require('json!./data/face.json')).geometry;
    // let material = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide});
    let material = new THREE.ShaderMaterial({
      uniforms: {
        map: { type: 't', value: null }
      },
      vertexShader: require('raw!./face.vert'),
      fragmentShader: require('raw!./face.frag'),
      side: THREE.DoubleSide
    });
    super(geometry, material);

    this.tracker = tracker;

    this.initFeaturePoints();
    this.initTexture();
    this.initMesh();
    this.initEyeMouth();
  }


  initFeaturePoints() {
    this.featurePointIndices = require('json!./data/fp.json').map((pa, i) => {
      const p = new THREE.Vector3(pa[0], pa[1], pa[2]);
      return i == 41 || p.length() > 0 ? this.findNearestIndex(this.geometry.vertices, p) : -1;
    });

    this.buildConnectionData(this.geometry);

    this.featurePointIndices.forEach((index, i) => {
      if (index >= 0) {
        this.calcDistanceToFeaturePoint(i);
      }
    });

    this.nodes.forEach(this.calcWeightForNode.bind(this));

    let cube = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    this.featurePoints = this.featurePointIndices.map((i) => {
      if (i < 0) return;
      let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.7, depthTest: false});
      // material.color.setHSL(Math.random(), 0.7, 0.5);
      let mesh = new THREE.Mesh(cube, material);
      mesh.visible = false;
      mesh.vertexIndex = i;
      mesh.position.copy(this.geometry.vertices[i]);
      this.add(mesh);
      return mesh;
    });

    let v1 = this.featurePoints[14].position.clone();
    let v0 = this.featurePoints[0].position.clone();
    let center = new THREE.Vector3().lerpVectors(v1, v0, 0.5);
    let scale = v1.clone().sub(center).x;
    for (let i = 71; i < this.featurePoints.length; i++) {
      let fp = this.featurePoints[i];
      let ip = fp.position.clone().sub(center);
      ip.multiplyScalar(1 / scale);
      fp.initialPosition = ip;
    }
  }


  findNearestIndex(vertices, target) {
    let distance = Number.MAX_VALUE;
    let index = 0;
    vertices.forEach((v, i) => {
      let d = v.distanceToSquared(target);
      if (d < distance) {
        distance = d;
        index = i;
      }
    });
    return index;
  }


  buildConnectionData(geometry) {
    this.nodes = geometry.vertices.map((v, i) => new Node(i, v.clone()));

    let connected = {};
    let connect = (a, b) => {
      let key = a << 16 | b;
      if (connected[key]) return;
      this.nodes[a].connection.push(this.nodes[b]);
      connected[key] = true;
      this.nodes[b].connection.push(this.nodes[a]);
      connected[b << 16 | a] = true;
    };
    geometry.faces.forEach((f) => {
      connect(f.a, f.b);
      connect(f.b, f.c);
      connect(f.c, f.a);
    });
  }


  calcDistanceToFeaturePoint(index) {
    this.nodes.forEach((node) => node.distanceToFP[index] = Number.MAX_VALUE);
    let start = this.nodes[this.featurePointIndices[index]];
    start.distanceToFP[index] = 0;
    let processing = [start];
    while (processing.length) {
      let next = [];
      processing.forEach((node) => {
        node.connection.forEach((connected) => {
          let distance = node.distanceToFP[index] + node.position.distanceTo(connected.position);
          if (distance < connected.distanceToFP[index]) {
            connected.distanceToFP[index] = distance;
            next.push(connected);
          }
        });
      });
      processing = next;
    }
  }


  calcWeightForNode(node) {
    let nearest = node.nearestFeaturePointIndex();
    let fp1 = this.nodes[this.featurePointIndices[nearest]];
    let p = node.position.clone().sub(fp1.position);
    let angles = this.featurePointIndices.map((index, i) => {
      if (index < 0) return NaN;
      let node = this.nodes[index].position.clone().sub(fp1.position);
      let angle = p.angleTo(node);
      return {index: i, angle};
    }).filter((a) => {
      return !isNaN(a.angle) && a.angle < Math.PI / 2;
    }).sort((a, b) => a.angle - b.angle);

    let d = 0;
    switch (angles.length) {
      case 0:
        break;
      case 1:
        d = fp1.distanceToFP[angles[0].index] / Math.cos(angles[0].angle);
        break;
      default:
        let d2 = fp1.distanceToFP[angles[0].index];
        let d3 = fp1.distanceToFP[angles[1].index];
        let cos2 = Math.cos(angles[0].angle);
        let cos3 = Math.cos(angles[1].angle);
        d = (d2 * cos2 + d3 * cos3) / (cos2 + cos3);
        break;
    }

    if (d == 0) {
      node.weights = this.featurePointIndices.map((id, i) => i == nearest ? 1 : 0);
    } else {
      const HALF_PI = Math.PI / 2;
      node.weights = [];
      node.weights[nearest] = Math.max(0, Math.sin(HALF_PI * (1.0 - node.distanceToFP[nearest] / d)));
      angles.forEach((a) => {
        if (node.distanceToFP[a.index] < d) {
          node.weights[a.index] = Math.sin(HALF_PI * (1.0 - node.distanceToFP[a.index] / d));
        }
      });
    }

    let total = 0;
    node.weights = node.weights.map((w, i) => {
      total += w;
      return {i, w};
    }).sort((a, b) => b.w - a.w).filter((w) => w.w > 0).slice(0, 4);
    node.weights.forEach((w) => {
      w.w /= total;
    });
    // console.log(node.index, node.weights);
  }


  initTexture() {
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.id = 'texture';
    this.textureCanvas.width = 512;
    this.textureCanvas.height = 512;
    this.textureContext = this.textureCanvas.getContext('2d');
    require('ctx-get-transform')(this.textureContext);
    this.textureContext.fillStyle = 'white';
    this.textureContext.fillRect(0, 0, this.textureCanvas.width, this.textureCanvas.height);
    // document.body.appendChild(this.textureCanvas);

    this.texture = new THREE.Texture(this.textureCanvas);
    this.texture.needsUpdate = true;
    // this.material.map = this.texture;
    this.material.uniforms.map.value = this.texture;


    if (this.tracker.currentPosition) {
      let min = [Number.MAX_VALUE, Number.MAX_VALUE];
      let max = [Number.MIN_VALUE, Number.MIN_VALUE];
      this.tracker.currentPosition.forEach((p) => {
        let x = p[0];
        let y = p[1];
        if (x < min[0]) min[0] = x;
        if (x > max[0]) max[0] = x;
        if (y < min[1]) min[1] = y;
        if (y > max[1]) max[1] = y;
      });
      let center = this.tracker.currentPosition[33];
      let size = Math.max(center[0] - min[0], max[0] - center[0], center[1] - min[1], max[1] - center[1]);
      this.textureContext.save();
      let scale = 256 * 0.95 / size;
      this.textureContext.translate(256, 256);
      this.textureContext.scale(scale, scale);
      this.textureContext.translate(-center[0], -center[1]);
      this.textureContext.drawImage(this.tracker.target, 0, 0);
      let mtx = this.textureContext.getTransform();
      // this.textureContext.drawImage(this.tracker.debugCanvas, 0, 0);
      this.textureContext.restore();

      let fpuv = [];

      this.textureContext.save();
      this.textureContext.fillStyle = 'rgba(128, 255, 0, 0.5)';
      this.tracker.currentPosition.forEach((p) => {
        let q = vec2.transformMat3(vec2.create(), p, mtx);
        fpuv.push([q[0] / 256 - 1, q[1] / 256 - 1]);
      });

      {
        this.textureContext.fillStyle = 'red';
        let v1 = this.tracker.currentPosition[14];
        let v0 = this.tracker.currentPosition[0];
        let center = vec2.lerp(vec2.create(), v1, v0, 0.5);
        let xAxis = vec2.sub(vec2.create(), v1, center);
        let scale = vec2.len(xAxis);
        let rotation = mat3.create();
        mat3.rotate(rotation, rotation, Math.atan2(xAxis[1], xAxis[0]));
        for (let i = 71; i < this.featurePoints.length; i++) {
          let fp = this.featurePoints[i].initialPosition;
          let p = vec2.scale(vec2.create(), [fp.x, -fp.y], scale);
          vec2.transformMat3(p, p, rotation);
          vec2.add(p, p, center);
          vec2.transformMat3(p, p, mtx);
          // this.textureContext.fillRect(p[0] - 3, p[1] - 3, 6, 6);
          fpuv.push([p[0] / 256 - 1, p[1] / 256 - 1]);
        }
      }

      this.featurePointUV = fpuv;

      this.textureContext.fillStyle = 'rgba(0, 0, 255, 0.5)';

      let displacement = this.featurePoints.map((mesh, i) => {
        if (!mesh) return;
        let node = this.nodes[mesh.vertexIndex];
        return [fpuv[i][0] - node.position.x, -fpuv[i][1] - node.position.y];
      });

      let uvs = this.nodes.map((target) => {
        let p = vec2.create();
        if (target.weights.length == 1) {
          let w = target.weights[0];
          vec2.add(p, [target.position.x, target.position.y], vec2.scale([], displacement[w.i], w.w));
        } else {
          let a = vec2.create();
          let b = 0;
          target.weights.forEach((w) => {
            let dp = vec2.scale([], displacement[w.i], w.w);
            let dist = 1.0 / (target.distanceToFP[w.i] * target.distanceToFP[w.i]);
            vec2.add(a, a, vec2.scale(dp, dp, dist));
            b += w.w * dist;
          });
          vec2.scale(a, a, 1 / b);
          vec2.add(p, [target.position.x, target.position.y], a);
        }
        return [(p[0] * 256 + 256) / 512, (p[1] * 256 + 256) / 512];
      });

      this.geometry.faces.forEach((face, i) => {
        let uv = this.geometry.faceVertexUvs[0][i];
        uv[0].x = uvs[face.a][0];
        uv[0].y = uvs[face.a][1];
        uv[1].x = uvs[face.b][0];
        uv[1].y = uvs[face.b][1];
        uv[2].x = uvs[face.c][0];
        uv[2].y = uvs[face.c][1];
      });
      this.geometry.uvsNeedUpdate = true;

      this.textureContext.restore();
    }
  }


  initMesh() {
    if (this.tracker.normalizedPosition) {
      this.tracker.normalizedPosition.forEach((np, i) => {
        let fp = this.featurePoints[i];
        if (fp) {
          // let scale = (500 - fp.localToWorld(new THREE.Vector3()).z) / 500 * 0.5;
          let scale = (500 - fp.position.z * 150) / 500 * 0.5;
          // scale = 0.3;
          // fp.position.x += (np[0] * scale - fp.position.x) * 0.3;
          // fp.position.y += (-np[1] * scale - fp.position.y) * 0.3;
          fp.position.x = np[0] * scale;
          fp.position.y = -np[1] * scale;
          // fp.position.z *= 2 * scale;
        }
      });

      // console.log(this.featurePoints);
      // [33, 41, 62, 34, 35, 36, 42, 37, 43, 38, 39, 40].forEach((i) => {
      //   let fp = this.featurePoints[i];
      //   fp.position.x += 0.2;
      // });

      let v1 = this.featurePoints[14].position.clone();
      let v0 = this.featurePoints[0].position.clone();
      let center = new THREE.Vector3().lerpVectors(v1, v0, 0.5);
      let rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), v1.clone().sub(center).normalize());
      let scale = v1.clone().sub(center).length();
      for (let i = 71; i < this.featurePoints.length; i++) {
        let fp = this.featurePoints[i];
        fp.position.copy(fp.initialPosition.clone().multiplyScalar(scale).applyQuaternion(rotation).add(center));
      }

      this.deformVertices();
    }
  }


  deformVertices() {
    let vertices = this.geometry.vertices;

    let displacement = this.featurePoints.map((mesh) => {
      if (!mesh) return;
      let node = this.nodes[mesh.vertexIndex];
      return mesh.position.clone().sub(node.position);
    });

    this.nodes.forEach((target) => {
      if (target.weights.length == 1) {
        let w = target.weights[0];
        vertices[target.index].copy(target.position).add(displacement[w.i].clone().multiplyScalar(w.w));
      } else {
        let a = new THREE.Vector3();
        let b = 0;
        target.weights.forEach((w) => {
          let dp = displacement[w.i].clone().multiplyScalar(w.w);
          let dist = 1.0 / (target.distanceToFP[w.i] * target.distanceToFP[w.i]);
          a.add(dp.multiplyScalar(dist));
          b += w.w * dist;
        });
        a.multiplyScalar(1 / b);
        vertices[target.index].copy(target.position).add(a);
      }
    });

    this.geometry.verticesNeedUpdate = true;
  }


  initEyeMouth() {
    // console.log(this.featurePointUV);
    this.featurePointUV.forEach((uv) => {
      uv[0] = uv[0] * 0.5 + 0.5;
      uv[1] = 1 - (uv[1] * 0.5 + 0.5);
    });
    let fp = require('json!./data/fp.json').map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    let findFPIndex = (v) => {
      let dist = Number.MAX_VALUE;
      let index = -1;
      fp.forEach((p, i) => {
        let d = p.distanceToSquared(v);
        if (d < dist) {
          dist = d;
          index = i;
        }
      });
      return index;
    };
    let geometry = new THREE.JSONLoader().parse(require('json!./data/eyemouth.json')).geometry;
    let fpIndices = geometry.vertices.map((v) => {
      let index = findFPIndex(v);
      v.copy(this.featurePoints[index].position);
      // v.z -= 0.01;
      return index;
    });
    geometry.faces.forEach((face, i) => {
      let uv = geometry.faceVertexUvs[0][i];
      uv[0].x = this.featurePointUV[fpIndices[face.a]][0];
      uv[0].y = this.featurePointUV[fpIndices[face.a]][1];
      uv[1].x = this.featurePointUV[fpIndices[face.b]][0];
      uv[1].y = this.featurePointUV[fpIndices[face.b]][1];
      uv[2].x = this.featurePointUV[fpIndices[face.c]][0];
      uv[2].y = this.featurePointUV[fpIndices[face.c]][1];
    });
    geometry.uvsNeedUpdate = true;
    this.eyemouth = new THREE.Mesh(geometry, this.material);
    this.add(this.eyemouth);
  }

}
