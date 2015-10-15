const d3 = require("d3");

// Initialize Model
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

/**
 * Midi Note view
 *
 * Visualize midi notes using d3.js
 */
export default class MidiNoteView {
  constructor(containerId) {
    // Setup svg
    const svg = d3.select('#'+containerId).append('svg').attr({
      width:128*10,
      height:10*10
    });
    svg.selectAll('rect').data(notes).enter().append('rect');

    // Setup note view
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

    this.svg = svg;
    this.keyboards = keyboards;
  }

  onMidi(data) {
    // note map
    for(let note of notes) {
      if(note.channel == data.channel && note.note == data.note) {
        note.velocity = data.velocity;
        break;
      }
    }
    // update view
    this.keyboards.attr({
      'fill':(d)=>{
        return `rgb(0,0,${d.velocity*2})`;
      }
    });
  }
}
