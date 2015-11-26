/* global THREE */


class App {

  constructor() {
    let loader = new createjs.LoadQueue(false)
    loader.loadFile({id: 'keyframes', src: 'keyframes.json'})
    loader.on('fileprogress', (e) => {
      console.log('fileprogress', e.loaded, e.total, e)
    })
    loader.on('complete', () => {
      console.log('complete')
    })
  }

}

new App()
