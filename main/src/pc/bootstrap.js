import loader from './asset-loader'

loader.on('progress', (event) => {
  console.log(Math.round((event.progress / event.total) * 100))
})
loader.on('complete', () => {
  console.timeEnd('asset loading')
})
loader.load()
console.time('asset loading')

window.__djv_loader = loader
