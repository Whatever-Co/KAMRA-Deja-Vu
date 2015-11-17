import {EventEmitter} from 'events'
import $ from 'jquery'
import StateMachine from 'javascript-state-machine'


export default class PageManager extends EventEmitter {

  constructor(stateMachine) {
    super()
    this.stateMachine = stateMachine
    this.init()
  }


  init() {
    // loading
    this.stateMachine.onleaveloadAssets = () => {
      $('#loading').fadeOut(1000, () => {
        this.stateMachine.transition()
      })
      return StateMachine.ASYNC
    }

    // top
    this.stateMachine.onentertop = () => {
      $('#top').fadeIn(1000)
    }
    this.stateMachine.onleavetop = () => {
      $('#top').fadeOut(1000, () => {
        this.stateMachine.transition()
      })
      return StateMachine.ASYNC
    }
    $('.with-webcam').click(() => this.stateMachine.start(true))
    $('.without-webcam').click(() => this.stateMachine.start(false))

    // share
    this.stateMachine.onentershare = () => {
      $('#share').fadeIn(1000)
    }
    this.stateMachine.onleaveshare = () => {
      $('#share').fadeOut(1000, () => {
        this.stateMachine.transition()
      })
      return StateMachine.ASYNC
    }
    $('.button-top').click(() => this.stateMachine.goTop())
  }

}
