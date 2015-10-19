// Require
const Fukuwarai = require("./Fukuwarai.js");

//-------------------------------
// Deform/index.js

let video;
let ctrack;

/*********** Code for face substitution *********/

const app = new Fukuwarai(document.getElementById('webgl'));
{
  const wc1 = document.getElementById('webgl').getContext('webgl');
  wc1.clearColor(0,0,0,0);
}
// canvas for copying videoframes to
const videoCanvas = document.createElement('canvas');

const param = {
  debug:false,
  mode:0
};

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
    tempPos[0] = (pos[i][0] - pos[62][0])*1.3 + pos[62][0];
    tempPos[1] = (pos[i][1] - pos[62][1])*1.3 + pos[62][1];
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
    video.style.opacity = 1.0;
  }
  requestAnimFrame(loop);
}


/********** parameter code *********/

const gui = new dat.GUI();
gui.add(param, 'debug');
gui.add(param, 'mode', {FOUR_EYE:0,DOUBLE_MOUTH:1}).onChange(mode=>{
  app.setMode(mode);
});

/********** EXPORT **********/

export function start(video_, ctrack_) {
  video = video_;
  ctrack = ctrack_;

  videoCanvas.width = video.width;
  videoCanvas.height = video.height;

  loop();
}

export function onMidi(data) {
  // on
  if(data.message == 144) {
    // nothing
  }
}
