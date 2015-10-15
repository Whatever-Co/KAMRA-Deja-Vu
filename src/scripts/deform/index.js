// Require
const FaceDeformer = require("./FaceDeformer.js");

//-------------------------------
// Deform/index.js

let video;
let ctrack;

/*********** Code for face substitution *********/


const fd = new FaceDeformer(document.getElementById('webgl'));
{
  const wc1 = document.getElementById('webgl').getContext('webgl');
  wc1.clearColor(0,0,0,0);
}

// canvas for copying videoframes to
const videocanvas = document.createElement('canvas');

const mouth_vertices = [
  [44,45,61,44],
  [45,46,61,45],
  [46,60,61,46],
  [46,47,60,46],
  [47,48,60,47],
  [48,59,60,48],
  [48,49,59,48],
  [49,50,59,49],
  [50,51,58,50],
  [51,52,58,51],
  [52,57,58,52],
  [52,53,57,52],
  [53,54,57,53],
  [54,56,57,54],
  [54,55,56,54],
  [55,44,56,55],
  [44,61,56,44],
  [61,60,56,61],
  [56,57,60,56],
  [57,59,60,57],
  [57,58,59,57],
  [50,58,59,50]
];

const extendVertices = [
  [0,71,72,0],
  [0,72,1,0],
  [1,72,73,1],
  [1,73,2,1],
  [2,73,74,2],
  [2,74,3,2],
  [3,74,75,3],
  [3,75,4,3],
  [4,75,76,4],
  [4,76,5,4],
  [5,76,77,5],
  [5,77,6,5],
  [6,77,78,6],
  [6,78,7,6],
  [7,78,79,7],
  [7,79,8,7],
  [8,79,80,8],
  [8,80,9,8],
  [9,80,81,9],
  [9,81,10,9],
  [10,81,82,10],
  [10,82,11,10],
  [11,82,83,11],
  [11,83,12,11],
  [12,83,84,12],
  [12,84,13,12],
  [13,84,85,13],
  [13,85,14,13],
  [14,85,86,14],
  [14,86,15,14],
  [15,86,87,15],
  [15,87,16,15],
  [16,87,88,16],
  [16,88,17,16],
  [17,88,89,17],
  [17,89,18,17],
  [18,89,93,18],
  [18,93,22,18],
  [22,93,21,22],
  [93,92,21,93],
  [21,92,20,21],
  [92,91,20,92],
  [20,91,19,20],
  [91,90,19,91],
  [19,90,71,19],
  [19,71,0,19]
];

/**
 * Show deformd face
 */
function drawMaskLoop() {
  // copy video texture
  videocanvas.getContext('2d').drawImage(video,0,0,videocanvas.width,videocanvas.height);

  updateParameters();

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
  let newPos = pos.concat(addPos);

  let newVertices = pModel.path.vertices.concat(mouth_vertices);
  // merge with newVertices
  newVertices = newVertices.concat(extendVertices);

  fd.load(videocanvas, newPos, pModel, newVertices);

  // get position of face
  let parameters = ctrack.getCurrentParameters();
  for (let i = 6; i<parameters.length; i++) {
    parameters[i] += ph['component '+(i-3)];
  }
  let positions = ctrack.calculatePositions(parameters);

  if (positions) {
    // add positions from extended boundary, unmodified
    newPos = positions.concat(addPos);
    // draw mask on top of face
    fd.draw(newPos);
  }
  requestAnimFrame(drawMaskLoop);
}


/********** parameter code *********/

const pnums = pModel.shapeModel.eigenValues.length-2;
const parameterHolder = function() {
  for (let i = 0;i<pnums; i++) {
    this['component '+(i+3)] = 0;
  }
  this.presets = 0;
};

const ph = new parameterHolder();
const gui = new dat.GUI();

let control = {};
let eig = 0;
for (let i=0; i<pnums; ++i) {
  eig = Math.sqrt(pModel.shapeModel.eigenValues[i+2])*3
  control['c'+(i+3)] = gui.add(ph, 'component '+(i+3), -5*eig, 5*eig).listen();
}

function updateParameters() {
  // Smoothing
  for(let key in ph) {
    ph[key] = ph[key] * 0.95;
  }
}

for (let i = 0; i<pnums; ++i) {
  ph['component '+(i+3)] = 0;
}

function remap(value, inputMin, inputMax, outputMin, outputMax) {
  return ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin);
}

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
    let keyStr = MIDI.noteToKey[data.note];
    if (data.channel == 0) {
      // Main melody
      switch (keyStr) {
        case 'F3':
          ph['component 10'] = -20;
          break;
        case 'Gb3':
          ph['component 10'] = 20;
          break;
      }
    } else if (data.channel == 1) {
      // Bass
      ph['component 4'] = remap(data.note, 40, 70, -20, 20);
    } else if (data.channel == 2) {
      // Constant loop
      ph['component 9'] = 40;
    } else if (data.channel == 3) {
      // Solo
      ph['component 4'] = remap(data.note, 72, 85, 40, -90);
    } else if (data.channel == 4) {
      // Beat
      switch (keyStr) {
        case 'Db5':
          ph['component 16'] = -20;
          break;
      }
    }
  }
}
