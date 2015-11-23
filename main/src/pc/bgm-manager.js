import $ from 'jquery'

const FADETIME = 1.0

class BgmManager {
  constructor() {
    this.playerA = document.createElement('audio')
    this.playerB = document.createElement('audio')
  }

  play(file, volume = 1.0) {
    if (this.player) {
      return
    }
    this.masterVolume = volume

    let ext = '.mp3'
    if (this.playerA.canPlayType('audio/ogg') != '') {
      ext = '.ogg'
    }
    ext += '?.jpg'

    this.playerA.src = this.playerB.src  = file + ext
    this.player = this.playerA
    this._loop()
  }

  stop() {
    $(this.player).animate({volume: 0}, 3000, () => {
      this.player.pause()
    })
  }

  _loop() {
    this.player.addEventListener('timeupdate', this._timeupdate.bind(this), false)
    this.player.currentTime = 0
    this.volume = this.masterVolume
    this.player.play()
  }

  _timeupdate(e) {
    if (this.player.currentTime < this.player.duration - FADETIME) {
      return
    }
    this.player.removeEventListener('timeupdate', this._timeupdate.bind(this), false)

    if (this.player == this.playerA) {
      this.player = this.playerB
    } else {
      this.player = this.playerA
    }
    this._loop()
  }
}

export default new BgmManager()
