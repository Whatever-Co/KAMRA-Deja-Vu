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
  let camera = new THREE.PerspectiveCamera(16, window.innerWidth / window.innerHeight, 10, 10000);
  camera.position.z = 2700;

  let scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 100, 600);

  let renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);

  let container = document.querySelector('.container');
  container.appendChild(renderer.domElement);

  //==============
  // Webcam
  // let video = await createWebCamAsync();
  // video.play();
  // await delayAsync(1000);

  let videoCanvas = document.createElement('canvas');
  videoCanvas.width = videoCanvas.height = 1024;
  let ctx = videoCanvas.getContext('2d');

  // let texture = new THREE.Texture(video);
  let texture = new THREE.Texture(videoCanvas);
  // texture.minFilter = THREE.LinearFilter;
  // texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;

  {
    let loader = new THREE.TextureLoader();
    loader.load('uvcheck.png', (texture) => {
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      material.uniforms.texture.value = texture;
    });
  }

  let material = new THREE.ShaderMaterial({
    vertexShader:require('./webcamzoom.vert'),
    fragmentShader:require('./webcamzoom.frag'),
    uniforms: {
      texture: {type: 't', value: texture},
      rate: {type: 'f', value: 0.001},
      frame: {type: 'f', value: 0.0},
      faceCenter: {type: 'v2', value: new THREE.Vector2(0.5, 0.5)},
      faceRadius: {type: 'f', value: 0.5},
      waveForce: {type: 'f', value: 0.03},
      zoomForce: {type: 'f', value: 1.3}
    }
  });

  let geometry = new THREE.PlaneGeometry(16 / 9, 1, 16 * 4, 9 * 4);
  let mesh = new THREE.Mesh( geometry, material);
  let scale = Math.tan(THREE.Math.degToRad(camera.fov / 2)) * camera.position.z * 2;
  mesh.scale.set(scale, scale, scale);
  scene.add(mesh);

  //==============
  // dat GUI
  let gui = new dat.GUI();
  gui.add(material, 'wireframe').name('Wireframe?');
  gui.add(material.uniforms.rate, 'value', 0.0, 1.0, 0.01).name('Rate').setValue(0);
  let gui_center = gui.addFolder('Face position');
  gui_center.open();
  gui_center.add(material.uniforms.faceCenter.value, 'x', 0.0, 1.0, 0.01);
  gui_center.add(material.uniforms.faceCenter.value, 'y', 0.0, 1.0, 0.01);
  gui_center.add(material.uniforms.faceRadius, 'value', 0.0, 1.0, 0.01).name('Radius');
  gui.add(material.uniforms.waveForce, 'value', 0.0, 0.2, 0.001).name('Wave froce');
  gui.add(material.uniforms.zoomForce, 'value', 0.0, 2.0, 0.01).name('Zoom force');

  //==============
  // Events
  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    let scale = Math.tan(THREE.Math.degToRad(camera.fov / 2)) * camera.position.z * 2;
    mesh.scale.set(scale, scale, scale);
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  //==============
  // Loop
  const loop = true;
  while (loop) {
    let timestamp = await requestAnimationFrameAsync();
    material.uniforms.frame.value = (timestamp + 10000) / 1000 * 24;

    // let h = video.videoWidth / 16 * 9;
    // let y = (video.videoHeight - h) / 2;
    // ctx.drawImage(video, 0, y, video.videoWidth, h, 0, 0, videoCanvas.width, videoCanvas.height);
    // texture.needsUpdate = true;

    renderer.render(scene, camera);
  }

}

main();
