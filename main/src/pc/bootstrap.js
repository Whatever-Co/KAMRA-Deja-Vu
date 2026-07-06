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
