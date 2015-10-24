/*global THREE*/

// import $ from 'jquery';
require('./main.sass');
document.body.innerHTML = require('./body.jade')();

window.THREE = require('three');
require('OrbitControls');
require('OBJLoader');


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
    window.addEventListener('click', this.onClick.bind(this));
    // window.addEventListener('mousedown', this.onMouseDown.bind(this));
    // this.onMouseMove = this.onMouseMove.bind(this);
    // this.onMouseUp = this.onMouseUp.bind(this);
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  initObjects() {
    // this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 10, 10), new THREE.MeshBasicMaterial({wireframe: true})));

    let hoge = new THREE.Object3D();
    this.scene.add(hoge);

    const loader = new THREE.JSONLoader();
    let geometry = loader.parse(require('json!./face.json')).geometry;
    geometry.computeBoundingBox();
    let bb = geometry.boundingBox;
    hoge.scale.set(200, 200, 200);
    this.face = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({transparent: true, opacity: 0.3, wireframe: true}));
    this.face.position.copy(bb.center().negate());
    hoge.add(this.face);

    let data = require('raw!./fp2.obj');
    let cube = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    let material = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5, depthTest: false});
    this.featurePoints = [];
    data.split(/\n/).forEach(line => {
      let tokens = line.split(' ');
      if (tokens[0] == 'v') {
        let p = new THREE.Mesh(cube, material);
        p.position.set(+tokens[1], +tokens[2], +tokens[3]);
        this.face.add(p);
        this.featurePoints.push(p);
      }
    });
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
    let mouse = new THREE.Vector2();
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
    }
  }

  onKeyDown(e) {
    console.log(e);
    switch (e.keyCode) {
      case 13: // Enter
        console.log(JSON.stringify(this.orderedFeaturePoints.map(p => [p.x, p.y, p.z])));
        break;
      case 32: // Space
        this.orderedFeaturePoints.push(new THREE.Vector3());
        break;
    }
  }

}


new App();
