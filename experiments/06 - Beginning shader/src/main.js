// shim
window.navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// require
require('babel/polyfill');
require('./main.sass');
document.body.innerHTML = require('./body.jade')();

const THREE = require('three');
const dat = require('dat-gui');

const delayAsync = t => new Promise(resolve => setTimeout(resolve, t));

const requestAnimationFrameAsync = () => new Promise(resolve => requestAnimationFrame(resolve));

function createWebCamAsync() {
  return new Promise((resolve, reject)=> {
    window.navigator.getUserMedia({video : true},
      (stream)=>{
        let video = document.createElement('video');
        video.src = window.URL.createObjectURL(stream);
        resolve(video);
      }
      ,(error)=>{
        reject(error);
      }
    );
  });
}

async function main() {
  //==============
  // Scene
  let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 300;

  let scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 100, 600);

  let renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);

  let container = document.querySelector('.container');
  container.appendChild(renderer.domElement);

  //==============
  // Webcam
  let video = await createWebCamAsync();
  video.play();
  await delayAsync(1000);

  let texture = new THREE.Texture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  let material = new THREE.ShaderMaterial({
    vertexShader:require('./webcamzoom.vert'),
    fragmentShader:require('./webcamzoom.frag'),
    uniforms: {
      texture: {type: 't', value: texture},
      rate: {type: 'f', value:0},
      center: {type: 'v2', value: new THREE.Vector2(0.5, 0.5)},
      waveForce: {type: 'f', value:0.02},
      zoomForce: {type: 'f', value:0.3}
    }
  });

  let geometry = new THREE.PlaneGeometry(400, 300, 30, 40);
  let mesh = new THREE.Mesh( geometry, material);
  scene.add(mesh);

  //==============
  // dat GUI
  let gui = new dat.GUI();
  gui.add(material, 'wireframe');
  gui.add(material.uniforms.rate, 'value', 0, 1).name('rate');
  let gui_center = gui.addFolder('center');
  gui_center.add(material.uniforms.center.value, 'x', 0, 1);
  gui_center.add(material.uniforms.center.value, 'y', 0, 1);
  gui.add(material.uniforms.waveForce, 'value', 0.0, 0.1).name('waveForce');
  gui.add(material.uniforms.zoomForce, 'value', 0.0, 1.0).name('zoomForce');

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
    renderer.render(scene, camera);
    texture.needsUpdate = true;
  }

}

main();
