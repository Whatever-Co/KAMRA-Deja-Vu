/*global THREE*/
import 'OrbitControls';

import FaceTracker from './facetracker';
import Face from './face';

import './main.sass';
document.body.innerHTML = require('./body.jade')();



class ImageApp {

  constructor() {
    this.animate = this.animate.bind(this);

    document.body.addEventListener('dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }, false);
    document.body.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      let file = e.dataTransfer.files[0];
      if (file.type.match(/image/i)) {
        let reader = new FileReader();
        reader.onload = (e) => {
          this.startTracker(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    this.initScene();

    this.tracker = new FaceTracker();
    this.tracker.on('tracked', () => {
      this.initObjects();
      this.animate();
    });
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


  startTracker(url) {
    let container = document.querySelector('#tracker');

    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      this.scene.remove(this.scene.children[i]);
    }
    if (this.tracker.target) {
      container.removeChild(this.tracker.target);
      container.removeChild(this.tracker.debugCanvas);
    }
    cancelAnimationFrame(this.requestId);
    this.face = null;

    this.tracker.startImage(url);

    container.appendChild(this.tracker.target);
    container.appendChild(this.tracker.debugCanvas);
  }


  initObjects() {
    this.face = new Face(this.tracker);
    this.face.scale.set(150, 150, 150);
    this.scene.add(this.face);
  }


  animate() {
    this.requestId = requestAnimationFrame(this.animate);

    this.controls.update();
    if (this.face) {
      this.face.rotation.y += 0.01;
    }
    this.renderer.render(this.scene, this.camera);
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

}



class CameraApp {

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.animate = this.animate.bind(this);

    this.initScene();
    this.animate();

    this.tracker = new FaceTracker();

    navigator.webkitGetUserMedia({
      video: {
        mandatory: {
          minWidth: 640,
          minHeight: 360,
          maxWidth: 1280,
          maxHeight: 720
        }
      }
    }, (stream) => {
      let video = document.createElement('video');
      video.style.transform = 'scale(-1, 1)';
      video.autoplay = true;
      video.src = window.URL.createObjectURL(stream);
      document.querySelector('#tracker').appendChild(video);
      video.addEventListener('loadedmetadata', (e) => {
        console.log(e);
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        this.tracker.startVideo(video);
        this.tracker.debugCanvas.id = 'tracker-debug';
        document.querySelector('#tracker').appendChild(this.tracker.debugCanvas);
        document.addEventListener('keydown', this.onKeyDown);
      });
    }, () => {
      console.error('?');
    });
  }


  onKeyDown(e) {
    e.preventDefault();
    console.log(e.keyCode);
    if (e.keyCode == 32) {
      // this.tracker.stop();
      if (this.face) {
        this.scene.remove(this.face);
        this.face = null;
      }
      this.face = new Face(this.tracker);
      this.face.scale.set(150, 150, 150);
      this.scene.add(this.face);
    }
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


  animate() {
    this.requestId = requestAnimationFrame(this.animate);

    this.controls.update();
    // if (this.face) {
    //   this.face.rotation.y += 0.01;
    // }
    this.renderer.render(this.scene, this.camera);
  }


  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

}


// new ImageApp();
new CameraApp();
