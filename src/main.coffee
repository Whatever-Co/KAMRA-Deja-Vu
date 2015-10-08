# includes
# require("./face_deform.js")
d3 = require("d3")

# midi setup
midiPlayer = MIDI.Player
MIDI.loadPlugin {
  soundfontUrl: "./soundfont/"
  instrument: "dummy" # load dummy sound font
  onsuccess: ()->
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
      window.CONTROL.startVideo()
      midiPlayer.start()
    audio.addEventListener "pause", ()->
      midiPlayer.pause()
    audio.addEventListener "timeupdate", (e)->
    # console.log "audio : ", @currentTime * 1000
      midiPlayer.currentTime = @currentTime * 1000
  onerror: (error)->
    console.log error
}

# define graph

notes = do ()->
  data = []
  for channel in [0...5]
    for note in [0...127]
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


param = window.CONTROL.param
remap = (value, inputMin, inputMax, outputMin, outputMax) ->
  return ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin)

# mapping
midiPlayer.addListener (data)->
  # console.log "midi : ", data.now

  # on
  if data.message == 144
    console.log "ch:#{data.channel}  note:#{data.message}"
    keyStr = MIDI.noteToKey[data.note]

    if data.channel == 0
      # Main melody
      switch keyStr
        when 'F3'
          param['component 10'] = -20
        when 'Gb3'
          param['component 10'] = 20
    else if data.channel == 1
      # Bass
      console.log "Bass #{data.note}"
      param['component 4'] = remap(data.note, 40, 70, -20, 20)
    else if data.channel == 2
      # Constant loop
      param['component 9'] = 40
    else if data.channel == 3
      # Solo
      console.log "Solo #{data.note}"
      param['component 4'] = remap(data.note, 72, 85, 40, -90)
     else if data.channel == 4
      # Beat
      switch keyStr
        when 'Db5'
          param['component 16'] = -20
      # console.log "Beat #{data.note}"


  # note map
  for note in notes
    if note.channel == data.channel && note.note == data.note
      note.velocity = data.velocity
      break
  keyboards.attr({
    'fill':(d)->
      return "rgb(0,0,#{d.velocity*2})"
  })


# resize aspect fit

aspectFit = (id)->
  dom = document.getElementById(id)
  w = window.innerWidth
  h = window.innerHeight
  target = 4/3



  if w/h > target
    width = h * target
    height = h
    left = (w - width) / 2
    top = 0
  else
    width = w
    height = w / target
    left = 0
    top = (h - height) / 2


  dom.style.width = width + 'px'
  dom.style.height = height + 'px'
  dom.style.left = left + 'px'
  dom.style.top = top + 'px'


for targetID in ['videoel','overlay','webgl']
  aspectFit(targetID)
