/*global THREE*/

// import $ from 'jquery';
require('./main.sass');
document.body.innerHTML = require('./body.jade')();

window.THREE = require('three');
require('OrbitControls');



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

    let container = document.querySelector('.container');
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

    let geometry = new THREE.JSONLoader().parse(require('json!./face.json')).geometry;
    geometry.computeBoundingBox();
    this.face = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({transparent: true, opacity: 0.3, wireframe: true}));
    this.face.position.copy(geometry.boundingBox.center().negate());
    this.root.add(this.face);

    this.featurePointIndices = [];
    require('json!./fp.json').forEach((pa, i) => {
      let p = new THREE.Vector3(pa[0], pa[1], pa[2]);
      this.featurePointIndices.push(p.length() > 0 ? this.findNearestIndex(geometry.vertices, p) : -1);
    });

    console.log(this.featurePointIndices);

    let cube = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    this.featurePointIndices.forEach(index => {
      console.log(index, geometry.vertices[index]);
      if (index < 0) return;
      let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5, depthTest: false});
      let mesh = new THREE.Mesh(cube, material);
      mesh.material.color.setHSL(Math.random(), 0.7, 0.5);
      mesh.position.copy(geometry.vertices[index]);
      this.face.add(mesh);
    });
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

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();
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
