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
const videoCanvas = document.createElement('canvas');
const scanCanvas = document.createElement('canvas');
const scanCanvasCtx = scanCanvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayCtx = overlay.getContext('2d');

const param = {
  debug:false,
  mode:0,
  foreheadExtend:1.6
};

let scanningIndex = 0;

/**
 * Show deformd face
 */
function loop() {
  // copy video texture
  videoCanvas.getContext('2d').drawImage(video,0,0,videoCanvas.width,videoCanvas.height);

  let pos = ctrack.getCurrentPosition(video);
  if (!pos) {
    // no tracking object
    requestAnimFrame(loop);
    return;
  }

  // create additional points around face
  let tempPos;
  let addPos = [];
  for (let i=0; i<23; i++) {
    tempPos = [];
    tempPos[0] = (pos[i][0] - pos[62][0])*param.foreheadExtend + pos[62][0];
    tempPos[1] = (pos[i][1] - pos[62][1])*param.foreheadExtend + pos[62][1];
    addPos.push(tempPos);
  }
  // merge with pos
  const newPos = pos.concat(addPos);

  // merge with newVertices
  app.load(videoCanvas, newPos);

  // get position of face
  app.draw(newPos);
  if (param.debug) {
    app.drawGrid(newPos);
    video.style.opacity = 0.4;
  }
  else {
    video.style.opacity = 0;
  }



  overlayCtx.rect(0,0,app.canvas.width,app.canvas.height);
  overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.001)';
  overlayCtx.fill();

  if(param.mode == 0) {
    _scanAll();
  } else if(param.mode == 1) {
    _scanHorizontal();
  } else if(param.mode == 2) {
    _scanVertical();
  }

  requestAnimFrame(loop);
}

function _scanAll() {
  // capture all face with alpha channnel
  overlayCtx.drawImage(app.canvas, 0, 0);
}

function _scanHorizontal() {
  const height = app.canvas.height;
  const bounds = app.bounds;

  // loop in the face bounding box
  if(scanningIndex == 0) {
    scanningIndex = bounds.xMin;
  }
  overlayCtx.drawImage(app.canvas,
    scanningIndex, 0, 2, height,
    scanningIndex, 0, 2, height
  );
  scanningIndex += 1;
  if(scanningIndex >= bounds.xMax) {
    scanningIndex = 0;
  }
}

function _scanVertical() {
  const width = app.canvas.width;
  const bounds = app.bounds;

  // loop in the face bounding box
  if(scanningIndex == 0) {
    scanningIndex = bounds.yMin;
  }
  overlayCtx.drawImage(app.canvas,
    0, scanningIndex, width, 2,
    0, scanningIndex, width, 2
  );
  scanningIndex += 1;
  if(scanningIndex >= bounds.yMax) {
    scanningIndex = 0;
  }
}


/********** parameter code *********/


const gui = new dat.GUI();
gui.add(param, 'debug');
gui.add(param, 'mode', {All:0, Horizontal:1, Vertical:2}).onChange(mode=>{
  scanningIndex = 0;

  overlayCtx.rect(0,0,app.canvas.width,app.canvas.height);
  overlayCtx.fillStyle="black";
  overlayCtx.fill();
});
gui.add(param, 'foreheadExtend', 1.2, 2.0);
gui.add(app, 'fallbackLength', 0.1, 0.5);
gui.add(app, 'fallbackPower', 5.0, 30.0);


/********** EXPORT **********/

export function start(video_, ctrack_) {
  video = video_;
  ctrack = ctrack_;

  videoCanvas.width = video.width;
  videoCanvas.height = video.height;

  loop();
}

export function onMidi(data) {
  // note on
  if(data.message == 144) {
    // nothing
  }
}
