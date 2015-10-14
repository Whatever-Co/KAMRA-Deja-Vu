const EventEmitter = require('events').EventEmitter;
const midiPlayer = MIDI.Player;

export default class MidiDispatcher extends EventEmitter {
  constructor(audio, midifile, bpm=120) {
    super();

    this.audio = audio;
    this.midifile = midifile;
    this.bpm = bpm;

    const self = this;
    
    MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instrument: "dummy", // load dummy sound font
      onsuccess: self.init.bind(self),
      onerror: (error)=> {
        console.log(error);
      }
    });
  }

  init() {
    midiPlayer.BPM = this.bpm;
    midiPlayer.loadFile(this.midifile,
      ()=>console.log("midi loaded"), // on loaded
      ()=>console.log("loading"), // on loading
      (error)=>console.error(error) // on error
    );
    midiPlayer.addListener((data)=>{
      this.emit("midi", data);
    });

    this.audio.addEventListener("play",()=>{
      midiPlayer.start();
      this.emit("play");
    }, false);
    this.audio.addEventListener("pause", ()=>{
      midiPlayer.pause();
      this.emit("pause");
    }, false);
    this.audio.addEventListener("timeupdate", (e)=>{
      midiPlayer.currentTime = this.audio.currentTime * 1000;
    }, false);
  }
}
