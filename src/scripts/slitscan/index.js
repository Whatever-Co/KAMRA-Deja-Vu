// Require
const SlitScan = require("./SlitScan.js");

//-------------------------------
// Deform/index.js

let video;
let ctrack;

/*********** Code for face substitution *********/

const app = new SlitScan(document.getElementById('webgl'));
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
  app.load(videocanvas, newPos);

  // get position of face
  app.draw(newPos);
  if (ph.debug) {
    app.drawGrid(newPos);
    video.style.opacity = 0.4;
  }
  else {
    video.style.opacity = 0;
  }
  requestAnimFrame(drawMaskLoop);
}


/********** parameter code *********/

const parameterHolder = function() {
  this.debug = false;
  this.mode = 0;
};
const ph = new parameterHolder();
const gui = new dat.GUI();
gui.add(ph, 'debug');
gui.add(ph, 'mode', {FOUR_EYE:0,DOUBLE_MOUTH:1}).onChange(mode=>{
  app.setMode(mode);
});

/********** EXPORT **********/

export function start(video_, ctrack_) {
  video = video_;
  ctrack = ctrack_;

  videocanvas.width = video.width;
  videocanvas.height = video.height;

  drawMaskLoop();
}

export function onMidi(data) {
  // note on
  if(data.message == 144) {
    // nothing
  }
}
