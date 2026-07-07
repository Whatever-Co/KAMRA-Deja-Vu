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
    let p = this.player.play()
    if (p && p.catch) {
      // autoplay policy blocks audio before the first user gesture
      // (mobile always, desktop without MEI) — retry on that gesture
      p.catch((err) => {
        console.warn('BgmManager: autoplay blocked, retrying on next gesture', err && err.name)
        // pin the player we intended to start — _loop() may swap
        // this.player at a track boundary before the user gestures
        let attemptedPlayer = this.player
        let retry = () => {
          let r = attemptedPlayer.play()
          if (r && r.catch) {
            r.catch((e) => console.error('BgmManager: retry play failed', e))
          }
        }
        // {once: true} auto-removes the listener after firing once
        document.addEventListener('click', retry, {once: true})
        document.addEventListener('touchend', retry, {once: true})
      })
    }
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
