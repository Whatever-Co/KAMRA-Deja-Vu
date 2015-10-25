/*global THREE*/

// import $ from 'jquery';
require('OrbitControls');
require('OBJLoader');

import FaceTracker from './facetracker';
import Face from './face';

require('./main.sass');
document.body.innerHTML = require('./body.jade')();



class App {

  constructor() {
    this.animate = this.animate.bind(this);

    this.initScene();
    this.startTracker();
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
  }


  startTracker() {
    this.tracker = new FaceTracker();
    this.tracker.startImage('media/franck_01829.jpg');
    this.tracker.on('tracked', () => {
      this.initObjects();
      this.animate();
    });

    let container = document.querySelector('#tracker');
    container.appendChild(this.tracker.target);
    container.appendChild(this.tracker.debugCanvas);
  }


  initObjects() {
    this.root = new THREE.Object3D();
    this.root.scale.set(150, 150, 150);
    this.scene.add(this.root);

    this.face = new Face(this.tracker);
    this.root.add(this.face);
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

}


new App();
