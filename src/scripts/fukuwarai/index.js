// Require
const FaceDeformer = require("./FaceDeformer.js");
const verticleData = require("./verticle_data.js");

//-------------------------------
// Deform/index.js

let video;
let ctrack;

/*********** Code for face substitution *********/

const fd = new FaceDeformer(
  document.getElementById('webgl'),
  verticleData.getAll()
);
{
  const wc1 = document.getElementById('webgl').getContext('webgl');
  wc1.clearColor(0,0,0,0);
}
// canvas for copying videoframes to
const videocanvas = document.createElement('canvas');


/**
 * Show deformd face
 */
function drawMaskLoop() {
  // copy video texture
  videocanvas.getContext('2d').drawImage(video,0,0,videocanvas.width,videocanvas.height);

  let pos = ctrack.getCurrentPosition(video);
  if (!pos) {
    // no tracking object
    requestAnimFrame(drawMaskLoop);
    return;
  }

  // create additional points around face
  let tempPos;
  let addPos = [];
  for (let i=0; i<23; i++) {
    tempPos = [];
    tempPos[0] = (pos[i][0] - pos[62][0])*1.3 + pos[62][0];
    tempPos[1] = (pos[i][1] - pos[62][1])*1.3 + pos[62][1];
    addPos.push(tempPos);
  }
  // merge with pos
  const newPos = pos.concat(addPos);

  // merge with newVertices
  fd.load(videocanvas, newPos);

  // get position of face
  fd.draw(newPos);
  if (ph.debug) {
    fd.drawGrid(newPos);
    video.style.opacity = 0.8;
  }
  else {
    video.style.opacity = 1.0;
  }
  requestAnimFrame(drawMaskLoop);
}


/********** parameter code *********/

const parameterHolder = function() {
  this.debug = true;
};
const ph = new parameterHolder();
const gui = new dat.GUI();
gui.add(ph, 'debug');

/********** EXPORT **********/

export function start(video_, ctrack_) {
  video = video_;
  ctrack = ctrack_;

  videocanvas.width = video.width;
  videocanvas.height = video.height;

  drawMaskLoop();
}

export function onMidi(data) {
  // on
  if(data.message == 144) {
    // nothing
  }
}
