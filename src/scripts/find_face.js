// Shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

const checks = require("./checks.js");

// check whether browser supports webGL
if (!checks.checkWebGL()) {
  alert("Your browser does not seem to support WebGL. Unfortunately this face mask example depends on WebGL, so you'll have to try it in another browser. :(");
}
// setup webcam
if (!navigator.getUserMedia) {
  alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
}

let video = document.getElementById('videoel');
let overlay = document.getElementById('overlay');
let overlayCC = overlay.getContext('2d');
let ctrack;
let callback;

checks.requestWebcam(video);

function drawGridLoop() {
  // check whether something tracking.
  let positions = ctrack.getCurrentPosition(video);
  if (!positions) {
    requestAnimFrame(drawGridLoop);
    return;
  }

  // draw current tracking
  overlayCC.clearRect(0, 0, 400, 300);
  ctrack.draw(overlay);

  // check whether mask has converged
  let pn = ctrack.getConvergence();
  if (pn >= 0.4) {
    requestAnimFrame(drawGridLoop);
    return;
  }

  // found
  overlayCC.clearRect(0, 0, 400, 300);
  callback();
}

//----------------

export function start(video_, tracker_, callback_) {
  video = video_;
  ctrack = tracker_;
  overlay = document.getElementById('overlay');
  overlayCC = overlay.getContext('2d');
  callback = callback_;

  // start tracking
  video.play();
  ctrack.start(video);
  // start drawing face grid
  drawGridLoop();
}