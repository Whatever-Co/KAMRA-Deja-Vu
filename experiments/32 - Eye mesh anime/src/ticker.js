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

    let prev = this.currentFrame
    let currentFrame = Math.floor((this.clock ? this.clock.position : -(t || 0)) / 1000 * 24)
    if (prev > 0 && currentFrame - prev > 1) {
      console.warn(`${currentFrame - prev - 1} frames skip detected at ${currentFrame}`)
    }

    this.currentFrame = currentFrame

    for (let f = prev + 1; f <= this.currentFrame; f++) {
      if (this.frameEvents[f]) {
        this.frameEvents[f].forEach((callback) => callback())
      }
    }
    this.emit('update', this.currentFrame, t)
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
