// shim
window.navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// require
require('babel/polyfill');
require('./main.sass');
document.body.innerHTML = require('./body.jade')();

import {mat4, vec3} from 'gl-matrix';


const THREE = require('three');
window.THREE = THREE; // export to global
require('OrbitControls');

const dat = require('dat-gui');

const requestAnimationFrameAsync = () => new Promise(resolve => requestAnimationFrame(resolve));

async function main() {
  //==============
  // Scene
  let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 4;

  let scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 100, 600);

  let renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);

  let container = document.querySelector('.container');
  container.appendChild(renderer.domElement);

  let controls = new THREE.OrbitControls(camera);

  //==============
  // Model
  let texture = new THREE.ImageUtils.loadTexture('uvcheck.png');
  let material = new THREE.ShaderMaterial({
    vertexShader:require('raw!./curl_flip.vert'),
    fragmentShader:require('raw!./curl_flip.frag'),
    side: THREE.DoubleSide,
    uniforms: {
      texture: {type: 't', value: texture},
      rate: {type: 'f', value:0.5},
      scaleZ: {type: 'f', value:0.0},
      radius: {type: 'f', value:0.2},
      curlPushMatrix: {type: 'm4', value:new THREE.Matrix4()},
      curlPopMatrix: {type: 'm4', value:new THREE.Matrix4()}
    }
  });

  let geometry = new THREE.JSONLoader().parse(require('./face.json')).geometry;
  let mesh = new THREE.Mesh( geometry, material);
  scene.add(mesh);

  let param = {
    rotasionZ:0.5,
    offsetX:0,
    offsetY:0
  };

  //==============
  // dat GUI
  let gui = new dat.GUI();
  gui.add(material, 'wireframe');
  gui.add(material.uniforms.rate, 'value', 0.0, 1.0).name('rate');
  gui.add(material.uniforms.scaleZ, 'value', 0.0, 1.2).name('zScale');
  gui.add(material.uniforms.radius, 'value', 0.1, 1.0).name('radius');
  gui.add(param, 'rotasionZ', 0.0, 3.14);
  gui.add(param, 'offsetX', -1.0, 1.0);
  gui.add(param, 'offsetY', -1.0, 1.0);

  //==============
  // Events
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  //==============
  // Loop
  const loop = true;
  while(loop) {
    await requestAnimationFrameAsync();

    // update matrix
    let mat = new THREE.Matrix4();
    mat.makeTranslation(param.offsetX, param.offsetY, 0);
    mat.makeRotationZ(param.rotasionZ);
    //mat.makeScale(0.1, 1.0, 10.0);
    let invMat = new THREE.Matrix4().getInverse(mat);

    material.uniforms.curlPushMatrix.value = mat;
    material.uniforms.curlPopMatrix.value = invMat;

    renderer.render(scene, camera);
    controls.update();
  }

}

main();
