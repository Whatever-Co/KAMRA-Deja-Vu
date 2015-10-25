/*global THREE*/

// import $ from 'jquery';
require('./main.sass');
document.body.innerHTML = require('./body.jade')();

import FaceTracker from './facetracker';

window.THREE = require('three');
require('OrbitControls');
require('OBJLoader');

import {vec2, mat3} from 'gl-matrix';
// console.log(vec2, mat3);


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



class App {

  constructor() {
    this.animate = this.animate.bind(this);

    this.orderedFeaturePoints = [];

    this.initScene();
    this.initObjects();
    this.initTracker();
    this.animate();
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000);
    // let w = window.innerWidth / 2;
    // let h = window.innerHeight / 2;
    // this.camera = new THREE.OrthographicCamera(-w, w, h, -h, 1, 3000);
    this.camera.position.z = 500;

    this.controls = new THREE.OrbitControls(this.camera);

    this.scene = new THREE.Scene();
    // this.scene.fog = new THREE.Fog(0x000000, 100, 600);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.querySelector('.container');
    container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize.bind(this));
    // window.addEventListener('click', this.onClick.bind(this));
    // window.addEventListener('mousedown', this.onMouseDown.bind(this));
    // this.onMouseMove = this.onMouseMove.bind(this);
    // this.onMouseUp = this.onMouseUp.bind(this);
    // window.addEventListener('keydown', this.onKeyDown.bind(this));
  }


  initObjects() {
    this.root = new THREE.Object3D();
    this.root.scale.set(150, 150, 150);
    this.scene.add(this.root);

    let geometry = new THREE.JSONLoader().parse(require('json!./face.json')).geometry;
    console.log(geometry);
    geometry.computeBoundingBox();
    // let material = new THREE.MeshBasicMaterial({transparent: true, opacity: Math.pow(0.5, 2), wireframe: true});
    let material = new THREE.MeshBasicMaterial({color: 0xffffff, map: THREE.ImageUtils.loadTexture('uvcheck.png')});
    this.face = new THREE.Mesh(geometry, material);
    this.face.frustumCulled = false;
    this.face.position.copy(geometry.boundingBox.center().negate());
    this.root.add(this.face);

    // geometry.faceVertexUvs[0].forEach((uvs) => {
    //   uvs.forEach((uv) => {
    //     uv.x = Math.random();
    //     uv.y = Math.random();
    //   });
    // });
    // geometry.uvsNeedUpdate = true;

    this.featurePointIndices = require('json!./fp.json').map((pa) => {
      const p = new THREE.Vector3(pa[0], pa[1], pa[2]);
      return p.length() > 0 ? this.findNearestIndex(geometry.vertices, p) : -1;
    });

    // this.cubes = [];
    // let cube = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    // this.featurePointIndices.forEach(index => {
    //   console.log(index, geometry.vertices[index]);
    //   if (index < 0) return;
    //   let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5, depthTest: false});
    //   let mesh = new THREE.Mesh(cube, material);
    //   mesh.material.color.setHSL(Math.random(), 0.7, 0.5);
    //   mesh.position.copy(geometry.vertices[index]);
    //   this.face.add(mesh);
    //   this.cubes.push(mesh);
    // });

    this.buildConnectionData(geometry);
    this.featurePointIndices.forEach((index, i) => {
      if (index >= 0) {
        this.calcDistanceToFeaturePoint(i);
      }
    });

    // show distance from selected feature point
    // let cube = new THREE.BoxGeometry(0.03, 0.03, 0.03);
    // this.nodes.forEach(node => {
    //   let material = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.5, depthTest: false});
    //   material.color.setHSL(node.distanceToFP[44] / 2, 0.7, 0.5);
    //   let mesh = new THREE.Mesh(cube, material);
    //   mesh.position.copy(node.position);
    //   this.face.add(mesh);
    // });

    // console.log(this.featurePointIndices[33]);
    // this.calcWeightForNode(this.nodes[408]);
    this.nodes.forEach((node) => this.calcWeightForNode(node));

    // let cube = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    // this.nodes.forEach(node => {
    //   node.weights.forEach(w => {
    //     if (w.i == 1) {
    //       let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.7, depthTest: false});
    //       let mesh = new THREE.Mesh(cube, material);
    //       mesh.position.copy(node.position);
    //       mesh.scale.set(w.w, w.w, w.w);
    //       this.face.add(mesh);
    //     }
    //   });
    // });

    let cube = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    this.featurePoints = this.featurePointIndices.map((i) => {
      if (i < 0) return;
      let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.7, depthTest: false});
      material.color.setHSL(Math.random(), 0.7, 0.5);
      let mesh = new THREE.Mesh(cube, material);
      mesh.visible = false;
      mesh.vertexIndex = i;
      mesh.position.copy(geometry.vertices[i]);
      this.face.add(mesh);
      return mesh;
    });

    this.initHeadPoints();

    // this.nodes.forEach((node) => {
    //   node.weights.forEach((w) => {
    //     if (w.i == 0 && w.w > 0.5) {
    //       console.log(node);
    //     }
    //   });
    // });

    // let fp = this.featurePoints[0];
    // fp.position.x = this.nodes[fp.vertexIndex].position.x - 0.5;
    // this.update();

    // console.log(this.featurePoints[62].position);
    // this.root.updateMatrixWorld();
    // console.log(this.featurePoints[62].localToWorld(new THREE.Vector3()));
    // console.log(this.featurePoints[0].localToWorld(new THREE.Vector3()));
    // console.log(this.camera.position);

    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.id = 'texture';
    this.textureCanvas.width = 256;
    this.textureCanvas.height = 256;
    this.textureContext = this.textureCanvas.getContext('2d');
    require('ctx-get-transform')(this.textureContext);
    this.textureContext.fillStyle = 'white';
    this.textureContext.fillRect(0, 0, 256, 256);
    document.body.appendChild(this.textureCanvas);

    this.texture = new THREE.Texture(this.textureCanvas);
    this.texture.needsUpdate = true;
    this.face.material.map = this.texture;
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
    // console.log(index, Math.round(Math.sqrt(distance) * 10000) / 10000);
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
    // console.log('node', node);

    // console.log(node.distanceToFP);
    let nearest = node.nearestFeaturePointIndex();
    // console.log('nearest', nearest);
    let fp1 = this.nodes[this.featurePointIndices[nearest]];
    // console.log('fp1', fp1.position);
    let p = node.position.clone().sub(fp1.position);
    // console.log('p', p);
    let angles = this.featurePointIndices.map((index, i) => {
      if (index < 0) return NaN;
      let node = this.nodes[index].position.clone().sub(fp1.position);
      let angle = p.angleTo(node);
      // console.log(i, index, node, angle, THREE.Math.radToDeg(angle));
      return {index: i, angle};
    }).filter((a) => {
      return !isNaN(a.angle) && a.angle < Math.PI / 2;
    }).sort((a, b) => a.angle - b.angle);
    // angles.forEach((a, i) => console.log(i, a));

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

    node.weights = node.weights.map((w, i) => {
      return {i, w};
    }).sort((a, b) => b.w - a.w).filter((w) => w.w > 0);

    // node.weights.forEach(w => {
    //   console.log(w);
    // });
  }


  initHeadPoints() {
    let v1 = this.featurePoints[14].position.clone();
    let v0 = this.featurePoints[0].position.clone();
    let center = new THREE.Vector3().lerpVectors(v1, v0, 0.5);
    // console.log(center);
    let scale = v1.clone().sub(center).x;
    // console.log(scale);
    for (let i = 71; i < this.featurePoints.length; i++) {
      let fp = this.featurePoints[i];
      let ip = fp.position.clone().sub(center);
      ip.multiplyScalar(1 / scale);
      // console.log(i, ip);
      fp.initialPosition = ip;
    }
  }


  initTracker() {
    this.tracker = new FaceTracker();
    this.tracker.startVideo('media/cap13_edit2.mp4');

    let container = document.querySelector('#tracker');
    container.appendChild(this.tracker.target);
    container.appendChild(this.tracker.debugCanvas);
  }


  updateTexture() {
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
      let center = this.tracker.currentPosition[41];
      let size = Math.max(center[0] - min[0], max[0] - center[0], center[1] - min[1], max[1] - center[1]);
      this.textureContext.save();
      let scale = 128 * 0.9 / size;
      this.textureContext.translate(128, 128);
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
        // this.textureContext.fillRect(q[0] - 3, q[1] - 3, 6, 6);
        vec2.scale(q, q, 1 / 256);
        q[0] -= 0.5;
        q[1] -= 0.5;
        fpuv.push(q);
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
          vec2.scale(p, p, 1 / 256);
          p[0] -= 0.5;
          p[1] -= 0.5;
          fpuv.push(p);
        }
      }

      this.textureContext.fillStyle = 'rgba(0, 0, 255, 0.5)';

      this.featurePoints.forEach((mesh, i) => {
        if (mesh) {
          mesh.position.x = (fpuv[i][0]) * 2;
          mesh.position.y = -(fpuv[i][1]) * 2;
        }
      });

      let displacement = this.featurePoints.map((mesh) => {
        if (!mesh) return;
        let node = this.nodes[mesh.vertexIndex];
        return mesh.position.clone().sub(node.position);
      });
      let uvs = this.nodes.map((target) => {
        let p = new THREE.Vector3();
        if (target.weights.length == 1) {
          let w = target.weights[0];
          p.copy(target.position).add(displacement[w.i].clone().multiplyScalar(w.w));
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
          p.copy(target.position).add(a);
        }
        // this.textureContext.fillRect(p.x * 128 + 128, -p.y * 128 + 128, 2, 2);
        return [(p.x * 128 + 128) / 256, 1 - (-p.y * 128 + 128) / 256];
      });

      this.face.geometry.faces.forEach((face, i) => {
        let uv = this.face.geometry.faceVertexUvs[0][i];
        uv[0].x = uvs[face.a][0];
        uv[0].y = uvs[face.a][1];
        uv[1].x = uvs[face.b][0];
        uv[1].y = uvs[face.b][1];
        uv[2].x = uvs[face.c][0];
        uv[2].y = uvs[face.c][1];
      });
      this.face.geometry.uvsNeedUpdate = true;

      this.textureContext.restore();

      this.texture.needsUpdate = true;
    }
  }


  updateFeaturePoints() {
    if (this.tracker.normalizedPosition) {
      this.tracker.normalizedPosition.forEach((np, i) => {
        let fp = this.featurePoints[i];
        if (fp) {
          let scale = (500 - fp.localToWorld(new THREE.Vector3()).z) / 500 * 0.5;
          fp.position.x += (np[0] * scale - fp.position.x) * 0.3;
          fp.position.y += (-np[1] * scale - fp.position.y) * 0.3;
        }
      });

      let v1 = this.featurePoints[14].position.clone();
      let v0 = this.featurePoints[0].position.clone();
      let center = new THREE.Vector3().lerpVectors(v1, v0, 0.5);
      let rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), v1.clone().sub(center).normalize());
      let scale = v1.clone().sub(center).length();
      for (let i = 71; i < this.featurePoints.length; i++) {
        let fp = this.featurePoints[i];
        fp.position.copy(fp.initialPosition.clone().multiplyScalar(scale).applyQuaternion(rotation).add(center));
      }
    }
  }


  updateMesh() {
    let vertices = this.face.geometry.vertices;

    let displacement = this.featurePoints.map((mesh) => {
      if (!mesh) return;
      let node = this.nodes[mesh.vertexIndex];
      return mesh.position.clone().sub(node.position);
    });
    this.nodes.forEach((target) => {
      if (target.weights.length == 0) return;
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

    // this.face.geometry.computeBoundingBox();
    this.face.geometry.verticesNeedUpdate = true;
  }


  animate() {
    requestAnimationFrame(this.animate);

    this.controls.update();

    // this.updateFeaturePoints();
    this.updateTexture();
    this.updateMesh();

    // const y = this.featurePoints[50].position.y;
    // [45, 46, 47, 48, 49, 59, 60, 61, 51, 52, 53, 54, 55, 56, 57, 58].forEach((i) => {
    //   let fp = this.featurePoints[i];
    //   let v = this.nodes[fp.vertexIndex];
    //   fp.position.y = y + (v.position.y - y) * (Math.sin(t / 500) + 2.2) * 0.7;
    // });

    // this.featurePoints.forEach((fp) => {
    //   if (fp) {
    //     let v = this.nodes[fp.vertexIndex];
    //     fp.position.x = v.position.x + Math.sin(t / 500 + v.position.y) * 0.5;
    //   }
    // });

    this.renderer.render(this.scene, this.camera);
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }


  onClick(e) {
    e.preventDefault();
    /*let mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    let intersects = raycaster.intersectObjects(this.featurePoints);
    if (intersects.length) {
      let p = intersects[0].object;
      console.log(this.orderedFeaturePoints.length, p.position);
      p.scale.set(0.3, 0.3, 0.3);
      this.orderedFeaturePoints.push(p.position.clone());
    }*/
  }

}


new App();
