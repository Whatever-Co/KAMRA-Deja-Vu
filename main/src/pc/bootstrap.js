// import loader from './asset-loader'

require(['./asset-loader'], () => {
  let loader = require('./asset-loader').default
  loader.on('progress', (event) => {
    console.log(Math.round((event.progress / event.total) * 100))
  })
  loader.load()
})
