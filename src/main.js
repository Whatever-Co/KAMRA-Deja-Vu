// Requires
const Stats = require("stats.js");
const d3 = require("d3");
const aspectFit = require("./scripts/layout.js").aspectFit;
const deform = require("./scripts/deform/index.js");

// main.js
const midiPlayer = MIDI.Player;
MIDI.loadPlugin({
  soundfontUrl: "./soundfont/",
  instrument: "dummy", // load dummy sound font
  onsuccess: ()=>{
    console.log("success");
    midiPlayer.BPM = 110;
    midiPlayer.loadFile(
      "sounds/dejavu1.mid",
      ()=>{
        console.log("midi loaded");
      },
      ()=>{
        console.log("loading");
      },
      (error)=>{
        console.error(error);
      }
    );
    const audio = document.getElementById("songAudio");
    audio.addEventListener("play",()=>{
      deform.startVideo();
      midiPlayer.start();
    });
    audio.addEventListener("pause", ()=>{
      midiPlayer.pause();
    });
    audio.addEventListener("timeupdate", (e)=>{
      midiPlayer.currentTime = audio.currentTime * 1000;
    });
  },
  onerror: (error)=> {
    console.log(error);
  }
});

// Make d3.js model
const notes = (()=>{
  const data = [];
  for(let channel=0; channel<=5; ++channel) {
    for(let note=0; note<=127; ++note) {
      data.push({
        channel:channel,
        note:note,
        velocity:0
      });
    }
  }
  return data;
})();

const svg = d3.select("#keyboards").append('svg').attr({
  width:128*10,
  height:10*10
});
svg.selectAll('rect').data(notes).enter().append('rect');

const keyboards = svg.selectAll('rect');
keyboards.attr({
  'x':(d)=> {
    return d.note * 10;
  },
  'y':(d)=> {
    return d.channel * 10;
  },
  'width':()=> {
    return 10;
  },
  'height':()=> {
    return 10;
  },
  'strokeWidth':()=>{
    return 1;
  },
  'stroke':()=>{
    return "rgb(0,0,0)";
  },
  'fill':(d)=>{
    return `rgb(0,0,${d.velocity*2})`;
  }
});

const param = deform.param;
function remap(value, inputMin, inputMax, outputMin, outputMax) {
  return ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin);
}

function onMidiData(data) {
  // on
  if(data.message == 144) {
    let keyStr = MIDI.noteToKey[data.note];
    if (data.channel == 0) {
      // Main melody
      switch (keyStr) {
        case 'F3':
          param['component 10'] = -20;
          break;
        case 'Gb3':
          param['component 10'] = 20;
          break;
      }
    } else if (data.channel == 1) {
      // Bass
      //console.log(`Bass ${data.note}`);
      param['component 4'] = remap(data.note, 40, 70, -20, 20);
    } else if (data.channel == 2) {
      // Constant loop
      param['component 9'] = 40;
    } else if (data.channel == 3) {
      // Solo
      //console.log(`Solo ${data.note}`);
      param['component 4'] = remap(data.note, 72, 85, 40, -90);
    } else if (data.channel == 4) {
      // Beat
      switch (keyStr) {
        case 'Db5':
          param['component 16'] = -20;
          break;
      }
    }
  }
  // note map
  for(let note of notes) {
    if(note.channel == data.channel && note.note == data.note) {
      note.velocity = data.velocity;
      break;
    }
  }
  // update view
  keyboards.attr({
    'fill':(d)=>{
      return `rgb(0,0,${d.velocity*2})`;
    }
  });
}
midiPlayer.addListener(onMidiData);

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