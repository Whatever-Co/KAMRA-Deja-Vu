import $ from 'jquery'
import StateMachine from 'javascript-state-machine'

import Ticker from './ticker'
import PreprocessWorker from 'worker!./preprocess-worker'
import App from './app'


class PageManager {

  constructor() {
    this.fsm = StateMachine.create({
      initial: 'loadAssets',
      events: [
        {name: 'loadComplete', from: 'loadAssets', to: 'top'},
        {name: 'start', from: 'top', to: 'playing'},
        {name: 'playCompleted', from: 'playing', to: 'share'},
        {name: 'goTop', from: 'share', to: 'top'}
      ],
      callbacks: {
        onleaveloadAssets: () => {
          $('#loading').fadeOut(1000, () => {
            this.app= new App(this.keyframes)
            this.app.on('complete', () => {
              this.fsm.playCompleted()
            })
            this.fsm.transition()
            setTimeout(() => {
              this.fsm.start(true)
            }, 1000)
          })
          return StateMachine.ASYNC
        },
        onentertop: () => {
          $('#top').fadeIn(1000)
        },
        onleavetop: () => {
          $('#top').fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
        onenterplaying: (e, f, t, useWebcam) => {
          this.app.start(useWebcam)
        },
        onentershare: () => {
          $('#share').fadeIn(1000)
        },
        onleaveshare: () => {
          $('#share').fadeOut(1000, () => {
            this.fsm.transition()
          })
          return StateMachine.ASYNC
        },
      }
    })
    $('.with-webcam').click(() => this.fsm.start(true))
    $('.without-webcam').click(() => this.fsm.start(false))
    $('.button-top').click(() => this.fsm.goTop())

    Ticker.start()

    this.preprocessKeyframes()
  }


  preprocessKeyframes() {
    let loader = window.__djv_loader

    this.keyframes = loader.getResult('keyframes')
    console.log(this.keyframes)

    console.time('morph data processing')
    let worker = new PreprocessWorker()

    let targetObject = [
      this.keyframes.user.property,
      this.keyframes.user_alt.property[0],
      this.keyframes.user_alt.property[1],
      this.keyframes.falling_children_mesh.property[0],
    ]
    .concat(this.keyframes.user_children.property.map((props) => props))
    .concat(this.keyframes.falling_children_mesh.property.map((props) => props))

    let transferList = []
    let objectVertices = targetObject.map((obj) => {
      return obj.face_vertices.map((v) => {
        if (v) {
          let a = new Float32Array(v)
          transferList.push(a.buffer)
          return a
        }
        return null
      })
    })

    worker.postMessage(objectVertices, transferList)
    worker.onmessage = (event) => {
      event.data.forEach((morph, i) => {
        targetObject[i].morph = morph
      })
      console.timeEnd('morph data processing')
      this.fsm.loadComplete()
    }
  }

}


new PageManager()
