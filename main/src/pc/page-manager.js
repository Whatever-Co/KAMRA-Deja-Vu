import {EventEmitter} from 'events'
import $ from 'jquery'


export default class PageManager extends EventEmitter {

  constructor(stateMachine) {
    super()
    this.stateMachine = stateMachine
    this.init()
  }


  init() {
    // loading
    this.stateMachine.onleaveloadAssets = () => {
      $('#loading').hide()
    }

    // top
    this.stateMachine.onentertop = () => {
      $('#top').show()
    }
    this.stateMachine.onleavetop = () => {
      $('#top').hide() 
    }
    $('.with-webcam').click(() => this.stateMachine.start(true))
    $('.without-webcam').click(() => this.stateMachine.start(false))

    // share
    this.stateMachine.onentershare = () => {
      $('#share').show()
    }
    this.stateMachine.onleaveshare = () => {
      $('#share').hide()
    }
    $('.button-top').click(() => this.stateMachine.goTop())
  }

}
