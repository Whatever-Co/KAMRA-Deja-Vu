import loader from './asset-loader'

loader.on('progress', (event) => {
  console.log(Math.round((event.progress / event.total) * 100))
})
loader.load()

window.__djv_loader = loader
