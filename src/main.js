// Requires
require("babel/polyfill");
const Stats = require("stats.js");
const aspectFit = require("./scripts/layout.js").aspectFit;
const MidiDispatcher = require("./scripts/MidiDispatcher.js");
const MidiNoteView = require("./scripts/MidiNoteView.js");
const findFace = require("./scripts/find_face.js");
const deform = require("./scripts/deform/index.js");

// main.js
// setup MIDI
const audio = document.getElementById("songAudio");
const midiDispatcher = new MidiDispatcher(audio, "sounds/dejavu1.mid", 110);
const midiNoteView = new MidiNoteView("keyboards");

const video = document.getElementById('videoel');
const ctrack = new clm.tracker();
ctrack.init(pModel);


midiDispatcher.addListener("play", () => {
  findFace.start(video, ctrack, onFaceFound);
});

midiDispatcher.addListener("midi", (data) => {
  deform.onMidi(data);
  midiNoteView.onMidi(data);
});

function onFaceFound() {
  deform.start(video, ctrack);
}

// aspect fit
for(let targetID of ['videoel','overlay','webgl']) {
  aspectFit(targetID, 4/3);
}

/*********** Code for stats **********/
{
  let stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.getElementById('container').appendChild( stats.domElement );

  document.addEventListener("clmtrackrIteration", function(event) {
    stats.update();
  }, false);
}

