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
    let currentFrame = Math.floor((this.clock ? this.clock.position : -(t || 0)) / 1000 * 24)
    if (currentFrame != this.currentFrame) {
      let prev = this.currentFrame
      this.currentFrame = currentFrame

      let d = currentFrame - prev
      if (d > 0) {
        for (let f = prev + 1; f <= currentFrame; f++) {
          if (this.frameEvents[f]) {
            this.frameEvents[f].forEach((callback) => callback())
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
    if (!this.frameEvents.hasOwnProperty(frame)) {
      this.frameEvents[frame] = []
    }
    this.frameEvents[frame].push(callback)
  }

}

export default new Ticker()
