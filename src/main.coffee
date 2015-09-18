# includes
require("./face_deform.js")
d3 = require("d3")

# midi setup

midiPlayer = MIDI.Player
midiPlayer.BPM = 110
# MIDI.setVolume(0,0)
midiPlayer.loadFile "sounds/dejavu1.mid"
  ,()->
    console.log "midi loaded"
  ,()->
    console.log "loading"
  ,(error)->
    console.log "error"
    console.log error
audio = document.getElementById("songAudio")
audio.addEventListener "play", ()->
  midiPlayer.start()
audio.addEventListener "pause", ()->
  midiPlayer.pause()
audio.addEventListener "timeupdate", (e)->
  # console.log "audio : ", @currentTime * 1000
  midiPlayer.currentTime = @currentTime * 1000

# define graph

notes = do ()->
  data = []
  for channel in [0..5]
    for note in [0..127]
      data.push({
        channel:channel
        note:note
        velocity:0
      })
  return data

svg = d3.select("#keyboards").append('svg').attr({
  width:128*10
  height:10*10
})

svg.selectAll('rect').data(notes).enter().append('rect')
keyboards = svg.selectAll('rect')
keyboards.attr({
  'x':(d)->
    return d.note * 10
  'y':(d)->
    return d.channel * 10
  'width':()->
    return 10
  'height':()->
    return 10
  'strokeWidth':()->
    return 1
  'stroke':()->
    return "rgb(0,0,0)"
  'fill':(d)->
    return "rgb(0,0,#{d.velocity*2})"
})

# mapping
midiPlayer.addListener (data)->
  # console.log "midi : ", data.now
  for note in notes
    if note.channel == data.channel && note.note == data.note
      note.velocity = data.velocity
      break
  keyboards.attr({
    'fill':(d)->
      return "rgb(0,0,#{d.velocity*2})"
  })
