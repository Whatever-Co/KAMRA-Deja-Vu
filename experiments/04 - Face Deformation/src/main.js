/*global THREE*/

// import $ from 'jquery';
require('./main.sass');
document.body.innerHTML = require('./body.jade')();

window.THREE = require('three');
import 'OrbitControls';



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
    this.animate();
  }


  initScene() {
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000);
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
    this.root.scale.set(90, 90, 90);
    this.scene.add(this.root);

    const geometry = new THREE.JSONLoader().parse(require('json!./face.json')).geometry;
    geometry.computeBoundingBox();
    this.face = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({transparent: true, opacity: 0.3, wireframe: true}));
    this.face.position.copy(geometry.boundingBox.center().negate());
    this.root.add(this.face);

    this.featurePointIndices = [];
    require('json!./fp.json').forEach((pa) => {
      const p = new THREE.Vector3(pa[0], pa[1], pa[2]);
      this.featurePointIndices.push(p.length() > 0 ? this.findNearestIndex(geometry.vertices, p) : -1);
    });

    // console.log(this.featurePointIndices);

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

    let cube = new THREE.BoxGeometry(0.03, 0.03, 0.03);
    this.featurePoints = this.featurePointIndices.map((i) => {
      if (i < 0) return;
      let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.7, depthTest: false});
      material.color.setHSL(Math.random(), 0.7, 0.5);
      let mesh = new THREE.Mesh(cube, material);
      mesh.vertexIndex = i;
      mesh.position.copy(geometry.vertices[i]);
      this.face.add(mesh);
      return mesh;
    });

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


  update() {
    let vertices = this.face.geometry.vertices;

    let displacement = this.featurePoints.map((mesh) => {
      if (!mesh) return;
      let node = this.nodes[mesh.vertexIndex];
      // console.log(i, mesh.position.clone().sub(node.position));
      return mesh.position.clone().sub(node.position);
    });
    this.nodes.forEach((target) => {
    // let target = this.nodes[327];
      if (target.weights.length == 0) return;
      if (target.weights.length == 1) {
        let w = target.weights[0];
        // console.log(target.index, this.featurePointIndices[w.i], w);
        vertices[target.index].copy(target.position).add(displacement[w.i].clone().multiplyScalar(w.w));
      } else {
        let a = new THREE.Vector3();
        let b = 0;
        target.weights.forEach((w) => {
        // console.log(w, displacement[w.i], target.distanceToFP[w.i]);
          let dp = displacement[w.i].clone().multiplyScalar(w.w);
          let dist = 1.0 / (target.distanceToFP[w.i] * target.distanceToFP[w.i]);
        // console.log(dp, dist);
          a.add(dp.multiplyScalar(dist));
          b += w.w * dist;
        });
        // console.log(a, b, target.weights.length);
        a.multiplyScalar(1 / b);
        // console.log(a);
        vertices[target.index].copy(target.position).add(a);
      }
    });

    this.face.geometry.verticesNeedUpdate = true;
  }


  animate(t) {
    requestAnimationFrame(this.animate);

    this.controls.update();

    const y = this.featurePoints[50].position.y;
    [45, 46, 47, 48, 49, 59, 60, 61, 51, 52, 53, 54, 55, 56, 57, 58].forEach((i) => {
      let fp = this.featurePoints[i];
      let v = this.nodes[fp.vertexIndex];
      fp.position.y = y + (v.position.y - y) * (Math.sin(t / 500) + 2.2) * 0.7;
    });

    // this.featurePoints.forEach((fp) => {
    //   if (fp) {
    //     let v = this.nodes[fp.vertexIndex];
    //     fp.position.x = v.position.x + Math.sin(t / 500 + v.position.y) * 0.5;
    //   }
    // });

    this.update();

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
