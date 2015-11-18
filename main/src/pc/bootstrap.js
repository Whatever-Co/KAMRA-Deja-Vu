import loader from './asset-loader'
import TWEEN from 'tween.js'


let loaderCanvas = document.querySelector('#loading canvas')
loaderCanvas.width = 400
loaderCanvas.height = 400
let loaderCtx = loaderCanvas.getContext('2d')
let updateLoading = (rate) => {
  loaderCtx.save()
  loaderCtx.clearRect(0, 0, 400, 400)
  loaderCtx.lineWidth = 1

  loaderCtx.strokeStyle = "rgba(255, 255, 255, 0.2)"
  loaderCtx.beginPath()
  loaderCtx.arc(200, 200, 199, 0, 2 * Math.PI, false)
  loaderCtx.stroke()

  loaderCtx.strokeStyle = "rgba(255, 255, 255, 0.5)"
  loaderCtx.beginPath()
  loaderCtx.arc(200, 200, 199,
    -Math.PI * 0.5,
    -Math.PI * 0.5 + 2 * Math.PI * rate, false)
  loaderCtx.stroke()
  loaderCtx.restore()
}

loader.on('progress', (event) => {
  let rate = event.progress / event.total
  console.log(Math.round(rate * 100))
  updateLoading(rate)
})
loader.on('complete', () => {
  console.timeEnd('asset loading')
})
loader.load()
console.time('asset loading')

window.__djv_loader = loader


// enable font

try{
  Typekit.load({ async: true })
} catch(e) {}