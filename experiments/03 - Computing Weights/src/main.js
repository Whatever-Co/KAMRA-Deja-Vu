require('./main.sass');
document.body.innerHTML = require('./body.jade')();

let THREE = require('three');


class Node {

  constructor(id, vertex, box) {
    this.id = id;
    this.vertex = vertex;
    this.box = box;
    this.score = [];
    this.connection = [];
    this.weights = [];
    this.isFeaturePoint = false;
  }

  connectTo(node) {
    if (this.connection.indexOf(node) == -1) {
      this.connection.push(node);
    }
  }

  setHSLColor(h, s, l) {
    this.box.material.color.setHSL(h, s, l);
  }

  focus(focus = true) {
    let s = focus ? 2 : 0;
    this.box.scale.set(s, s, s);
  }

  nearestFeaturePointIndex() {
    let index = 0;
    let distance = this.score[0];
    this.score.forEach((d, i) => {
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
    this.initScene();
    this.initObjects();
    this.animate();
  }

  initScene() {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.z = 300;

    // this.controls = new THREE.OrbitControls(this.camera);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 100, 600);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    let container = document.querySelector('.container');
    container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize.bind(this));
    // window.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  initObjects() {
    // let loader = new THREE.JSONLoader();
    // loader.load('untitled.json', (geometry, material) => {
    //   let matrix = new THREE.Matrix4();
    //   matrix.makeScale(35, 35, 35);
    //   geometry.applyMatrix(matrix);
    //   geometry.center();
    //   // this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true}));
    //   // this.scene.add(this.mesh);

    //   this.buildNodes(geometry);
    //   this.start();
    // });

    this.buildNodes(new THREE.PlaneGeometry(300, 300, 20, 20));
    // this.buildNodes(new THREE.SphereGeometry(130, 40, 20, 0, Math.PI * 1.5, Math.PI * 0.2, Math.PI * 0.6));
    // this.buildNodes(new THREE.BoxGeometry(200, 200, 200, 20, 20, 20));

    this.featurePoints = [129, 119, 323, 351];
    this.featurePoints.forEach(i => {
      this.nodes[i].isFeaturePoint = true;
      this.nodes[i].focus();
    });

    let colors = [0, 1, 2, 3].map(i => new THREE.Color(`hsl(${i / 4}, 70%, 50%)`));
    console.log(colors);

    for (let i = 0; i < this.featurePoints.length; i++) {
      this.nodes.forEach(node => node.score[i] = Number.MAX_VALUE);
      let start = this.nodes[this.featurePoints[i]];
      start.score[i] = 0;
      let processing = [start];
      while (processing.length) {
        let next = [];
        processing.forEach(node => {
          node.connection.forEach(n => {
            let score = node.score[i] + node.vertex.distanceTo(n.vertex);
            if (score < n.score[i]) {
              n.score[i] = score;
              next.push(n);
            }
          });
        });
        processing = next;
      }
    }

    this.nodes.forEach((target) => {
    // for (let k = 0; k < 3; k++) {
    // let target = this.nodes[this.featurePoints[0]];
      // node.setHSLColor((node.score[3] % 200) / 200, 0.7, 0.5);
      console.log('target', target);

    // let target = this.nodes[180];
      // target.focus();
      // console.log(target.score);
      let nearest = target.nearestFeaturePointIndex();
      console.log('nearest', nearest);
      let fp1 = this.nodes[this.featurePoints[nearest]];
      // console.log('fp1', fp1.vertex);
      let p = target.vertex.clone().sub(fp1.vertex);
      // console.log('p', p);
      let angles = this.featurePoints.map((index, i) => {
        let target = this.nodes[index].vertex.clone().sub(fp1.vertex);
        let angle = p.angleTo(target);
        // console.log(i, index, target, angle, THREE.Math.radToDeg(angle));
        return {index: i, angle: angle};
      }).filter(a => {
        return !isNaN(a.angle) && a.angle < Math.PI / 2;
      }).sort((a, b) => a.angle - b.angle);
    // console.log(angles);
      // angles.forEach((a, i) => console.log(i, a));

      let d = 0;
      switch (angles.length) {
        case 0:
          break;
        case 1:
          d = fp1.score[angles[0].index] / Math.cos(angles[0].angle);
          break;
        default:
          let d2 = fp1.score[angles[0].index];
          let d3 = fp1.score[angles[1].index];
          // console.log('d1', d1, 'd2', d2, 'd3', d3);
          let cos2 = Math.cos(angles[0].angle);
          let cos3 = Math.cos(angles[1].angle);
          // console.log('cos2', cos2, 'cos3', cos3);
          d = (d2 * cos2 + d3 * cos3) / (cos2 + cos3);
          break;
      }
      // console.log('d', d);
      if (d == 0) {
        target.weights = this.featurePoints.map((id, i) => i == nearest ? 1 : 0);
      } else {
        const HALF_PI = Math.PI / 2;
      // target.weights = target.score.map(dist => Math.max(0, Math.sin(HALF_PI * (1.0 - dist / d))));
        target.weights = [0, 0, 0, 0];
        target.weights[nearest] = Math.max(0, Math.sin(HALF_PI * (1.0 - target.score[nearest] / d)));
        for (let i = 0; i < Math.min(2, angles.length); i++) {
          target.weights[angles[i].index] = Math.max(0, Math.sin(HALF_PI * (1.0 - target.score[angles[i].index] / d)));
        }
      }
      console.log('weights', target.weights);
      let wsum = 0;
      let c = new THREE.Color(0);
      target.weights.forEach((w, i) => {
        // console.log(i, w, colors[i].r, colors[i].g, colors[i].b);
        c.r += colors[i].r * w;
        c.g += colors[i].g * w;
        c.b += colors[i].b * w;
        wsum += w;
      });
      // console.log('color', c.r, c.g, c.b, wsum);
      c.r /= wsum;
      c.g /= wsum;
      c.b /= wsum;
      target.box.material.color.copy(c);
    // }
    });

    // let fp = this.nodes[this.featurePoints[0]];
    // fp.box.position.x += 10;
    this.update();
  }

  buildNodes(geometry) {
    this.mesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3}));
    this.scene.add(this.mesh);

    this.nodes = [];
    geometry.vertices.forEach((v, i) => {
      let box = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshBasicMaterial({color: 0x808080})
        );
      box.index = i;
      box.position.copy(v);
      this.mesh.add(box);
      this.nodes.push(new Node(i, v, box));
    });


    let connected = {};
    let connect = (a, b) => {
      let key = a << 16 | b;
      if (connected[key]) return;
      this.nodes[a].connectTo(this.nodes[b]);
      connected[key] = true;
      this.nodes[b].connectTo(this.nodes[a]);
      connected[b << 16 | a] = true;
    };
    geometry.faces.forEach((f) => {
      connect(f.a, f.b);
      connect(f.b, f.c);
      connect(f.c, f.a);
    });
  }

  update() {
    // let target = this.nodes[180];
    this.nodes.forEach(target => {
      // let target = this.nodes[this.nodes.length-1];
      if (target.isFeaturePoint) return;
      // console.log(target.weights);
      let a = new THREE.Vector3();
      let b = 0;
      this.featurePoints.forEach((index, i) => {
        let fp = this.nodes[index];
        let displacement = fp.box.position.clone().sub(fp.vertex).multiplyScalar(target.weights[i]);
        let dist = 1.0 / (target.score[i] * target.score[i]);
        // console.log(index, i, target.weights[i], displacement, dist);
        a.add(displacement.multiplyScalar(dist));
        b += target.weights[i] * dist;
      });
      a.multiplyScalar(1 / b);
      target.box.position.copy(target.vertex).add(a);
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    // if (this.mesh) {
    //   this.mesh.rotation.y += 0.002;
    // }
    this.renderer.render(this.scene, this.camera);
  }

  onClick(e) {
    let mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    let intersects = raycaster.intersectObjects(this.mesh.children);
    if (intersects.length) {
      console.log(intersects[0].object);
      if (e.shiftKey) {
      } else {
      } 
    }
  }

  onMouseDown(e) {
    e.preventDefault();
    let mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    let intersects = raycaster.intersectObjects(this.mesh.children);
    if (intersects.length) {
      this.dragging = intersects[0].object;
      this.prevMouse = mouse;
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
    }
  }

  onMouseMove(e) {
    e.preventDefault();
    let x = (e.clientX / window.innerWidth) * 2 - 1;
    let y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.dragging.position.x += (x - this.prevMouse.x) * 200;
    this.dragging.position.y += (y - this.prevMouse.y) * 200;
    this.prevMouse.x = x;
    this.prevMouse.y = y;
    this.update();
  }
 
  onMouseUp(e) {
    e.preventDefault();
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}


new App();
