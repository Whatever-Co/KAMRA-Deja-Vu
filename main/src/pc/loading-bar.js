
class LoadingBar {
  constructor() {
    this.canvas = document.querySelector('#loading canvas')
    this.canvas.width = 400
    this.canvas.height = 400
    this.context = this.canvas.getContext('2d')
  }

  update(rate) {
    let ctx = this.context
    ctx.save()
    ctx.clearRect(0, 0, 400, 400)
    ctx.lineWidth = 1

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.beginPath()
    ctx.arc(200, 200, 199, 0, 2 * Math.PI, false)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(200, 200, 199,
      -Math.PI * 0.5,
      -Math.PI * 0.5 + 2 * Math.PI * rate, false)
    ctx.stroke()
    ctx.restore()
  }
}

export default new LoadingBar()