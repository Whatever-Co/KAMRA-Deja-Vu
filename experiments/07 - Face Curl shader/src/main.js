// shim
window.navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// require
require('babel/polyfill');
require('./main.sass');
document.body.innerHTML = require('./body.jade')();

const THREE = require('three');
window.THREE = THREE; // export to global
require('OrbitControls');

const dat = require('dat-gui');

const requestAnimationFrameAsync = () => new Promise(resolve => requestAnimationFrame(resolve));

async function main() {
  //==============
  // Scene
  let camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.z = 500;
  // camera.position.set(300, 200, 300).setLength(500);

  let scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0x000000, 100, 600);

  let renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x1a2b34);

  let container = document.querySelector('.container');
  container.appendChild(renderer.domElement);

  let controls = new THREE.OrbitControls(camera, renderer.domElement);

  //==============
  // Model
  let texture = new THREE.ImageUtils.loadTexture('uvcheck.png');
  texture.anisotropy = renderer.getMaxAnisotropy();
  let material = new THREE.ShaderMaterial({
    vertexShader:require('raw!./curl_flip.vert'),
    fragmentShader:require('raw!./curl_flip.frag'),
    side: THREE.DoubleSide,
    uniforms: {
      texture: {type: 't', value: texture},
      cameraZ: {type: 'f', value: camera.position.z},
      scaleZ: {type: 'f', value: 0.001},
      curlOffset: {type: 'f', value: 0.001},
      curlStrength: {type: 'f', value: THREE.Math.degToRad(270)},
      curlRotateX: {type: 'f', value: 0.001}
    }
  });

  let geometry = new THREE.JSONLoader().parse(require('./face.json')).geometry;
  geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 40 / 150));
  let mesh = new THREE.Mesh( geometry, material);
  mesh.scale.set(150, 150, 150);
  scene.add(mesh);
  {
    mesh.updateMatrixWorld();
    mesh.geometry.computeBoundingBox();
    let bbox = mesh.geometry.boundingBox;
    mesh.localToWorld(bbox.min);
    mesh.localToWorld(bbox.max);
    console.log(bbox.min, bbox.max, bbox.max.clone().sub(bbox.min));
  }

  scene.add(new THREE.AxisHelper(100));

  //==============
  // dat GUI
  let gui = new dat.GUI();
  gui.add(material, 'wireframe');
  let scaleZ = gui.add(material.uniforms.scaleZ, 'value', 0.0, 1.0, 0.01).name('Scale Z').setValue(0);
  gui.add(material.uniforms.curlOffset, 'value', 90, 300, 0.1).name('Curl Offset').setValue(300);
  gui.add(material.uniforms.curlStrength, 'value', 0, Math.PI * 2, 0.001).name('Curl Strength');
  gui.add(material.uniforms.curlRotateX, 'value', 0, Math.PI * 2, 0.001).name('Curl Rotate X').setValue(0);

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
    // scaleZ.setValue(Math.sin(Date.now() / 500) * 0.7 + 0.5);
    renderer.render(scene, camera);
    controls.update();
  }

}

main();
