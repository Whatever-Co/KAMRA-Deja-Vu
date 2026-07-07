import Detector from 'Detector'
import Config from './config'
import loader from './asset-loader'
import LoadingBar from './loading-bar'

if (!Detector.canvas || !Detector.webgl || !Detector.workers || !Detector.fileapi) {
  // No supported devices (mobile runs the full app as of 2026)
  location.href = 'sp'
}

if (Config.IS_MOBILE) {
  // styles gate the landscape-only rotate overlay on this class
  document.documentElement.className += ' mobile'
  // #page hosts every HTML screen at a 1280x720 mobile design size
  // (see index.styl); contain-scale it into the viewport so the UI stays
  // proportional and un-clipped. The video canvas has its own cover-scale in
  // app.js. Stage dims kept smaller than the 1920x1080 desktop layout so scale
  // lands around 0.5x on a phone (labels stay readable).
  const MOBILE_STAGE_WIDTH = 1280
  const MOBILE_STAGE_HEIGHT = 720
  const applyMobileStageScale = () => {
    const page = document.getElementById('page')
    if (!page) return
    const w = window.innerWidth
    const h = window.innerHeight
    const s = Math.min(w / MOBILE_STAGE_WIDTH, h / MOBILE_STAGE_HEIGHT)
    const tx = (w - MOBILE_STAGE_WIDTH * s) / 2
    const ty = (h - MOBILE_STAGE_HEIGHT * s) / 2
    page.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
  }
  applyMobileStageScale()
  window.addEventListener('resize', applyMobileStageScale)
  window.addEventListener('orientationchange', applyMobileStageScale)
}

loader.on('weighted progress', (event) => {
  let rate = event.progress / event.total
  LoadingBar.update(rate * 0.95) // Estimate final worker task
})
loader.on('complete', () => {
  console.timeEnd('asset loading')
})
loader.load()
console.time('asset loading')

window.__djv_loader = loader
window.__djv_loadingBar = LoadingBar
