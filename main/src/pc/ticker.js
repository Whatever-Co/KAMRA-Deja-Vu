import {EventEmitter} from 'events'


class Ticker extends EventEmitter {

  constructor() {
    super()
    this.update = this.update.bind(this)
    this.frameEvents = {}
    this.currentFrame = -1
  }


  start() {
    this.update()
  }


  stop() {
    cancelAnimationFrame(this.requestId)
  }


  update(t) {
    this.requestId = requestAnimationFrame(this.update)
    let currentFrame = Math.floor((this.clock ? this.clock.position : -t) / 1000 * 24)
    if (currentFrame != this.currentFrame) {
      let prev = this.currentFrame
      this.currentFrame = currentFrame

      let d = currentFrame - prev
      if (d > 0) {
        for (let f = prev + 1; f <= currentFrame; f++) {
          if (typeof(this.frameEvents[f]) == 'function') {
            this.frameEvents[f]()
          }
        }
      }
      this.emit('update', currentFrame, t)
    }
  }


  setClock(clock) {
    this.clock = clock
  }


  addFrameEvent(frame, callback) {
    this.frameEvents[frame] = callback
  }

}

export default new Ticker()
