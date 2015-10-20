require('./main.sass');
document.body.innerHTML = require('./body.jade')();

let THREE = require('three');


class Node {

  constructor(id, vertex, box) {
    this.id = id;
    this.vertex = vertex;
    this.box = box;
    this.score = Number.MAX_VALUE;
    this.connection = [];
  }

  connectTo(node) {
    if (this.connection.indexOf(node) == -1) {
      this.connection.push(node);
    // } else {
    //   console.log('dup', this.id, node.id);
    }
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

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    let container = document.querySelector('.container');
    container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('click', this.onClick.bind(this));
  }

  initObjects() {
    let loader = new THREE.JSONLoader();
    loader.load('untitled.json', (geometry, material) => {
      let matrix = new THREE.Matrix4();
      matrix.makeScale(35, 35, 35);
      geometry.applyMatrix(matrix);
      geometry.center();
      // this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true}));
      // this.scene.add(this.mesh);

      this.buildNodes(geometry);
      this.start();
    });

    // let geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    // this.buildNodes(new THREE.SphereGeometry(130, 40, 20, 0, Math.PI * 1.5, Math.PI * 0.2, Math.PI * 0.6));
    // this.buildNodes(new THREE.BoxGeometry(200, 200, 200, 20, 20, 20));
    // this.start();
  }

  buildNodes(geometry) {
    this.mesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true}));
    this.scene.add(this.mesh);

    // console.log(geometry.faces[0]);
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

    geometry.faces.forEach((f) => {
      this.nodes[f.a].connectTo(this.nodes[f.b]);
      this.nodes[f.a].connectTo(this.nodes[f.c]);
      this.nodes[f.b].connectTo(this.nodes[f.a]);
      this.nodes[f.b].connectTo(this.nodes[f.c]);
      this.nodes[f.c].connectTo(this.nodes[f.a]);
      this.nodes[f.c].connectTo(this.nodes[f.b]);
    });
  }

  start(index = -1) {
    this.reset();

    if (index < 0) {
      index = Math.floor(Math.random() * this.nodes.length);
    }
    let start = this.nodes[index];
    start.score = 0;
    start.box.material.color.setHSL(0, 1, 0.5);
    start.box.scale.set(2, 2, 2);
    this.next = [start];
    this.interval = setInterval(this.step.bind(this), 20);
  }

  reset() {
    clearInterval(this.interval);
    this.nodes.forEach((node) => {
      node.box.material.color.setHex(0x808080);
      node.box.scale.set(1, 1, 1);
      node.score = Number.MAX_VALUE;
    });
  }

  step() {
    let next = [];
    this.next.forEach((node) => {
      // console.log(node);
      node.connection.forEach((n) => {
        let score = node.score + node.vertex.distanceTo(n.vertex);
        if (score < n.score) {
          n.score = score;
          n.box.material.color.setHSL((n.score % 200) / 200, 0.7, 0.5);
          next.push(n);
        }
      });
    });

    this.next = next;
    if (this.next.length == 0) {
      clearInterval(this.interval);
      console.log('complete!');
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
<<<<<<< HEAD
    if (this.mesh) {
      this.mesh.rotation.y += 0.002;
    }
=======
    // if (this.mesh) {
    //   this.mesh.rotation.y += 0.002;
    // }
>>>>>>> Add experiments/02
    this.renderer.render(this.scene, this.camera);
  }


  onClick(e) {
<<<<<<< HEAD
=======
    console.log(e);
>>>>>>> Add experiments/02
    let mouse = new THREE.Vector2();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    let intersects = raycaster.intersectObjects(this.mesh.children);
    console.log(intersects);
    if (intersects.length) {
      // intersects[0].object.visible = false;
<<<<<<< HEAD
      this.start(intersects[0].object.index);
=======
      if (e.shiftKey) {
        this.start(intersects[0].object.index);
      } else {
        let node = this.nodes[intersects[0].object.index];
        console.log(node);
      } 
>>>>>>> Add experiments/02
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}


new App();
