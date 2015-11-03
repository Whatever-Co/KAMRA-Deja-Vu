import {EventEmitter} from 'events'

class Ticker extends EventEmitter {

  constructor() {
    super()
    this.update = this.update.bind(this)
    this.previousFrame = -1
  }


  start() {
    this.update()
  }


  stop() {
    cancelAnimationFrame(this.requestId)
  }


  update(t) {
    this.requestId = requestAnimationFrame(this.update)
    let currentFrame = Math.floor(t / 1000 * 24)
    if (currentFrame > this.previousFrame) {
      this.previousFrame = currentFrame
      this.emit('update', currentFrame)
    }
  }

}

export default new Ticker()
