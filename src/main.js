// Requires
const Stats = require("stats.js");
const aspectFit = require("./scripts/layout.js").aspectFit;
const deform = require("./scripts/deform/index.js");
const MidiDispatcher = require("./scripts/MidiDispatcher.js");
const MidiNoteView = require("./scripts/MidiNoteView.js");

// main.js
// setup MIDI
const audio = document.getElementById("songAudio");
const midiDispatcher = new MidiDispatcher(audio, "sounds/dejavu1.mid", 110);
const midiNoteView = new MidiNoteView("keyboards");

midiDispatcher.addListener("play", () => deform.startVideo());
midiDispatcher.addListener("midi", (data) => {
  deform.onMidi(data);
  midiNoteView.onMidi(data);
});

// aspect fit
for(let targetID of ['videoel','overlay','webgl']) {
  aspectFit(targetID, 4/3);
}

/*********** Code for stats **********/

let stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.getElementById('container').appendChild( stats.domElement );

document.addEventListener("clmtrackrIteration", function(event) {
  stats.update();
}, false);